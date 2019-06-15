const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect, assert } = require('chai')
    .use(require('chai-bytes'));
const should = require('chai').should();
const abi = require('ethereumjs-abi');

const MockContract = artifacts.require("../contracts/Mocks/MockContract.sol"); //Gnosis Mock contract framework


const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const KYCController = artifacts.require("../contracts/Controlling/KYCController.sol");
const InsiderListController = artifacts.require("../contracts/Controlling/InsiderListController.sol");
const PEPListController = artifacts.require("../contracts/Controlling/PEPListController.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");





//const AMLLimit = new BN(15000);




contract('VotingToken', function ([deployer, initialHolder, recipient, votingOfficial, anotherAccount]) {



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


        //create SUT
        this.transferQueues = await TransferQueues.new();
        this.controller = await Controller.new(this.kycMock.address, this.insiderListMock.address, this.pepListMock.address);

        //not via mocked Token and initial supply, because erc20 functionality tests are not required anymore here, and
        //initial minting would distort test results
        this.token = await VotingToken.new(this.controller.address, this.transferQueues.address);
        this.token.addVotingOfficial(votingOfficial);


    });


/*    describe('createBallot', function () {
        describe('when the ballotname is empty', function () {
            it('reverts', async function () {

                await expectRevert(this.token.createBallot( abi.rawEncode(['bytes32'],['']), [abi.rawEncode(['bytes32'],[''])],{from: votingOfficial}),
                    'VotingToken: The ballotName must not be empty!'
                );
            });
        });

        describe('when the optionNames parameter is empty', function () {
            it('reverts', async function () {

                await expectRevert(this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [],{from: votingOfficial}),
                    'VotingToken: The optionNames Array must not be empty!'
                );
            });
        });


        describe('when all parameters are correct', function () {
            it('creates a ballot and stores it', async function () {

                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['A']),abi.rawEncode(['bytes32'],['B'])],{from: votingOfficial});

                console.log((await this.token.ballots(0)));
                console.log((await this.token.ballots(0)).optionNames);
                //assert(false); //TODO assertions on existence of options and optionnames
            });
        });

    });
    describe('Basic voting an reverts', function () {
        describe('when the ballot does not exist', function () {
            it('reverts', async function () {

                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],[''])); //issue must be before create, for cutoff time
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],{from: votingOfficial});

                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['VoteWRONG']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder}),
                    'VotingToken: Ballot not found!'
                );
            });
        });

        describe('when the option does not exist', function () {
            it('reverts', async function () {

                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],{from: votingOfficial});

                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option C']),{from: initialHolder}),
                    'VotingToken: Chosen option does not exist in chosen Ballot.'
                );
            });
        });

        describe('when the sender did not possess tokens at time of creation of the Ballot', function () {
            it('reverts', async function () {


                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],{from: votingOfficial});

                //we issue the tokens after the creation of the ballot, after the cutoff time
                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));

                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder}),
                    'VotingToken: Sender did not own tokens at the Cutoff Time!'
                );
            });
        });

        describe('when the sender already voted', function () {
                it('reverts', async function () {

                    await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));
                    await advanceBlock();
                    await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],{from: votingOfficial});
                    await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder});
                    await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder}),
                        'VotingToken: Sender already voted'
                    );
                });
        });


        describe('when the sender already voted', function () {
            it('reverts', async function () {

                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));
                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],{from: votingOfficial});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder});
                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder}),
                    'VotingToken: Sender already voted'
                );
            });
        });



    });*/

    describe('Voting and winner Calculations', function () {
        describe('when one holder has more tokens than another', function () {
            it('reverts', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(101), abi.rawEncode(['bytes'],['']));

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],{from: votingOfficial});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: anotherAccount});


                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])
                console.log("resultat:");
                console.log(result);

                //TODO here, winningoptionname is 0x4f7074696f6e2042000000000000000000000000000000000000000000000000, should be converted back for easier comparison

                result.winningOptionName.should.be.equal('0x4f7074696f6e2042000000000000000000000000000000000000000000000000');
                //result.winningOptionName.should.be.equalBytes('Option B');
                result.winningOptionVoteCount.should.be.equal(new BN(101));

            });
        });
    });
    //TODO test if ERC1594 functions also work when incorporating voting


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
            if (err) { return reject(err) }
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
            if (err) { return reject(err) }
            const newBlockHash = web3.eth.getBlock('latest').hash

            return resolve(newBlockHash)
        })
    })
}
