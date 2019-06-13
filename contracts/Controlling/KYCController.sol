pragma solidity ^0.5.4;

import "../Interfaces/IController.sol";
import "../Roles/KYCVerifierRole.sol";


//CENTRAL controller that stores addresses in a whitelist, TODO enter into registry
//Allows all actions for all whitelisted addresses (sender and recipient, if applicable)
//TODO include some kind of link to the decentralized information
contract KYCController is IController, KYCVerifierRole {
    byte internal constant STATUS_SUCCESS = 0x51; // Uses status codes from ERC-1066
    byte internal constant STATUS_FAIL = 0x50;

    event AddedToWhitelist(address added);
    event RemovedFromWhitelist(address added);
    event Test(string test); //TODO remove

    mapping (address => bool) public whitelist; //TODO eventually store some some struct on what type of kyc is stored




    /**
    * @notice Verify if an issuance to an address is allowed
    * @dev Allows issuing if _tokenHolder is on whitelist
    * @return {
        "allowed": "Returns true if issue is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code"
    }
    */
    function verifyIssue(address _tokenHolder, uint256 _value, bytes calldata _data) external view
    returns (bool)
    {
        if(_onWhitelist(_tokenHolder)){
            return true;
            
        }
        else{
            return false;
            
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
    returns (bool allowed)
    {

        if(_onWhitelist(_from) && _onWhitelist(_to)){ //TODO application specific more detailed Status codes?
            allowed = true;
            
        }
        else{
            allowed = false;
            
        }
    }

    /**
    * @notice Verify if a transferFrom is allowed.
    * @dev Allows transfer if _from, _to, and _forwarder are on the whitelist
    * @return {
        "allowed": "Returns true if transferFrom is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code" //TODO remove comment
    }
    */
    function verifyTransferFrom(address _from, address _to, address _forwarder, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed)
    {
        if(_onWhitelist(_from) && _onWhitelist(_to) && _onWhitelist(_forwarder)){
            allowed = true;
            
        }
        else{
            allowed = false;
            
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
    returns (bool allowed)
    {
        if(_onWhitelist(_sender)){
            allowed = true;
            
        }
        else{
            allowed = false;
            
        }
    }

    /**
    * @notice Verify if a redeemFrom is allowed.
    * @dev Allows redeem if _sender and _tokenHolder are on the whitelist
    * @return {
        "allowed": "Returns true if redeem is allowed, returns false otherwise.",
        "statusCode": "ERC1066 status code" //TODO remove this on all of them
    }
    */
    function verifyRedeemFrom(address _sender, address _tokenHolder, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed)
    {
        if(_onWhitelist(_sender) && _onWhitelist(_tokenHolder)){
            allowed = true;
            
        }
        else{
            allowed = false;
            
        }
    }

    /**
    * @notice Add an address to the stored KYC whitelist
    * @dev Only addresses with the role @KYCVerifier are allowed to use this Function
    */
    function addAddressToWhitelist(address _addr) external onlyKYCVerifier { //TODO do I have to set my instance of KYCVerifier somewhere central, or are they linked by deploying?
        whitelist[_addr] = true;
        emit AddedToWhitelist(_addr);
    }

    /**
    * @notice Remove an address to the stored KYC whitelist
    * @dev Only addresses with the role @KYCVerifier are allowed to use this Function
    */
    function removeAddressFromWhitelist(address _addr) external onlyKYCVerifier {
        whitelist[_addr] = false;
        emit RemovedFromWhitelist(_addr);
    }

    /**
    * @notice Check if an address is present on the whitelist
    * @return returns true if the address is on the whitelist
    */
    function _onWhitelist(address _addr) public view returns(bool) {
        return (whitelist[_addr]); //TODO make whitelist expirable and check here?
    }



}