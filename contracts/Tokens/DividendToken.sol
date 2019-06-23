pragma solidity ^0.5.0;

import "../Openzeppelin/SafeMath.sol";
import "./ERC1594.sol";
import "../Libraries/UIntConverterLib.sol";
import "../Libraries/SafeMathInt.sol";

/**
 * This is an adaptation of the standard implementation of the Dividend Paying Token Standard
 * https://github.com/ethereum/EIPs/issues/1726
 * @notice this Token corresponds to preferred Securities, that do not allow voting but gather more regular dividends
*/
contract DividendToken is ERC1594 {
    using SafeMath for uint;
    using SafeMathInt for int;
    using UIntConverterLib for uint;


    // Event to inform holders of new Distribution of dividends
    event DividendsDistributed(
        address indexed from,
        uint256 weiAmount
    );

    // Event to inform holders of new Distribution of dividends
    event DividendWithdrawn(
        address indexed to,
        uint256 weiAmount
    );


    // With `magnitude`, we can properly distribute dividends even if the amount of received ether is small.
    // For more discussion about choosing the value of `magnitude`,
    //  see https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728
    uint constant internal magnitude = 2**128;

    uint internal magnifiedDividendPerShare;

    // About dividendCorrection:
    // If the token balance of a `_user` is never changed, the dividend of `_user` can be computed with:
    //   `dividendOf(_user) = dividendPerShare * balanceOf(_user)`.
    // When `balanceOf(_user)` is changed (via minting/burning/transferring tokens),
    //   `dividendOf(_user)` should not be changed,
    //   but the computed value of `dividendPerShare * balanceOf(_user)` is changed.
    // To keep the `dividendOf(_user)` unchanged, we add a correction term:
    //   `dividendOf(_user) = dividendPerShare * balanceOf(_user) + dividendCorrectionOf(_user)`,
    //   where `dividendCorrectionOf(_user)` is updated whenever `balanceOf(_user)` is changed:
    //   `dividendCorrectionOf(_user) = dividendPerShare * (old balanceOf(_user)) - (new balanceOf(_user))`.
    // So now `dividendOf(_user)` returns the same value before and after `balanceOf(_user)` is changed.
    mapping(address => int) internal magnifiedDividendCorrections;
    mapping(address => uint) internal withdrawnDividends;


    /*constructor(Controller _controller, TransferQueues _queues) ERC1594( _controller, _queues) public { //The super contract is a modifier of sorts of the constructor

    }*/


    /// @dev Distributes dividends whenever ether is paid to this contract.
    function() external payable {
        distributeDividends();
    }
    /**
     * @notice Distributes ether to token holders as dividends.
     * @dev It reverts if the total supply of tokens is 0.
     * It emits the `DividendsDistributed` event if the amount of received ether is greater than 0.
     * About undistributed ether:
     *   In each distribution, there is a small amount of ether not distributed,
     *     the magnified amount of which is
     *     `(msg.value * magnitude) % totalSupply()`.
     *   With a well-chosen `magnitude`, the amount of undistributed ether
     *     (de-magnified) in a distribution can be less than 1 wei.
     *   We can actually keep track of the undistributed ether in a distribution
     *     and try to distribute it in the next distribution,
     *     but keeping track of such data on-chain costs much more than
     *     the saved ether, so we don't do that.
    */
    function distributeDividends() public payable { //TODO rework
        require(totalSupply() > 0, "DividendToken: There are no Tokens currently owned");

        if (msg.value > 0) {
            magnifiedDividendPerShare = magnifiedDividendPerShare.add(
                (msg.value).mul(magnitude) / totalSupply()
            );
            emit DividendsDistributed(msg.sender, msg.value);
        }
    }
    /**
     * @notice Withdraws the ether distributed to the sender.
     * @dev It emits a `DividendWithdrawn` event if the amount of withdrawn ether is greater than 0.
    */
    function withdrawDividend() public {
        uint _withdrawableDividend = withdrawableDividendOf(msg.sender);
        if (_withdrawableDividend > 0) {
            withdrawnDividends[msg.sender] = withdrawnDividends[msg.sender].add(_withdrawableDividend);
            emit DividendWithdrawn(msg.sender, _withdrawableDividend);
            (msg.sender).transfer(_withdrawableDividend);
        }
    }
    /**
    * @notice View the amount of dividend in wei that an address can withdraw.
    * @param _owner The address of a token holder.
    * @return The amount of dividend in wei that `_owner` can withdraw.
    */
    function dividendOf(address _owner) public view returns(uint) {
        return withdrawableDividendOf(_owner);
    }

    /**
    * @notice View the amount of dividend in wei that an address can withdraw.
    * @param _owner The address of a token holder.
    * @return The amount of dividend in wei that `_owner` can withdraw.
    */
    function withdrawableDividendOf(address _owner) public view returns(uint) {
        return accumulativeDividendOf(_owner).sub(withdrawnDividends[_owner]);
    }

    /**
    * @notice View the amount of dividend in wei that an address has withdrawn.
    * @param _owner The address of a token holder.
    * @return The amount of dividend in wei that `_owner` has withdrawn.
    */
    function withdrawnDividendOf(address _owner) public view returns(uint) {
        return withdrawnDividends[_owner];
    }

    /**
     * @notice View the amount of dividend in wei that an address has earned in total.
     * @dev accumulativeDividendOf(_owner) = withdrawableDividendOf(_owner) + withdrawnDividendOf(_owner)
     * = (magnifiedDividendPerShare * balanceOf(_owner) + magnifiedDividendCorrections[_owner]) / magnitude
     * @param _owner The address of a token holder.
     * @return The amount of dividend in wei that `_owner` has earned in total.
    */
    function accumulativeDividendOf(address _owner) public view returns(uint) {
        return magnifiedDividendPerShare.mul(balanceOf(_owner)).toIntSafe()
        .add(magnifiedDividendCorrections[_owner]).toUintSafe() / magnitude;
    }

    /**
     * @dev transfers with regard to the dividend corrections, overrides super function
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function transferWithData(address _to, uint256 _value, bytes memory _data) public {

        super.transferWithData( _to, _value, _data);

        int magCorrection = magnifiedDividendPerShare.mul(_value).toIntSafe();
        magnifiedDividendCorrections[msg.sender] = magnifiedDividendCorrections[msg.sender].add(magCorrection);
        magnifiedDividendCorrections[_to] = magnifiedDividendCorrections[_to].sub(magCorrection);
    }

    /**
     * @dev transfers using the allowance for another address with regard to the dividend corrections,
     * overrides super and calls it
     * @param _from The address to transfer from.
     * @param _to The address to transfer to.
     * @param _value The amount to be transferred.
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function transferFromWithData(address _from, address _to, uint _value, bytes memory _data) public {
        super.transferFromWithData(_from, _to, _value, _data);

        int magCorrection = magnifiedDividendPerShare.mul(_value).toIntSafe();
        magnifiedDividendCorrections[_from] = magnifiedDividendCorrections[_from].add(magCorrection);
        magnifiedDividendCorrections[_to] = magnifiedDividendCorrections[_to].sub(magCorrection);
    }

    /**
     * @dev function that issues tokens to an account.
     * Updates magnifiedDividendCorrections to keep dividends unchanged.
     * @param _tokenHolder The account that will receive the created tokens.
     * @param _value The amount that will be created.
     * @param _data The `bytes _data` allows arbitrary data to be submitted alongside the transfer.
     */
    function issue(address _tokenHolder, uint _value, bytes memory _data) public onlyIssuer {
        super.issue(_tokenHolder, _value, _data);

        magnifiedDividendCorrections[_tokenHolder] = magnifiedDividendCorrections[_tokenHolder]
        .sub( (magnifiedDividendPerShare.mul(_value)).toIntSafe() );
    }





    /**
     * @notice This function redeems an amount of the token of a msg.sender.
     * @dev overrides and calls the super implementation
     * @param _value The amount of tokens to be redeemed
     * @param _data The `bytes _data` it can be used in the token contract to authenticate the redemption.
     */
    function redeem(uint _value, bytes memory _data) public {
        super.redeem(_value, _data);
        magnifiedDividendCorrections[msg.sender] = magnifiedDividendCorrections[msg.sender]
        .add( (magnifiedDividendPerShare.mul(_value)).toIntSafe() );
    }

    /**
     * @notice This function redeems an amount of the token of a msg.sender.
     * @dev It is an analogy to `transferFrom`, and overrides the method in the super contract to hide it
     * in order to enforce usage of this method that is aware of the dividend corrections
     * @param _tokenHolder The account whose tokens gets redeemed.
     * @param _value The amount of tokens to be redeemed
     * @param _data The `bytes _data` that can be used in the super token contract to authenticate the redemption.
     */
    function redeemFrom(address _tokenHolder, uint _value, bytes memory _data) public {
        super.redeemFrom(_tokenHolder, _value, _data);

        magnifiedDividendCorrections[_tokenHolder] = magnifiedDividendCorrections[_tokenHolder]
        .add( (magnifiedDividendPerShare.mul(_value)).toIntSafe() );

    }

    //@dev internal function to convert uints to ints safely
/*    function toIntSafe(uint256 a) internal pure returns (int256) {
        int256 b = int256(a);
        require(b >= 0);
        return b;
    }*/

}