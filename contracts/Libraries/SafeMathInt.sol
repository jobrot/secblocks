pragma solidity ^0.5.0;

library SafeMathInt {
    function sub(int256 a, int256 b) internal pure returns (int256) {
        require((b >= 0 && a - b <= a) || (b < 0 && a - b > a));

        return a - b;
    }

    function add(int256 a, int256 b) internal pure returns (int256) {
        int256 c = a + b;
        require((b >= 0 && c >= a) || (b < 0 && c < a));
        return c;
    }

    function toUintSafe(int256 a) internal pure returns (uint256) {
        require(a >= 0);
        return uint256(a);
    }
}
