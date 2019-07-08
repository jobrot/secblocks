pragma solidity ^0.5.4;

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
        bytes32 proxyId,
        address proxyAddress
    );

    event ProxyAdded(
        bytes32 proxyId,
        address proxyAddress
    );

    event ProxyUpdated(
        bytes32 proxyId,
        address proxyAddress
    );

    /**
      @notice maps unique proxyIdentifiers to concrete Addresses of the proxy Contracts
      the Identifier consists of:
        * the type of contract this proxy contains, omitting "Verifier" (KYC, InsiderList, TransferQueues, VótingToken ...)
          das defined by name of the initially deployed Contract behind the proxy, as all future Contracts have to
          subtypes of this contract
        * if applicable, the company name, or other issuing Entity. This is only relevant for contracts that differ
          for different tokens, such as TransferQueues, the actual token contracts, insiderListVerifier and general
          Verifiers. It does not apply to PEPListVerifier, KYCVerifier and Libraries that might be proxied in future.
       The Parts of the identifier are Capitalized in CamelCase as given by the contracts and joined in the order given
       above. As the proxys themselves are never upgraded, version names are unnecessary.
    */
    mapping(bytes32 => ProxyStruct) public proxies;
    bytes32[] public proxyIdList;

    function exists(bytes32 proxyId) public view returns (bool) {
        return proxies[proxyId].exists;
    }

    function getProxyCount() external view returns (uint) {
        return proxyIdList.length;
    }


    function getProxyIdList() external view returns( bytes32[] memory){
        return proxyIdList;
    }

    /**
        @notice create a new Proxy with the id @param proxyId, for the exact form of the Id see above notice
      */
    function createProxy(bytes32 proxyId) external onlyOrchestrator returns (address proxyAddress){
        require(!exists(proxyId), "Proxy ID is already present in Registry");
        proxyAddress = address(new UnstructuredProxy(msg.sender));
        proxyIdList.push(proxyId);
        emit ProxyCreated(proxyId,proxyAddress);

        proxies[proxyId].proxyAddress = proxyAddress;
        proxies[proxyId].exists = true;
        return proxyAddress;
    }
    /**
        @notice add a preexisting proxy with the id @param proxyId to the registry by passing
        the address of the deployed proxy @param proxyAddress
      */
    function addProxy(bytes32 proxyId, address proxyAddress) external onlyOrchestrator returns (address){
        require(!exists(proxyId), "Proxy ID is already present in Registry");
        proxies[proxyId].proxyAddress = proxyAddress;
        proxies[proxyId].exists = true;
        emit ProxyAdded(proxyId,proxyAddress);
        return proxyAddress;
    }
    /**
        @dev this option should not really be needed in real world use, but as the registry is intended to
        last, it is prudent to have the possibility of upgrading
      */
    function updateProxy(bytes32 proxyId, address proxyAddress) external onlyOrchestrator {
        require(exists(proxyId), "Proxy ID does not exist in Registry");
        proxies[proxyId].proxyAddress = proxyAddress;
        emit ProxyUpdated(proxyId,proxyAddress);
    }
}
