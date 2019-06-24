const {BN, constants, expectEvent, expectRevert} = require('openzeppelin-test-helpers');
const {ZERO_ADDRESS} = constants;
const should = require('chai').should();
const abi = require('ethereumjs-abi');

const MockContract = artifacts.require("../contracts/Mocks/MockContract.sol"); //Gnosis Mock contract framework
const GeneralControllerMock = artifacts.require("../contracts/Mocks/GeneralControllerMock.sol");

const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");
const InsiderListController = artifacts.require("../contracts/Controlling/InsiderListController.sol");
const PEPListController = artifacts.require("../contracts/Controlling/PEPListController.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");
const UnstructuredProxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");


const {
    shouldBehaveLikeERC20,
    shouldBehaveLikeERC20Transfer,
    shouldBehaveLikeERC20Approve,
} = require('./ERC20BehaviourTests.js');


const ERC1594Mock = artifacts.require('ERC1594Mock');

const TRANSFER_RETENTION_TIME = 604800; //604800 == 1 Week in Seconds
const AMLLimit = new BN(15000);
const initialSupply = AMLLimit;
const UnderAMLLimit = AMLLimit.sub(new BN(1));
const HalfAMLLimit = AMLLimit.div(new BN(2));


contract('ERC1594, TransferQueues, Controller', function ([deployer, initialHolder, recipient, anotherAccount]) {


    beforeEach(async function () {
        this.kycController = await KYCController.new();
        this.insiderListController = await InsiderListController.new();
        this.pepListController = await PEPListController.new();


        this.kycMock = await MockContract.new();
        this.insiderListMock = await MockContract.new();
        this.pepListMock = await MockContract.new();

        //Let the mocks of all Controllers return Success by default, except if defined differently for tests
        await this.kycMock.givenAnyReturnBool(true);
        await this.insiderListMock.givenAnyReturnBool(true);
        await this.pepListMock.givenAnyReturnBool(true);
        //const verifyTransfer = this.kycController.contract.methods.verifyTransfer(0, 0, 0,0).encodeABI();
        //await this.kycMock.givenMethodReturn(verifyTransfer,abi.rawEncode(['bool','bytes'], ['true','0x51']))
        //await this.insiderMock.givenAnyReturn(abi.rawEncode(['bool','bytes'], ['true','0x51']));
        //await this.pepListMock.givenAnyReturn(abi.rawEncode(['bool','bytes'], ['true','0x51']));

        //console.log(await this.kycMock.test("x"));

        /*console.log("kycController:");
        console.log(this.kycController);
        console.log("DG:");
        console.log(this.kycControllerDG);
        await this.kycControllerDG.deploy(deployer);*/
        //this.insiderListController = await InsiderListController.new();
        //this.pepListController =  await PEPListController.new();

        //create SUT
        this.transferQueues = await TransferQueues.new();
        this.controller = await Controller.new(); //this.kycMock.address, this.insiderListMock.address, this.pepListMock.address
        this.token = await ERC1594Mock.new(); //this.controller.address, this.transferQueues.address, initialHolder, initialSupply


        //Comment this in for full proxy test
        this.controllerProxy = await UnstructuredProxy.new(deployer);
        await this.controllerProxy.upgradeToInit(this.controller.address);
        this.controller = await Controller.at(this.controllerProxy.address);
        this.controller.setKYCController(this.kycMock.address);
        this.controller.setPEPListController(this.pepListMock.address);
        this.controller.setInsiderListController(this.insiderListMock.address);

        this.proxy = await UnstructuredProxy.new(deployer);
        await this.proxy.upgradeToInit(this.token.address);
        this.token = await ERC1594Mock.at(this.proxy.address);
        await this.token.setController(this.controller.address);
        await this.token.setTransferQueues(this.transferQueues.address);
        await this.token.addIssuer(deployer);
        await this.token.mint(initialHolder, initialSupply);



    });


    describe('transferWithData', function () {


        //kyc
        describe('when the sender or recipient is not kycd', function () {
            it('reverts', async function () {
                const transferFromInitialHolder = this.kycController.contract.methods.verifyTransfer(initialHolder, recipient, 1, abi.rawEncode(['bytes'], [''])).encodeABI();
                await this.kycMock.givenMethodReturnBool(transferFromInitialHolder, false);

                await expectRevert(this.token.transferWithData(recipient, 1, abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'The transfer is not allowed by the KYCController!'
                );
            });
        });

        describe('when the sender and recipient are kycd', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData(recipient, 1, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(initialSupply.sub(new BN(1)));

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal('1');
            });
        });


        // insiderlist
        describe('when the sender or recipient are insiders', function () {
            it('reverts', async function () {
                const transferFromInitialHolder = this.insiderListController.contract.methods.verifyTransfer(initialHolder, recipient, 1, abi.rawEncode(['bytes'], [''])).encodeABI();
                await this.insiderListMock.givenMethodReturnBool(transferFromInitialHolder, false);

                await expectRevert(this.token.transferWithData(recipient, 1, abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'The transfer is not allowed by the InsiderListController!'
                );
            });
        });

        describe('when the sender and recipient are not insiders', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData(recipient, 1, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(initialSupply.sub(new BN(1)));

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal('1');
            });
        });


        // peplist
        describe('when the sender or recipient are politically exposed persons', function () {
            it('reverts', async function () {
                const transferFromInitialHolder = this.pepListController.contract.methods.verifyTransfer(initialHolder, recipient, 1, abi.rawEncode(['bytes'], [''])).encodeABI();
                await this.pepListMock.givenMethodReturnBool(transferFromInitialHolder, false);

                await expectRevert(this.token.transferWithData(recipient, 1, abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'The transfer is not allowed by the PoliticallyExposedPersonController!'
                );
            });
        });

        describe('when the sender and recipient are not politically exposed persons', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData(recipient, 1, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(initialSupply.sub(new BN(1)));

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal('1');
            });
        });


        // AML


        describe('when the amount of a single transfer is just beyond the AML Limit', function () {
            it('transfers correctly', async function () {
                //await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                await this.token.transferWithData(recipient, UnderAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('1');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(UnderAMLLimit);
            });
        });


        describe('when the amount of a single transfer is at the AML Limit', function () {
            it('reverts', async function () {
                //await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                await expectRevert(this.token.transferWithData(recipient, AMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period.'
                );
            });
        });


        describe('when the amount of two concurrent transfers to a single recipient is at the AML Limit', function () {
            it('reverts', async function () {
                //await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                await this.token.transferWithData(recipient, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder})

                await expectRevert(this.token.transferWithData(recipient, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period.'
                );
            });
        });

        describe('when the amount of two concurrent transfers to multiple recipient is at the AML Limit', function () {
            it('reverts', async function () {
                //await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                await this.token.transferWithData(recipient, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder})

                await expectRevert(this.token.transferWithData(anotherAccount, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period.'
                );
            });
        });


        //this test should run last, as it changes time
        describe('when the amount of two transfers more than RETENTION_TIME apart to a single recipient are under the AML Limit', function () {
            it('transfers correctly', async function () {
                await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'], ['']));

                await this.token.transferWithData(recipient, UnderAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(TRANSFER_RETENTION_TIME + 1000);
                await advanceBlock();

                await this.token.transferWithData(recipient, UnderAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('2');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(UnderAMLLimit.add(UnderAMLLimit));

            });
        });

        describe('when the amount of two transfers more than RETENTION_TIME apart to multiple recipients are exactly the AML Limit', function () {
            it('transfers correctly', async function () {

                await this.token.transferWithData(recipient, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(TRANSFER_RETENTION_TIME + 1000);
                await advanceBlock();

                await this.token.transferWithData(anotherAccount, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('0');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(HalfAMLLimit);
                (await this.token.balanceOf(anotherAccount)).should.be.bignumber.equal(HalfAMLLimit);
            });
        });


        describe('when the amount of multiple transfers less than RETENTION_TIME apart to a single recipient are under the AML Limit', function () {
            it('transfers correctly', async function () {

                await this.token.transferWithData(recipient, AMLLimit.div(new BN(4)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(1000);
                await advanceBlock();

                await this.token.transferWithData(recipient, AMLLimit.div(new BN(4)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(1000);
                await advanceBlock();

                await this.token.transferWithData(recipient, AMLLimit.div(new BN(4)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(1000);
                await advanceBlock();

                await this.token.transferWithData(recipient, AMLLimit.div(new BN(4)).sub(new BN(1)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});


                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('1');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(UnderAMLLimit);


            });
        });


        //this test should run last, as it changes time
        describe('when the amount of two transfers more than RETENTION_TIME apart to a single recipient are under the AML Limit', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData(recipient, AMLLimit.div(new BN(4)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(1000);
                await advanceBlock();

                await this.token.transferWithData(recipient, AMLLimit.div(new BN(4)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(1000);
                await advanceBlock();

                await this.token.transferWithData(recipient, AMLLimit.div(new BN(4)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(AMLLimit.div(new BN(4)));

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(AMLLimit.div(new BN(4)).mul(new BN(3)));

                await advanceTime(1000);
                await advanceBlock();

                await expectRevert(this.token.transferWithData(recipient, AMLLimit.div(new BN(4)), abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period.'
                );

            });
        });


        describe('when the amount of multiple transfers less than RETENTION_TIME apart to a single recipient are at the AML Limit only when taking order into account', function () {
            it('reverts before time is over, and transfers correctly afterwards', async function () {
                await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'], ['']));


                await this.token.transferWithData(recipient, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                await advanceTime(TRANSFER_RETENTION_TIME / 4);
                await advanceBlock();

                //Reverts, as retention time is not yet over
                await expectRevert(this.token.transferWithData(recipient, HalfAMLLimit, abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period.'
                );
                await advanceTime(TRANSFER_RETENTION_TIME / 4);
                await advanceBlock();

                //smaller amounts to fill up queue
                await this.token.transferWithData(recipient, new BN(1), abi.rawEncode(['bytes'], ['']), {from: initialHolder});
                await this.token.transferWithData(recipient, new BN(1), abi.rawEncode(['bytes'], ['']), {from: initialHolder});


                await advanceTime(TRANSFER_RETENTION_TIME / 2);
                await advanceBlock();

                //this should now work, as the first transfer is cleared
                await this.token.transferWithData(recipient, AMLLimit.sub(new BN(3)), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(UnderAMLLimit.add(HalfAMLLimit));

                await advanceTime(TRANSFER_RETENTION_TIME / 2);
                await advanceBlock();

                //small transfers should be cleared out by now, so a transfer of 2 should work, but not a transfer of 3
                await expectRevert(this.token.transferWithData(recipient, new BN(3), abi.rawEncode(['bytes'], ['']), {from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period.'
                );

                await this.token.transferWithData(recipient, new BN(2), abi.rawEncode(['bytes'], ['']), {from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(UnderAMLLimit.sub(HalfAMLLimit));

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(UnderAMLLimit.add(HalfAMLLimit).add(new BN(2)));


            });
        });


    });



    describe('Controllers General Adding and Removing', function () {


        describe('when a general controller is added', function () {
            it('an event is emitted', async function () {
                this.generalcontrollerMock = await GeneralControllerMock.new();


                var { logs } = await this.controller.addController(this.generalcontrollerMock.address);
                expectEvent.inLogs(logs, 'ControllerAdded', { controller: this.generalcontrollerMock.address });

            });
        });




        describe('when a non existing general controller is removed', function () {
            it('reverts', async function () {
                this.generalcontrollerMock = await GeneralControllerMock.new();
                await expectRevert(this.controller.removeController(this.generalcontrollerMock.address),
                    'Controllers list is empty.'
                );
            });
        });


        describe('when multiple general controllers are added and removed', function () {
            it('all adds and removes work as expected', async function () {
                this.generalcontrollerMock1 = await GeneralControllerMock.new();
                this.generalcontrollerMock2 = await GeneralControllerMock.new();
                this.generalcontrollerMock3 = await GeneralControllerMock.new();
                this.generalcontrollerMock4 = await GeneralControllerMock.new();


                var { logs } = await this.controller.addController(this.generalcontrollerMock1.address);
                expectEvent.inLogs(logs, 'ControllerAdded', { controller: this.generalcontrollerMock1.address });

               var { logs } = await this.controller.addController(this.generalcontrollerMock2.address);
                expectEvent.inLogs(logs, 'ControllerAdded', { controller: this.generalcontrollerMock2.address });

                var { logs } = await this.controller.addController(this.generalcontrollerMock3.address);
                expectEvent.inLogs(logs, 'ControllerAdded', { controller: this.generalcontrollerMock3.address });

                assert((await this.controller.getControllerCount())==3);

                var { logs } = await this.controller.removeController(this.generalcontrollerMock1.address);
                expectEvent.inLogs(logs, 'ControllerRemoved', { controller: this.generalcontrollerMock1.address });

                assert((await this.controller.getControllerCount())==2);

                var { logs } = await this.controller.removeController(this.generalcontrollerMock2.address);
                expectEvent.inLogs(logs, 'ControllerRemoved', { controller: this.generalcontrollerMock2.address });

                assert((await this.controller.getControllerCount())==1);

                await expectRevert(this.controller.removeController(this.generalcontrollerMock1.address),
                    'Controller to remove is not in the controllers list.'
                );

                assert((await this.controller.getControllerCount())==1);

                var { logs } = await this.controller.addController(this.generalcontrollerMock4.address);
                expectEvent.inLogs(logs, 'ControllerAdded', { controller: this.generalcontrollerMock4.address });



            });
        });


        describe('when verifyall is called', function () {
            it('general Controllers are also called', async function () {
                this.generalcontrollerMock = await GeneralControllerMock.new();


                var { logs } = await this.controller.addController(this.generalcontrollerMock.address);
                expectEvent.inLogs(logs, 'ControllerAdded', { controller: this.generalcontrollerMock.address });


                await expectRevert(this.token.transferWithData(recipient,1 ,abi.rawEncode(['bytes'], ['']),{from: initialHolder}),
                    'The transfer is not allowed by a general Controller!'
                );


            });
        });

    });

});

// Source for helper functions: https://medium.com/fluidity/standing-the-time-of-test-b906fcc374a9

advanceTime = (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [time],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result)
        })
    })
}

advanceBlock = () => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: new Date().getTime()
        }, (err, result) => {
            if (err) {
                return reject(err)
            }
            const newBlockHash = web3.eth.getBlock('latest').hash

            return resolve(newBlockHash)
        })
    })
}
