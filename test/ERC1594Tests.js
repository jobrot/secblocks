const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;
const should = require('chai').should();
const abi = require('ethereumjs-abi');
//import Doppelganger from 'ethereum-doppelganger';
//const Doppelganger = require('ethereum-doppelganger').default;
//const Doppelganger = require('ethereum-doppelganger');


const MockContract = artifacts.require("../contracts/Mocks/MockContract.sol"); //Gnosis Mock contract framework

const ERC1594 = artifacts.require("../contracts/Tokens/ERC1594.sol");
const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");
const InsiderListController = artifacts.require("../contracts/Controlling/InsiderListController.sol");
const PEPListController = artifacts.require("../contracts/Controlling/PEPListController.sol");


const {
    shouldBehaveLikeERC20,
    shouldBehaveLikeERC20Transfer,
    shouldBehaveLikeERC20Approve,
} = require('./ERC20BehaviourTests.js');


const ERC1594Mock = artifacts.require('ERC1594Mock');

const STATUS_SUCCESS = 0x51; // Uses status codes from ERC-1066
const STATUS_FAIL = 0x50;


contract('ERC1594', function ([deployer, initialHolder, recipient, anotherAccount]) {
    const initialSupply = new BN(100);




    beforeEach(async function () {
        //this.kycController = await KYCController.new();
        //this.kycControllerDG = new Doppelganger(this.kycController.abi);

        this.kycMock = await MockContract.new();
        this.insiderMock = await MockContract.new();
        this.pepListMock = await MockContract.new();

        //Let the mocks of all Controllers return Success by default, except if defined differently for tests
        //await this.kycMock.givenAnyReturnBool(false);
        await this.kycMock.givenAnyReturnBool(true);//(abi.rawEncode(['bool','bytes'], ['false','0x51']));
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



        //this.token = await ERC1594Mock.new(this.kycMock.address, this.insiderMock.address, this.pepListMock.address, initialHolder, initialSupply);

        this.token = await ERC1594.new(this.kycMock.address, this.insiderMock.address, this.pepListMock.address);

        await this.token.issue(initialHolder, initialSupply, abi.rawEncode(['bytes'],['']));//mint(initialHolder,initialSupply);
    });

    //shouldBehaveLikeERC20(kycController,insiderListController,pepListController,  'ERC20', initialSupply, initialHolder, recipient, anotherAccount);

    describe('transferWithData', function () {

/*        shouldBehaveLikeERC20Transfer('ERC20', initialHolder, recipient, initialSupply, function (from, to, amount) {
            return this.token.transferInternal(from, to, amount);
        });TODO*/

        /*describe('when the sender is the zero address', function () {
            it('reverts', async function () {
                //await this.kycControllerDG.verifyTransfer.returns({verified: true,statusCode: STATUS_SUCCESS});
                await expectRevert(this.token.transferInternal(ZERO_ADDRESS, recipient, initialSupply),
                    'ERC20: transfer from the zero address'
                );
            });
        });*/

        describe('when the sender is not kycd', function () {
            it('reverts', async function () {
                await this.kycMock.givenAnyReturnBool(false);//(abi.rawEncode(['bool','bytes'], ['false','0x52']));

                await expectRevert(this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder}),
                    'ERC1594: The transfer is not allowed by the KYCController!'
                );
            });
        });

        describe('when the sender is kycd', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('99');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal('1');
            });
        });
    });

