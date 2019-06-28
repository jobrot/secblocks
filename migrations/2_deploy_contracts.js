const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");
const InsiderListController = artifacts.require("../contracts/Controlling/InsiderListController.sol");
const PEPListController = artifacts.require("../contracts/Controlling/PEPListController.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");
const Registry = artifacts.require("../contracts/Registry.sol");

const UnstructuredProxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");

const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const DividendToken = artifacts.require("../contracts/Tokens/DividendToken.sol");
const abi = require('ethereumjs-abi');


module.exports = async function (deployer) {


    await deployer.deploy(KYCController);
    await deployer.deploy(InsiderListController);
    await deployer.deploy(PEPListController);
    await deployer.deploy(TransferQueues);
    await deployer.deploy(Controller, KYCController.address, InsiderListController.address, PEPListController.address);
    await deployer.deploy(VotingToken, Controller.address,  TransferQueues.address);
    var registrydeployed = await deployer.deploy(Registry);

    // var proxyAddress = await registrydeployed.createProxy("VotingTokenExampleCompany").then((result)=>{
    //     return result.logs[0].args.proxyAddress;
    // });

    //console.log(proxyAddress);
    //console.log((await registrydeployed.proxies("VotingTokenExampleCompany")).proxyAddress);

    //--- Create all Subcontroller proxies ---

    var kycControllerProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['KYCController'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    kycControllerProxy.upgradeToInit(KYCController.address);
    var kycController = await KYCController.at(kycControllerProxy.address); // this line is unneccessary, proxy address could also be used if we dont need functions of the controller itself


    var insiderListControllerProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['InsiderListControllerExampleCompany'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    insiderListControllerProxy.upgradeToInit(InsiderListController.address);
    var insiderListController = await InsiderListController.at(insiderListControllerProxy.address);


    var pepListControllerProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['PEPListController'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    pepListControllerProxy.upgradeToInit(PEPListController.address);
    var pepListController = await PEPListController.at(pepListControllerProxy.address);

    //--- create controller proxy ---

    var controllerProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['ControllerExampleCompany'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    controllerProxy.upgradeToInit(Controller.address);
    var controller = await Controller.at(controllerProxy.address);

    //--- create TransferQueues proxy ---
    var transferQueuesProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['TransferQueuesExampleCompany'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    transferQueuesProxy.upgradeToInit(TransferQueues.address);
    var transferQueues = await TransferQueues.at(transferQueuesProxy.address);


    // add subcontroller proxies to controller proxy

    controller.setKYCController(kycController.address);
    controller.setPEPListController(pepListController.address);
    controller.setInsiderListController(insiderListController.address);

    //--- Deploying the main Token contract (in real world use, this would happen for each token that is listed

    var votingTokenProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['VotingTokenExampleCompany'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    votingTokenProxy.upgradeToInit(VotingToken.address);
    var votingToken = await VotingToken.at(votingTokenProxy.address);

    votingToken.setController(controller.address);
    votingToken.setTransferQueues(transferQueues.address);

    /*
        this.proxy = await UnstructuredProxy.new(deployer);
        this.proxy.upgradeToInit(this.token.address);
        this.token = await VotingToken.at(this.proxy.address);
        await this.token.setController(this.controller.address);
        await this.token.setTransferQueues(this.transferQueues.address);
        await this.token.addIssuer(deployer);
        await this.token.addVotingOfficial(deployer);*/



  /*  deployer.deploy(KYCController).then(() => {
        return deployer.deploy(InsiderListController).then(() => {
            return deployer.deploy(PEPListController).then(() => {
                return deployer.deploy(TransferQueues).then(() => {
                    return deployer.deploy(Controller, KYCController.address, InsiderListController.address, PEPListController.address,).then(() => {
                        return deployer.deploy(VotingToken, Controller.address,  TransferQueues.address).then(() => {
                            return deployer.deploy(Registry).then((registrydeployed) => {
                                //VotingToken.deployed.totalsupply();
                                //proxydeployed.upgradeToInit(VotingToken.address);
                                registrydeployed.createProxy(abi.rawEncode(['bytes3232'],['VotingTokenExampleCompany'])).then((result)=>{
                                    console.log(result);
                                    console.log("hier");
                                    console.log(result.logs[0].address);
                                });
                                return true;
                            });
                        });
                    });
                });
            });
        });
    });*/


    // Deploy multiple contracts, some with arguments and some without.
// This is quicker than writing three `deployer.deploy()` statements as the deployer
// can perform the deployment as a single batched request.
    //    deployer.deploy([
    //     [A, arg1, arg2, ...],
    //     B,
    //    [C, arg1]
    //  ]);


};
