pragma solidity ^0.5.0;


interface IVerifier {
    function verifyIssue(address _tokenHolder, uint256 _value, bytes calldata _data) external view
        returns (bool allowed);

    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external view 
        returns (bool allowed);

    function verifyTransferFrom(address _from, address _to, address _spender, uint256 _amount, bytes calldata _data) external view
        returns (bool allowed);

    function verifyRedeem(address _sender, uint256 _amount, bytes calldata _data) external view 
        returns (bool allowed);

    function verifyRedeemFrom(address _sender, address _tokenHolder, uint256 _amount, bytes calldata _data) external view
        returns (bool allowed);
}