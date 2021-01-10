Welcome to CypherPunk project! 

# About this project
This project is to create an ICO that follows the idea of Dutch Auction where the price is determined by the market. More information on the model of this auction is here: https://algorand.foundation/algo-auctions 

# Guide to run the app

Prerequisites: Ganache, NPM, Metamask

Steps: 

1. Open your Ganache UI

2. Open a command prompt in the project directory: truffle migrate --reset //compiles and deploy the cryptotoken contract

3. Open the truffle console by this command line: truffle console

4. Hooray, we now can interact with the smart contracts by the following steps:

var c = await CypherpunkCoin.deployed()

c.createAuction(100000, 10000, 100, 20) // create auction contract, with start price of 100000 mEth, reservedPrice of 10000 mEth, total supply of 100 tokens. This auction lasts for 20 minutes

c.openCurrAuction() // start the auction contract

5. Thereafter, open a new command prompt in the same directory and follow these commands:

cd client

npm start // start the dapp

6. Go to the web address: localhost:3000. Login into Metamask, connect to localhost of Ganache and add any account from Ganache to Metamask.

7. Play with the app :)
# Security issues

Security issues of the app are discussed in the term paper (in directory paper)

