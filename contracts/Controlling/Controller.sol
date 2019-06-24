pragma solidity ^0.5.4;

//import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../Openzeppelin/Address.sol";

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
contract Controller is OrchestratorRole {
    IController[] public controllers; // External controller contract
    KYCController public kycController;
    InsiderListController public insiderListController;
    PEPListController public pepListController;

    event ControllerAdded(address controller);
    event ControllerRemoved(address controller);
    event KYCControllerUpdated(address controller);
    event InsiderListControllerUpdated(address controller);
    event PEPListControllerUpdated(address controller);

    // reenable constructor, if deployment without proxy is needed
    //    constructor(KYCController _kycController, InsiderListController _insiderListController, PEPListController _pepListController) public {
    //        kycController = _kycController;
    //        insiderListController = _insiderListController;
    //        pepListController = _pepListController;
    //    }


    /**
    * @notice Adds a Controller contract to this contract.
    * @dev does not control for duplicate entries
    * @param _controller Controller contract address.
    */
    function addController(IController _controller) external onlyOrchestrator {
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
    }


    function getControllerCount() public view returns (uint) {
        return controllers.length;
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
    function remove(IController _controllerToRemove) internal {
        require(controllers.length > 0, "Controllers list is empty.");
        uint i = 0;
        for (; i < controllers.length; i++) {
            if (address(controllers[i]) == address(_controllerToRemove)) {
                break;
            }
        }

        require(i != controllers.length, "Controller to remove is not in the controllers list.");


        controllers[i] = controllers[controllers.length - 1];


        controllers.length--;
        emit ControllerRemoved(address(_controllerToRemove));


    }


    function verifyAllTransfer(address _from, address _to, uint _value, bytes memory _data) public {
        bool verified;
        verified = kycController.verifyTransfer(_from, _to, _value, _data);
        require(verified, "The transfer is not allowed by the KYCController!");
        verified = insiderListController.verifyTransfer(_from, _to, _value, _data);
        require(verified, "The transfer is not allowed by the InsiderListController!");
        verified = pepListController.verifyTransfer(_from, _to, _value, _data);
        require(verified, "The transfer is not allowed by the PoliticallyExposedPersonController!");

        //this could be a problem, if there were enough complex controllers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < controllers.length; i++) {
            IController controller = IController(address(controllers[i]));
            verified = controller.verifyTransfer(_from, _to, _value, _data);
            require(verified, "The transfer is not allowed by a general Controller!");
        }
    }


    function verifyAllTransferFrom(address spender, address _from, address _to, uint _value, bytes memory _data) public {
        bool verified;
        verified = kycController.verifyTransferFrom(_from, _to, spender, _value, _data);
        require(verified, "The transfer is not allowed by the KYCController!");
        verified = insiderListController.verifyTransferFrom(_from, _to, spender, _value, _data);
        require(verified, "The transfer is not allowed by the InsiderListController!");
        verified = pepListController.verifyTransferFrom(_from, _to, spender, _value, _data);
        require(verified, "The transfer is not allowed by the PoliticallyExposedPersonController!");

        //this could be a problem, if there were enough complex controllers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < controllers.length; i++) {
            IController controller = IController(address(controllers[i]));
            verified = controller.verifyTransferFrom(_from, _to, spender, _value, _data);
            require(verified, "The transfer is not allowed by a general Controller!");
        }
    }


    function verifyAllRedeem(address _sender, uint _value, bytes memory _data) public {
        bool verified;
        verified = kycController.verifyRedeem(_sender, _value, _data);
        require(verified, "The redeem is not allowed by the KYCController!");
        verified = insiderListController.verifyRedeem(_sender, _value, _data);
        require(verified, "The redeem is not allowed by the InsiderListController!");
        verified = pepListController.verifyRedeem(_sender, _value, _data);
        require(verified, "The redeem is not allowed by the PoliticallyExposedPersonController!");

        //this could be a problem, if there were enough complex controllers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < controllers.length; i++) {
            IController controller = IController(address(controllers[i]));
            verified = controller.verifyRedeem(_sender, _value, _data);
            require(verified, "The redeem is not allowed by a general Controller!");
        }
    }


    function verifyAllRedeemFrom(address _sender, address _tokenholder, uint _value, bytes memory _data) public {
        bool verified;
        verified = kycController.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
        require(verified, "The redeem is not allowed by the KYCController!");
        verified = insiderListController.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
        require(verified, "The redeem is not allowed by the InsiderListController!");
        verified = pepListController.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
        require(verified, "The redeem is not allowed by the PoliticallyExposedPersonController!");

        //this could be a problem, if there were enough complex controllers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < controllers.length; i++) {
            IController controller = IController(address(controllers[i]));
            verified = controller.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
            require(verified, "The redeem is not allowed by a general Controller!");
        }
    }


    function verifyAllIssue( address _tokenholder, uint _value, bytes memory _data) public {
        bool verified;
        verified = kycController.verifyIssue(_tokenholder, _value, _data);
        require(verified, "The issue is not allowed by the KYCController!");
        verified = insiderListController.verifyIssue(_tokenholder, _value, _data);
        require(verified, "The issue is not allowed by the InsiderListController!");
        verified = pepListController.verifyIssue(_tokenholder, _value, _data);
        require(verified, "The issue is not allowed by the PoliticallyExposedPersonController!");

        //this could be a problem, if there were enough complex controllers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < controllers.length; i++) {
            IController controller = IController(address(controllers[i]));
            verified = controller.verifyIssue(_tokenholder, _value, _data);
            require(verified, "The issue is not allowed by a general Controller!");
        }
    }

}