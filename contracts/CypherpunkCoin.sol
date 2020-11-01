pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./Auction.sol";

contract CypherpunkCoin is Context, AccessControl, ERC20Burnable {
    Auction public currAuction;
    bytes32 public constant AUCTION_CREATOR_ROLE = keccak256(
        "AUCTION_CREATOR_ROLE"
    );

    constructor(string memory name, string memory symbol)
        public
        ERC20(name, symbol)
    {
        //set up admin role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        //set up auction creator role
        _setupRole(AUCTION_CREATOR_ROLE, msg.sender);
        _mint(msg.sender, 1000);
    }
    address public auctionAddress;

    // create auction from the token
    function createAuction(
        uint256 _startPrice,
        uint256 _reservedPrice,
        uint256 _supply
    ) public returns (Auction) {require(
            hasRole(AUCTION_CREATOR_ROLE, msg.sender),
            "CypherpunkCoin: must have auction creator role to create an auction"
        );
        currAuction = new Auction(_startPrice, _reservedPrice, _supply, this);
        transfer(address(currAuction), _supply);
        auctionAddress = address(currAuction);
        return currAuction;
    }

    function openCurrAuction() external {
        require(
            hasRole(AUCTION_CREATOR_ROLE, msg.sender),
            "CypherpunkCoin: must have auction creator role to open this auction"
        );
        currAuction.openAuction();
    }

    receive() external payable {}
}