/*    describe('decrease allowance', function () {
        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            function shouldDecreaseApproval (amount) {
                describe('when there was no approved amount before', function () {
                    it('reverts', async function () {
                        await expectRevert(this.token.decreaseAllowance(
                            spender, amount, { from: initialHolder }), 'SafeMath: subtraction overflow'
                        );
                    });
                });

                describe('when the spender had an approved amount', function () {
                    const approvedAmount = amount;

                    beforeEach(async function () {
                        ({ logs: this.logs } = await this.token.approve(spender, approvedAmount, { from: initialHolder }));
                    });

                    it('emits an approval event', async function () {
                        const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });

                        expectEvent.inLogs(logs, 'Approval', {
                            owner: initialHolder,
                            spender: spender,
                            value: new BN(0),
                        });
                    });

                    it('decreases the spender allowance subtracting the requested amount', async function () {
                        await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: initialHolder });

                        (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal('1');
                    });

                    it('sets the allowance to zero when all allowance is removed', async function () {
                        await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
                        (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal('0');
                    });

                    it('reverts when more than the full allowance is removed', async function () {
                        await expectRevert(
                            this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: initialHolder }),
                            'SafeMath: subtraction overflow'
                        );
                    });
                });
            }

            describe('when the sender has enough balance', function () {
                const amount = initialSupply;

                shouldDecreaseApproval(amount);
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.addn(1);

                shouldDecreaseApproval(amount);
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = initialSupply;
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(this.token.decreaseAllowance(
                    spender, amount, { from: initialHolder }), 'SafeMath: subtraction overflow'
                );
            });
        });
    });

    describe('increase allowance', function () {
        const amount = initialSupply;

        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            describe('when the sender has enough balance', function () {
                it('emits an approval event', async function () {
                    const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                    expectEvent.inLogs(logs, 'Approval', {
                        owner: initialHolder,
                        spender: spender,
                        value: amount,
                    });
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, new BN(1), { from: initialHolder });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount.addn(1));
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.addn(1);

                it('emits an approval event', async function () {
                    const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                    expectEvent.inLogs(logs, 'Approval', {
                        owner: initialHolder,
                        spender: spender,
                        value: amount,
                    });
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, new BN(1), { from: initialHolder });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount.addn(1));
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(
                    this.token.increaseAllowance(spender, amount, { from: initialHolder }), 'ERC20: approve to the zero address'
                );
            });
        });
    });

    describe('_mint', function () {
        const amount = new BN(50);
        it('rejects a null account', async function () {
            await expectRevert(
                this.token.mint(ZERO_ADDRESS, amount), 'ERC20: mint to the zero address'
            );
        });

        describe('for a non zero account', function () {
            beforeEach('minting', async function () {
                const { logs } = await this.token.mint(recipient, amount);
                this.logs = logs;
            });

            it('increments totalSupply', async function () {
                const expectedSupply = initialSupply.add(amount);
                (await this.token.totalSupply()).should.be.bignumber.equal(expectedSupply);
            });

            it('increments recipient balance', async function () {
                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(amount);
            });

            it('emits Transfer event', async function () {
                const event = expectEvent.inLogs(this.logs, 'Transfer', {
                    from: ZERO_ADDRESS,
                    to: recipient,
                });

                event.args.value.should.be.bignumber.equal(amount);
            });
        });
    });

    describe('_burn', function () {
        it('rejects a null account', async function () {
            await expectRevert(this.token.burn(ZERO_ADDRESS, new BN(1)),
                'ERC20: burn from the zero address');
        });

        describe('for a non zero account', function () {
            it('rejects burning more than balance', async function () {
                await expectRevert(this.token.burn(
                    initialHolder, initialSupply.addn(1)), 'SafeMath: subtraction overflow'
                );
            });

            const describeBurn = function (description, amount) {
                describe(description, function () {
                    beforeEach('burning', async function () {
                        const { logs } = await this.token.burn(initialHolder, amount);
                        this.logs = logs;
                    });

                    it('decrements totalSupply', async function () {
                        const expectedSupply = initialSupply.sub(amount);
                        (await this.token.totalSupply()).should.be.bignumber.equal(expectedSupply);
                    });

                    it('decrements initialHolder balance', async function () {
                        const expectedBalance = initialSupply.sub(amount);
                        (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(expectedBalance);
                    });

                    it('emits Transfer event', async function () {
                        const event = expectEvent.inLogs(this.logs, 'Transfer', {
                            from: initialHolder,
                            to: ZERO_ADDRESS,
                        });

                        event.args.value.should.be.bignumber.equal(amount);
                    });
                });
            };

            describeBurn('for entire balance', initialSupply);
            describeBurn('for less amount than balance', initialSupply.subn(1));
        });
    });

    describe('_burnFrom', function () {
        const allowance = new BN(70);

        const spender = anotherAccount;

        beforeEach('approving', async function () {
            await this.token.approve(spender, allowance, { from: initialHolder });
        });

        it('rejects a null account', async function () {
            await expectRevert(this.token.burnFrom(ZERO_ADDRESS, new BN(1)),
                'ERC20: burn from the zero address'
            );
        });

        describe('for a non zero account', function () {
            it('rejects burning more than allowance', async function () {
                await expectRevert(this.token.burnFrom(initialHolder, allowance.addn(1)),
                    'SafeMath: subtraction overflow'
                );
            });

            it('rejects burning more than balance', async function () {
                await expectRevert(this.token.burnFrom(initialHolder, initialSupply.addn(1)),
                    'SafeMath: subtraction overflow'
                );
            });

            const describeBurnFrom = function (description, amount) {
                describe(description, function () {
                    beforeEach('burning', async function () {
                        const { logs } = await this.token.burnFrom(initialHolder, amount, { from: spender });
                        this.logs = logs;
                    });

                    it('decrements totalSupply', async function () {
                        const expectedSupply = initialSupply.sub(amount);
                        (await this.token.totalSupply()).should.be.bignumber.equal(expectedSupply);
                    });

                    it('decrements initialHolder balance', async function () {
                        const expectedBalance = initialSupply.sub(amount);
                        (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(expectedBalance);
                    });

                    it('decrements spender allowance', async function () {
                        const expectedAllowance = allowance.sub(amount);
                        (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(expectedAllowance);
                    });

                    it('emits a Transfer event', async function () {
                        const event = expectEvent.inLogs(this.logs, 'Transfer', {
                            from: initialHolder,
                            to: ZERO_ADDRESS,
                        });

                        event.args.value.should.be.bignumber.equal(amount);
                    });

                    it('emits an Approval event', async function () {
                        expectEvent.inLogs(this.logs, 'Approval', {
                            owner: initialHolder,
                            spender: spender,
                            value: await this.token.allowance(initialHolder, spender),
                        });
                    });
                });
            };

            describeBurnFrom('for entire allowance', allowance);
            describeBurnFrom('for less amount than allowance', allowance.subn(1));
        });
    });

    describe('_approve', function () {
        shouldBehaveLikeERC20Approve('ERC20', initialHolder, recipient, initialSupply, function (owner, spender, amount) {
            return this.token.approveInternal(owner, spender, amount);
        });

        describe('when the owner is the zero address', function () {
            it('reverts', async function () {
                await expectRevert(this.token.approveInternal(ZERO_ADDRESS, recipient, initialSupply),
                    'ERC20: approve from the zero address'
                );
            });
        });
    });*/
});