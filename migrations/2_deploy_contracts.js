
const KYCVerifier = artifacts.require("../contracts/Controlling/KYCVerifier.sol");
const InsiderListVerifier = artifacts.require("../contracts/Controlling/InsiderListVerifier.sol");
const PEPListVerifier = artifacts.require("../contracts/Controlling/PEPListVerifier.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");
const Registry = artifacts.require("../contracts/registry.sol");

const UnstructuredProxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");

const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const DividendToken = artifacts.require("../contracts/Tokens/DividendToken.sol");
const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");

const abi = require('ethereumjs-abi');


module.exports = async function (deployer) {

    await deployer.deploy(KYCVerifier);
    await deployer.deploy(InsiderListVerifier);
    await deployer.deploy(PEPListVerifier);
    await deployer.deploy(TransferQueues);
    await deployer.deploy(Controller, KYCVerifier.address, InsiderListVerifier.address, PEPListVerifier.address);
    await deployer.deploy(VotingToken, Controller.address,  TransferQueues.address);
    var registrydeployed = await deployer.deploy(Registry);

    //--- Create all Subcontroller proxies ---

    var kycControllerProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['KYC'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    kycControllerProxy.upgradeToInit(KYCVerifier.address);
    var kycVerifier = await KYCVerifier.at(kycControllerProxy.address); // this line is unneccessary, proxy address could also be used if we dont need functions of the controller itself


    var insiderListControllerProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['InsiderListExampleCompany'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    insiderListControllerProxy.upgradeToInit(InsiderListVerifier.address);
    var insiderListVerifier = await InsiderListVerifier.at(insiderListControllerProxy.address);


    var pepListControllerProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['PEPList'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    pepListControllerProxy.upgradeToInit(PEPListVerifier.address);
    var pepListVerifier = await PEPListVerifier.at(pepListControllerProxy.address);

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

    controller.setKYCVerifier(kycVerifier.address);
    controller.setPEPListVerifier(pepListVerifier.address);
    controller.setInsiderListVerifier(insiderListVerifier.address);

    //--- Deploying the main Token contract (in real world use, this would happen for each token that is listed

    var votingTokenProxy = await UnstructuredProxy.at(await registrydeployed.createProxy(abi.rawEncode(['bytes32'], ['VotingTokenExampleCompany'])).then((result)=>{
        return result.logs[0].args.proxyAddress;
    }));
    votingTokenProxy.upgradeToInit(VotingToken.address);
    var votingToken = await VotingToken.at(votingTokenProxy.address);

    await transferQueues.transferOwnership(votingToken.address);

    votingToken.setController(controller.address);
    votingToken.setTransferQueues(transferQueues.address);
    votingToken.setName(abi.rawEncode(['bytes32'], ['ExampleCompany']));

};
