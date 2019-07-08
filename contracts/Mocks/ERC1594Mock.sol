pragma solidity ^0.5.4;

import "../Tokens/ERC1594.sol";

// mock class using ERC20, in order for the test class to be able to access internal functions
contract ERC1594Mock is ERC1594 {

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _burnFrom(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) external {
        _transfer(from, to, value);
    }

    function approveInternal(address owner, address spender, uint256 value) external {
        _approve(owner, spender, value);
    }
}