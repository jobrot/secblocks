pragma solidity ^0.5.0;


interface IController {
    function verifyIssue(address _tokenHolder, uint256 _value, bytes calldata _data) external view
        returns (bool allowed, byte statusCode);

    function verifyTransfer(address _from, address _to, uint256 _amount, bytes calldata _data) external view 
        returns (bool allowed, byte statusCode);

    function verifyTransferFrom(address _from, address _to, address _forwarder, uint256 _amount, bytes calldata _data) external view
        returns (bool allowed, byte statusCode);

    function verifyRedeem(address _sender, uint256 _amount, bytes calldata _data) external view 
        returns (bool allowed, byte statusCode);

    function verifyRedeemFrom(address _sender, address _tokenHolder, uint256 _amount, bytes calldata _data) external view
        returns (bool allowed, byte statusCode);
}