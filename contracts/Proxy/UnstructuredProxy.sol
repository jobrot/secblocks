pragma solidity ^0.5.0;

contract UnstructuredProxy {
    bytes32 private constant ownerPosition = keccak256("secblocks.proxy.owner");
    bytes32 private constant implementationPosition = keccak256("secblocks.proxy.implementation");

    /**
    * @dev the constructor sets the owner
    */
    constructor() public {
        _setProxyOwner(msg.sender);
    }

     /**
     * @dev upgrades the contained implementation of the Contract
     * Attention! Upgraded contract must extend the original implementation
     * and follow the same storage layout (no switching of variables etc.)
     * Contract must be Initializable
    */
    function upgradeTo(address newImplementation) public onlyProxyOwner {
        address currentImplementation = implementation();
        require(currentImplementation != newImplementation);
        setImplementation(newImplementation);
        bytes memory payload = abi.encodeWithSignature("initialize(address)", msg.sender);
        address(this).call(payload);
    }

    /**
    * @dev returns position of the implementation
    */
    function implementation() public view returns (address impl) {
        bytes32 position = implementationPosition;
        assembly { impl := sload(position) }
    }

    /**
    * @dev sets position of the implementation
    */
    function setImplementation(address newImplementation) internal {
        bytes32 position = implementationPosition;
        assembly { sstore(position, newImplementation) }
    }

    /**
    * @dev sets new Proxy owner. ATTENTION! Removes the owner rights of the executing address!
    */
    function setProxyOwner(address newProxyOwner) public onlyProxyOwner {
        require(newProxyOwner!=address(0));
        _setProxyOwner(newProxyOwner);
    }

    /**
    * @dev sets position of the implementation
    */
    function proxyOwner() public view returns (address owner) {
        bytes32 position = ownerPosition;
        assembly { owner := sload(position) }
    }


    /**
     * @dev Fallback function allowing to perform a delegatecall to the given implementation.
    * This function will return whatever the implementation call returns
    * Is marked external, as it will be called mostly externally (only on upgrade internal call), to save gas.
    */
    function () payable external {
        address _impl = implementation();
        require(_impl != address(0));

        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize)
            let result := delegatecall(gas, _impl, ptr, calldatasize, 0, 0)
            let size := returndatasize
            returndatacopy(ptr, 0, size)

            switch result
            case 0 { revert(ptr, size) }
            default { return(ptr, size) }
        }
    }

    /**
    * @dev internal ownersetter
    */
    function _setProxyOwner(address newProxyOwner) internal {
        bytes32 position = ownerPosition;
        assembly { sstore(position, newProxyOwner) }
    }

    modifier onlyProxyOwner() {
        require (msg.sender == proxyOwner());
        _;
    }
}