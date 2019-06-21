const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");
const InsiderListController = artifacts.require("../contracts/Controlling/InsiderListController.sol");
const PEPListController = artifacts.require("../contracts/Controlling/PEPListController.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");

const Proxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");

const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const DividendToken = artifacts.require("../contracts/Tokens/DividendToken.sol");


module.exports = function (deployer) {
    var address;


    deployer.deploy(KYCController).then(() => {
        return deployer.deploy(InsiderListController).then(() => {
            return deployer.deploy(PEPListController).then(() => {
                return deployer.deploy(TransferQueues).then(() => {
                    return deployer.deploy(Controller, KYCController.address, InsiderListController.address, PEPListController.address,).then(() => {
                        return deployer.deploy(VotingToken, Controller.address,  TransferQueues.address).then(() => {
                            return deployer.deploy(Proxy).then((proxydeployed) => {
                                //VotingToken.deployed.totalsupply();
                                proxydeployed.upgradeTo(VotingToken.address);
                                return true;
                            });
                        });
                    });
                });
            });
        });
    });


    // Deploy multiple contracts, some with arguments and some without.
// This is quicker than writing three `deployer.deploy()` statements as the deployer
// can perform the deployment as a single batched request.
    //    deployer.deploy([
    //     [A, arg1, arg2, ...],
    //     B,
    //    [C, arg1]
    //  ]);


};
