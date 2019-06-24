const tryExpectCatch = require('./misc/trycatch');

const KYCController = artifacts.require('KYCController.sol');
const truffleAssert = require('truffle-assertions');
const UnstructuredProxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");

const abi = require('ethereumjs-abi');
const should = require('chai').should();

const NULLBYTE=abi.rawEncode(['bytes'],['']);

contract(['KYCController', 'KYCVerifierRole'], (accounts) => {
    let origSut;
    let sut;
    let proxy;
    let deployer = accounts[0];
    let verifier = accounts[1];
    let otherAccount = accounts[2];
    let whitelisted = accounts[3];
    let unwhitelisted = accounts[4];
    let unrelatedAccount = accounts[9];


    before(async () => {
        sut = await KYCController.new();
        //comment this in for proxy test
        proxy = await UnstructuredProxy.new(deployer);
        await proxy.upgradeToInit(sut.address);
        sut = await KYCController.at(proxy.address);
    });

    it('deployer should be a verifier', async () => {
        const result = await sut.isKYCVerifier(deployer);
        assert.equal(result, true);
    });

    it('unrelated accounts should not be able to add new verifiers', async () => {
        //await expectThrow(this.moderator.addModerator(moderatorRole, { from: unrelatedAccount }));
        await tryExpectCatch(sut.addKYCVerifier(verifier, {from: unrelatedAccount}), 'KYCVerifierRole: caller does not have the KYCVerifier role');
        await truffleAssert.reverts(
            sut.addKYCVerifier(verifier, {from: unrelatedAccount}), 'KYCVerifierRole: caller does not have the KYCVerifier role');


        const result = await sut.isKYCVerifier(verifier);
        assert.equal(result, false);
    });

    it('verifiers should be able to add new verifiers', async () => {
        const result1 = await sut.addKYCVerifier(verifier, {from: deployer});

        truffleAssert.eventEmitted(result1, 'KYCVerifierAdded', (ev) => {
            return ev.account === verifier;
        });

        const status1 = await sut.isKYCVerifier(verifier);
        assert.equal(status1, true);


        const result2 = await sut.addKYCVerifier(otherAccount, {from: verifier});

        truffleAssert.eventEmitted(result2, 'KYCVerifierAdded', (ev) => {
            return ev.account === otherAccount;
        });

        const status2 = await sut.isKYCVerifier(otherAccount);
        assert.equal(status2, true);
    });


    //as all functions test only on the whitelist, they can all be tested in parallel

    it('all verify actions should fail if one participating address is not whitelisted', async () => {
        await sut.addAddressToWhitelist(whitelisted);

        const resultIssue = (await sut.verifyIssue( unwhitelisted, 100,NULLBYTE, {from: deployer}));

        const resultTransferUU= (await sut.verifyTransfer(unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultTransferWU = (await sut.verifyTransfer(whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultTransferUW = (await sut.verifyTransfer(unwhitelisted, whitelisted, 100, NULLBYTE, {from: deployer}));


        const resultTransferFromUUU= (await sut.verifyTransferFrom(unwhitelisted, unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultTransferFromWUU = (await sut.verifyTransferFrom(whitelisted, unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultTransferFromWWU = (await sut.verifyTransferFrom(whitelisted, whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultTransferFromUWU = (await sut.verifyTransferFrom(unwhitelisted, whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultTransferFromUUW = (await sut.verifyTransferFrom(unwhitelisted, unwhitelisted, whitelisted, 100, NULLBYTE, {from: deployer}));
        const resultTransferFromUWW = (await sut.verifyTransferFrom(unwhitelisted, whitelisted, whitelisted, 100, NULLBYTE, {from: deployer}));



        const resultRedeem = (await sut.verifyRedeem(unwhitelisted, 100, NULLBYTE, {from: deployer}));

        const resultRedeemFromUU= (await sut.verifyRedeemFrom(unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultRedeemFromWU = (await sut.verifyRedeemFrom(whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer}));
        const resultRedeemFromUW = (await sut.verifyRedeemFrom(unwhitelisted, whitelisted, 100, NULLBYTE, {from: deployer}));


       assert.equal(resultIssue, false);

        assert.equal(resultTransferUU, false);
        assert.equal(resultTransferWU, false);
        assert.equal(resultTransferUW, false);

        assert.equal(resultTransferFromUUU, false);
        assert.equal(resultTransferFromWUU, false);
        assert.equal(resultTransferFromWWU, false);
        assert.equal(resultTransferFromUWU, false);
        assert.equal(resultTransferFromUUW, false);
        assert.equal(resultTransferFromUWW, false);

        assert.equal(resultRedeem, false);

        assert.equal(resultRedeemFromUU, false);
        assert.equal(resultRedeemFromWU, false);
        assert.equal(resultRedeemFromUW, false);

    });



    it('all verify actions should succeed if all participating address are not whitelisted', async () => {
        await sut.addAddressToWhitelist(whitelisted);

        const resultIssue = await sut.verifyIssue( whitelisted, 100,  NULLBYTE,{from: deployer});

        const resultTransfer= await sut.verifyTransfer(whitelisted, whitelisted, 100, NULLBYTE, {from: deployer});

        const resultTransferFrom= await sut.verifyTransferFrom(whitelisted, whitelisted, whitelisted, 100, NULLBYTE, {from: deployer});

        const resultRedeem = await sut.verifyRedeem(whitelisted, 100, NULLBYTE, {from: deployer});

        const resultRedeemFrom= await sut.verifyRedeemFrom(whitelisted, whitelisted, 100, NULLBYTE, {from: deployer});


        assert.equal(resultIssue, true);

        assert.equal(resultTransfer, true);

        assert.equal(resultTransferFrom, true);

        assert.equal(resultRedeem, true);

        assert.equal(resultRedeemFrom, true);

    });

});