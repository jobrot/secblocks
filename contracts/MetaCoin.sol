/*
pragma solidity >=0.4.22 <0.6.0;

import "./ConvertLib.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract MetaCoin {

	address public minter;
	mapping (address => uint) balances;


	// This declares a new complex type which will
	// be used for variables later.
	// It will represent a single voter.
	struct Voter {
		//uint weight; // weight is accumulated by delegation
		bool voted;  // if true, that person already voted
		//address delegate; // person delegated to
		uint vote;   // index of the voted proposal
	}

	// This is a type for a single proposal.
	struct Proposal {
		bytes32 name;   // short name (up to 32 bytes)
		uint voteCount; // number of accumulated votes
	}

	//voters left out

	struct Ballot {
		// stores a `Voter` struct for each possible address.
		mapping(address => Voter) voters;
		// A dynamically-sized array of `Proposal` structs.
		//Proposal[] public proposals;
		Proposal[] proposals;
	}

	Ballot[] public ballots;


	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	constructor() public {
		minter= msg.sender;
	}

	//TODO need ballot creating function

	/// Give your vote to proposal `proposals[proposal].name`.
	function vote(uint ballot, uint proposal) public {
		Voter storage sender = ballots[ballot].voters[msg.sender];
		require(sender.weight != 0, "Has no right to vote");
		require(!sender.voted, "Already voted.");
		sender.voted = true;
		sender.vote = proposal;

		// If `proposal` is out of the range of the array,
		// this will throw automatically and revert all
		// changes.
		ballots[ballot].proposals[proposal].voteCount += balances[sender.weight]; //sender has as much weight as he posesses tokens
	}

	function mint(address receiver, uint amount) public {
		//TODO proof of Ownership of Security! How Possible in infitesimal amounts?
		if (msg.sender != minter) return;
		balances[receiver] += amount;
	}

	function sendCoin(address receiver, uint amount) public returns(bool sufficient) {
		if (balances[msg.sender] < amount) return false;
		balances[msg.sender] -= amount;
		balances[receiver] += amount;
		emit Transfer(msg.sender, receiver, amount);
		return true;
	}

	//create a balance in dollar or whatever according to current oracle course?
	function getBalanceInEth(address addr) public view returns(uint){
		return ConvertLib.convert(getBalance(addr),2);
	}

	function getBalance(address addr) public view returns(uint) {
		return balances[addr];
	}

	/// @dev Computes the winning proposal taking all
	/// previous votes into account.
	function winningProposal() public view
	returns (uint winningProposal_)
	{
		uint winningVoteCount = 0;
		for (uint p = 0; p < proposals.length; p++) {
			if (proposals[p].voteCount > winningVoteCount) {
				winningVoteCount = proposals[p].voteCount;
				winningProposal_ = p;
			}
		}
	}

	// Calls winningProposal() function to get the index
	// of the winner contained in the proposals array and then
	// returns the name of the winner
	function winnerName() public view
	returns (bytes32 winnerName_)
	{
		winnerName_ = proposals[winningProposal()].name;
	}

}
*/
