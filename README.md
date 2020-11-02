# CZ4153-Dutch-Contract
Prerequsites:
Ganache
npm
metamask

Installation
npm install
cd client
npm install

To start: 
Open ganache, create new workspace and import truffle.config 
import rpc server to metamask
import account from ganache to metamask
import token from token contract to metamask

Open a command prompt in the project directory
truffle migrate --reset //compiles and deploy the cryptotoken contract
truffle console 
var c = await CypherpunkCoin.deployed() 
c.createAuction(100000, 10000, 100, 20) //creates auction contract, units in mEth
c.openCurrAuction() // this starts the auction contract

new command prompt in the same directory
cd client 
npm start //start the dapp