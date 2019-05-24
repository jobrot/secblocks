pragma solidity ^0.5.0;


import "./DividendToken.sol";

//Original: https://github.com/Giveth/minime/blob/master/contracts/MiniMeToken.sol
//Other: https://github.com/validitylabs/token-voting-system/blob/master/src/contracts/voting/LoggedToken.sol


/// @dev draws some inspiration from Jordi Baylina's MiniMeToken to record historical balances
contract VotingToken is DividendToken{



    /// @dev `Checkpoint` is the structure that attaches a block number to a
    ///  given value, the block number attached is the one that last changed the
    ///  value
    struct  Checkpoint {

        // `fromBlock` is the block number that the value was generated super.mint(_to, _amount); from
        uint128 fromBlock;

        // `value` is the amount of tokens at a specific block number
        uint128 value;
    }


    // `balances` is the map that tracks the balance of each address, in this
    //  contract when the balance changes the block number that the change
    //  occurred is also included in the map
    mapping (address => Checkpoint[]) private _balances; //TODO if i do it like this, all transfer function etc. have to use this
//TODO or i just need to overwrite _burn _mint _transfer and _balances + new get balance methoden TODO HIER STEHENGEBLIEBEN

    // `allowed` tracks any extra transfer rights as in all ERC20 tokens
    mapping (address => mapping (address => uint256)) allowed;

    // Tracks the history of the `totalSupply` of the token
    Checkpoint[] totalSupplyHistory;


    uint creationBlock;


    // List of all Proposals by the Issuer/dude

    bytes32[] proposals;



    //we dont need issue, because the underlying function _mint is edited
    /*function issue(address _tokenHolder, uint _value, bytes memory _data) public onlyIssuer {
        generateTokens(_to, _amount);
    }*/


    ///////////////////
    // ERC20 Methods
    ///////////////////

    /// @notice Send `_amount` tokens to `_to` from `msg.sender`
    /// @param _to The address of the recipient
    /// @param _amount The amount of tokens to be transferred
    /// @return Whether the transfer was successful or not
 /*   function transfer(address _to, uint256 _amount) public returns (bool success) {
         _transfer(msg.sender, _to, _amount);
    }*/

    /// @notice Send `_amount` tokens to `_to` from `_from` on the condition it
    ///  is approved by `_from`
    /// @param _from The address holding the tokens being transferred
    /// @param _to The address of the recipient
    /// @param _amount The amount of tokens to be transferred
    /// @return True if the transfer was successful
   /* function transferFrom(address _from, address _to, uint256 _amount
    ) public {
        _transfer(_from, _to, _amount);
    }
*/
    /// @dev This is the actual transfer function in the token contract, it can
    ///  only be called by other functions in this contract.
    ///  Overwrites the ERC-20 function in order to enable interacting with
    /// @param _from The address holding the tokens being transferred
    /// @param _to The address of the recipient
    /// @param _amount The amount of tokens to be transferred
    /// @return True if the transfer was successful
    function _transfer(address _from, address _to, uint _amount
    ) internal {

        require(_amount!=0, "Empty Transfers are not allowed.");

        // Do not allow transfer to 0x0 or the token contract itself
        require((_to != address(0)) && (_to != address(this)), "Self Transfers and Transfers to 0x are not allowed.");

        uint previousBalanceFrom = balanceOfAt(_from, block.number);

        // Check if amount exceeds funds
        require(previousBalanceFrom>=_amount,"Transferred amount exceeds available funds.");


        // First update the balance array with the new value for the address
        //  sending the tokens
        updateValueAtNow(_balances[_from], previousBalanceFrom - _amount);

        // Then update the balance array with the new value for the address
        //  receiving the tokens
        uint previousBalanceTo = balanceOfAt(_to, block.number);
        require(previousBalanceTo + _amount >= previousBalanceTo); // Check for overflow
        updateValueAtNow(_balances[_to], previousBalanceTo + _amount);

        // An event to make the transfer easy to find on the blockchain
        emit Transfer(_from, _to, _amount);

    }

    /// @dev overrides the function from ERC20
    /// @param _owner The address that's balance is being requested
    /// @return The balance of `_owner` at the current block
    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balanceOfAt(_owner, block.number);
    }

    /// @notice `msg.sender` approves `_spender` to spend `_amount` tokens on
    ///  its behalf. This is a modified version of the ERC20 approve function
    ///  to be a little bit safer
    /// @param _spender The address of the account able to transfer the tokens
    /// @param _amount The amount of tokens to be approved for transfer
    /// @return True if the approval was successful
 /*   function approve(address _spender, uint256 _amount) public returns (bool success) {

        // To change the approve amount you first have to reduce the addresses`
        //  allowance to zero by calling `approve(_spender,0)` if it is not
        //  already 0 to mitigate the race condition described here:
        //  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
        require((_amount == 0) || (allowed[msg.sender][_spender] == 0));



        allowed[msg.sender][_spender] = _amount;
        Approval(msg.sender, _spender, _amount);
        return true;
    }*/

    /// @dev This function makes it easy to read the `allowed[]` map
    /// @param _owner The address of the account that owns the token
    /// @param _spender The address of the account able to transfer the tokens
    /// @return Amount of remaining tokens of _owner that _spender is allowed
    ///  to spend
