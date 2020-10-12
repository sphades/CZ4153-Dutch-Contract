pragma solidity ^0.6.0;

contract Escrow {
    enum State { AWAITING_ETH_DEPOSIT, AWAITING_CPC_DEPOSIT, AWAITING_AUCTION_END, AUCTION_ENDED, COMPLETE }
    
    State public currState;
    
    address payable public buyer;
    address payable public seller;
    address payable public tokenAddress;
    
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this method");
        _;
    }

    modifier onlySeller(){
        require(msg.sender == seller, "Only seller can call this method");
        _;
    }
    
    constructor(address payable _buyer, address payable _seller) public {   //Seller = adress of Dutch Auction contract
        buyer = _buyer;
        seller = _seller;
        tokenAddress = ; //CypherpunkCoin contract address
    }
    
    function deposit_eth() onlyBuyer external payable { //Only buyer can call this method
        require(currState == State.AWAITING_ETH_DEPOSIT, "Already paid");
        currState = State.AWAITING_CPC_DEPOSIT;
    }

    
    function deposit_cpc() onlySeller external payable { //Only seller can call this method
        require(currState == State.AAWAITING_CPC_DEPOSIT, "Buyer has not deposited ETH");
        currState = State.AWAITING_AUCTION_END;
    }

    function close_auction() onlySeller external{   //Dutch Auction contract will call this method in all Escrow instances when auction ends
        currState = State.AUCTION_ENDED
    }

    function release() onlySeller external payable{ //Dutch Auction contract will call this method to release CPC tokens to bidders and ETH to the Ducth Auction contract after the auction ends
        require(currState == State.AUCTION_ENDED, "Auction is still ongoing");
        let token = await ERC20Basic.at(tokenAddress);
        let cpc_balance = await token.balanceOf(address(this));
        tokenAddress.call(bytes4(sha3("transferFrom(address,address,uint)")), seller, buyer, cpc_balance);  //Calls the transferFrom() function from the CypherpunkCoin smart contract.
        seller.transfer(address(this).balance); 
        currState = State.COMPLETE;
        selfdestruct(address(this));
    }
}