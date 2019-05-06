const tryExpectCatch = require('./misc/trycatch');

const KYCController = artifacts.require('KYCController.sol');
const truffleAssert = require('truffle-assertions');

const STATUS_SUCCESS = "0x51";
const STATUS_FAIL = "0x50";
const ALLOWED_APPLICATION_CODE = web3.utils.keccak256('org.tenx.allowed');
const FORBIDDEN_APPLICATION_CODE = web3.utils.keccak256('org.tenx.forbidden');
const NULLBYTE = '0x';

contract(['KYCController', 'KYCVerifierRole'], (accounts) => {
    let sut;
    let deployer = accounts[0];
    let verifier = accounts[1];
    let otherAccount = accounts[2];
    let whitelisted = accounts[3];
    let unwhitelisted = accounts[4];
    let unrelatedAccount = accounts[9];


    before(async () => {
        sut = await KYCController.new();
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
        const resultIssue = await sut.verifyIssue(unwhitelisted, 100, NULLBYTE, {from: deployer});

        const resultTransferUU= await sut.verifyTransfer(unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultTransferWU = await sut.verifyTransfer(whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultTransferUW = await sut.verifyTransfer(unwhitelisted, whitelisted, 100, NULLBYTE, {from: deployer});

        const resultTransferFromUUU= await sut.verifyTransferFrom(unwhitelisted, unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultTransferFromWUU = await sut.verifyTransferFrom(whitelisted, unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultTransferFromWWU = await sut.verifyTransferFrom(whitelisted, whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultTransferFromUWU = await sut.verifyTransferFrom(unwhitelisted, whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultTransferFromUUW = await sut.verifyTransferFrom(unwhitelisted, unwhitelisted, whitelisted, 100, NULLBYTE, {from: deployer});
        const resultTransferFromUWW = await sut.verifyTransferFrom(unwhitelisted, whitelisted, whitelisted, 100, NULLBYTE, {from: deployer});

        const resultRedeem = await sut.verifyRedeem(unwhitelisted, 100, NULLBYTE, {from: deployer});

        const resultRedeemFromUU= await sut.verifyRedeemFrom(unwhitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultRedeemFromWU = await sut.verifyRedeemFrom(whitelisted, unwhitelisted, 100, NULLBYTE, {from: deployer});
        const resultRedeemFromUW = await sut.verifyRedeemFrom(unwhitelisted, whitelisted, 100, NULLBYTE, {from: deployer});



        assert.equal(resultIssue.allowed, false);
        assert.equal(resultIssue.statusCode, STATUS_FAIL);

        assert.equal(resultTransferUU.allowed, false);
        assert.equal(resultTransferUU.statusCode, STATUS_FAIL);
        assert.equal(resultTransferWU.allowed, false);
        assert.equal(resultTransferWU.statusCode, STATUS_FAIL);
        assert.equal(resultTransferUW.allowed, false);
        assert.equal(resultTransferUW.statusCode, STATUS_FAIL);

        assert.equal(resultTransferFromUUU.allowed, false);
        assert.equal(resultTransferFromUUU.statusCode, STATUS_FAIL);
        assert.equal(resultTransferFromWUU.allowed, false);
        assert.equal(resultTransferFromWUU.statusCode, STATUS_FAIL);
        assert.equal(resultTransferFromWWU.allowed, false);
        assert.equal(resultTransferFromWWU.statusCode, STATUS_FAIL);
        assert.equal(resultTransferFromUWU.allowed, false);
        assert.equal(resultTransferFromUWU.statusCode, STATUS_FAIL);
        assert.equal(resultTransferFromUUW.allowed, false);
        assert.equal(resultTransferFromUUW.statusCode, STATUS_FAIL);
        assert.equal(resultTransferFromUWW.allowed, false);
        assert.equal(resultTransferFromUWW.statusCode, STATUS_FAIL);

        assert.equal(resultRedeem.allowed, false);
        assert.equal(resultRedeem.statusCode, STATUS_FAIL);

        assert.equal(resultRedeemFromUU.allowed, false);
        assert.equal(resultRedeemFromUU.statusCode, STATUS_FAIL);
        assert.equal(resultRedeemFromWU.allowed, false);
        assert.equal(resultRedeemFromWU.statusCode, STATUS_FAIL);
        assert.equal(resultRedeemFromUW.allowed, false);
        assert.equal(resultRedeemFromUW.statusCode, STATUS_FAIL);

    });



    it('all verify actions should succeed if all participating address is not whitelisted', async () => {
        await sut.addAddressToWhitelist(whitelisted);
        const resultIssue = await sut.verifyIssue(whitelisted, 100, NULLBYTE, {from: deployer});

        const resultTransfer= await sut.verifyTransfer(whitelisted, whitelisted, 100, NULLBYTE, {from: deployer});

        const resultTransferFrom= await sut.verifyTransferFrom(whitelisted, whitelisted, whitelisted, 100, NULLBYTE, {from: deployer});

        const resultRedeem = await sut.verifyRedeem(whitelisted, 100, NULLBYTE, {from: deployer});

        const resultRedeemFrom= await sut.verifyRedeemFrom(whitelisted, whitelisted, 100, NULLBYTE, {from: deployer});

        assert.equal(resultIssue.allowed, true);
        assert.equal(resultIssue.statusCode, STATUS_SUCCESS);

        assert.equal(resultTransfer.allowed, true);
        assert.equal(resultTransfer.statusCode, STATUS_SUCCESS);

        assert.equal(resultTransferFrom.allowed, true);
        assert.equal(resultTransferFrom.statusCode, STATUS_SUCCESS);

        assert.equal(resultRedeem.allowed, true);
        assert.equal(resultRedeem.statusCode, STATUS_SUCCESS);

        assert.equal(resultRedeemFrom.allowed, true);
        assert.equal(resultRedeemFrom.statusCode, STATUS_SUCCESS);

    });

});