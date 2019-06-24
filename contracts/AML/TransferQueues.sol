pragma solidity ^0.5.0;
import "../Openzeppelin/SafeMath.sol";


contract TransferQueues {
    using SafeMath for uint256;

    struct TransferQueue{
        mapping(uint => uint) timestampQueue;
        mapping(uint => uint) amountQueue;
        uint first;// = 1;
        uint last;// = 0;
    }

    mapping (address => TransferQueue) queues;

    function enqueue(address user, uint timestamp, uint amount) public {
        if(queues[user].first==0){ //uninitialized
            queues[user].first=1;
            queues[user].last=0;
        }
        queues[user].last += 1;
        queues[user].timestampQueue[queues[user].last] = timestamp;
        queues[user].amountQueue[queues[user].last] = amount;
    }

    function dequeue(address user) public returns ( uint timestamp, uint amount) {
        require(queues[user].last >= queues[user].first, "TransferQueue: dequeue called on empty Queue");  // non-empty queue

        timestamp = queues[user].timestampQueue[queues[user].first];
        amount = queues[user].amountQueue[queues[user].first];

        delete queues[user].timestampQueue[queues[user].first];
        delete queues[user].amountQueue[queues[user].first];
        queues[user].first += 1;
    }

    function peek(address user) public returns (uint timestamp, uint amount) {
        require(queues[user].last >= queues[user].first, "TransferQueue: peek called on empty Queue");  // non-empty queue

        timestamp = queues[user].timestampQueue[queues[user].first];
        amount = queues[user].amountQueue[queues[user].first];
    }

    function empty(address user) public returns (bool) {
        return queues[user].last<queues[user].first;
    }

    function sumOfTransfers(address user) public returns (uint sum) {
        sum = 0;
        for(uint i = queues[user].first; i<=queues[user].last; i++){
            sum= sum.add(queues[user].amountQueue[i]);
        }
    }

}