pragma solidity ^0.5.0;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";
import "../Proxy/Initializable.sol";


// A role for the global Verifiers for KYC information, who are allowed to enter
//TODO enter in singular registry somehow
contract KYCVerifierRole is Initializable {
    using Roles for Roles.Role;

    event KYCVerifierAdded(address indexed account);
    event KYCVerifierRemoved(address indexed account);

    Roles.Role private _kycVerifiers;

    constructor () internal {
        _addKYCVerifier(msg.sender);
        initialized = true;
    }

    function _initialize(address _initialManager) internal{
        _addKYCVerifier(_initialManager);
    }

    modifier onlyKYCVerifier() {
        require(isKYCVerifier(msg.sender), "KYCVerifierRole: caller does not have the KYCVerifier role");
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
        emit KYCVerifierAdded(account);
    }

    function _removeKYCVerifier(address account) internal {
        _kycVerifiers.remove(account);
        emit KYCVerifierRemoved(account);
    }
}