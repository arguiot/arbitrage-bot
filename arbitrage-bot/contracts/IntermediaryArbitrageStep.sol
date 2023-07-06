// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IntermediaryArbitrageStep {
    function prepareStep(
        address coordinator,
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amount,
        address data
    ) external returns (address contractToCall, bytes memory callData);
}
