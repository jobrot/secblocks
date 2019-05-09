pragma solidity ^0.5.4;

import "../Interfaces/IController.sol";
import "../Roles/KYCVerifierRole.sol";

//Controller that stores addresses in a blacklist, corresponds to a single token (one company normally)
//Allows no actions for all blacklisted addresses (sender and recipient, if applicable)
//may be overwritten if the controlling entity signs a transaction
// This contract in combination with the stored customer information from the decentralized data storage of customers
// constitutes an insider list according to https://eur-lex.europa.eu/legal-content/DE/TXT/PDF/?uri=CELEX:32016R0347&from=DE
contract KYCController is IController, KYCVerifierRole {
    byte internal constant STATUS_SUCCESS = 0x51; // Uses status codes from ERC-1066
    byte internal constant STATUS_FAIL = 0x50;

    event AddedToBlacklist(address added);
    event RemovedFromBlacklist(address added);

    mapping (address => bool) public blacklist;

    /**
    * @notice Verify if an issuance to an address is allowed
    * @dev Allows issuing if _tokenHolder is on whitelist
    * @return {
        "allowed": "Returns true if issue is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code"
    }
    */
    function verifyIssue(address _tokenHolder, uint256 _value, bytes calldata _data) external view
    returns (bool allowed, byte statusCode)
    {
        if(_onBlacklist(_tokenHolder)){
            allowed = false;
            statusCode = STATUS_FAIL;
        }
        else{
            allowed = true;
            statusCode = STATUS_SUCCESS;
        }
    }

    /**
    * @notice Verify if a transfer is allowed.
    * @dev Allows transfer if _from and _to are on whitelist
    * @return {
        "allowed": "Returns true if transfer is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code"
    }
    */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed, byte statusCode)
    {
        if(_onBlacklist(_from) && _onBlacklist(_to)){ //TODO application specific more detailed Status codes?
            allowed = false;
            statusCode = STATUS_FAIL;
        }
        else{
            allowed = true;
            statusCode = STATUS_SUCCESS;
        }
    }

    /**
    * @notice Verify if a transferFrom is allowed.
    * @dev Allows transfer if _from, _to, and _forwarder are on the whitelist
    * @return {
        "allowed": "Returns true if transferFrom is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code"
    }
    */
    function verifyTransferFrom(address _from, address _to, address _forwarder, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed, byte statusCode)
    {
        if(_onBlacklist(_from) && _onBlacklist(_to) && _onBlacklist(_forwarder)){
            allowed = false;
            statusCode = STATUS_FAIL;
        }
        else{
            allowed = true;
            statusCode = STATUS_SUCCESS;
        }
    }

    /**
    * @notice Verify if a redeem is allowed.
    * @dev Allows redeem if _sender is on the whitelist
    * @return {
        "allowed": "Returns true if redeem is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code"
    }
    */
    function verifyRedeem(address _sender, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed, byte statusCode)
    {
        if(_onBlacklist(_sender)){
            allowed = false;
            statusCode = STATUS_FAIL;
        }
        else{
            allowed = true;
            statusCode = STATUS_SUCCESS;
        }
    }

    /**
    * @notice Verify if a redeemFrom is allowed.
    * @dev Allows redeem if _sender and _tokenHolder are on the whitelist
    * @return {
        "allowed": "Returns true if redeem is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code"
    }
    */
    function verifyRedeemFrom(address _sender, address _tokenHolder, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed, byte statusCode)
    {
        if(_onBlacklist(_sender) && _onBlacklist(_tokenHolder)){
            allowed = false;
            statusCode = STATUS_FAIL;
        }
        else{
            allowed = true;
            statusCode = STATUS_SUCCESS;
        }
    }

    /**
    * @notice Add an address to the stored KYC whitelist
    * @dev Only addresses with the role @KYCVerifier are allowed to use this Function
    */
    function addAddressToWhitelist(address _addr) external onlyKYCVerifier { //TODO do I have to set my instance of KYCVerifier somewhere central, or are they linked by deploying?
        blacklist[_addr] = true;
        emit AddedToBlacklist(_addr);
    }

    /**
    * @notice Remove an address to the stored KYC whitelist
    * @dev Only addresses with the role @KYCVerifier are allowed to use this Function
    */
    function removeAddressFromWhitelist(address _addr) external onlyKYCVerifier {
        blacklist[_addr] = false;
        emit RemovedFromBlacklist(_addr);
    }

    /**
    * @notice Check if an address is present on the whitelist
    * @return returns true if the address is on the whitelist
    */
    function _onBlacklist(address _addr) public view returns(bool) {
        return (blacklist[_addr]);
    }

}