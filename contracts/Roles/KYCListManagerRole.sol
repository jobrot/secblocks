pragma solidity ^0.5.0;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";
import "../Proxy/Initializable.sol";


// A role for the global Verifiers for KYC information, who are allowed to enter
contract KYCListManagerRole is Initializable {
    using Roles for Roles.Role;

    event KYCListManagerAdded(address indexed account);
    event KYCListManagerRemoved(address indexed account);

    Roles.Role private _kycVerifiers;

    constructor () internal {
        _addKYCVerifier(msg.sender);
        initialized = true;
    }

    function _initialize(address _initialManager) internal{
        _addKYCVerifier(_initialManager);
    }

    modifier onlyKYCVerifier() {
        require(isKYCVerifier(msg.sender), "KYCListManagerRole: caller does not have the KYCVerifier role");
        _;
    }

    function isKYCVerifier(address account) public view returns (bool) {
        return _kycVerifiers.has(account);
    }

    function addKYCVerifier(address account) public onlyKYCVerifier {
        _addKYCVerifier(account);
    }

    function renounceKYCVerifier() public {
        _removeKYCVerifier(msg.sender);
    }

    function _addKYCVerifier(address account) internal {
        _kycVerifiers.add(account);
        emit KYCListManagerAdded(account);
    }

    function _removeKYCVerifier(address account) internal {
        _kycVerifiers.remove(account);
        emit KYCListManagerRemoved(account);
    }
}