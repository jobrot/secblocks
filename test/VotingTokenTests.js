const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect, assert } = require('chai')
    .use(require('chai-bytes'));
const should = require('chai').should();
const abi = require('ethereumjs-abi');

const MockContract = artifacts.require("../contracts/Mocks/MockContract.sol"); //Gnosis Mock contract framework


const VotingToken = artifacts.require("../contracts/Tokens/VotingToken.sol");
const TransferQueues = artifacts.require("../contracts/AML/TransferQueues.sol");
const Controller = artifacts.require("../contracts/Controlling/Controller.sol");
const UnstructuredProxy = artifacts.require("../contracts/Proxy/UnstructuredProxy.sol");


contract('VotingToken', function ([deployer, initialHolder, recipient, issuer, anotherAccount]) {



    beforeEach(async function () {

        

        this.kycMock = await MockContract.new();
        this.insiderListMock = await MockContract.new();
        this.pepListMock = await MockContract.new();

        //Let the mocks of all Controllers return Success by default, except if defined differently for tests
        await this.kycMock.givenAnyReturnBool(true);
        await this.insiderListMock.givenAnyReturnBool(true);
        await this.pepListMock.givenAnyReturnBool(true);


        //create SUT
        this.transferQueues = await TransferQueues.new();
        this.controller = await Controller.new(); //this.kycMock.address, this.insiderListMock.address, this.pepListMock.address

        //not via mocked Token and initial supply, because erc20 functionality tests are not required anymore here, and
        //initial minting would distort test results
        this.token = await VotingToken.new(); //this.controller.address, this.transferQueues.address


        //Comment this in for full proxy test
        this.controllerProxy = await UnstructuredProxy.new(deployer);
        await this.controllerProxy.upgradeToInit(this.controller.address);
        this.controller = await Controller.at(this.controllerProxy.address);
        this.controller.setKYCVerifier(this.kycMock.address);
        this.controller.setPEPListVerifier(this.pepListMock.address);
        this.controller.setInsiderListVerifier(this.insiderListMock.address);

        this.proxy = await UnstructuredProxy.new(deployer);
        await this.proxy.upgradeToInit(this.token.address);
        this.token = await VotingToken.at(this.proxy.address);
        await this.token.setController(this.controller.address);
        await this.token.setTransferQueues(this.transferQueues.address);
        await this.token.addIssuerOrchestrator(deployer);
        await this.token.addIssuer(issuer);
        await this.transferQueues.transferOwnership(this.token.address);
        
        this.futureDate = (await web3.eth.getBlock('latest')).timestamp + 1000000;

    });


    describe('createBallot', function () {
        describe('when the ballotname is empty', function () {
            it('reverts', async function () {

                await expectRevert(this.token.createBallot( abi.rawEncode(['bytes32'],['']), [abi.rawEncode(['bytes32'],[''])],this.futureDate,{from: issuer}),
                    'BallotName must not be empty!'
                );
            });
        });

        describe('when the optionNames parameter is empty', function () {
            it('reverts', async function () {

                await expectRevert(this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [],this.futureDate,{from: issuer}),
                    'OptionNames must not be empty!'
                );
            });
        });


        describe('when all parameters are correct', function () {
            it('creates a ballot and stores it', async function () {

                const { logs } =  await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['A']),abi.rawEncode(['bytes32'],['B'])],this.futureDate,{from: issuer});

                assert((await this.token.ballots(0)).name!=0);
                expectEvent.inLogs(logs, 'BallotCreated', { ballotName: '0x566f746500000000000000000000000000000000000000000000000000000000' });
            });
        });

    });
    describe('Basic voting and reverts', function () {
        describe('when the ballot does not exist', function () {
            it('reverts', async function () {

                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],[''])); //issue must be before create, for cutoff time
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});

                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['VoteWRONG']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder}),
                    'Ballot not found!'
                );
            });
        });

        describe('when the option does not exist', function () {
            it('reverts', async function () {

                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});

                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option C']),{from: initialHolder}),
                    'Option does not exist in Ballot.'
                );
            });
        });

        describe('when the sender did not possess tokens at time of creation of the Ballot', function () {
            it('reverts', async function () {


                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});

                //we issue the tokens after the creation of the ballot, after the cutoff time
                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));

                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder}),
                    'Sender held no tokens at cutoff'
                );
            });
        });

        describe('when the sender already voted', function () {
                it('reverts', async function () {

                    await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));
                    await advanceBlock();
                    await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});
                    await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder});
                    await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder}),
                        'Sender already voted'
                    );
                });
        });


        describe('when the Voting Time is over', function () {
            it('reverts', async function () {

                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));
                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],(await web3.eth.getBlock('latest')).timestamp,{from: issuer});
                //await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder});
                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder}),
                    'Vote has ended.'
                );
            });
        });

        describe('when the enddate is in the future', function () {
            it('votes, reverts on voting again', async function () {

                await this.token.issue(initialHolder, 100, abi.rawEncode(['bytes'],['']));
                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder});
                await expectRevert(this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: initialHolder}),
                    'Sender already voted'
                );
            });
        });

    });

    describe('Voting and winner Calculations', function () {
        describe('when one holder has more tokens than another', function () {
            it('correct option wins', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(101), abi.rawEncode(['bytes'],['']));

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote']), abi.rawEncode(['bytes32'],['Option B']),{from: anotherAccount});


                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])



                web3.utils.toAscii(result.winningOptionName).should.be.equal(abi.rawEncode(['bytes32'],['Option B']).toString("ascii"));
                result.winningOptionVoteCount.should.be.bignumber.equal(new BN(101));

            });
        });


        describe('when one holder has more tokens than another, than changing in another vote', function () {
            it('correct option wins', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(101), abi.rawEncode(['bytes'],['']));

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote1']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});

                await this.token.issue(initialHolder, new BN(2), abi.rawEncode(['bytes'],['']));

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote2']), [abi.rawEncode(['bytes32'],['Option C']),abi.rawEncode(['bytes32'],['Option D'])],this.futureDate,{from: issuer});


                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option B']),{from: anotherAccount});

                await this.token.vote( abi.rawEncode(['bytes32'],['Vote2']), abi.rawEncode(['bytes32'],['Option C']),{from: initialHolder});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote2']), abi.rawEncode(['bytes32'],['Option D']),{from: anotherAccount});



                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote1']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])
                web3.utils.toAscii(result.winningOptionName).should.be.equal(abi.rawEncode(['bytes32'],['Option B']).toString("ascii"));
                result.winningOptionVoteCount.should.be.bignumber.equal(new BN(101));

                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote2']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])
                web3.utils.toAscii(result.winningOptionName).should.be.equal(abi.rawEncode(['bytes32'],['Option C']).toString("ascii"));
                result.winningOptionVoteCount.should.be.bignumber.equal(new BN(102));

            });
        });


        describe('when multiple token holders vote', function () {
            it('correct option wins', async function () {
                await this.token.issue(initialHolder, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(51), abi.rawEncode(['bytes'],['']));
                await this.token.issue(recipient, new BN(50), abi.rawEncode(['bytes'],['']));

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote1']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});



                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option B']),{from: anotherAccount});

                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote1']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])
                web3.utils.toAscii(result.winningOptionName).should.be.equal(abi.rawEncode(['bytes32'],['Option A']).toString("ascii"));
                result.winningOptionVoteCount.should.be.bignumber.equal(new BN(100));

                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option B']),{from: recipient});

                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote1']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])
                web3.utils.toAscii(result.winningOptionName).should.be.equal(abi.rawEncode(['bytes32'],['Option B']).toString("ascii"));
                result.winningOptionVoteCount.should.be.bignumber.equal(new BN(101));


            });
        });



        describe('when multiple token holders vote and tokens are transferred', function () {
            it('correct option wins', async function () {
                await this.token.issue(initialHolder, new BN(101), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(100), abi.rawEncode(['bytes'],['']));
                await this.token.issue(recipient, new BN(2), abi.rawEncode(['bytes'],['']));
                await this.token.transferWithData(anotherAccount,2, abi.rawEncode(['bytes'],['']),{from:recipient});

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote1']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});


                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option B']),{from: anotherAccount});




                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote1']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])
                web3.utils.toAscii(result.winningOptionName).should.be.equal(abi.rawEncode(['bytes32'],['Option B']).toString("ascii"));
                result.winningOptionVoteCount.should.be.bignumber.equal(new BN(102));

            });
        });


        describe('when multiple token holders vote and tokens are burned', function () {
            it('correct option wins', async function () {
                await this.token.issue(initialHolder, new BN(101), abi.rawEncode(['bytes'],['']));
                await this.token.issue(anotherAccount, new BN(100), abi.rawEncode(['bytes'],['']));

                await this.token.redeem(2, abi.rawEncode(['bytes'],['']),{from:initialHolder});

                await advanceBlock();
                await this.token.createBallot( abi.rawEncode(['bytes32'],['Vote1']), [abi.rawEncode(['bytes32'],['Option A']),abi.rawEncode(['bytes32'],['Option B'])],this.futureDate,{from: issuer});


                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option A']),{from: initialHolder});
                await this.token.vote( abi.rawEncode(['bytes32'],['Vote1']), abi.rawEncode(['bytes32'],['Option B']),{from: anotherAccount});




                var result = (await this.token.currentlyWinningOption(abi.rawEncode(['bytes32'],['Vote1']),{from: initialHolder})); //abi.rawEncode(['bytes32'],['Vote'])
                web3.utils.toAscii(result.winningOptionName).should.be.equal(abi.rawEncode(['bytes32'],['Option B']).toString("ascii"));
                result.winningOptionVoteCount.should.be.bignumber.equal(new BN(100));

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
