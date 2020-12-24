const cypherpunkCoin = artifacts.require("CypherpunkCoin");
// const Auction = artifacts.require("Auction.sol");;
// const Auction = artifacts.require("AuctionAgainstReentry");

module.exports = (deployer,network,accounts) => {
  deployer.deploy(cypherpunkCoin, "Cypherpunk", "CY").then(async (cypherPunk)=>{
    // await cypherPunk.createAuction(3000,2000,200,5);
    // auctionAddress = await cypherPunk.auctionAddress();
    // await cypherPunk.openCurrAuction();
    // auction = await Auction.at(auctionAddress);
  
    // for (let i = 0; i<300;i++)
    //     try {
    //         await auction.commit({value: 111111111111111,from:accounts[0]});}
    //     catch(err){}  
    //       //    .then((instance)=> instance.createAuction(300,200,200));
  })

};