pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CypherpunkCoin.sol";

/*Differences:
1.time limit = 30s
2.State is public and settable
3.fake commitments*/

contract AuctionTest {
    using SafeMath for uint256;
    // if one address buy many times??
    // mapping (address => uint) private commitments;
    struct commitment {
        address bidder;
        uint256 amount;
    }

    commitment[] private commitments;
    mapping(address => uint256) bidderToAmount;

    enum State {OPENED, CLOSED, RELEASED}
    // total Ether stored
    uint256 public totalEther;
    uint256 public startPrice;
    uint256 public reservedPrice;
    uint256 public clearingPrice;
    // total Supply of tokens
    uint256 public tokenSupply;
    uint256 public startTime;
    uint256 public curPrice;
    // uint256 demand;

    CypherpunkCoin private token;
    State public currState;
    uint256 public constant timeLimit = 30 seconds;

    constructor(
        uint256 _startPrice,
        uint256 _reservedPrice,
        uint256 _tokenSupply,
        CypherpunkCoin _token
    ) public {
        startTime = now;
        startPrice = _startPrice;
        reservedPrice = _reservedPrice;
        tokenSupply = _tokenSupply;
        token = _token;
        currState = State.OPENED;
        for (uint256 i = 0; i < 50; i++) {
            commitments.push(commitment(address(this), 1000));
        }
    }

    function setState() external{
        currState = State.CLOSED;
    }

    function commit() external payable {
        require(currState == State.OPENED, "This auction already closes");
        if (now.sub(startTime) > timeLimit) {
            clearingPrice = reservedPrice;
            currState = State.CLOSED;
            // send back money to bidder
            msg.sender.transfer(msg.value);
            return;
        }
        curPrice = (startTime.add(timeLimit).sub(now))
            .mul(1000)
            .div(timeLimit)
            .mul(startPrice.sub(reservedPrice))
            .div(1000)
            .add(reservedPrice);
        totalEther = totalEther.add(msg.value);
        commitments.push(commitment(msg.sender, msg.value));
        bidderToAmount[msg.sender] = bidderToAmount[msg.sender].add(msg.value);
        // demand = totalEther.div(curPrice);
        // to check whether the demand is larger than supply
        if (totalEther > tokenSupply.mul(curPrice * 10000000000000)) {
            clearingPrice = curPrice;
            currState = State.CLOSED;
        }
    }

    modifier checkRelease() {
        require(currState != State.RELEASED, "The auction already releases");
        if (currState == State.OPENED) {
            require(
                now.sub(startTime) > timeLimit,
                "The auction is still opened, please wait"
            );
            clearingPrice = reservedPrice;
            currState = State.CLOSED;
        }
        _;
    }

    // anyone can trigger the release as long as it satisfies the requirements
    function releaseTokens() external checkRelease() {
        uint256 ethSendToTokenContract = totalEther;
        uint256 remainingEther = 0;
        for (uint256 i = 0; i < commitments.length; i++) {
            if (tokenSupply == 0) break;
            uint256 tokenTransfer = commitments[i].amount.div(
                clearingPrice * 10000000000000
            );
            if (tokenTransfer > tokenSupply) {
                //send back redundant ether
                address payable payableLastBidder = address(
                    uint160(commitments[i].bidder)
                );
                tokenTransfer = tokenSupply;
                uint256 ethSendTopayableLastBidder = commitments[i].amount.sub(
                    tokenTransfer.mul(clearingPrice * 10000000000000)
                );
                payableLastBidder.transfer(ethSendTopayableLastBidder);
                ethSendToTokenContract = ethSendToTokenContract.sub(
                    ethSendTopayableLastBidder
                );
                tokenSupply = 0;
            } else tokenSupply = tokenSupply.sub(tokenTransfer);
            token.transfer(commitments[i].bidder, tokenTransfer);
        }
        address payable payableToken = address(uint160(address(token)));
        payableToken.transfer(ethSendToTokenContract);
        if (tokenSupply > 0) token.burn(tokenSupply);
        currState = State.RELEASED;
    }

    function getCommitments(address bidder) public view returns (uint256) {
        return bidderToAmount[bidder];
    }
}
