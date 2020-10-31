pragma solidity ^0.6.0;

import "./Auction.sol";
import "./CypherpunkCoin.sol";

contract ReentrancyTest{
    Auction public auction;
    uint256 rightfulCYCAmt;

    constructor{
        auction = Auction(_startPrice,
                          _reservedPrice,
                          _tokenSupply,
                          CypherpunkCoin _token)
    }

    function bid(){
        rightfulCYCAmt = this.balance/auction.reservedPrice *10000000000000;
        auction.commit().value(this.balance);
        // No option to sleep/wait in Solidity, request for Auction constructor to have time_limit variable.
        auction.releaseTokens();
    }

    //Fallback function
    funtion() payable{
        auction.releaseTokens();
    }


        
}