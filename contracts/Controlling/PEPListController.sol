pragma solidity ^0.5.4;

import "../Interfaces/IController.sol";
import "../Roles/PEPListManagerRole.sol";

//CENTRAL Controller that stores addresses of all Politically Exposed Persons
//Is to be combined with the KYC information for the full PEP list (Address, Full name, Occupation) as mandated
// by EU law
contract PEPListController is IController, PEPListManagerRole {
    byte internal constant STATUS_SUCCESS = 0x51; // Uses status codes from ERC-1066
    byte internal constant STATUS_FAIL = 0x50;

    event AddedToBlacklist(address added); 
    event RemovedFromBlacklist(address added);

    mapping (address => bool) public blacklist;

    /**
    * @notice Verify if an issuance to an address is allowed
    * @dev Allows issuing if _tokenHolder is on blacklist
    * @return {
        "allowed": "Returns true if issue is allowed, returns false otherwise."
    }
    */
    function verifyIssue(address _tokenHolder, uint256 _value, bytes calldata _data) external view
    returns (bool allowed)
    {
        if(_onBlacklist(_tokenHolder)){
            allowed = false;
            
        }
        else{
            allowed = true;
            
        }
    }

    /**
    * @notice Verify if a transfer is allowed.
    * @dev Allows transfer if _from and _to are on blacklist
    * @return {
        "allowed": "Returns true if transfer is allowed, returns false otherwise."
    }
    */
    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed)
    {
        if(_onBlacklist(_from) && _onBlacklist(_to)){
            allowed = false;
        }
        else{
            allowed = true;
        }
    }

    /**
    * @notice Verify if a transferFrom is allowed.
    * @dev Allows transfer if _from, _to, and _spender are on the blacklist
    * @return {
        "allowed": "Returns true if transferFrom is allowed, returns false otherwise."
    }
    */
    function verifyTransferFrom(address _from, address _to, address _spender, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed)
    {
        if(_onBlacklist(_from) && _onBlacklist(_to) && _onBlacklist(_spender)){
            allowed = false;
            
        }
        else{
            allowed = true;
            
        }
    }

    /**
    * @notice Verify if a redeem is allowed.
    * @dev Allows redeem if _sender is on the blacklist
    * @return {
        "allowed": "Returns true if redeem is allowed, returns false otherwise."
    }
    */
    function verifyRedeem(address _sender, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed)
    {
        if(_onBlacklist(_sender)){
            allowed = false;
            
        }
        else{
            allowed = true;
            
        }
    }

    /**
    * @notice Verify if a redeemFrom is allowed.
    * @dev Allows redeem if _sender and _tokenHolder are on the blacklist
    * @return {
        "allowed": "Returns true if redeem is allowed, returns false otherwise."
    }
    */
    function verifyRedeemFrom(address _sender, address _tokenHolder, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed)
    {
        if(_onBlacklist(_sender) && _onBlacklist(_tokenHolder)){
            allowed = false;
            
        }
        else{
            allowed = true;
            
        }
    }

    /**
    * @notice Add an address to the stored PEP list
    * @dev Only addresses with the role @PepListManagerRole are allowed to use this Function
    */
    function addAddressToBlacklist(address _addr) external onlyPEPListManager {
        blacklist[_addr] = true;
        emit AddedToBlacklist(_addr);
    }

    /**
    * @notice Remove an address to the stored PEP list
    * @dev Only addresses with the role @PepListManager are allowed to use this Function
    */
    function removeAddressFromBlacklist(address _addr) external onlyPEPListManager {
        blacklist[_addr] = false;
        emit RemovedFromBlacklist(_addr);
    }

    /**
    * @notice Check if an address is present on the blacklist
    * @return returns true if the address is on the blacklist
    */
    function _onBlacklist(address _addr) public view returns(bool) {
        return (blacklist[_addr]);
    }

}