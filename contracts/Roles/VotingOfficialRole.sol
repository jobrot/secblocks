pragma solidity ^0.5.0;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";

// A role for the Deployer of the Token Smart Contracts, that is allowed to add Controllers to the Tokens
contract VotingOfficialRole {
    using Roles for Roles.Role;

    event VotingOfficialChecked(address indexed account); //TODO remove
    event IsVotingOfficial(bool ist); //TODO remove
    event VotingOfficialAdded(address indexed account);
    event VotingOfficialRemoved(address indexed account);

    Roles.Role private _votingOfficials;

    constructor () internal {
        _addVotingOfficial(msg.sender);
    }

    modifier onlyVotingOfficial() {
        emit VotingOfficialChecked(msg.sender);
        emit IsVotingOfficial(isVotingOfficial(msg.sender));
        require(isVotingOfficial(msg.sender), "VotingOfficialRole: caller does not have the VotingOfficial role");
        _;
    }

    function isVotingOfficial(address account) public view returns (bool) {
        return _votingOfficials.has(account);
    }

    function addVotingOfficial(address account) public onlyVotingOfficial {
        _addVotingOfficial(account);
    }

    function renounceVotingOfficial() public {
        _removeVotingOfficial(msg.sender);
    }

    function _addVotingOfficial(address account) internal {
        _votingOfficials.add(account);
        emit VotingOfficialAdded(account);
    }

    function _removeVotingOfficial(address account) internal {
        _votingOfficials.remove(account);
        emit VotingOfficialRemoved(account);
    }
}