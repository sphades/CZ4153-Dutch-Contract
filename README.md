Welcome to CypherPunk project! 

# About this project
This project is to create an ICO that follows the idea of Dutch Auction where the price is determined by the market. More information on the model of this auction is here: https://algorand.foundation/algo-auctions 

# Guide to run the app
Prerequisites: Ganache, NPM, Metamask

Steps: 

1. Install dependencies:

- yarn install for the outer folder 

- npm install in the client folder

2. Open your Ganache UI

3. Open a command prompt in the project directory: truffle migrate --reset //compiles and deploy the cryptotoken contract

4. Open the truffle console by this command line: truffle console

5. Hooray, we now can interact with the smart contracts by the following steps:

var c = await CypherpunkCoin.deployed()

c.createAuction(100000, 10000, 100, 20) // create auction contract, with start price of 100000 mEth, reservedPrice of 10000 mEth, total supply of 100 tokens. This auction lasts for 20 minutes

c.openCurrAuction() // start the auction contract

6. Thereafter, open a new command prompt in the same directory and follow these commands:

cd client

npm start // start the dapp

7. Go to the web address: localhost:3000. Login into Metamask, connect to localhost of Ganache and add any account from Ganache to Metamask.

8. Play with the app :)

A demo of the app can be found at this link: https://youtu.be/49oLh1VYZfE
# Security issues

Security issues of the app are discussed in the term paper (in directory paper)

Any problem can reach out to us at this email: tccuong1999@gmail.com
