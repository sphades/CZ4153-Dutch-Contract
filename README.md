Welcome to CypherPunk project! 

# About this project
This project is to create an Auction that follows the idea of Dutch Auction where the price is determined by the market. More information on the model of this auction is here: https://algorand.foundation/algo-auctions 

# Guide to run the app: 

Prerequisites: Ganache, NPM, Metamask

Open a command prompt in the project directory: truffle migrate --reset //compiles and deploy the cryptotoken contract

After that, open the truffle console by this command line: truffle console

Hooray, we now can interact with the smart contracts by the following steps:

var c = await CypherpunkCoin.deployed()

c.createAuction(100000, 10000, 100, 20) // create auction contract, with start price of 100000 mEth, reservedPrice of 10000 mEth, total supply of 100 tokens. This auction lasts for 20 minutes

c.openCurrAuction // start the auction contract

Thereafter, open a new command prompt in the same directory and follow these commands:

cd client

npm start // start the dapp


Please check out the AuctionAgainstAttack.sol and DoSAttack.sol in folder contracts to see our protection and attack respectively!
