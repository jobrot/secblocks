const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect, assert } = require('chai')
    .use(require('chai-bytes'));
const should = require('chai').should();
const abi = require('ethereumjs-abi');

const MockContract = artifacts.require("../contracts/Mocks/MockContract.sol"); //Gnosis Mock contract framework


const DividendToken = artifacts.require("../contracts/Tokens/DividendToken.sol");
const KYCVerifier = artifacts.require("../contracts/Controlling/KYCVerifier.sol");
const InsiderListVerifier = artifacts.require("../contracts/Controlling/InsiderListVerifier.sol");
const PEPListVerifier = artifacts.require("../contracts/Controlling/PEPListVerifier.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");
const UnstructuredProxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");



//when executing this tests, make sure that distributer has a sufficient amount of ether (23.5), i.e. with a standard
//ganache- or truffle test suite, all test can be executed max 4 time before reinitializing
contract('DividendToken', function ([deployer, initialHolder, distributer, recipient, anotherAccount]) {



    beforeEach(async function () {
        

        this.kycMock = await MockContract.new();
        this.insiderListMock = await MockContract.new();
        this.pepListMock = await MockContract.new();

        //Let the mocks of all Controllers return Success by default, except if defined differently for tests
        await this.kycMock.givenAnyReturnBool(true);
        await this.insiderListMock.givenAnyReturnBool(true);
        await this.pepListMock.givenAnyReturnBool(true);


        //create SUT
        this.transferQueues = await TransferQueues.new(); //TODO if bored, maybe proxy transferqueues in tests
        this.controller = await Controller.new(); //this.kycMock.address, this.insiderListMock.address, this.pepListMock.address

        //not via mocked Token and initial supply, because erc20 functionality tests are not required anymore here, and
        //initial minting would distort test results
        this.token = await DividendToken.new(); //this.controller.address, this.transferQueues.address

        //Comment this in for full proxy test
        this.controllerProxy = await UnstructuredProxy.new(deployer);
        await this.controllerProxy.upgradeToInit(this.controller.address);
        this.controller = await Controller.at(this.controllerProxy.address);
        this.controller.setKYCVerifier(this.kycMock.address);
        this.controller.setPEPListVerifier(this.pepListMock.address);
        this.controller.setInsiderListVerifier(this.insiderListMock.address);

        this.proxy = await UnstructuredProxy.new(deployer);
        await this.proxy.upgradeToInit(this.token.address);
        this.token = await DividendToken.at(this.proxy.address);
        await this.token.setController(this.controller.address);
        await this.token.setTransferQueues(this.transferQueues.address);
        await this.token.addIssuerOrchestrator(deployer);
        await this.transferQueues.transferOwnership(this.token.address);


    });


    describe('distributeDividends', function () {
        describe('when no tokens were issued yet', function () {
            it('reverts', async function () {

                await expectRevert(this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('2', 'ether'))}),
                    'Currently, no tokens exist.'
                );
            });
        });



    });
    describe('distributing and withdrawing', function () {
        describe('when only one token holder exists', function () {
            it('transfers all dividends to the holder (check actual transfer)', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));


                let originalBalance = await web3.eth.getBalance(initialHolder);

                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('2', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('2', 'ether') });


                var { logs } = await this.token.withdrawDividend({from: initialHolder})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: initialHolder, weiAmount: web3.utils.toWei('2', 'ether') });


                //as we have to account for transfer costs for the withdrawing of the dividends, we check if the difference between the
                //balances is between the expected value for the gas costs
                var balanceDifference=new Number(await web3.eth.getBalance(initialHolder))-new Number(web3.utils.toWei('2', 'ether'))+new Number(web3.utils.toWei('0.005', 'ether'))-new Number(originalBalance);
                assert.isAbove((balanceDifference),0);
                assert.isBelow((balanceDifference),new Number(web3.utils.toWei('0.005', 'ether')));
            });
        });


        describe('when two token holder exist and it is issued', function () {
            it('transfers dividends according to holdings', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(50), abi.rawEncode(['bytes'],['']));


                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('3', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('3', 'ether') });


                var { logs } = await this.token.withdrawDividend({from: initialHolder})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: initialHolder, weiAmount: web3.utils.toWei('2', 'ether') });

                var { logs } = await this.token.withdrawDividend({from: anotherAccount})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: anotherAccount, weiAmount: web3.utils.toWei('1', 'ether') });

                //checks of balance are omitted, as the principal workings of transfer have been checked
            });
        });

        describe('when two token holder exist and tokens are transferred before distribution', function () {
            it('transfers more to second holder, according to transfer', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(50), abi.rawEncode(['bytes'],['']));

                await this.token.transferWithData(anotherAccount,new BN(50), abi.rawEncode(['bytes'],['']), {from: initialHolder})

                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('3', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('3', 'ether') });


                var { logs } = await this.token.withdrawDividend({from: initialHolder})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: initialHolder, weiAmount: web3.utils.toWei('1', 'ether') });

                var { logs } = await this.token.withdrawDividend({from: anotherAccount})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: anotherAccount, weiAmount: web3.utils.toWei('2', 'ether') });

                //checks of balance are omitted, as the principal workings of transfer have been checked
            });
        });


        describe('when two token holder exist and tokens are transferred after distribution', function () {
            it('transfers dividends according to holdings before transfer', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(50), abi.rawEncode(['bytes'],['']));


                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('3', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('3', 'ether') });

                await this.token.transferWithData(anotherAccount,new BN(50), abi.rawEncode(['bytes'],['']), {from: initialHolder})


                var { logs } = await this.token.withdrawDividend({from: initialHolder})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: initialHolder, weiAmount: web3.utils.toWei('2', 'ether') });

                var { logs } = await this.token.withdrawDividend({from: anotherAccount})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: anotherAccount, weiAmount: web3.utils.toWei('1', 'ether') });

                //checks of balance are omitted, as the principal workings of transfer have been checked
            });
        });

        describe('when two token holder exist and tokens are burned before distribution', function () {
            it('transfers dividends according to holdings including burning', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(50), abi.rawEncode(['bytes'],['']));

                await this.token.redeem(new BN(50), abi.rawEncode(['bytes'],['']), {from: initialHolder})


                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('3', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('3', 'ether') });



                var { logs } = await this.token.withdrawDividend({from: initialHolder})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: initialHolder, weiAmount: web3.utils.toWei('1.5', 'ether') });

                var { logs } = await this.token.withdrawDividend({from: anotherAccount})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: anotherAccount, weiAmount: web3.utils.toWei('1.5', 'ether') });

                //checks of balance are omitted, as the principal workings of transfer have been checked
            });
        });

        describe('when multiple transfers are executed, tokens are burned, and multiple payouts are created', function () {
            it('all dividends are transferred correctly', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(50), abi.rawEncode(['bytes'],['']));




                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('3', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('3', 'ether') });
                // initial: 2, another: 1

                await this.token.transferWithData(anotherAccount,new BN(50), abi.rawEncode(['bytes'],['']), {from: initialHolder})

                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('3', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('3', 'ether') });
                // initial: 1, another: 2


                await this.token.redeem(new BN(50), abi.rawEncode(['bytes'],['']), {from: initialHolder})

                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('0.5', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('0.5', 'ether') });
                // initial: 0, another: 0.5


                await this.token.issue(recipient, new BN(50), abi.rawEncode(['bytes'],['']));
                var { logs } = await this.token.distributeDividends({from: distributer, value: new BN(web3.utils.toWei('3', 'ether'))});
                expectEvent.inLogs(logs, 'DividendsDistributed', { from: distributer, weiAmount: web3.utils.toWei('3', 'ether') });
                // initial: 0, another: 2, recipient: 1

                var { logs } = await this.token.withdrawDividend({from: initialHolder})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: initialHolder, weiAmount: web3.utils.toWei('3', 'ether') });

                var { logs } = await this.token.withdrawDividend({from: anotherAccount})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: anotherAccount, weiAmount: web3.utils.toWei('5.5', 'ether') });

                var { logs } = await this.token.withdrawDividend({from: recipient})
                expectEvent.inLogs(logs, 'DividendWithdrawn', { to: recipient, weiAmount: web3.utils.toWei('1', 'ether') });


                //checks of balance are omitted, as the principal workings of transfer have been checked
            });
        });

    });
});

