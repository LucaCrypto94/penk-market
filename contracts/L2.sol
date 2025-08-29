// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract PenkMarketL2 is ReentrancyGuard, Ownable, Pausable {
    
    // Verifier address
    address public immutable VERIFIER_ADDRESS;
    
    // Events
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed by, uint256 amount, uint256 timestamp);
    event Swapped(
        uint256 amount,
        address indexed recipient,
        address indexed initiator,
        uint256 timestamp,
        string txid
    );
    
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
    
    // Withdraw PEPU function - only owner or verifier
    function withdraw(uint256 amount) external onlyOwnerOrVerifier nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient contract balance");
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "PEPU transfer failed");
        
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }
    
    // Swap function - allows verifier to withdraw native PEPU with transaction ID verification
    // This allows the verifier to withdraw PEPU to itself
    function swap(
        uint256 amount,
        string memory txid
    ) external onlyOwnerOrVerifier nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(txid).length > 0, "Transaction ID is required");
        require(address(this).balance >= amount, "Insufficient PEPU balance in contract");
        
        // Transfer native PEPU to the caller (verifier)
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "PEPU transfer failed");
        
        emit Swapped(
            amount,
            msg.sender,
            msg.sender,
            block.timestamp,
            txid
        );
    }
    
    // View function to check contract PEPU balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
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