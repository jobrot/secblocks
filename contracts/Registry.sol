pragma solidity ^0.5.0;

import "./Roles/OrchestratorRole.sol";
import "./Proxy/UnstructuredProxy.sol";
/**
   This is the single registry, that is used to create and manage proxies within the system. Clients can query this
  registry for the addresses to the proxies of all controllers and all security tokens by name.
*/
contract Registry is OrchestratorRole {


    struct ProxyStruct {
        address proxyAddress;
        bool exists;
    }

    event ProxyCreated(
        string proxyId,
        address proxyAddress
    );


    /**
      @notice maps unique proxyIdentifiers to concrete Addresses of the proxy Contracts
      the Identifier consists of:
        * the type of contract this proxy contains (KYCController, TransferQueues, VótingToken ...) as
          defined by name of the initially deployed Contract behind the proxy, as all future Contracts have to
          subtypes of this contract
        * if applicable, the company name, or other issuing Entity. This is only relevant for contracts that differ
          for different tokens, such as TransferQueues, the actual token contracts, insiderListController and general
          Controllers. It does not apply to PEPListController, KYCController and Libraries that might be proxied in future.
       The Parts of the identifier are Capitalized in CamelCase as given by the contracts and joined in the order given
       above. As the proxys themselves are never upgraded, version names are unnecessary.
    */
    mapping(string => ProxyStruct) public proxies;
    string[] public proxyIdList;

    function exists(string memory proxyId) public view returns (bool) {
        return proxies[proxyId].exists;
    }

    function getProxyCount() public view returns (uint) {
        return proxyIdList.length;
    }
    /**
        @notice create a new Proxy with the id @param proxyId, for the exact form of the Id see above notice
      */
    function createProxy(string memory proxyId) public onlyOrchestrator returns (address proxyAddress){
        require(!exists(proxyId), "Proxy ID is already present in Registry");
        proxyAddress = address(new UnstructuredProxy(msg.sender));

        emit ProxyCreated(proxyId,proxyAddress);

        proxies[proxyId].proxyAddress = proxyAddress;
        proxies[proxyId].exists = true;
        return proxyAddress;
        //address(0x33ccc2f306ea7a797c4b03b4c0e1a37eef2c7678a90c3e2ea9b6cbf864111111); //TODO
    }
    /**
        @notice add a preexisting proxy with the id @param proxyId to the registry by passing
        the address of the deployed proxy @param proxyAddress
      */
    function addProxy(string memory proxyId, address proxyAddress) public onlyOrchestrator returns (address){
        require(!exists(proxyId), "Proxy ID is already present in Registry");
        proxies[proxyId].proxyAddress = proxyAddress;
        proxies[proxyId].exists = true;
        return proxyAddress;
    }
    /**
        @dev this option should not really be needed in real world use, but as the registry is intended to
        last, it is prudent to have the possibility of upgrading
      */
    function updateProxy(string memory proxyId, address proxyAddress) public onlyOrchestrator {
        require(exists(proxyId), "Proxy ID does not exist in Registry");
        proxies[proxyId].proxyAddress = proxyAddress;
    }
}
