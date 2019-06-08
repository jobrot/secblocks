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
const AMLLimit = new BN(15000);
const UnderAMLLimit = AMLLimit.sub(new BN(1));
const HalfAMLLimit = AMLLimit.div(new BN(2));


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



        this.token = await ERC1594Mock.new(this.kycMock.address, this.insiderListMock.address, this.pepListMock.address, initialHolder, initialSupply);

        //this.token = await ERC1594.new(this.kycMock.address, this.insiderMock.address, this.pepListMock.address);

        //await this.token.issue(initialHolder, initialSupply, abi.rawEncode(['bytes'],['']));//mint(initialHolder,initialSupply);
    });

    //shouldBehaveLikeERC20(kycController,insiderListController,pepListController,  'ERC20', initialSupply, initialHolder, recipient, anotherAccount);

    describe('transferWithData', function () {

        /*shouldBehaveLikeERC20Transfer('ERC20', initialHolder, recipient, initialSupply, function (from, to, amount) {
            return this.token.transferInternal(from, to, amount);
        });*/

        //kyc
        /*describe('when the sender or recipient is not kycd', function () {
            it('reverts', async function () {
                const transferFromInitialHolder = this.kycController.contract.methods.verifyTransfer(initialHolder, recipient, 1, abi.rawEncode(['bytes'],[''])).encodeABI();
                await this.kycMock.givenMethodReturnBool(transferFromInitialHolder,false);

                await expectRevert(this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder}),
                    'ERC1594: The transfer is not allowed by the KYCController!'
                );
            });
        });

        describe('when the sender and recipient are kycd', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('99');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal('1');
            });
        });


        // insiderlist
        describe('when the sender or recipient are insiders', function () {
            it('reverts', async function () {
                const transferFromInitialHolder = this.insiderListController.contract.methods.verifyTransfer(initialHolder, recipient, 1, abi.rawEncode(['bytes'],[''])).encodeABI();
                await this.insiderListMock.givenMethodReturnBool(transferFromInitialHolder,false);

                await expectRevert(this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder}),
                    'ERC1594: The transfer is not allowed by the InsiderListController!'
                );
            });
        });

        describe('when the sender and recipient are not insiders', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('99');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal('1');
            });
        });


        // peplist
        describe('when the sender or recipient are politically exposed persons', function () {
            it('reverts', async function () {
                const transferFromInitialHolder = this.pepListController.contract.methods.verifyTransfer(initialHolder, recipient, 1, abi.rawEncode(['bytes'],[''])).encodeABI();
                await this.pepListMock.givenMethodReturnBool(transferFromInitialHolder,false);

                await expectRevert(this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder}),
                    'ERC1594: The transfer is not allowed by the PoliticallyExposedPersonController!'
                );
            });
        });

        describe('when the sender and recipient are not politically exposed persons', function () {
            it('transfers correctly', async function () {
                await this.token.transferWithData( recipient,1,abi.rawEncode(['bytes'],['']),{from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('99');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal('1');
            });
        });*/



        // AML


        describe('when the amount of a single transfer is just beyond the AML Limit', function () {
            it('transfers correctly', async function () {
                await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                await this.token.transferWithData( recipient,UnderAMLLimit,abi.rawEncode(['bytes'],['']),{from: initialHolder});

                (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('101');

                (await this.token.balanceOf(recipient)).should.be.bignumber.equal(UnderAMLLimit);
            });
        });


       describe('when the amount of a single transfer is at the AML Limit', function () {
            it('reverts', async function () {
                await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                await expectRevert(this.token.transferWithData( recipient,AMLLimit,abi.rawEncode(['bytes'],['']),{from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period, and must be cosigned by an operator.'
                );
            });
        });


       describe('when the amount of two concurrent transfers to a single recipient is at the AML Limit', function () {
            it('reverts', async function () {
                await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                this.token.transferWithData( recipient,HalfAMLLimit,abi.rawEncode(['bytes'],['']),{from: initialHolder})

                await expectRevert(this.token.transferWithData( recipient,HalfAMLLimit ,abi.rawEncode(['bytes'],['']),{from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period, and must be cosigned by an operator.'
                );
            });
        });

        describe('when the amount of two concurrent transfers to multiple recipient is at the AML Limit', function () {
            it('reverts', async function () {
                await this.token.issue(initialHolder, AMLLimit, abi.rawEncode(['bytes'],['']));

                this.token.transferWithData( recipient,HalfAMLLimit,abi.rawEncode(['bytes'],['']),{from: initialHolder})

                await expectRevert(this.token.transferWithData( anotherAccount,HalfAMLLimit,abi.rawEncode(['bytes'],['']),{from: initialHolder}),
                    'ERC1594: The transfer exceeds the allowed quota within the retention period, and must be cosigned by an operator.'
                );
            });
        });

        //TODO check retention time

    });

});