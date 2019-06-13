pragma solidity ^0.5.0;



import "./DividendToken.sol";
import "../Roles/VotingOfficialRole.sol";

//Original: https://github.com/Giveth/minime/blob/master/contracts/MiniMeToken.sol
//Other: https://github.com/validitylabs/token-voting-system/blob/master/src/contracts/voting/LoggedToken.sol


/// @dev draws some inspiration from Jordi Baylina's MiniMeToken to record historical balances
contract VotingToken is DividendToken{


    event BallotCreated(
        bytes32 ballotName
    );

    /// @dev `Checkpoint` is the structure that attaches a block number to a
    ///  given value, the block number attached is the one that last changed the
    ///  value
    struct Checkpoint {
        // `fromBlock` is the block number that the value was generated super.mint(_to, _amount); from
        uint128 fromBlock;
        // `value` is the amount of tokens at a specific block number
        uint128 value;
    }

    // an option is a single possible result for a ballot that can be voted for
//    struct Option{
//        bytes32 name;
//        uint voteCount;
//    }

    // a ballot is a structure that corresponds to a single descision that can be
    // voted upon by token holders, each with a weight corresponding to their
    // owned tokens at the cutoff date
    struct Ballot{
        bytes32 name; // name of the current ballot / asked question
        bytes32[] optionNames; //list of all voteable options
        uint[] optionVoteCounts; //list of all resp. vote counts
        mapping (address => bool) voted; // record on which addresses already voted
        uint cutoffBlockNumber; // block number of the block, where the balances are counted for voting weight
    }


    // `balances` is the map that tracks the balance of each address, in this
    //  contract when the balance changes the block number that the change
    //  occurred is also included in the map
    mapping (address => Checkpoint[]) private _balances;


    // `allowed` tracks any extra transfer rights as in all ERC20 tokens
    mapping (address => mapping (address => uint256)) allowed;

    // Tracks the history of the `totalSupply` of the token
    Checkpoint[] totalSupplyHistory;

    // all ballots that can be voted upon by token holders
    Ballot[] public ballots;

    constructor(Controller _controller, TransferQueues _queues) DividendToken( _controller, _queues) public { //The super contract is a modifier of sorts of the constructor

    }


    ///////////////////
    // ERC20 Methods
    ///////////////////

    /// @dev This is the actual transfer function in the token contract, it can
    ///  only be called by other functions in this contract.
    ///  Overwrites the ERC-20 function in order to enable interacting with
    /// @param _from The address holding the tokens being transferred
    /// @param _to The address of the recipient
    /// @param _amount The amount of tokens to be transferred
    /// @return True if the transfer was successful
    function _transfer(address _from, address _to, uint _amount
    ) internal {
        require(_amount!=0, "Empty Transfers are not allowed.");

        // Do not allow transfer to 0x0 or the token contract itself
        require((_to != address(0)) && (_to != address(this)), "Transfers to 0x and Token Contract are not allowed.");

        uint previousBalanceFrom = balanceOfAt(_from, block.number);

        // Check if amount exceeds funds
        require(previousBalanceFrom>=_amount,"Transferred amount exceeds available funds.");


        // First update the balance array with the new value for the address
        //  sending the tokens
        updateValueAtNow(_balances[_from], previousBalanceFrom.sub(_amount));

        // Then update the balance array with the new value for the address
        //  receiving the tokens
        uint previousBalanceTo = balanceOfAt(_to, block.number);
        require(previousBalanceTo.add(_amount) >= previousBalanceTo); // Check for overflow
        updateValueAtNow(_balances[_to], previousBalanceTo.add(_amount));

        // An event to make the transfer easy to find on the blockchain
        emit Transfer(_from, _to, _amount);

    }

    /// @dev overrides the function from ERC20
    /// @param _owner The address that's balance is being requested
    /// @return The balance of `_owner` at the current block
    function balanceOf(address _owner) public view returns (uint256) {
        return balanceOfAt(_owner, block.number);
    }


    ////////////////
    // Voting Functions
    ////////////////


    /// @dev creates a new ballot and appends it to 'ballots'
    /// @param ballotName The name of the ballot resp. the asked Question
    /// @param optionNames List of possible choices / answers to the question
    function createBallot(bytes32 ballotName, bytes32[] memory optionNames) public { //TODO   onlyVotingOfficial

        //Check the arguments for validity
        require(ballotName[0] != 0, "The ballotName must not be empty!");
        require(optionNames.length > 0, "The optionNames Array must not be empty!");


        Ballot memory ballot = Ballot({name: ballotName, cutoffBlockNumber: block.number, optionNames: optionNames, optionVoteCounts: new uint[](optionNames.length)});
        ballots.push(ballot);
        //ballots[ballots.length-1].players.push(msg.sender);

        emit BallotCreated(ballotName);
    }

    /// @info casts votes equal to the senders tokens at the cutoff time of the newest ballot designated
    /// by @ballotName to the option designated by @optionName
    /// @ballotName Ballot to vote in
    /// @optionName option to vote for
    /// @dev rolls back on unfound ballot or option, if sender already voted, or does not own tokens at cutoff
    function vote(bytes32 ballotName, bytes32 optionName) public {
        //Search through all Ballots backwards, so that the recent ones are found first
        int found = -1;

        for(int i = UIntConverterLib.toIntSafe(ballots.length); i>0; i--){ //TODO could be optimized for gas
            if(ballots[SafeMathInt.toUintSafe(i-1)].name == ballotName){
                found=i-1;
                break;
            }
        }
        require(found >= 0, "Ballot not found!"); //TODO test

        Ballot storage ballot = ballots[SafeMathInt.toUintSafe(found)];

        //check if User had tokens at the time of the ballot start == right to vote
        uint senderBalance = this.balanceOfAt(msg.sender, ballot.cutoffBlockNumber);
        require(senderBalance >0, "Sender did not own tokens at the Cutoff Time!");

        //check if User already voted
        require(ballot.voted[msg.sender]==false,"Sender already voted");

        //Search for the voted option in the ballot

        for(int j = UIntConverterLib.toIntSafe(ballot.optionNames.length); j>0; j--){
            if(ballot.optionNames[SafeMathInt.toUintSafe(j-1)]==optionName){
                ballot.voted[msg.sender]=true;
                ballot.optionVoteCounts[SafeMathInt.toUintSafe(j-1)]=ballot.optionVoteCounts[SafeMathInt.toUintSafe(j-1)].add(senderBalance);  //TODO replace with safe functions
                return;
            }
        }
        require(false, "Chosen option does not exist in chosen Ballot.");
    }

    /// @info Computes the winning proposal taking all votes up until now into account, exact tallying can be gotten from
    /// the function getBallot(bytes32 ballotName)
    /// @dev does not change state or close the voting intentionally, is public so that everybody
    /// can look at the current winner, and to allow for maximum flexibility (company can decide
    /// a time when to decide the winners, as the time may change due to not all voters being on chain
    /// ATTENTION: does not deal with votes where two options are equal, this must be decided by the user via getBallot(bytes32 ballotName)
    /// @ballotName ballot to be queried
    /// @return name of the winning option and resp. vote count
    function currentlyWinningOption(bytes32 ballotName) public view returns (bytes32 winningOptionName, uint winningOptionVoteCount){
        Ballot memory ballot;
        //Search through all Ballots backwards, so that the recent ones are found first
        for(int i = UIntConverterLib.toIntSafe(ballots.length); i>0; i--){
            if(ballots[SafeMathInt.toUintSafe(i-1)].name==ballotName){
                ballot = ballots[SafeMathInt.toUintSafe(i-1)];
            }
        }
        require(ballot.name.length > 0, "Ballot not found!"); //TODO test this

        uint winningVoteCount = 0;
        int winningOptionIndex = -1;
        for (uint p = 0; p < ballot.optionVoteCounts.length; p++) {
            if (ballot.optionVoteCounts[p] > winningVoteCount) {
                winningVoteCount = ballot.optionVoteCounts[p];
                winningOptionIndex = UIntConverterLib.toIntSafe(p);
            }
        }
        require(winningOptionIndex !=-1,"No votes yet!");


        winningOptionName=ballot.optionNames[SafeMathInt.toUintSafe(winningOptionIndex)];
        winningOptionVoteCount=ballot.optionVoteCounts[SafeMathInt.toUintSafe(winningOptionIndex)];
    }



    ////////////////
    // Query balance and totalSupply in History
    ////////////////

    /// @dev Queries the balance of `_owner` at a specific `_blockNumber`
    /// @param _owner The address from which the balance will be retrieved
    /// @param _blockNumber The block number when the balance is queried
    /// @return The balance at `_blockNumber`
    function balanceOfAt(address _owner, uint _blockNumber) public view
    returns (uint) {

        return getValueAt(_balances[_owner], _blockNumber);

    }

    /// @notice Total amount of tokens at a specific `_blockNumber`.
    /// @param _blockNumber The block number when the totalSupply is queried
    /// @return The total amount of tokens at `_blockNumber`
    function totalSupplyAt(uint _blockNumber) public view returns(uint) {
        return getValueAt(totalSupplyHistory, _blockNumber);
    }



    /// @dev overwrite erc20 function
    /// @notice Generates `_value` tokens that are assigned to `_owner`
    /// @param _owner The address that will be assigned the new tokens
    /// @param _value The quantity of tokens generated
    /// @return True if the tokens are generated correctly
    function  _mint(address _account, uint256 _value) internal { //TODO fix require error messages
        require(_account != address(0));
        uint curTotalSupply = totalSupply();
        require(curTotalSupply.add(_value) >= curTotalSupply); // Check for overflowgenerateTokens
        uint previousBalanceTo = balanceOf(_account);
        require(previousBalanceTo.add(_value) >= previousBalanceTo); // Check for overflow
        updateValueAtNow(totalSupplyHistory, curTotalSupply.add(_value));
        updateValueAtNow(_balances[_account], previousBalanceTo.add(_value));
        emit Transfer(address(0), _account, _value);
    }


    /// @notice Burns `_amount` tokens from `_owner`
    /// @dev overwrites the erc20 implementation, is also used by _burnFrom
    /// @param _owner The address that will lose the tokens
    /// @param _amount The quantity of tokens to burn
    /// @return True if the tokens are burned correctly
    function _burn(address _account, uint _value
    )  internal  {
        //erc 20 checks
        require(_account != address(0));
        require(_value <= balanceOf(_account));

        uint curTotalSupply = totalSupply();
        require(curTotalSupply >= _value);
        uint previousBalanceFrom = balanceOf(_account);
        require(previousBalanceFrom >= _value);
        updateValueAtNow(totalSupplyHistory, curTotalSupply.sub(_value));
        updateValueAtNow(_balances[_account], previousBalanceFrom.sub(_value));
        emit Transfer(_account,address(0), _value);
    }

    /// @dev This function makes it easy to get the total number of tokens
    /// @return The total number of tokens
    function totalSupply() public view returns (uint) {
        return totalSupplyAt(block.number);
    }

    ////////////////
    // Internal helper functions to query and set a value in a snapshot array
    ////////////////

    /// @dev `getValueAt` retrieves the number of tokens at a given block number
    /// @param checkpoints The history of values being queried
    /// @param _block The block number to retrieve the value at
    /// @return The number of tokens being queried
    function getValueAt(Checkpoint[] storage checkpoints, uint _block
    ) view internal returns (uint) {
        if (checkpoints.length == 0) return 0;

        // Shortcut for the actual value
        if (_block >= checkpoints[checkpoints.length-1].fromBlock)
            return checkpoints[checkpoints.length-1].value;
        if (_block < checkpoints[0].fromBlock) return 0;

        // Binary search of the value in the array
        uint min = 0;
        uint max = checkpoints.length-1;
        while (max > min) {
            uint mid = (max.add(min).add(1))/ 2;
            if (checkpoints[mid].fromBlock<=_block) {
                min = mid;
            } else {
                max = mid-1;
            }
        }
        return checkpoints[min].value;
    }

    /// @dev `updateValueAtNow` used to update the `balances` map and the
    ///  `totalSupplyHistory`
    /// @param checkpoints The history of data being updated
    /// @param _value The new number of tokens
    function updateValueAtNow(Checkpoint[] storage checkpoints, uint _value
    ) internal  {
        if ((checkpoints.length == 0)
            || (checkpoints[checkpoints.length -1].fromBlock < block.number)) {
            Checkpoint storage newCheckPoint = checkpoints[ checkpoints.length++ ];
            newCheckPoint.fromBlock =  uint128(block.number);
            newCheckPoint.value = uint128(_value);
        } else {
            Checkpoint storage oldCheckPoint = checkpoints[checkpoints.length-1];
            oldCheckPoint.value = uint128(_value);
        }
    }

}