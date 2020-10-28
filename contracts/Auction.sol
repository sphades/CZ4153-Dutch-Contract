pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CypherpunkCoin.sol";

contract Auction {
    using SafeMath for uint256;
    // if one address buy many times??
    // mapping (address => uint) private commitments;
    struct commitment {
        address bidder;
        uint256 amount;
    }

    commitment[] private commitments;

    enum State {OPEN, CLOSE}
    // total Ether stored
    uint256 totalEther;
    uint256 startPrice;
    uint256 reservedPrice;
    uint256 clearingPrice;
    // total Supply of tokens
    uint256 totalSupply;
    uint256 startTime;
    // uint256 demand;

    CypherpunkCoin private token;
    State private currState;

    constructor(uint256 _startPrice, CypherpunkCoin _token) public {
        startTime = now;
        startPrice = _startPrice;
        token = _token;
    }

    function commit() external payable {
        require(currState == State.OPEN, "This auction already closes");
        if (now.sub(startTime) > 20 minutes) {
            //enforce?
            clearingPrice = reservedPrice;
            currState = State.CLOSE;
            return;
        }
        uint256 curPrice = (20 minutes - now + startTime)
            .div(20 minutes)
            .mul(startPrice - reservedPrice)
            .add(reservedPrice);
        totalEther += msg.value;
        commitments.push(commitment(msg.sender, msg.value));
        // demand = totalEther.div(curPrice);
        // to check whether the demand is larger than supply
        if (totalEther > totalSupply.mul(curPrice)) {
            releaseTokens();
            clearingPrice = curPrice;
            currState = State.CLOSE;
        }
    }

    function releaseTokens() internal {
        for (uint256 i = 0; i < commitments.length; i++) {
            if (totalSupply == 0) break;
            uint256 toTransfer = commitments[i].amount.div(clearingPrice);
            if (toTransfer > totalSupply) {
                toTransfer = totalSupply;
                totalSupply = 0;
            } else totalSupply -= toTransfer;
            token.transfer(commitments[i].bidder, toTransfer);
        }
        address payable addressToken = address(uint160(address(token)));
        addressToken.transfer(totalEther);
        if (totalSupply > 0) token.burn(totalSupply);
        // we are using the minting functions so no burning for now :)
    }
}
