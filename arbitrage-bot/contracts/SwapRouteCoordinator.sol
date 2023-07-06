// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "./IntermediaryArbitrageStep.sol";
import "./LapExchangeInterface.sol";
import "./Step.sol";

import "hardhat/console.sol";

contract SwapRouteCoordinator {
    event Arbitrage(uint256 amountOut);

    function initiateArbitrage(
        uint256 startAmount,
        address lapExchange,
        address[] memory intermediaries,
        address[] memory tokens,
        address[] memory data
    ) public returns (uint amountOut) {
        require(
            intermediaries.length == tokens.length &&
                tokens.length == data.length,
            "Input arrays length mismatch"
        );

        // Call startArbitrage with constructed steps array
        amountOut = startArbitrage(
            startAmount,
            lapExchange,
            intermediaries,
            tokens,
            data
        );
    }

    function startArbitrage(
        uint256 startAmount,
        address lapExchange,
        address[] memory intermediaries,
        address[] memory tokens,
        address[] memory data
    ) internal returns (uint amountOut) {
        require(intermediaries.length > 2, "Must have at least 3 steps");

        (address contractToCall, bytes memory callData) = LapExchangeInterface(
            lapExchange
        ).initialize(startAmount, intermediaries, tokens, data);

        console.log("contractToCall: %s", contractToCall);

        // Perform swap
        IERC20(tokens[0]).approve(contractToCall, startAmount);
        (bool success, bytes memory returnData) = contractToCall.call(callData);

        require(success, "Swap operation failed");

        // Return amount of tokenB received
        IERC20 lastToken = IERC20(tokens[tokens.length - 1]);
        amountOut = lastToken.balanceOf(address(this));

        emit Arbitrage(amountOut);
    }

    function performArbitrage(
        address[] memory intermediaries,
        address[] memory tokens,
        address[] memory data
    ) public {
        for (uint i = 1; i < tokens.length - 1; i++) {
            uint256 amount = IERC20(tokens[i]).balanceOf(address(this)); // Get current balance of token, this way we can use any token as input
            console.log("amount: %s %s", amount, tokens[i]);
            // Prepare call data based on current step
            (
                address contractToCall,
                bytes memory callData
            ) = IntermediaryArbitrageStep(intermediaries[i + 1]).prepareStep(
                    address(this),
                    IERC20(tokens[i]),
                    IERC20(tokens[i + 1]),
                    amount,
                    data[i + 1]
                );

            // Perform swap
            IERC20(tokens[i]).approve(contractToCall, amount);
            console.log(
                "Allowance: %s",
                IERC20(tokens[i]).allowance(address(this), contractToCall)
            );
            console.log("contractToCall: %s", contractToCall);

            (bool success, bytes memory outdata) = contractToCall.call(
                callData
            );

            require(success, "Inter-Swap operation failed");

            // address[] memory path = new address[](2);
            // path[0] = tokens[i];
            // path[1] = tokens[i + 1];

            // IUniswapV2Router02 router = IUniswapV2Router02(contractToCall);
            // try
            //     router.swapExactTokensForTokens(
            //         amount,
            //         0, // Accept any amount of output tokens
            //         path,
            //         address(this),
            //         block.timestamp + 100
            //     )
            // {
            //     // Successful execution code here
            // } catch Error(string memory reason) {
            //     console.log("Error: %s", reason);
            // }

            console.log(
                "Swapped! New balance: %s",
                IERC20(tokens[i + 1]).balanceOf(address(this))
            );

            // console.log("intermediary success: %s", success);

            // require(success, "Swap operation failed");
        }
    }

    function repay(address token, uint256 amount, address destination) public {
        IERC20(token).transfer(destination, amount);
    }
}
