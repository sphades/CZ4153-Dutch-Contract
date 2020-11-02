pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CypherpunkCoin.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Auction is AccessControl {
    using SafeMath for uint256;

    struct commitment {
        address bidder;
        uint256 amount;
    }

    commitment[] private commitments;
    mapping(address => uint256) bidderToAmount;

    enum State {CREATED, OPENED, CLOSED, RELEASED}

    // total Ether stored
    uint256 public totalEther;
    uint256 public startPrice;
    uint256 public reservedPrice;
    uint256 public clearingPrice;
    // total Supply of tokens
    uint256 public tokenSupply;
    uint256 public startTime;
    uint256 public timeLimit;
    uint256 public constant MULTIPLIER = 10**12;

    CypherpunkCoin private token;
    State public currState;

    constructor(
        uint256 _startPrice,
        uint256 _reservedPrice,
        uint256 _tokenSupply,
        uint256 _timeLimit,
        CypherpunkCoin _token
    ) public {
        startPrice = _startPrice;
        reservedPrice = _reservedPrice;
        tokenSupply = _tokenSupply;
        // conver from minutes to seconds
        timeLimit = _timeLimit * 60;
        token = _token;
        currState = State.CREATED;
    }

    function commit() external payable {
        // Auction already closes or does not open yet, send back the money to user
        // if (currState != State.OPENED) {
        //     msg.sender.transfer(msg.value);
        //     emit closeAndSendBackMoney(msg.sender);
        //     return;
        // }
        require(
            currState == State.OPENED,
            "The contract closed or have not opened yet"
        );
        // if the time is over but auction does not close, close it at the exact clearing price
        require(now.sub(startTime) < timeLimit, "The contract is over ");

        // calculate the current price at this time
        uint256 curPrice = (startTime.add(timeLimit).sub(now))
            .mul(1000)
            .div(timeLimit)
            .mul(startPrice.sub(reservedPrice))
            .div(1000)
            .add(reservedPrice);
        // in case the existing number of ethers comitted already makes the demand exceed supply
        // when price decreases
        require(
            totalEther < tokenSupply.mul(curPrice * MULTIPLIER),
            "The contract already closed"
        );

        totalEther = totalEther.add(msg.value);
        commitments.push(commitment(msg.sender, msg.value));
        bidderToAmount[msg.sender] = bidderToAmount[msg.sender].add(msg.value);
        emit newCommit(totalEther);
        // to check whether the demand is larger than supply
        if (totalEther >= tokenSupply.mul(curPrice * MULTIPLIER)) {
            clearingPrice = curPrice;
            currState = State.CLOSED;
            emit changeState(currState);
        }
    }

    function closeAuction() public {
        require(currState != State.CLOSED, "The contract already closed");
        if (now.sub(startTime) > timeLimit) {
            currState = State.CLOSED;
            //in case the number of ethers staked already makes the demand exceed supply
            // when price decreases
            if (totalEther > tokenSupply.mul(reservedPrice * MULTIPLIER)) {
                clearingPrice = totalEther.div(tokenSupply).div(MULTIPLIER);
            } else clearingPrice = reservedPrice;
            currState = State.CLOSED;
            emit changeState(currState);
            return;
        }
        uint256 curPrice = (startTime.add(timeLimit).sub(now))
            .mul(1000)
            .div(timeLimit)
            .mul(startPrice.sub(reservedPrice))
            .div(1000)
            .add(reservedPrice);
        require(
            totalEther >= tokenSupply.mul(curPrice * MULTIPLIER),
            "Not the right time to close"
        );
        clearingPrice = totalEther.div(tokenSupply).div(MULTIPLIER);
        currState = State.CLOSED;
        emit changeState(currState);
    }

    // Anyone can trigger the release as long as it satisfies the requirements
    function releaseTokens() external {
        require(
            currState == State.CLOSED,
            "The auction already releases or not opened yet"
        );
        uint256 ethSendToTokenContract = totalEther;
        uint256 remainingToken = tokenSupply;
        for (uint256 i = 0; i < commitments.length; i++) {
            // if (remainingToken == 0) break;
            // token to transfer to the bidder
            uint256 tokenTransfer = commitments[i].amount.div(
                clearingPrice * MULTIPLIER
            );
            if (tokenTransfer > remainingToken) {
                //send back redundant ether
                address payable payableLastBidder = address(
                    uint160(commitments[i].bidder)
                );
                tokenTransfer = remainingToken;
                uint256 ethSendToPayableLastBidder = commitments[i].amount.sub(
                    tokenTransfer.mul(clearingPrice * MULTIPLIER)
                );
                payableLastBidder.transfer(ethSendToPayableLastBidder);
                ethSendToTokenContract = ethSendToTokenContract.sub(
                    ethSendToPayableLastBidder
                );
                remainingToken = 0;
            } else remainingToken = remainingToken.sub(tokenTransfer);
            token.transfer(commitments[i].bidder, tokenTransfer);
        }
        address payable payableTokenContract = address(uint160(address(token)));
        payableTokenContract.transfer(ethSendToTokenContract);
        if (remainingToken > 0) token.burn(remainingToken);
        currState = State.RELEASED;
        emit changeState(currState);
    }

    function getCommitments(address bidder) public view returns (uint256) {
        return bidderToAmount[bidder];
    }

    function openAuction() external {
        require(
            msg.sender == address(token),
            "Only the token contract can open the auction"
        );
        startTime = now;
        currState = State.OPENED;
        emit changeState(currState);
    }

    event changeState(State s);
    event closeAndSendBackMoney();
    event newCommit(uint256 tEther);
}
