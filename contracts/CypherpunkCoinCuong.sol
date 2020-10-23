pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CypherpunkCoin is ERC20 {
    constructor() public ERC20("CypherpunkCoin", "CYC") {}
}
