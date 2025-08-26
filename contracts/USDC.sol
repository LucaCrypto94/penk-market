// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract USDC is ERC20, Ownable {
    uint8 private _decimals = 6; // USDC uses 6 decimals
    
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // Mint 1000 USDC tokens (with 6 decimals = 1000 * 10^6)
        _mint(msg.sender, 1000 * 10**6);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
} 