pragma solidity ^0.5.0;

import "../Tokens/ERC1594.sol";

// mock class using ERC20, in order for the test class to be able to access internal functions
contract ERC1594Mock is ERC1594 {
    constructor(Controller _controller, TransferQueues _queues,  address initialAccount, uint256 initialBalance) ERC1594(_controller, _queues) public {
        _mint(initialAccount, initialBalance);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _burnFrom(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) public {
        _transfer(from, to, value);
    }

    function approveInternal(address owner, address spender, uint256 value) public {
        _approve(owner, spender, value);
    }
}