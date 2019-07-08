pragma solidity ^0.5.4;

//import "openzeppelin-solidity/contracts/access/Roles.sol";
import "../Openzeppelin/Roles.sol";
import "../Proxy/Initializable.sol";

// A role for the Issuer of a token, not initializable as the other roles, as this would clash in ERC1594
contract IssuerRole {
    using Roles for Roles.Role;

    event IssuerAdded(address indexed account);
    event IssuerRemoved(address indexed account);

    Roles.Role private _issuers;

    constructor () internal {
        _addIssuer(msg.sender);
    }

    modifier onlyIssuer() {
        require(isIssuer(msg.sender), "IssuerRole: caller does not have the Issuer role");
        _;
    }

    function isIssuer(address account) public view returns (bool) {
        return _issuers.has(account);
    }

    function addIssuer(address account) external onlyIssuer {
        _addIssuer(account);
    }

    function renounceIssuer() external {
        _removeIssuer(msg.sender);
    }

    function _addIssuer(address account) internal {
        _issuers.add(account);
        emit IssuerAdded(account);
    }

    function _removeIssuer(address account) internal {
        _issuers.remove(account);
        emit IssuerRemoved(account);
    }
}