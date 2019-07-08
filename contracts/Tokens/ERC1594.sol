pragma solidity ^0.5.4;

import "../Interfaces/IERC1594.sol";
import "./ERC20.sol";
import "../Roles/IssuerRole.sol";
import "../AML/TransferQueues.sol";
import "../Controlling/Controller.sol";
//import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title AML aware implementation of ERC1594 (Subset of ERC1400 https://github.com/ethereum/EIPs/issues/1411)
 * adapted from the standard implementation of the spec: https://github.com/SecurityTokenStandard/EIP-Spec
 */
contract ERC1594 is IERC1594, ERC20, IssuerRole, OrchestratorRole {
    // Variable which tells whether issuance is ON or OFF forever
    bool internal issuanceClosed = false;
    bool internal nameSet=false;

    bytes32 public name;

    // Variable that stores stores a mapping of the last transfers of the account
    // in order to comply with AML regulations
    // @dev maps each address to an array of dynamic length, that consists a struct of the timestamp and
    // the value of the outbound funds (counted in number of tokens, value must be determined on check
    TransferQueues queues;
    // The single controller that is to be queried before all token moving actions on the respective functions
    Controller controller;

    // Constant that defines how long the last Transfers of each sender are considered for AML checks
    uint constant TRANSFER_RETENTION_TIME = 604800; //604800 == 1 Week in Seconds
    // Constant that defines the maximum value that may be traded within the retention time
    // currently is used as token number, but should in future be implemented using a pricing oracle to represent euros
    uint constant SPEND_CEILING = 15000;

    // reenable constructor, if deployment without proxy is needed
    /*constructor(Controller _controller, TransferQueues _queues)  public { //The super contract is a modifier of sorts of the constructor
        queues = _queues;
        controller = _controller;
    }*/

    /**
     * @dev these three functions are the replacement for the constructor setters in proxy setups
     */
    function setTransferQueues(TransferQueues _queues) external onlyOrchestrator{
        queues = _queues;
    }
    function setController(Controller _controller) external onlyOrchestrator{
        controller = _controller;
    }
    function addIssuerOrchestrator(address issuer) external onlyOrchestrator{
        _addIssuer(issuer);
    }
    function setName(bytes32 _name) external onlyOrchestrator{
        require(!nameSet);
        name = _name;
        nameSet = true;
    }

    /**
     * @notice Transfers tokens if allowed by AML constraints and controller
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function transferWithData(address _to, uint256 _value, bytes memory  _data) public {
        super.transferWithData(_to, _value,_data);

        controller.verifyAllTransfer(msg.sender, _to, _value, _data);
        _checkAMLConstraints(msg.sender,_value);
    }



    /**
     * @notice Transfers tokens if allowed by AML constraints and controller, but not from the
     * sender itself, but from the _from address. The sender must have sufficient allowance (see ERC20 standard)
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function transferFromWithData(address _from, address _to, uint256 _value, bytes memory  _data) public {
        super.transferFromWithData(_from, _to, _value,_data);

        controller.verifyAllTransferFrom(msg.sender, _from, _to, _value, _data);
        _checkAMLConstraints(_from,_value);
    }




    /**
     * @notice A security token issuer can specify that issuance has finished for the token
     * (i.e. no new tokens can be minted or issued).
     * @dev If a token returns FALSE for `isIssuable()` then it MUST always return FALSE in the future.
     * If a token returns FALSE for `isIssuable()` then it MUST never allow additional tokens to be issued.
     * @return bool `true` signifies the minting is allowed. ´false` denotes the end of minting
     */
    function isIssuable() external view returns (bool) {
        return !issuanceClosed;
    }

    /**
     * @notice Increases the total token supply by adding tokens to _tokenHolder. Can only be called by the Issuer, and
     * if the Issuance of the token is not closed. Checks with the controller, and emits an Issued event.
     * @param _tokenHolder The account that will receive the created tokens (account should be whitelisted or KYCed).
     * @param _value The amount of tokens need to be issued
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function issue(address _tokenHolder, uint256 _value, bytes memory _data) public onlyIssuer {
        _mint(_tokenHolder, _value);

        //There is no need to override the mint function here, as it is never accessed in the ERC20 contract and an internal function
        require(!issuanceClosed, "Issuance is closed");
        controller.verifyAllIssue(_tokenHolder,_value,_data);

        //Future work: additional checks on issuing, but will most likely be primarily offchain, as there are no good
        //one size fits all issuing checks
        emit Issued(msg.sender, _tokenHolder, _value, _data);
    }




    /**
     * @notice Closes the issuance forever, forbidding any more tokens to be minted as per ERC1594 definition.
     */
    function closeIssuance() external onlyIssuer {
        issuanceClosed = true;
    }
    /**
     * @notice Redeems (i.e. burns) tokens of the sender. Emits an Redeemed event which can be listened for, in order
     * to give some off chain reward or reimbursement to the redeemer, if so defined by the token issuer
     * @param _value The amount of tokens to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeem(uint256 _value, bytes memory  _data) public { //public instead of external so that subcontracts can call
        _burn(msg.sender, _value);

        //There is no need to override the burn function here, as it is never accessed in the ERC20 contract and an internal function
        controller.verifyAllRedeem(msg.sender,_value,_data);
        emit Redeemed(address(0), msg.sender, _value, _data);
    }




    /**
     * @notice Redeems (see notice above) tokens of the allowance of _tokenholder.
     * @dev analogous to `transferFrom`
     * @param _tokenHolder The account whose tokens gets redeemed.
     * @param _value The amount of tokens to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeemFrom(address _tokenHolder, uint256 _value, bytes memory  _data) public {
        _burnFrom(_tokenHolder, _value);

        //There is no need to override the burn function here, as it is never accessed in the ERC20 contract and an internal function
        controller.verifyAllRedeem(msg.sender,_value,_data);
        emit Redeemed(msg.sender, _tokenHolder, _value, _data);
    }

    /**
     * @notice Checks if a transfer can be executed. May be called by clients prior to executing a transaction, in order
     * to prevent losses.
     * Does not take AML into account, as this depends on timing of the transaction
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * @return bool It signifies whether the transaction will be executed or not.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code
     */
    function canTransfer(address _to, uint256 _value, bytes calldata _data) external view returns (bool, byte, bytes32) {
        bool can;
        bytes32 reason;
        (can, reason)=controller.checkAllTransfer(msg.sender,  _to,  _value,  _data);
        if (balanceOf(msg.sender) < _value) return (false, 0x54, bytes32(0));
        else if (!can) return (false, 0x59, reason);
        return (true, 0x51, bytes32(0));
    }

    /**
     * @notice Checks if a transferFrom can be executed. May be called by clients prior to executing a transaction, in order
     * to prevent losses.
     * Does not take AML into account, as this depends on timing of the transaction
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * @return bool It signifies whether the transaction will be executed or not.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code
     */
    function canTransferFrom(address _from, address _to, uint256 _value, bytes calldata _data) external view returns (bool, byte, bytes32) {
        bool can;
        bytes32 reason;
        (can, reason)=controller.checkAllTransfer(msg.sender,  _to,  _value,  _data);
        if (_value > _allowed[_from][msg.sender]) return (false, 0x53, bytes32(0));
        else if (balanceOf(_from) < _value) return (false, 0x54, bytes32(0));
        else if (!can) return (false, 0x59, reason);
        return (true, 0x51, bytes32(0));
    }

    /**
     * @notice checks if the Anti Money Laundering constraints are satisfied, i.e. all outgoing transactions by _from
     * within a timespan of TRANSFER_RETENTION_TIME do not exceed SPEND_CEILING.
     */
    function _checkAMLConstraints(address from, uint value) private{
        //actually, according to the aml law, for transactions over the limit the senders only have to be authenticated,
        //which would anyway be the case with the KYCVerifier
        require(_updateTransferListAndCalculateSum(from,value) < SPEND_CEILING,"ERC1594: The transfer exceeds the allowed quota within the retention period."); //TODO Future work: enable cosigning via data
    }

    /**
    * @dev Adds two numbers, return false on overflow, keeps transfer list ordered
    */
    function _updateTransferListAndCalculateSum(address _from, uint256 _value) private returns(uint sum) {
        uint sumOfTransfers=0;
        uint timestamp;


        while(!queues.empty(_from)){
            (timestamp, )= queues.peek(_from);
            if(timestamp <= now - TRANSFER_RETENTION_TIME){
                queues.dequeue(_from);
            }
            else break;
        }

        queues.enqueue(_from, now, _value);

        return queues.sumOfTransfers(_from);

    }

}
