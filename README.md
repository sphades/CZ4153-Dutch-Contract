# CZ4153-Dutch-Contract

# CZ4153-Dutch-Contract
Prerequsites:
Ganache
npm
metamask

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


// Our auction follow the Algorand ideas: https://algorand.foundation/algo-auctions
// Note about the reentry testing
// Our existing smart contract is not resistant to reentry attack, however,
// this is discovered 4 hours before the deadline
// therefore, we can only create our ideas to prevent this in the file AuctionAgainstReentry.sol
// the attack for Auction.sol is in file ReentryAttack.sol
// any problem or doubt, feel free to contact us!
