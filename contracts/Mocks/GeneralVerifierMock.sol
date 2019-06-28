pragma solidity ^0.5.0;

import "../Interfaces/IVerifier.sol";

contract GeneralVerifierMock is IVerifier {
    function verifyIssue(address _tokenHolder, uint256 _value, bytes calldata _data) external view
    returns (bool allowed){
        return true;
    }

    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed){
        return false;
    }

    function verifyTransferFrom(address _from, address _to, address _spender, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed){
        return true;
    }

    function verifyRedeem(address _sender, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed){
        return true;
    }

    function verifyRedeemFrom(address _sender, address _tokenHolder, uint256 _amount, bytes calldata _data) external view
    returns (bool allowed){
        return true;
    }
}
