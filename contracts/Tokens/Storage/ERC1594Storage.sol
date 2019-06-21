pragma solidity ^0.5.0;


import "../../AML/TransferQueues.sol";
import "../../Controlling/Controller.sol";

contract ERC1594Storage {
    // Variable which tells whether issuance is ON or OFF forever
    // Implementers need to implement one more function to reset the value of `issuance` variable
    // to false. That function is not a part of the standard (EIP-1594) as it is depend on the various factors
    // issuer, followed compliance rules etc. So issuers have the choice how they want to close the issuance.
    bool internal issuance = true; //TODO

    // Variable that stores stores a mapping of the last transfers of the account
    // in order to comply with AML regulations
    // @dev maps each address to an array of dynamic length, that consists a struct of the timestamp and
    // the value of the outbound funds (counted in number of tokens, value must be determined on check (todo or not, check immediately at entering?)
    //mapping (address => TransferQueue) lastTransfers;
    TransferQueues queues;

    // The single controller that is to be queried before all token moving actions on the respective functions
    Controller controller;
}
