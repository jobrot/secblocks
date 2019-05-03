pragma solidity ^0.5.4;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "./IController.sol";
import "../Roles/OrchestratorRole.sol";


contract Controlled is OrchestratorRole{
    IController public controller; // External controller contract //TODO make multiple

    event ControllerUpdated(address controller);

    constructor(IController _controller) public {
        controller = _controller;
    }

    /**
    * @notice Links a Controller contract to this contract.
    * @param _controller Controller contract address.
    */
    function setController(IController _controller) external onlyOrchestrator  { //TODO! nicht onlycontroller, das hier braucht eine neue rolle, administrator, order orchestrator oder so, derjenige, der alle verknüpft (diese rolle ist dann pro vertrag fast wie der owner, also doch vlt eher owner?
        require(address(controller) != address(0), "Controller address must not be a zero address.");
        require(Address.isContract(address(_controller)), "Address must point to a contract.");
        controller = _controller;
        emit ControllerUpdated(address(_controller));
    }
}