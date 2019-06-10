pragma solidity ^0.5.0;
//Source of basic Queue: https://programtheblockchain.com/posts/2018/03/23/storage-patterns-stacks-queues-and-deques/
contract TransferQueue {
//    struct TimestampedTransfer{
//        uint timestamp;
//        uint amount;
//    }

    mapping(uint => uint) timestampQueue;
    mapping(uint => uint) amountQueue;
    uint first = 1;
    uint last = 0;

    function enqueue(uint timestamp, uint amount) public {
        last += 1;
        timestampQueue[last] = timestamp;
        amountQueue[last] = amount;
    }

    function dequeue() public returns (uint timestamp, uint amount) {
        require(last >= first, "TransferQueue: dequeue called on empty Queue");  // non-empty queue

        timestamp = timestampQueue[first];
        amount = amountQueue[first];

        delete timestampQueue[first];
        delete amountQueue[first];
        first += 1;
    }

    function peek() public returns (uint timestamp, uint amount) {
        require(last >= first, "TransferQueue: peek called on empty Queue");  // non-empty queue

        timestamp = timestampQueue[first];
        amount = amountQueue[first];
    }

    function empty() public returns (bool) {
        return last<first;
    }

    function sumOfTransfers() public returns (uint sum) {
        sum = 0;
        for(uint i = first; i<=last; i++){
            sum+=amountQueue[i]; //TODO safemath
        }
    }

}