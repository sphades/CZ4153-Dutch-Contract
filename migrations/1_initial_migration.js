const cypherpunkCoin = artifacts.require("CypherpunkCoin");

module.exports = function(deployer) {
  deployer.deploy(cypherpunkCoin, "Cypherpunk", "CY")
        //    .then((instance)=> instance.createAuction(300,200,200));
};