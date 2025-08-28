// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

// Interface for Uniswap V3 Quoter
interface IQuoterV2 {
    struct QuoteExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    }

    function quoteExactInputSingle(QuoteExactInputSingleParams calldata params)
        external
        returns (
            uint256 amountOut,
            uint160 sqrtPriceX96After,
            uint32 initializedTicksCrossed,
            uint256 gasEstimate
        );
}

// Interface for Uniswap V3 Swap Router
interface IV3SwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    function multicall(uint256 deadline, bytes[] calldata data)
        external
        payable
        returns (bytes[] memory results);

    function refundETH() external payable;
}

contract PenkMarketL2 is ReentrancyGuard, Ownable, Pausable {
    
    // Contract addresses for PEPU L2
    address public constant QUOTER_ADDRESS = 0xd647b2D80b48e93613Aa6982b85f8909578b4829;
    address public constant SWAP_ROUTER_ADDRESS = 0x150c3F0f16C3D9EB34351d7af9c961FeDc97A0fb;
    address public constant WPEPU_ADDRESS = 0xF9Cf4A16d26979b929Be7176bAc4e7084975FCB8;
    
    // Verifier address
    address public immutable VERIFIER_ADDRESS;
    
    // Fee tiers to try for swaps
    uint24[3] public feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
    
    // Default slippage: 0.5% (50 basis points)
    uint256 public slippageBasisPoints = 50;
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed by, uint256 amount, uint256 timestamp);
    event Swapped(
        address indexed tokenOut,
        uint256 pepuAmountIn,
        uint256 tokenAmountOut,
        address indexed recipient,
        address indexed initiator,
        uint24 fee,
        uint256 timestamp
    );
    event SlippageUpdated(uint256 oldBasisPoints, uint256 newBasisPoints);
    
    constructor(address _verifierAddress) Ownable(msg.sender) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        VERIFIER_ADDRESS = _verifierAddress;
    }
    
    // Modifier to check if caller is owner or verifier
    modifier onlyOwnerOrVerifier() {
        require(
            msg.sender == owner() || msg.sender == VERIFIER_ADDRESS,
            "Only owner or verifier can call this function"
        );
        _;
    }
    
    // Deposit function - anyone can deposit PEPU
    function deposit() external payable {
        require(msg.value > 0, "Must send PEPU");
        
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }
    
    // Withdraw function - only owner or verifier
    function withdraw(uint256 amount) external onlyOwnerOrVerifier nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "PEPU transfer failed");
        
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }
    
    // Main swap function - only owner or verifier can call
    function swap(
        uint256 amount,
        address tokenAddress,
        address userAddress
    ) external onlyOwnerOrVerifier nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenAddress != address(0), "Invalid token address");
        require(userAddress != address(0), "Invalid user address");
        require(address(this).balance >= amount, "Insufficient PEPU balance in contract");
        require(tokenAddress != WPEPU_ADDRESS, "Cannot swap to WPEPU directly");
        
        // Get the best quote and fee tier
        (uint256 bestAmountOut, uint24 bestFee) = _getBestQuote(amount, tokenAddress);
        require(bestAmountOut > 0, "No liquidity available for this token");
        
        // Calculate minimum output with slippage protection
        uint256 amountOutMinimum = (bestAmountOut * (10000 - slippageBasisPoints)) / 10000;
        
        // Execute the swap
        uint256 actualAmountOut = _executeSwap(
            amount,
            tokenAddress,
            userAddress,
            bestFee,
            amountOutMinimum
        );
        
        emit Swapped(
            tokenAddress,
            amount,
            actualAmountOut,
            userAddress,
            msg.sender,
            bestFee,
            block.timestamp
        );
    }
    
    // Internal function to get best quote across different fee tiers
    function _getBestQuote(
        uint256 amountIn,
        address tokenOut
    ) internal returns (uint256 bestAmountOut, uint24 bestFee) {
        IQuoterV2 quoter = IQuoterV2(QUOTER_ADDRESS);
        
        bestAmountOut = 0;
        bestFee = feeTiers[1]; // Default to 0.3%
        
        for (uint256 i = 0; i < feeTiers.length; i++) {
            try quoter.quoteExactInputSingle(
                IQuoterV2.QuoteExactInputSingleParams({
                    tokenIn: WPEPU_ADDRESS,
                    tokenOut: tokenOut,
                    amountIn: amountIn,
                    fee: feeTiers[i],
                    sqrtPriceLimitX96: 0
                })
            ) returns (uint256 amountOut, uint160, uint32, uint256) {
                if (amountOut > bestAmountOut) {
                    bestAmountOut = amountOut;
                    bestFee = feeTiers[i];
                }
            } catch {
                // Fee tier has no liquidity, continue to next
                continue;
            }
        }
    }
    
    // Internal function to execute the swap
    function _executeSwap(
        uint256 amountIn,
        address tokenOut,
        address recipient,
        uint24 fee,
        uint256 amountOutMinimum
    ) internal returns (uint256 amountOut) {
        IV3SwapRouter swapRouter = IV3SwapRouter(SWAP_ROUTER_ADDRESS);
        
        // Prepare swap parameters
        IV3SwapRouter.ExactInputSingleParams memory params = IV3SwapRouter.ExactInputSingleParams({
            tokenIn: WPEPU_ADDRESS,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });
        
        // Prepare multicall data
        bytes[] memory data = new bytes[](2);
        
        // Encode swap call
        data[0] = abi.encodeWithSelector(
            IV3SwapRouter.exactInputSingle.selector,
            params
        );
        
        // Encode refund call
        data[1] = abi.encodeWithSelector(
            IV3SwapRouter.refundETH.selector
        );
        
        // Set deadline (20 minutes from now)
        uint256 deadline = block.timestamp + 1200;
        
        // Execute multicall with native PEPU
        bytes[] memory results = swapRouter.multicall{value: amountIn}(deadline, data);
        
        // Decode the amount out from the first call result
        amountOut = abi.decode(results[0], (uint256));
        
        return amountOut;
    }
    
    // View function to get quote without executing
    function getQuote(
        uint256 amountIn,
        address tokenAddress
    ) external returns (uint256 amountOut, uint24 fee) {
        return _getBestQuote(amountIn, tokenAddress);
    }
    
    // View function to check contract PEPU balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Owner function to update slippage tolerance
    function updateSlippage(uint256 newBasisPoints) external onlyOwner {
        require(newBasisPoints <= 1000, "Slippage cannot exceed 10%"); // Max 10% slippage
        uint256 oldBasisPoints = slippageBasisPoints;
        slippageBasisPoints = newBasisPoints;
        
        emit SlippageUpdated(oldBasisPoints, newBasisPoints);
    }
    
    // Emergency pause/unpause functions
    function emergencyPause() external onlyOwner {
        _pause();
    }
    
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency withdraw all PEPU (only owner)
    function emergencyWithdrawAll() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No PEPU to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
        
        emit Withdrawn(msg.sender, balance, block.timestamp);
    }
    
    // Function to receive PEPU directly (acts as deposit)
    receive() external payable {
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }
    
    // Fallback function
    fallback() external payable {
        revert("Function not found");
    }
} 