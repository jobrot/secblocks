pragma solidity ^0.5.4;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";
import "../Proxy/Initializable.sol";


// A role for the global Verifiers for KYC information, who are allowed to enter
contract KYCListManagerRole is Initializable {
    using Roles for Roles.Role;

    event KYCListManagerAdded(address indexed account);
    event KYCListManagerRemoved(address indexed account);

    Roles.Role private _kYCListManagers;

    constructor () internal {
        _addKYCListManager(msg.sender);
        initialized = true;
    }

    function _initialize(address _initialManager) internal{
        _addKYCListManager(_initialManager);
    }

    modifier onlyKYCListManager() {
        require(isKYCListManager(msg.sender), "KYCListManagerRole: caller does not have the KYCListManager role");
        _;
    }

    function isKYCListManager(address account) public view returns (bool) {
        return _kYCListManagers.has(account);
    }

    function addKYCListManager(address account) external onlyKYCListManager {
        _addKYCListManager(account);
    }

    function renounceKYCListManager() external {
        _removeKYCListManager(msg.sender);
    }

    function _addKYCListManager(address account) internal {
        _kYCListManagers.add(account);
        emit KYCListManagerAdded(account);
    }

    function _removeKYCListManager(address account) internal {
        _kYCListManagers.remove(account);
        emit KYCListManagerRemoved(account);
    }
}