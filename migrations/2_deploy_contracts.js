/*var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");*/
var IERC1594 = artifacts.require("../contracts/interfaces/IERC1594.sol");
var ERC1594 = artifacts.require("../contracts/ERC1594.sol");
var ERC20 = artifacts.require("../contracts/ERC20.sol");


module.exports = function(deployer) {
  /*deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);

  deployer.deploy(Examplecoin);*/

  deployer.deploy(IERC1594);
  deployer.deploy(ERC20);
  deployer.link(IERC1594,ERC1594); //TODO check if needed
  deployer.link(ERC20,ERC1594);
  deployer.deploy(ERC1594);

};
