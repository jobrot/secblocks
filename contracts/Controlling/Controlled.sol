pragma solidity ^0.5.4;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../Interfaces/IController.sol";
import "../Roles/OrchestratorRole.sol";
import "./KYCController.sol";
import "./PEPListController.sol";
import "./InsiderListController.sol";
/**
  A controlled Contract is an entity, that has multiple Controllers implementing IController, which can verify
  Transactions, issues etc. It must have exactly one KYC-, PEP- and an InsiderController, as they are mandated
  by law, and might have an arbitrary number of additional controllers, that are consulted sequentially on
  all operations. (This has to be done by the implementing Contract)
*/
contract Controlled is OrchestratorRole {
    IController[] public controllers; // External controller contract //TODO make multiple
    KYCController public kycController;
    InsiderListController public insiderListController;
    PEPListController public pepListController;


    event ControllerAdded(address controller);
    event ControllerRemoved(address controller);
    event KYCControllerUpdated(address controller);
    event InsiderListControllerUpdated(address controller);
    event PEPListControllerUpdated(address controller);

    constructor(KYCController _kycController, InsiderListController _insiderListController, PEPListController _pepListController) public {
        kycController = _kycController;
        insiderListController = _insiderListController;
        pepListController = _pepListController;
    }

    /**
    * @notice Adds a Controller contract to this contract.
    * @param _controller Controller contract address.
    */
    function addController(IController _controller) external onlyOrchestrator {//TODO what happens, when i put a contract that isnt IController?? If it doesnt matter, remove all functions for specific controllers below
        require(address(_controller) != address(0), "Controller address must not be a zero address.");
        require(Address.isContract(address(_controller)), "Address must point to a contract.");
        controllers.push(_controller);
        emit ControllerAdded(address(_controller));
    }

    /**
    * @notice Remove a Controller contract from this contract.
    * @param _controller Controller contract address.
    */
    function removeController(IController _controller) external onlyOrchestrator {
        require(address(_controller) != address(0), "Controller address must not be a zero address.");
        require(Address.isContract(address(_controller)), "Address must point to a contract.");
        remove(_controller);
        emit ControllerRemoved(address(_controller));
    }

    /**
     * @notice Set a KYC Controller contract for this contract.
     * @param _controller Controller contract address.
    */
    function setKYCController(KYCController _controller) external onlyOrchestrator {
        require(address(_controller) != address(0), "Controller address must not be a zero address.");
        require(Address.isContract(address(_controller)), "Address must point to a contract.");
        kycController = _controller;
        emit KYCControllerUpdated(address(_controller));
    }

    /**
     * @notice Set a PEPList Controller contract for this contract.
     * @param _controller Controller contract address.
    */
    function setPEPListController(PEPListController _controller) external onlyOrchestrator {
        require(address(_controller) != address(0), "Controller address must not be a zero address.");
        require(Address.isContract(address(_controller)), "Address must point to a contract.");
        pepListController = _controller;
        emit PEPListControllerUpdated(address(_controller));
    }

    /**
     * @notice Set a InsiderList Controller contract for this contract.
     * @param _controller Controller contract address.
    */
    function setInsiderListController(InsiderListController _controller) external onlyOrchestrator {
        require(address(_controller) != address(0), "Controller address must not be a zero address.");
        require(Address.isContract(address(_controller)), "Address must point to a contract.");
        insiderListController = _controller;
        emit InsiderListControllerUpdated(address(_controller));
    }


    /**
        @dev removes a single controller from the list of general controllers in the contract
    */
    function remove(IController _controllerToRemove) internal {//TODO test this, also with empty list
        uint i = 0;
        while (controllers[i] != _controllerToRemove) {
            i++;
        }
        require(i != controllers.length, "Controller to remove is not in the controllers list.");
        while (i < controllers.length - 1) {
            controllers[i] = controllers[i + 1];
            i++;
        }
        delete controllers[controllers.length - 1];
        controllers.length--;
    }


}