// const auction = artifacts.require("Auction");
const cypherpunkCoin = artifacts.require("CypherpunkCoin");
const r = artifacts.require("Reentrancy");
const safeMathLib = artifacts.require("@openzeppelin/contracts/access/SafeMath")

module.exports = function(deployer) {
  deployer.deploy(cypherpunkCoin, "Cypherpunk", "CY");
  deployer.deploy(r);
};
