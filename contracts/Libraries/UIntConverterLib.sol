pragma solidity ^0.5.0;

library UIntConverterLib {
    function toIntSafe(uint256 a) internal pure returns (int256) {
        int256 b = int256(a);
        require(b >= 0);
        return b;
    }
}
