// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../Openzeppelin/ERC20.sol";

contract LINK is ERC20 {
    uint constant _initial_supply = 10000 * (10**18);
    constructor() ERC20("LINK", "LINK", 18) {
        _mint(msg.sender, _initial_supply);
    }
} 


contract USDC is ERC20 {
    uint constant _initial_supply = 10000 * (10**6);
    constructor() ERC20("USDC", "USDC", 6) {
        _mint(msg.sender, _initial_supply);
    }
} 


contract DAI is ERC20 {
    uint constant _initial_supply = 10000 * (10**18);
    constructor() ERC20("DAI", "DAI", 18) {
        _mint(msg.sender, _initial_supply);
    }
} 
