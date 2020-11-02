# CZ4153-Dutch-Contract

To start: 
truffle migrate //compiles and deploy the cryptotoken contract
truffle console 
var c = await CypherpunkCoin.deployed() 
c.createAuction(100000, 10000, 100, 20) //creates auction contract
c.openCurrAuction() // this starts the auction

new console
cd client 
npm start //start the dapp