const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCVerifier = artifacts.require("../contracts/Controlling/KYCVerifier.sol");
const InsiderListVerifier = artifacts.require("../contracts/Controlling/InsiderListVerifier.sol");
const PEPListVerifier = artifacts.require("../contracts/Controlling/PEPListVerifier.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");
const Registry = artifacts.require("../contracts/registry.sol");

const UnstructuredProxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");

const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const DividendToken = artifacts.require("../contracts/Tokens/DividendToken.sol");
const abi = require('ethereumjs-abi');


module.exports = async function (deployer) {


    await deployer.deploy(KYCVerifier);
    await deployer.deploy(InsiderListVerifier);
    await deployer.deploy(PEPListVerifier);
    await deployer.deploy(TransferQueues);
    await deployer.deploy(Controller, KYCVerifier.address, InsiderListVerifier.address, PEPListVerifier.address);
    await deployer.deploy(VotingToken, Controller.address,  TransferQueues.address);
    var registrydeployed = await deployer.deploy(Registry);

    // var proxyAddress = await registrydeployed.createProxy("VotingTokenExampleCompany").then((result)=>{
    //     return result.logs[0].args.proxyAddress;
    // });

    //console.log(proxyAddress);
    //console.log((await registrydeployed.proxies("VotingTokenExampleCompany")).proxyAddress);

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

    await transferQueues.transferOwnership(VotingToken.address);

    votingToken.setController(controller.address);
    votingToken.setTransferQueues(transferQueues.address);
    votingToken.setName(abi.rawEncode(['bytes32'], ['ExampleCompany']));

    console.log("Deployer: ");
    console.log(deployer); //TODO add address of deployer to votingtoken as issuer
    //votingToken.addIssuer()

    /*
        this.proxy = await UnstructuredProxy.new(deployer);
        this.proxy.upgradeToInit(this.token.address);
        this.token = await VotingToken.at(this.proxy.address);
        await this.token.setController(this.controller.address);
        await this.token.setTransferQueues(this.transferQueues.address);
        await this.token.addIssuer(deployer);
        await this.token.addVotingOfficial(deployer);*/



  /*  deployer.deploy(KYCVerifier).then(() => {
        return deployer.deploy(InsiderListVerifier).then(() => {
            return deployer.deploy(PEPListVerifier).then(() => {
                return deployer.deploy(TransferQueues).then(() => {
                    return deployer.deploy(Controller, KYCVerifier.address, InsiderListVerifier.address, PEPListVerifier.address,).then(() => {
                        return deployer.deploy(VotingToken, Controller.address,  TransferQueues.address).then(() => {
                            return deployer.deploy(registry).then((registrydeployed) => {
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
