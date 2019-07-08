pragma solidity ^0.5.4;


/**
 * @dev For Contracts to be able to be deployed via a proxy, the setting of the resp. managing address (e.g. owner)
 * in the constructor must be circumvented, as all storage is lost when switching to the proxy, and the constructor
 * is not called again.
 */
contract Initializable {
    bool internal initialized=false;

    /**
     * @dev To be called in the process of proxy creation to re- set an owner/manager/controller
     */
    function initialize(address initialManager) external{
        require(!initialized, "Initializable is already initialized");
        initialized = true;
        _initialize(initialManager);
    }

    /**
    * @dev To be extended by Initializable Contracts, who need to set their respective managers in this functions
    */
    function _initialize(address _initialManager) internal;

}
