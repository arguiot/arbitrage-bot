// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

library FlashSwap {
    struct Route {
        address factory;
        bytes32 initCodeHash;
        address router;
        address token0;
        address token1;
    }
}