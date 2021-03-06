pragma solidity ^0.5.4;

import "./DividendToken.sol";


/**
 * @dev Inspiration by MiniMeToken https://github.com/Giveth/minime/blob/master/contracts/MiniMeToken.sol by giveEth
 * @notice this Token corresponds to common stock that enables dividends as well as voting
*/
contract VotingToken is DividendToken {

    event BallotCreated(
        bytes32 ballotName
    );

    struct Checkpoint {
        // `fromBlock` is the block number that the checkpoint was generated
        uint128 fromBlock;
        // `value` is the amount of tokens of the checked address at the specific block number
        uint128 value;
    }

    /*
     * @notice a ballot is a structure that corresponds to a single decision that can be
     * voted upon by token holders, each with a weight corresponding to their
     * owned tokens at the cutoff date
     */
    struct Ballot {
        bytes32 name; // name of the current ballot / asked question
        bytes32[] optionNames; //list of all voteable options
        uint[] optionVoteCounts; //list of all resp. vote counts
        mapping(address => bool) voted; // record on which addresses already voted
        uint cutoffBlockNumber; // block number of the block, where the balances are counted for voting weight
        uint endDate;
    }

    bytes32[] tempOptionNames;


    /**
      * @dev tracks the balance of each address over time via timestamped Checkpoints
      * including the blocknumber
      * intentionally
    */
    mapping(address => Checkpoint[]) private _historizedBalances;


    // Tracks the history of the `totalSupply` of the token
    Checkpoint[] totalSupplyHistory;

    // all ballots that can be voted upon by token holders
    Ballot[] public ballots;

    // reenable constructor, if deployment without proxy is needed
    /*constructor(Controller _controller, TransferQueues _queues) DividendToken(_controller, _queues) public {//The super contract is a modifier of sorts of the constructor

    }*/

    /*
    * @info get all optionNames for a single ballot, indicated by its index in the public ballot array
    * @param ballotIndex ballot to get optionNames from
    * @returns all options of the ballot at the given index
    */
    function getOptionNames(uint ballotIndex) external view returns (bytes32[] memory){
        return ballots[ballotIndex].optionNames;
    }

    /*
    * @info get all voteCounts for a single ballot, indicated by its index in the public ballot array
    * @param ballotIndex ballot to get voteCounts from
    * @returns all voteCounts of the ballot at the given index, corresponding to the names from getOptionNames
    */
    function getOptionVoteCounts(uint ballotIndex) external view returns (uint256[] memory){
        return ballots[ballotIndex].optionVoteCounts;
    }

    /**
     * @dev Overwrites the ERC-20 function so that it will be used
     * by all functions in super contracts to keep checkpoints up to date
     * @param _from The address holding the tokens being transferred
     * @param _to The address of the recipient
     * @param _amount The amount of tokens to be transferred
    */
    function _transfer(address _from, address _to, uint _amount) internal {
        //require(_amount != 0, "VotingToken: Empty Transfers are not allowed.");

        // Do not allow transfer to or from 0x0
        require((_to != address(0)) && (_from != address(0)), "Transfer to or from 0x");

        uint previousBalanceSender = balanceOfAt(_from, block.number);

        // update the balance array with the new value for the sender
        updateValueAtNow(_historizedBalances[_from], previousBalanceSender.sub(_amount));

        // update the balance array with the new value for the receiver
        uint previousBalanceTo = balanceOfAt(_to, block.number);
        updateValueAtNow(_historizedBalances[_to], previousBalanceTo.add(_amount));

        emit Transfer(_from, _to, _amount);
    }

    /**
     * @dev overrides the function from ERC20
     * @param _owner The address that's balance is being requested
     * @return The balance of `_owner` at the current block
     */
    function balanceOf(address _owner) public view returns (uint256) {
        return balanceOfAt(_owner, block.number);
    }


    /**
     * @dev creates a new ballot and appends it to 'ballots'
     * caller must ensure that optionNames are unique, or else only the first appearance is used
     * @param ballotName The name of the ballot resp. the asked Question
     * @param optionNames List of possible choices / answers to the question
    */
    function createBallot(bytes32 ballotName, bytes32[] calldata optionNames, uint endDate) external onlyIssuer {
        //Check the arguments for validity
        require(ballotName[0] != 0, "BallotName must not be empty!");
        require(optionNames.length > 0, "OptionNames must not be empty!");

        delete tempOptionNames;

        for (uint i = 0; i < optionNames.length; i++) {
            tempOptionNames.push(optionNames[i]);
        }

        Ballot memory ballot = Ballot({name : ballotName, cutoffBlockNumber : block.number, endDate : endDate, optionNames : tempOptionNames, optionVoteCounts : new uint[](optionNames.length)});
        ballots.push(ballot);

        emit BallotCreated(ballotName);
    }
    /**
      * @notice casts votes equal to the senders tokens at the cutoff time of the newest ballot designated
      * by ballotName to the option designated by optionName
      * @param ballotName Ballot to vote in
      * @param optionName option to vote for
      * @dev rolls back on unfound ballot or option, if sender already voted, or does not own tokens at cutoff
    */
    function vote(bytes32 ballotName, bytes32 optionName) external {
        //Search through all Ballots backwards, so that the recent ones are found first
        int found = - 1;

        for (int i = UIntConverterLib.toIntSafe(ballots.length); i > 0; i--) {//could still be optimized for gas
            if (ballots[SafeMathInt.toUintSafe(i - 1)].name == ballotName) {
                found = i - 1;
                break;
            }
        }
        require(found >= 0, "VotingToken: Ballot not found!");

        Ballot storage ballot = ballots[SafeMathInt.toUintSafe(found)];

        //check if User had tokens at the time of the ballot start == right to vote
        uint senderBalance = balanceOfAt(msg.sender, ballot.cutoffBlockNumber);
        require(senderBalance > 0, "Sender held no tokens at cutoff");

        //check if endDate has not passed
        require(ballot.endDate > now, "Vote has ended.");

        //check if User already voted
        require(ballot.voted[msg.sender] == false, "Sender already voted");

        //Search for the voted option in the ballot

        for (int j = UIntConverterLib.toIntSafe(ballot.optionNames.length); j > 0; j--) {
            if (ballot.optionNames[SafeMathInt.toUintSafe(j - 1)] == optionName) {
                ballot.voted[msg.sender] = true;
                ballot.optionVoteCounts[SafeMathInt.toUintSafe(j - 1)] = ballot.optionVoteCounts[SafeMathInt.toUintSafe(j - 1)].add(senderBalance);
                return;
            }
        }
        require(false, "Option does not exist in Ballot.");
    }
    /**
     * @notice Computes the winning proposal taking all votes up until now into account, exact tallying can be gotten from
     * the function getBallot(bytes32 ballotName)
     * @dev does not change state or close the voting intentionally, is public so that everybody
     * can look at the current winner, and to allow for maximum flexibility (company can decide
     * a time when to decide the winners, as the time may change due to not all voters being on chain
     * ATTENTION: does not deal with votes where two options are equal, this must be decided by the user via getBallot(bytes32 ballotName) TODO potentially add this functionality
     * @param ballotName ballot to be queried
    * @return name of the winning option and resp. vote count, if it can be calculated, else returns error message and 0
    */
    function currentlyWinningOption(bytes32 ballotName) external view returns (bytes32 winningOptionName, uint winningOptionVoteCount){

        Ballot memory ballot;
        //Search through all Ballots backwards, so that the recent ones are found first
        for (int i = UIntConverterLib.toIntSafe(ballots.length); i > 0; i--) {
            if (ballots[SafeMathInt.toUintSafe(i - 1)].name == ballotName) {
                ballot = ballots[SafeMathInt.toUintSafe(i - 1)];
            }
        }
        //require(ballot.name.length > 0, "Ballot not found!");
        //This is because some clients apparently can not deal with requires on view functions
        if (ballot.name.length <= 0) {
            return (bytes32("Ballot not found!"), 0);
        }
        uint winningVoteCount = 0;
        //bool invalid = false;
        int winningOptionIndex = - 1;
        for (uint p = 0; p < ballot.optionVoteCounts.length; p++) {
            if (ballot.optionVoteCounts[p] > winningVoteCount) {
                //invalid = false;
                winningVoteCount = ballot.optionVoteCounts[p];
                winningOptionIndex = UIntConverterLib.toIntSafe(p);
            }
            /*if (ballot.optionVoteCounts[p] == winningVoteCount){
                invalid =true;
            }*/
        }

        //return (bytes32("At least two votes are tied!"), winningVoteCount);

        //require(winningOptionIndex != - 1,"No votes yet!");
        if (winningOptionIndex == - 1) {
            return (bytes32("No votes yet!"), 0);
        }

        winningOptionName = ballot.optionNames[SafeMathInt.toUintSafe(winningOptionIndex)];
        winningOptionVoteCount = ballot.optionVoteCounts[SafeMathInt.toUintSafe(winningOptionIndex)];
    }


    /**
    * @dev Queries the balance of `_owner` at a specific `_blockNumber`
    * @param _owner The address from which the balance will be retrieved
    * @param _blockNumber The block number when the balance is queried
    * @return The balance at `_blockNumber`
    */
    function balanceOfAt(address _owner, uint _blockNumber) public view
    returns (uint) {

        return getValueAt(_historizedBalances[_owner], _blockNumber);

    }
    /**
     * @notice Total amount of tokens at a specific `_blockNumber`.
     * @param _blockNumber The block number when the totalSupply is queried
     * @return The total amount of tokens at `_blockNumber`
    */
    function totalSupplyAt(uint _blockNumber) public view returns (uint) {
        return getValueAt(totalSupplyHistory, _blockNumber);
    }


    /**
    * @dev overwrite erc20 function
    * @notice mints tokens to _account, while keeping tabs on supply
    * @param _account The address that will be assigned the new tokens
    * @param _value The quantity of tokens generated
    */
    function _mint(address _account, uint256 _value) internal {
        require(_account != address(0));
        uint curTotalSupply = totalSupply();
        uint previousBalanceTo = balanceOf(_account);
        updateValueAtNow(totalSupplyHistory, curTotalSupply.add(_value));
        updateValueAtNow(_historizedBalances[_account], previousBalanceTo.add(_value));
        emit Transfer(address(0), _account, _value);
    }

    /**
    * @notice Burns `_amount` tokens from `_owner`
    * @dev overwrites the erc20 implementation, is also used by _burnFrom
    * @param _account The account whose tokens will be burnt.
    * @param _value The amount that will be burnt.
    */
    function _burn(address _account, uint _value) internal {
        //erc 20 checks
        require(_account != address(0));
        require(_value <= balanceOf(_account));

        uint curTotalSupply = totalSupply();
        require(curTotalSupply >= _value);
        uint previousBalanceFrom = balanceOf(_account);
        require(previousBalanceFrom >= _value);
        updateValueAtNow(totalSupplyHistory, curTotalSupply.sub(_value));
        updateValueAtNow(_historizedBalances[_account], previousBalanceFrom.sub(_value));
        emit Transfer(_account, address(0), _value);
    }

    /// @dev get total number of tokens
    function totalSupply() public view returns (uint) {
        return totalSupplyAt(block.number);
    }


    /**
    * @dev retrieve the number of tokens at a given block number
    * @param checkpoints The history of values being queried
    * @param _block The block number to retrieve the value at
    * @return The number of tokens being queried
    */
    function getValueAt(Checkpoint[] storage checkpoints, uint _block
    ) view internal returns (uint) {
        if (checkpoints.length == 0) return 0;

        // Shortcut for the current value
        if (_block >= checkpoints[checkpoints.length - 1].fromBlock)
            return checkpoints[checkpoints.length - 1].value;
        if (_block < checkpoints[0].fromBlock) return 0;

        // Binary search of the value in the array
        uint min = 0;
        uint max = checkpoints.length - 1;
        while (max > min) {
            uint mid = (max.add(min).add(1)) / 2;
            if (checkpoints[mid].fromBlock <= _block) {
                min = mid;
            } else {
                max = mid - 1;
            }
        }
        return checkpoints[min].value;
    }
    /**
     * @dev update current value for balances or totalsupply
     * @param checkpoints The history of data being updated
     * @param _value The new number of tokens
    */
    function updateValueAtNow(Checkpoint[] storage checkpoints, uint _value) internal {
        if ((checkpoints.length == 0)
            || (checkpoints[checkpoints.length - 1].fromBlock < block.number)) {
            Checkpoint storage newCheckPoint = checkpoints[checkpoints.length++];
            newCheckPoint.fromBlock = uint128(block.number);
            newCheckPoint.value = uint128(_value);
        } else {
            Checkpoint storage oldCheckPoint = checkpoints[checkpoints.length - 1];
            oldCheckPoint.value = uint128(_value);
        }
    }

}