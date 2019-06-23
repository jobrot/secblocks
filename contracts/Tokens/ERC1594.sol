pragma solidity ^0.5.0;

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
    function setTransferQueues(TransferQueues _queues) public onlyOrchestrator{
        queues = _queues;
    }
    function setController(Controller _controller) public onlyOrchestrator{
        controller = _controller;
    }
    function addIssuer(address issuer) public onlyOrchestrator{
        _addIssuer(issuer);
    }

    /**
     * @notice Transfer restrictions can take many forms and typically involve on-chain rules or whitelists.
     * However for many types of approved transfers, maintaining an on-chain list of approved transfers can be
     * cumbersome and expensive. An alternative is the co-signing approach, where in addition to the token holder
     * approving a token transfer, and authorised entity provides signed data which further validates the transfer.
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * for the token contract to interpret or record. This could be signed data authorising the transfer
     * (e.g. a dynamic whitelist) but is flexible enough to accomadate other use-cases.
     */
    function transferWithData(address _to, uint256 _value, bytes memory  _data) public {
        bool verified;
        controller.verifyAllTransfer(msg.sender, _to, _value, _data);




        //in our case, is always the case... so what is it? just implement a flagging service?
        //if anything is done, it surely must also be stored, (alle ausgänge innerhalb einer woche oder so)
        //kein ausgang x anderer, sondern generell ausgang, einfach zweite map
         require(_updateTransferListAndCalculateSum(msg.sender,_value) < SPEND_CEILING,"ERC1594: The transfer exceeds the allowed quota within the retention period, and must be cosigned by an operator."); //TODO naming of operator with role



        // Add a function to validate the `_data` parameter
        _transfer(msg.sender, _to, _value);
    }

    /**
     * @notice Transfer restrictions can take many forms and typically involve on-chain rules or whitelists.
     * However for many types of approved transfers, maintaining an on-chain list of approved transfers can be
     * cumbersome and expensive. An alternative is the co-signing approach, where in addition to the token holder
     * approving a token transfer, and authorised entity provides signed data which further validates the transfer.
     * @dev `msg.sender` MUST have a sufficient `allowance` set and this `allowance` must be debited by the `_value`.
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * for the token contract to interpret or record. This could be signed data authorising the transfer
     * (e.g. a dynamic whitelist) but is flexible enough to accomadate other use-cases.
     */
    function transferFromWithData(address _from, address _to, uint256 _value, bytes memory  _data) public {
        // Add a function to validate the `_data` parameter
        _transferFrom(msg.sender, _from, _to, _value);
    }

    /**
     * @notice A security token issuer can specify that issuance has finished for the token
     * (i.e. no new tokens can be minted or issued).
     * @dev If a token returns FALSE for `isIssuable()` then it MUST always return FALSE in the future.
     * If a token returns FALSE for `isIssuable()` then it MUST never allow additional tokens to be issued.
     * @return bool `true` signifies the minting is allowed. While `false` denotes the end of minting
     */
    function isIssuable() external view returns (bool) {
        return !issuanceClosed;
    }

    /**
     * @notice This function must be called to increase the total supply (Corresponds to mint function of ERC20).
     * @dev It only be called by the token issuer or the operator defined by the issuer. ERC1594 doesn't have
     * have the any logic related to operator but its superset ERC1400 have the operator logic and this function
     * is allowed to call by the operator.
     * @param _tokenHolder The account that will receive the created tokens (account should be whitelisted or KYCed).
     * @param _value The amount of tokens need to be issued
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function issue(address _tokenHolder, uint256 _value, bytes memory _data) public onlyIssuer {
        // Add a function to validate the `_data` parameter
        require(!issuanceClosed, "Issuance is closed");
        _mint(_tokenHolder, _value);
        emit Issued(msg.sender, _tokenHolder, _value, _data);
    }

    /**
     * @notice Closes the issuance forever, forbidding any more tokens to be minted as per ERC1594
     */
    function closeIssuance() public onlyIssuer {
        issuanceClosed = true;
    }
    /**
     * @notice This function redeems an amount of the token of a msg.sender. For doing so msg.sender may incentivize
     * using different ways that could be implemented with in the `redeem` function definition. But those implementations
     * are out of the scope of the ERC1594.
     * @param _value The amount of tokens to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeem(uint256 _value, bytes memory  _data) public { //public instead of external so that subcontracts can call
        // Add a function to validate the `_data` parameter
        _burn(msg.sender, _value);
        emit Redeemed(address(0), msg.sender, _value, _data);
    }

    /**
     * @notice This function redeems an amount of the token of a msg.sender from a subcontract.
     * @dev internal function only to be called by derived contracts, for subcontracts that can verify msg.sender
     * @param _value The amount of tokens to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
   NOT NEEDED probably
    function _redeemInternal(address _originalSender, uint256 _value, bytes calldata _data) internal {
        // Add a function to validate the `_data` parameter
        _burn(_originalSender, _value);
        emit Redeemed(address(0), msg.sender, _value, _data);
    }
  */

    /**
     * @notice This function redeems an amount of the token of a msg.sender. For doing so msg.sender may incentivize
     * using different ways that could be implemented with in the `redeem` function definition. But those implementations
     * are out of the scope of the ERC1594.
     * @dev analogous to `transferFrom`
     * @param _tokenHolder The account whose tokens gets redeemed.
     * @param _value The amount of tokens to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeemFrom(address _tokenHolder, uint256 _value, bytes memory  _data) public {
        // Add a function to validate the `_data` parameter
        _burnFrom(_tokenHolder, _value);
        emit Redeemed(msg.sender, _tokenHolder, _value, _data);
    }

    /**
     * @notice Transfers of securities may fail for a number of reasons. So this function will used to understand the
     * cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
     * with a reson string to understand the failure cause, table of Ethereum status code will always reside off-chain
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * @return bool It signifies whether the transaction will be executed or not.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code
     */
    function canTransfer(address _to, uint256 _value, bytes calldata _data) external view returns (bool, byte, bytes32) {
        // Add a function to validate the `_data` parameter
        //TODO add checks on controllers
        if (balanceOf(msg.sender) < _value) return (false, 0x52, bytes32(0));
        else if (_to == address(0)) return (false, 0x57, bytes32(0));
        else if (!_checkAdd(balanceOf(_to), _value)) return (false, 0x50, bytes32(0));
        return (true, 0x51, bytes32(0));
    }

    /**
     * @notice Transfers of securities may fail for a number of reasons. So this function will used to understand the
     * cause of failure by getting the byte value. Which will be the ESC that follows the EIP 1066. ESC can be mapped
     * with a reason string to understand the failure cause, table of Ethereum status code will always reside off-chain
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     * @return bool It signifies whether the transaction will be executed or not.
     * @return byte Ethereum status code (ESC)
     * @return bytes32 Application specific reason code
     */
    function canTransferFrom(address _from, address _to, uint256 _value, bytes calldata _data) external view returns (bool, byte, bytes32) {
        // Add a function to validate the `_data` parameter
        if (_value > _allowed[_from][msg.sender]) return (false, 0x53, bytes32(0));
        else if (balanceOf(_from) < _value) return (false, 0x52, bytes32(0));
        else if (_to == address(0)) return (false, 0x57, bytes32(0));
        else if (!_checkAdd(balanceOf(_to), _value)) return (false, 0x50, bytes32(0));
        return (true, 0x51, bytes32(0));
    }

    /**
   * @dev Adds two numbers, return false on overflow.
   */
    function _checkAdd(uint256 _a, uint256 _b) private pure returns (bool) {
        uint256 c = _a + _b;
        if (c < _a) return false;
        else return true;
    }


    /**
   * @dev Adds two numbers, return false on overflow, keeps transfer list ordered
   */
    function _updateTransferListAndCalculateSum(address _from, uint256 _value) private returns(uint sum) {

        //TransferQueue senderTransfers = lastTransfers[_from];

        // TimestampedTransfer[] storage senderTransfers = lastTransfers[_from]; //Storage pointer, not actual new storage allocated

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
