// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PEPU is ERC20, Ownable {
    uint8 private _decimals = 18; // PEPU uses 18 decimals (standard for most tokens)
    
    constructor() ERC20("PEPU Token", "PEPU") Ownable(msg.sender) {
        // Mint 1,000,000 PEPU tokens (with 18 decimals = 1000000 * 10^18)
        _mint(msg.sender, 1000000 * 10**18);
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