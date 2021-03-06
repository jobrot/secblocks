pragma solidity ^0.5.4;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";
import "../Proxy/Initializable.sol";


// A role for the global Verifiers for KYC information, who are allowed to enter
contract PEPListManagerRole is Initializable {
    using Roles for Roles.Role;

    event PEPListManagerAdded(address indexed account);
    event PEPListManagerRemoved(address indexed account);

    Roles.Role private _pepListManagers;

    constructor () internal {
        _addPEPListManager(msg.sender);
        initialized = true;
    }

    function _initialize(address _initialManager) internal{
        _addPEPListManager(_initialManager);
    }

    modifier onlyPEPListManager() {
        require(isPEPListManager(msg.sender), "PEPListManagerRole: caller does not have the PEPListManager role");
        _;
    }

    function isPEPListManager(address account) public view returns (bool) {
        return _pepListManagers.has(account);
    }

    function addPEPListManager(address account) external onlyPEPListManager {
        _addPEPListManager(account);
    }

    function renouncePEPListManager() external {
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