// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./IntermediaryArbitrageStep.sol";
import "./LapExchangeInterface.sol";
import "./Step.sol";

import "hardhat/console.sol";

contract SwapRouteCoordinator {
    function startArbitrage(
        uint256 startAmount,
        address lapExchange,
        Step[] memory steps
    ) public returns (uint amountOut) {
        require(steps.length > 2, "Must have at least 3 steps");

        IERC20 tokenA = steps[0].token;
        IERC20 tokenB = steps[1].token;

        console.log("tokenA: %s", address(tokenA));
        console.log("tokenB: %s", address(tokenB));

        (address contractToCall, bytes memory callData) = LapExchangeInterface(
            lapExchange
        ).initialize(address(this), tokenA, tokenB, startAmount, steps);

        console.log("contractToCall: %s", contractToCall);

        // Perform swap
        tokenA.approve(contractToCall, startAmount);
        (bool success, bytes memory data) = contractToCall.call(callData);

        console.log("success: %s", success);

        require(success, "Swap operation failed");

        // Return amount of tokenB received
        IERC20 lastToken = steps[steps.length - 1].token;
        amountOut = lastToken.balanceOf(address(this));
    }

    function performArbitrage(uint256 startAmount, Step[] memory steps) public {
        for (uint i = 1; i < steps.length - 1; i++) {
            Step memory step = steps[i + 1];

            uint256 amount = steps[i].token.balanceOf(address(this)); // Get current balance of token, this way we can use any token as input
            console.log("amount: %s %s", amount, address(steps[i].token));
            // Prepare call data based on current step
            (address contractToCall, bytes memory callData) = step
                .intermediary
                .prepareStep(
                    address(this),
                    steps[i].token,
                    step.token,
                    amount,
                    step.data
                );

            // Perform swap
            steps[i].token.approve(contractToCall, amount);
            console.log(
                "Allowance: %s",
                steps[i].token.allowance(address(this), contractToCall)
            );
            console.log("contractToCall: %s", contractToCall);

            // (bool success, bytes memory data) = contractToCall.call(callData);

            address[] memory path = new address[](2);
            path[0] = address(steps[i].token);
            path[1] = address(step.token);

            IUniswapV2Router02 router = IUniswapV2Router02(contractToCall);
            try
                router.swapExactTokensForTokens(
                    amount,
                    0, // Accept any amount of output tokens
                    path,
                    address(this),
                    block.timestamp + 100
                )
            {
                // Successful execution code here
            } catch Error(string memory reason) {
                console.log("Error: %s", reason);
            }

            console.log(
                "Swapped! New balance: %s",
                step.token.balanceOf(address(this))
            );

            // console.log("intermediary success: %s", success);

            // require(success, "Swap operation failed");
        }
    }
}
