// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract TokenEscrow is ReentrancyGuard, Ownable, Pausable {
    
    // Token addresses
    address public immutable USDC_ADDRESS;
    address public immutable PEPU_ADDRESS;
    address public immutable VERIFIER_ADDRESS;
    
    // Transaction states
    enum TransactionStatus { PENDING, COMPLETED, REFUNDED }
    
    // Transaction structure
    struct Transaction {
        address user;
        address tokenAddress;
        uint256 amount;
        uint256 timestamp;
        TransactionStatus status;
        string tokenType;
    }
    
    // State variables
    uint256 public transactionNonce;
    mapping(string => Transaction) public transactions;
    mapping(string => bool) public txidExists;
    mapping(address => string[]) public userTransactions;
    
    // Events
    event TransactionCreated(
        string indexed txid,
        address indexed user,
        string providedString,
        uint256 amount,
        string tokenType,
        uint256 timestamp
    );
    
    event TransactionCompleted(
        string indexed txid,
        address indexed user,
        uint256 amount,
        string tokenType
    );
    
    event TransactionRefunded(
        string indexed txid,
        address indexed user,
        uint256 amount,
        string tokenType
    );
    
    // Modifiers
    modifier validTransaction(string memory txid) {
        require(txidExists[txid], "Transaction does not exist");
        require(transactions[txid].status == TransactionStatus.PENDING, "Transaction is not pending");
        _;
    }
    
    constructor(
        address _usdcAddress,
        address _pepuAddress,
        address _verifierAddress
    ) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_pepuAddress != address(0), "Invalid PEPU address");
        require(_verifierAddress != address(0), "Invalid verifier address");
        
        USDC_ADDRESS = _usdcAddress;
        PEPU_ADDRESS = _pepuAddress;
        VERIFIER_ADDRESS = _verifierAddress;
        transactionNonce = 0;
    }
    
    // Buy with ETH
    function buy(string memory providedString) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH");
        
        // Generate transaction ID (including timestamp)
        transactionNonce++;
        string memory txid = _generateTxid(msg.sender, msg.value, address(0), transactionNonce, block.timestamp);
        
        // Ensure txid is unique
        require(!txidExists[txid], "Transaction ID collision");
        
        // Store transaction
        transactions[txid] = Transaction({
            user: msg.sender,
            tokenAddress: address(0),
            amount: msg.value,
            timestamp: block.timestamp,
            status: TransactionStatus.PENDING,
            tokenType: "ETH"
        });
        
        txidExists[txid] = true;
        userTransactions[msg.sender].push(txid);
        
        emit TransactionCreated(txid, msg.sender, providedString, msg.value, "ETH", block.timestamp);
    }
    
    // Buy with USDC
    function buyWithUSDC(string memory providedString, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer USDC from user to contract
        IERC20(USDC_ADDRESS).transferFrom(msg.sender, address(this), amount);
        
        // Generate transaction ID
        transactionNonce++;
        string memory txid = _generateTxid(msg.sender, amount, USDC_ADDRESS, transactionNonce, block.timestamp);
        
        // Ensure txid is unique
        require(!txidExists[txid], "Transaction ID collision");
        
        // Store transaction
        transactions[txid] = Transaction({
            user: msg.sender,
            tokenAddress: USDC_ADDRESS,
            amount: amount,
            timestamp: block.timestamp,
            status: TransactionStatus.PENDING,
            tokenType: "USDC"
        });
        
        txidExists[txid] = true;
        userTransactions[msg.sender].push(txid);
        
        emit TransactionCreated(txid, msg.sender, providedString, amount, "USDC", block.timestamp);
    }
    
    // Buy with PEPU
    function buyWithPEPU(string memory providedString, uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        
        // Transfer PEPU from user to contract
        IERC20(PEPU_ADDRESS).transferFrom(msg.sender, address(this), amount);
        
        // Generate transaction ID
        transactionNonce++;
        string memory txid = _generateTxid(msg.sender, amount, PEPU_ADDRESS, transactionNonce, block.timestamp);
        
        // Ensure txid is unique
        require(!txidExists[txid], "Transaction ID collision");
        
        // Store transaction
        transactions[txid] = Transaction({
            user: msg.sender,
            tokenAddress: PEPU_ADDRESS,
            amount: amount,
            timestamp: block.timestamp,
            status: TransactionStatus.PENDING,
            tokenType: "PEPU"
        });
        
        txidExists[txid] = true;
        userTransactions[msg.sender].push(txid);
        
        emit TransactionCreated(txid, msg.sender, providedString, amount, "PEPU", block.timestamp);
    }
    
    // Complete transaction (only verifier can call)
    function completeTransaction(string memory txid) external validTransaction(txid) {
        require(msg.sender == VERIFIER_ADDRESS, "Only verifier can complete transactions");
        
        Transaction storage transaction = transactions[txid];
        transaction.status = TransactionStatus.COMPLETED;
        
        emit TransactionCompleted(txid, transaction.user, transaction.amount, transaction.tokenType);
    }
    
    // Refund transaction (only verifier can call)
    function refundTransaction(string memory txid) external validTransaction(txid) {
        require(msg.sender == VERIFIER_ADDRESS, "Only verifier can complete transactions");
        
        Transaction storage transaction = transactions[txid];
        transaction.status = TransactionStatus.REFUNDED;
        
        // Refund the tokens/ETH
        if (keccak256(abi.encodePacked(transaction.tokenType)) == keccak256(abi.encodePacked("ETH"))) {
            payable(transaction.user).transfer(transaction.amount);
        } else {
            IERC20(transaction.tokenAddress).transfer(transaction.user, transaction.amount);
        }
        
        emit TransactionRefunded(txid, transaction.user, transaction.amount, transaction.tokenType);
    }
    
    // Get transaction details
    function getTransaction(string memory txid) external view returns (Transaction memory) {
        require(txidExists[txid], "Transaction does not exist");
        return transactions[txid];
    }
    
    // Get user's transaction IDs
    function getUserTransactions(address user) external view returns (string[] memory) {
        return userTransactions[user];
    }
    
    // Pause contract (only owner)
    function pause() external onlyOwner {
        _pause();
    }
    
    // Unpause contract (only owner)
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Withdraw ETH (only owner)
    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }
    
    // Withdraw tokens (only owner)
    function withdrawToken(address tokenAddress) external onlyOwner {
        uint256 balance = IERC20(tokenAddress).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(tokenAddress).transfer(owner(), balance);
    }
    
    // Generate unique transaction ID
    function _generateTxid(
        address user,
        uint256 amount,
        address tokenAddress,
        uint256 nonce,
        uint256 timestamp
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "0x",
            _toHexString(abi.encodePacked(user, amount, tokenAddress, nonce, timestamp))
        ));
    }
    
    // Convert bytes to hex string
    function _toHexString(bytes memory data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[1 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
    
    // Receive function for ETH
    receive() external payable {}
}