pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CypherpunkCoin.sol";

// import "./preventReentryTransfer";

contract AuctionAgainsReentry {
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

    // open the auction
    function openAuction() external {
        require(
            msg.sender == address(token),
            "Only the token contract can open the auction"
        );
        require(currState == State.CREATED, "The auction is already opened");
        startTime = now;
        currState = State.OPENED;
        emit changeState(currState);
    }

    // for a bidder to commit their money
    function commit() external payable {
        require(
            currState == State.OPENED,
            "The contract closed or have not opened yet"
        );
        // check whether the time is over
        require(now.sub(startTime) < timeLimit, "The contract is over ");

        // calculate the current price at this time
        uint256 curPrice = (startTime.add(timeLimit).sub(now))
            .mul(1000)
            .div(timeLimit)
            .mul(startPrice.sub(reservedPrice))
            .div(1000)
            .add(reservedPrice);
        // check whether the total Demand already exceeds supply
        require(
            totalEther < tokenSupply.mul(curPrice * MULTIPLIER),
            "The demand is larger than supply, the contract should close now"
        );

        totalEther = totalEther.add(msg.value);
        commitments.push(commitment(msg.sender, msg.value));
        bidderToAmount[msg.sender] = bidderToAmount[msg.sender].add(msg.value);
        emit newCommit(totalEther);
        // to check whether the demand is larger than supply
        if (totalEther >= tokenSupply.mul(curPrice * MULTIPLIER)) {
            // avoid the reentry attack by paying the last bidder or not at the commitment stage
            // if it fails, then the commitment is failed and this
            // does not affect other bidders
            clearingPrice = curPrice;
            uint256 ethSendBack = totalEther.sub(
                tokenSupply.mul(clearingPrice.mul(MULTIPLIER))
            );
            if (ethSendBack > 0) {
                totalEther = totalEther.sub(ethSendBack);
                commitments[commitments.length - 1].amount = (msg.value).sub(
                    ethSendBack
                );
                bidderToAmount[msg.sender] = bidderToAmount[msg.sender].sub(
                    ethSendBack
                );
                currState = State.CLOSED;
                emit changeState(currState);
                msg.sender.transfer(ethSendBack);
            } else {
                currState = State.CLOSED;
                emit changeState(currState);
            }
        }
    }

    // Anyone can close the auction as long as contract state satisfy the requirements
    function closeAuction() public {
        require(currState == State.OPENED, "The contract already closed");
        if (now.sub(startTime) > timeLimit) {
            //in case the number of ethers staked already makes the demand exceed supply
            // when price decreases
            currState = State.CLOSED;
            emit changeState(currState);
            if (totalEther > tokenSupply.mul(reservedPrice * MULTIPLIER)) {
                clearingPrice = totalEther.div(tokenSupply).div(MULTIPLIER);
            } else clearingPrice = reservedPrice;
        } else {
            uint256 curPrice = (startTime.add(timeLimit).sub(now))
                .mul(1000)
                .div(timeLimit)
                .mul(startPrice.sub(reservedPrice))
                .div(1000)
                .add(reservedPrice);
            // In case the number of ethers staked already makes the demand exceed supply
            // when price decreases
            require(
                totalEther >= tokenSupply.mul(curPrice * MULTIPLIER),
                "Not the right time to close"
            );
            currState = State.CLOSED;
            emit changeState(currState);
            clearingPrice = totalEther.div(tokenSupply).div(MULTIPLIER);
        }
    }

    // Anyone can trigger the release as long as contract state satisfies the requirements
    function releaseTokens() public {
        require(
            currState == State.CLOSED,
            "The auction already releases or not opened yet"
        );
        currState = State.RELEASED;
        emit changeState(currState);
        uint256 remainingToken = tokenSupply;
        for (uint256 i = 0; i < commitments.length; i++) {
            // token to transfer to the bidder
            uint256 tokenTransfer = commitments[i].amount.div(
                clearingPrice.mul(MULTIPLIER)
            );
            remainingToken = tokenSupply.sub(tokenTransfer);
            token.transfer(commitments[i].bidder, tokenTransfer);
        }
        // send money to the token contract
        address payable payableTokenContract = address(uint160(address(token)));
        payableTokenContract.transfer(totalEther);
        if (remainingToken > 0) token.burn(remainingToken);
    }

    function getCommitments(address bidder) public view returns (uint256) {
        return bidderToAmount[bidder];
    }

    event changeState(State s);
    event newCommit(uint256 tEther);
}
