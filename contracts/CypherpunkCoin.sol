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
        //set up admin role
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        //set up auction creator role
        _setupRole(AUCTION_CREATOR_ROLE, msg.sender);
        _mint(msg.sender, 1000);
    }

    address public auctionAddress;

    // prices in units of microEther
    function createAuction(
        uint256 _startPrice,
        uint256 _reservedPrice,
        uint256 _supply,
        uint256 _timeLimit
    ) external {
        require(
            hasRole(AUCTION_CREATOR_ROLE, msg.sender),
            "CypherpunkCoin: must have auction creator role to create an auction"
        );
        Auction auction = new Auction(
            _startPrice,
            _reservedPrice,
            _supply,
            _timeLimit,
            this
        );
        transfer(address(auction), _supply);
        auctionAddress = address(auction);
    }

    function openCurrAuction() external {
        require(
            hasRole(AUCTION_CREATOR_ROLE, msg.sender),
            "CypherpunkCoin: must have auction creator role to open this auction"
        );
        Auction(auctionAddress).openAuction();
    }

    receive() external payable {}
}
