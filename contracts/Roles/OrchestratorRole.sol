pragma solidity ^0.5.0;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";
import "../Proxy/Initializable.sol";

// A role for the Deployer of the Token Smart Contracts, that is allowed to add Controllers to the Tokens
contract OrchestratorRole is Initializable {
    using Roles for Roles.Role;

    event OrchestratorAdded(address indexed account);
    event OrchestratorRemoved(address indexed account);

    Roles.Role private _orchestrators;

    constructor () internal {
        _addOrchestrator(msg.sender);
        initialized = true;
    }

    function _initialize(address _initialManager) internal{
        _addOrchestrator(_initialManager);
    }

    modifier onlyOrchestrator() {
        require(isOrchestrator(msg.sender), "OrchestratorRole: caller does not have the Orchestrator role");
        _;
    }

    function isOrchestrator(address account) public view returns (bool) {
        return _orchestrators.has(account);
    }

    function addOrchestrator(address account) public onlyOrchestrator {
        _addOrchestrator(account);
    }

    function renounceOrchestrator() public {
        _removeOrchestrator(msg.sender);
    }

    function _addOrchestrator(address account) internal {
        _orchestrators.add(account);
        emit OrchestratorAdded(account);
    }

    function _removeOrchestrator(address account) internal {
        _orchestrators.remove(account);
        emit OrchestratorRemoved(account);
    }
}