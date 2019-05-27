pragma solidity ^0.5.0;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";


// A role for the global Verifiers for KYC information, who are allowed to enter
contract InsiderListManagerRole {
    using Roles for Roles.Role;

    event InsiderListManagerAdded(address indexed account);
    event InsiderListManagerRemoved(address indexed account);

    Roles.Role private _insiderListManagers;

    constructor () internal {
        _addInsiderListManager(msg.sender);
    }

    modifier onlyInsiderListManager() {
        require(isInsiderListManager(msg.sender), "InsiderListManagerRole: caller does not have the InsiderListManager role");
        _;
    }

    function isInsiderListManager(address account) public view returns (bool) {
        return _insiderListManagers.has(account);
    }

    function addInsiderListManager(address account) public onlyInsiderListManager {
        _addInsiderListManager(account);
    }

    function renounceInsiderListManager() public {
        _removeInsiderListManager(msg.sender);
    }

    function _addInsiderListManager(address account) internal {
        _insiderListManagers.add(account);
        emit InsiderListManagerAdded(account);
    }

    function _removeInsiderListManager(address account) internal {
        _insiderListManagers.remove(account);
        emit InsiderListManagerRemoved(account);
    }
}