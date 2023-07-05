// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Step.sol";

interface LapExchangeInterface {
    /// @notice Initializes the exchange
    /// @dev This function should be called by the coordinator contract, it will initialize the flash swap, and re-route the call to the coordinator for performing the arbitrage. It also handles the repayments.
    /// @param coordinator The address of the coordinator contract
    /// @param tokenA The token to start with
    /// @param tokenB The token to end with
    /// @param amount The amount of tokenA to start with
    /// @param steps The steps to take to get from tokenA to tokenB
    /// @return contractToCall The address of the contract to call
    /// @return callData The data to call the contract with
    function initialize(
        address coordinator,
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amount,
        Step[] calldata steps
    ) external returns (address contractToCall, bytes memory callData);
}
