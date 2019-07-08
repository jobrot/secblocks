pragma solidity ^0.5.4;

//import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../Openzeppelin/Address.sol";

import "../Interfaces/IVerifier.sol";
import "../Roles/OrchestratorRole.sol";
import "./KYCVerifier.sol";
import "./PEPListVerifier.sol";
import "./InsiderListVerifier.sol";


/**
  A controlled Contract is an entity, that has multiple Verifiers implementing IVerifier, which can verify
  Transactions, issues etc. It must have exactly one KYC-, PEP- and an InsiderVerifier, as they are mandated
  by law, and might have an arbitrary number of additional verifiers, that are consulted sequentially on
  all operations. (This has to be done by the implementing Contract)
*/
contract Controller is OrchestratorRole {
    IVerifier[] public verifiers; // External verifier contract
    KYCVerifier public kycVerifier;
    InsiderListVerifier public insiderListVerifier;
    PEPListVerifier public pepListVerifier;

    event VerifierAdded(address verifier);
    event VerifierRemoved(address verifier);
    event KYCVerifierUpdated(address verifier);
    event InsiderListVerifierUpdated(address verifier);
    event PEPListVerifierUpdated(address verifier);

    // reenable constructor, if deployment without proxy is needed
    //    constructor(KYCVerifier _kycVerifier, InsiderListVerifier _insiderListVerifier, PEPListVerifier _pepListVerifier) public {
    //        kycVerifier = _kycVerifier;
    //        insiderListVerifier = _insiderListVerifier;
    //        pepListVerifier = _pepListVerifier;
    //    }


    /**
    * @notice Adds a Verifier contract to this contract.
    * @dev does not control for duplicate entries
    * @param _verifier Verifier contract address.
    */
    function addVerifier(IVerifier _verifier) external onlyOrchestrator {
        require(address(_verifier) != address(0), "Verifier address must not be a zero address.");
        require(Address.isContract(address(_verifier)), "Address must point to a contract.");
        verifiers.push(_verifier);
        emit VerifierAdded(address(_verifier));
    }

    /**
    * @notice Remove a Verifier contract from this contract.
    * @param _verifier Verifier contract address.
    */
    function removeVerifier(IVerifier _verifier) external onlyOrchestrator {
        require(address(_verifier) != address(0), "Verifier address must not be a zero address.");
        require(Address.isContract(address(_verifier)), "Address must point to a contract.");
        remove(_verifier);
    }


    function getVerifierCount() external view returns (uint) {
        return verifiers.length;
    }

    /**
     * @notice Set a KYC Verifier contract for this contract.
     * @param _verifier Verifier contract address.
    */
    function setKYCVerifier(KYCVerifier _verifier) external onlyOrchestrator {
        require(address(_verifier) != address(0), "Verifier address must not be a zero address.");
        require(Address.isContract(address(_verifier)), "Address must point to a contract.");
        kycVerifier = _verifier;
        emit KYCVerifierUpdated(address(_verifier));
    }

    /**
     * @notice Set a PEPList Verifier contract for this contract.
     * @param _verifier Verifier contract address.
    */
    function setPEPListVerifier(PEPListVerifier _verifier) external onlyOrchestrator {
        require(address(_verifier) != address(0), "Verifier address must not be a zero address.");
        require(Address.isContract(address(_verifier)), "Address must point to a contract.");
        pepListVerifier = _verifier;
        emit PEPListVerifierUpdated(address(_verifier));
    }

    /**
     * @notice Set a InsiderList Verifier contract for this contract.
     * @param _verifier Verifier contract address.
    */
    function setInsiderListVerifier(InsiderListVerifier _verifier) external onlyOrchestrator {
        require(address(_verifier) != address(0), "Verifier address must not be a zero address.");
        require(Address.isContract(address(_verifier)), "Address must point to a contract.");
        insiderListVerifier = _verifier;
        emit InsiderListVerifierUpdated(address(_verifier));
    }


    /**
        @dev removes a single verifier from the list of general verifiers in the contract
    */
    function remove(IVerifier _verifierToRemove) internal {
        require(verifiers.length > 0, "Verifiers list is empty.");
        uint i = 0;
        for (; i < verifiers.length; i++) {
            if (address(verifiers[i]) == address(_verifierToRemove)) {
                break;
            }
        }

        require(i != verifiers.length, "Verifier to remove is not in the verifiers list.");


        verifiers[i] = verifiers[verifiers.length - 1];


        verifiers.length--;
        emit VerifierRemoved(address(_verifierToRemove));


    }


    function verifyAllTransfer(address _from, address _to, uint _value, bytes calldata _data) external {
        bool verified;
        verified = kycVerifier.verifyTransfer(_from, _to, _value, _data);
        require(verified, "The transfer is not allowed by the KYCVerifier!");
        verified = insiderListVerifier.verifyTransfer(_from, _to, _value, _data);
        require(verified, "The transfer is not allowed by the InsiderListVerifier!");
        verified = pepListVerifier.verifyTransfer(_from, _to, _value, _data);
        require(verified, "The transfer is not allowed by the PoliticallyExposedPersonVerifier!");

        //this could be a problem, if there were enough complex verifiers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < verifiers.length; i++) {
            IVerifier verifier = IVerifier(address(verifiers[i]));
            verified = verifier.verifyTransfer(_from, _to, _value, _data);
            require(verified, "The transfer is not allowed by a general Verifier!");
        }
    }


    function verifyAllTransferFrom(address spender, address _from, address _to, uint _value, bytes calldata _data) external {
        bool verified;
        verified = kycVerifier.verifyTransferFrom(_from, _to, spender, _value, _data);
        require(verified, "The transfer is not allowed by the KYCVerifier!");
        verified = insiderListVerifier.verifyTransferFrom(_from, _to, spender, _value, _data);
        require(verified, "The transfer is not allowed by the InsiderListVerifier!");
        verified = pepListVerifier.verifyTransferFrom(_from, _to, spender, _value, _data);
        require(verified, "The transfer is not allowed by the PoliticallyExposedPersonVerifier!");

        //this could be a problem, if there were enough complex verifiers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < verifiers.length; i++) {
            IVerifier verifier = IVerifier(address(verifiers[i]));
            verified = verifier.verifyTransferFrom(_from, _to, spender, _value, _data);
            require(verified, "The transfer is not allowed by a general Verifier!");
        }
    }


    function verifyAllRedeem(address _sender, uint _value, bytes calldata _data) external {
        bool verified;
        verified = kycVerifier.verifyRedeem(_sender, _value, _data);
        require(verified, "The redeem is not allowed by the KYCVerifier!");
        verified = insiderListVerifier.verifyRedeem(_sender, _value, _data);
        require(verified, "The redeem is not allowed by the InsiderListVerifier!");
        verified = pepListVerifier.verifyRedeem(_sender, _value, _data);
        require(verified, "The redeem is not allowed by the PoliticallyExposedPersonVerifier!");

        //this could be a problem, if there were enough complex verifiers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < verifiers.length; i++) {
            IVerifier verifier = IVerifier(address(verifiers[i]));
            verified = verifier.verifyRedeem(_sender, _value, _data);
            require(verified, "The redeem is not allowed by a general Verifier!");
        }
    }


    function verifyAllRedeemFrom(address _sender, address _tokenholder, uint _value, bytes calldata _data) external {
        bool verified;
        verified = kycVerifier.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
        require(verified, "The redeem is not allowed by the KYCVerifier!");
        verified = insiderListVerifier.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
        require(verified, "The redeem is not allowed by the InsiderListVerifier!");
        verified = pepListVerifier.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
        require(verified, "The redeem is not allowed by the PoliticallyExposedPersonVerifier!");

        //this could be a problem, if there were enough complex verifiers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < verifiers.length; i++) {
            IVerifier verifier = IVerifier(address(verifiers[i]));
            verified = verifier.verifyRedeemFrom(_sender, _tokenholder, _value, _data);
            require(verified, "The redeem is not allowed by a general Verifier!");
        }
    }


    function verifyAllIssue( address _tokenholder, uint _value, bytes calldata _data) external {
        bool verified;
        verified = kycVerifier.verifyIssue(_tokenholder, _value, _data);
        require(verified, "The issue is not allowed by the KYCVerifier!");
        verified = insiderListVerifier.verifyIssue(_tokenholder, _value, _data);
        require(verified, "The issue is not allowed by the InsiderListVerifier!");
        verified = pepListVerifier.verifyIssue(_tokenholder, _value, _data);
        require(verified, "The issue is not allowed by the PoliticallyExposedPersonVerifier!");

        //this could be a problem, if there were enough complex verifiers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < verifiers.length; i++) {
            IVerifier verifier = IVerifier(address(verifiers[i]));
            verified = verifier.verifyIssue(_tokenholder, _value, _data);
            require(verified, "The issue is not allowed by a general Verifier!");
        }
    }


    function checkAllTransfer(address _from, address _to, uint _value, bytes calldata _data) external view returns(bool, bytes32) {
        bool verified;
        verified = kycVerifier.verifyTransfer(_from, _to, _value, _data);
        if(!verified) return (verified, bytes32("Not allowed by KYCVerifier!"));
        verified =  insiderListVerifier.verifyTransfer(_from, _to, _value, _data);
        if(!verified) return (verified, bytes32("Not allowed by InsiderVerifier!"));
        verified =  pepListVerifier.verifyTransfer(_from, _to, _value, _data);
        if(!verified) return (verified, bytes32("Not allowed by PEPVerifier!"));

        //this could be a problem, if there were enough complex verifiers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < verifiers.length; i++) {
            IVerifier verifier = IVerifier(address(verifiers[i]));
            verified = verifier.verifyTransfer(_from, _to, _value, _data);
            if(!verified) return (verified, bytes32("Not allowed by other Verifier!"));
        }
        return (verified, bytes32(""));
    }


    function checkAllTransferFrom(address spender, address _from, address _to, uint _value, bytes calldata _data) external view returns(bool, bytes32) {
        bool verified;
        verified = kycVerifier.verifyTransferFrom(_from, _to, spender, _value, _data);
        if(!verified) return (verified, bytes32("Not allowed by KYCVerifier!"));
        verified = insiderListVerifier.verifyTransferFrom(_from, _to, spender, _value, _data);
        if(!verified) return (verified, bytes32("Not allowed by InsiderVerifier!"));
        verified = pepListVerifier.verifyTransferFrom(_from, _to, spender, _value, _data);
        if(!verified) return (verified, bytes32("Not allowed by PEPVerifier!"));

        //this could be a problem, if there were enough complex verifiers to run out of gas, but in this case the whole point of the system would be already defeated
        for (uint i = 0; i < verifiers.length; i++) {
            IVerifier verifier = IVerifier(address(verifiers[i]));
            verified = verifier.verifyTransferFrom(_from, _to, spender, _value, _data);
            if(!verified) return (verified, bytes32("Not allowed by other Verifier!"));
        }
        return (verified, bytes32(""));
    }

}