pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./Auction.sol";

contract CypherpunkCoin is Context, AccessControl, ERC20Burnable {
    bytes32 public constant AUCTION_CREATOR_ROLE = keccak256(
        "AUCTION_CREATOR_ROLE"
    );

    constructor(string memory name, string memory symbol)
        public
        ERC20(name, symbol)
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(AUCTION_CREATOR_ROLE, msg.sender);
        _mint(msg.sender, 1000);
    }

    function createAuction(uint256 startPrice, uint256 amount) public {
        require(
            hasRole(AUCTION_CREATOR_ROLE, msg.sender),
            "CypherpunkCoin: must have auction creator role to create an auction"
        );
        Auction myAuction = new Auction(startPrice, this);
        transfer(address(myAuction), amount);
    }
}
