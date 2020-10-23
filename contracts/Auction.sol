pragma solidity ^0.6.0;

import "@openzeppelin/contract/math/SafeMath.sol";

contract Auction {
    using SafeMath for uint256;
    // if one address buy many times??
    // mapping (address => uint) private commitments;
    struct commitment {
        address bidder;
        uint256 amount;
    }

    commitment[] private commitments;

    enum State {OPEN, CLOSE};
    // total Ether supply
    uint256 totalEther;
    uint256 startPrice;
    uint256 reservedPrice;
    uint256 clearingPrice
    uint256 totalSupply;
    uint256 startTime;
    uint256 demand;
    CypherpunkCoin private token;
    State private currState;

    constructor(uint256 startPrice, address token) public {
        startTime = now;
        startPrice = startPrice;
        this.token = token;
    }

    function commit(uint256 amount) public {
        require(currState == State.OPEN, "This auction already closes");
        if (now.sub(startTime) > 20 minutes) {
            clearingPrice = reservedPrice;
            currState = State.CLOSE;
            return;
        }
        uint256 curPrice = (20 minutes - now + startTime)
            .div(20 minutes)
            .mul(startPrice - reservedPrice)
            .add(reservedPrice);
        totalEther += amount;
        commitments.push(commitment(msg.sender, amount));
        demand = totalEther.div(curPrice);
        if (demand > totalSupply) {
            releaseTokens();
            clearingPrice = curPrice;
            currState = State.CLOSE;
        }
    }

    function releaseTokens() public {
        for (uint256 i = 0; i < commitments.length; i++) {
            if (totalEther==0) break;
            uint toTransfer = commitments[i].div(clearingPrice));
            if (toTransfer > totalEther) {
                toTransfer = totalEther;
                totalEther = 0;
            }
            else totalEther -= toTransfer;
            token._mint(commitments[i].bidder(), toTransfer);
        }
        // we are using the minting functions so no burning for now :)
    }
}