/*    function allowance(address _owner, address _spender
    ) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }*/






    ////////////////
    // Query balance and totalSupply in History
    ////////////////

    /// @dev Queries the balance of `_owner` at a specific `_blockNumber`
    /// @param _owner The address from which the balance will be retrieved
    /// @param _blockNumber The block number when the balance is queried
    /// @return The balance at `_blockNumber`
    function balanceOfAt(address _owner, uint _blockNumber) public view
    returns (uint) {

        return getValueAt(_balances[_owner], _blockNumber);

    }

    /// @notice Total amount of tokens at a specific `_blockNumber`.
    /// @param _blockNumber The block number when the totalSupply is queried
    /// @return The total amount of tokens at `_blockNumber`
    function totalSupplyAt(uint _blockNumber) public view returns(uint) {

        return getValueAt(totalSupplyHistory, _blockNumber);

    }



    ////////////////
    // Generate and destroy tokens
    ////////////////

    /// @dev overwrite erc20 function
    /// @notice Generates `_value` tokens that are assigned to `_owner`
    /// @param _owner The address that will be assigned the new tokens
    /// @param _value The quantity of tokens generated
    /// @return True if the tokens are generated correctly
    function  _mint(address _account, uint256 _value) internal { //TODO check if it overwrites although variable names differ
        require(_account != address(0));
        //TODO use checks and safemath as it is used in other token contracts
        uint curTotalSupply = totalSupply();
        require(curTotalSupply + _value >= curTotalSupply); // Check for overflowgenerateTokens
        uint previousBalanceTo = balanceOf(_account);
        require(previousBalanceTo + _value >= previousBalanceTo); // Check for overflow
        updateValueAtNow(totalSupplyHistory, curTotalSupply + _value);
        updateValueAtNow(_balances[_account], previousBalanceTo + _value);
        emit Transfer(address(0), _account, _value);
    }


    //TODO _burn is missing!!!


    /// @dev This function makes it easy to get the total number of tokens
    /// @return The total number of tokens
    function totalSupply() public view returns (uint) {
        return totalSupplyAt(block.number);
    }

    ////////////////
    // Internal helper functions to query and set a value in a snapshot array
    ////////////////

    /// @dev `getValueAt` retrieves the number of tokens at a given block number
    /// @param checkpoints The history of values being queried
    /// @param _block The block number to retrieve the value at
    /// @return The number of tokens being queried
    function getValueAt(Checkpoint[] storage checkpoints, uint _block
    ) view internal returns (uint) {
        if (checkpoints.length == 0) return 0;

        // Shortcut for the actual value
        if (_block >= checkpoints[checkpoints.length-1].fromBlock)
            return checkpoints[checkpoints.length-1].value;
        if (_block < checkpoints[0].fromBlock) return 0;

        // Binary search of the value in the array
        uint min = 0;
        uint max = checkpoints.length-1;
        while (max > min) {
            uint mid = (max + min + 1)/ 2;
            if (checkpoints[mid].fromBlock<=_block) {
                min = mid;
            } else {
                max = mid-1;
            }
        }
        return checkpoints[min].value;
    }

    /// @dev `updateValueAtNow` used to update the `balances` map and the
    ///  `totalSupplyHistory`
    /// @param checkpoints The history of data being updated
    /// @param _value The new number of tokens
    function updateValueAtNow(Checkpoint[] storage checkpoints, uint _value
    ) internal  {
        if ((checkpoints.length == 0)
            || (checkpoints[checkpoints.length -1].fromBlock < block.number)) {
            Checkpoint storage newCheckPoint = checkpoints[ checkpoints.length++ ];
            newCheckPoint.fromBlock =  uint128(block.number);
            newCheckPoint.value = uint128(_value);
        } else {
            Checkpoint storage oldCheckPoint = checkpoints[checkpoints.length-1];
            oldCheckPoint.value = uint128(_value);
        }
    }

    /// @dev Internal function to determine if an address is a contract
    /// @param _addr The address being queried
    /// @return True if `_addr` is a contract
    function isContract(address _addr) view internal returns(bool) {
        uint size;
        if (_addr == address(0)) return false;
        assembly {
            size := extcodesize(_addr)
        }
        return size>0;
    }

    /// @dev Helper function to return a min betwen the two uints
    function min(uint a, uint b) pure internal returns (uint) { //TODO library?
        return a < b ? a : b;
    }

    /// @notice The fallback function: If the contract's controller has not been
    ///  set to 0, then the `proxyPayment` method is called which relays the
    ///  ether and creates tokens as described in the token controller contract
    function () external payable {

    }


}