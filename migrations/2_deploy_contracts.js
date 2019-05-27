const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");
const InsiderListController = artifacts.require("../contracts/Controlling/InsiderListController.sol");
const PEPListController = artifacts.require("../contracts/Controlling/PEPListController.sol");

const DividendToken = artifacts.require("../contracts/Tokens/DividendToken.sol");


module.exports = function (deployer) {
    /*deployer.deploy(ConvertLib);
    deployer.link(ConvertLib, MetaCoin); //link is for libraries (may already be deployed)
    deployer.deploy(MetaCoin);

    deployer.deploy(Examplecoin);*/


    deployer.deploy(KYCController).then(() => {
        return deployer.deploy(InsiderListController).then(() => {
            return deployer.deploy(PEPListController).then(() => {
                return deployer.deploy(VotingToken, KYCController.address, InsiderListController.address, PEPListController.address).then(() => {
                    return true; //ERC1594.deployed.setController(KYCController.address);
                });
            });
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
