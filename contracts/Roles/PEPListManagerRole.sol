pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/access/Roles.sol";

// A role for the global Verifiers for KYC information, who are allowed to enter
contract PEPListManagerRole {
    using Roles for Roles.Role;

    event PEPListManagerAdded(address indexed account);
    event PEPListManagerRemoved(address indexed account);

    Roles.Role private _pepListManagers;

    constructor () internal {
        _addPEPListManager(msg.sender);
    }

    modifier onlyPEPListManager() {
        require(isPEPListManager(msg.sender), "PEPListManagerRole: caller does not have the PEPListManager role");
        _;
    }

    function isPEPListManager(address account) public view returns (bool) {
        return _pepListManagers.has(account);
    }

    function addPEPListManager(address account) public onlyPEPListManager {
        _addPEPListManager(account);
    }

    function renouncePEPListManager() public {
        _removePEPListManager(msg.sender);
    }

    function _addPEPListManager(address account) internal {
        _pepListManagers.add(account);
        emit PEPListManagerAdded(account);
    }

    function _removePEPListManager(address account) internal {
        _pepListManagers.remove(account);
        emit PEPListManagerRemoved(account);
    }
}