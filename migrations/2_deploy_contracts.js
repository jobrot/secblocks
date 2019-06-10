const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");
const InsiderListController = artifacts.require("../contracts/Controlling/InsiderListController.sol");
const PEPListController = artifacts.require("../contracts/Controlling/PEPListController.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");

const DividendToken = artifacts.require("../contracts/Tokens/DividendToken.sol");


module.exports = function (deployer) {
    var address;


    deployer.deploy(KYCController).then(() => {
        return deployer.deploy(InsiderListController).then(() => {
            return deployer.deploy(PEPListController).then(() => {
                return deployer.deploy(TransferQueues).then(() => {
                    return deployer.deploy(ERC1594, KYCController.address, InsiderListController.address, PEPListController.address, TransferQueues.address).then(() => {
                        return true; //ERC1594.deployed.setController(KYCController.address);
                    });
                });
            });
        });
    });

};
