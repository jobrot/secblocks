/*var ConvertLib = artifacts.require("./ConvertLib.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");*/
//var IERC1594 = artifacts.require("../contracts/interfaces/IERC1594.sol");
const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
//var ERC20 = artifacts.require("../contracts/ERC20.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");


module.exports = function(deployer) {
  /*deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin); //link is for libraries (may already be deployed)
  deployer.deploy(MetaCoin);

  deployer.deploy(Examplecoin);*/


  deployer.deploy(KYCController).then(()=> {
      return deployer.deploy(ERC1594, KYCController.address).then(() => {
         return true; //ERC1594.deployed.setController(KYCController.address);
      });
  });
    //deployer.deploy(KYCController);
    //deployer.deploy(ERC1594, );

  //deployer.deploy(IERC1594);
  //deployer.deploy(ERC20);
  //deployer.link(IERC1594,ERC1594); //TODO check if needed
  //deployer.link(ERC20,ERC1594);
  //deployer.deploy(ERC1594);

 /* const controller = await KYCController.deployed();
  const erc1594 = await ERC1594.deployed();
*/
};
