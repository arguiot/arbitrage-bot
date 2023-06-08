// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';
import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';

contract CoordinateUniswapV2 is IUniswapV2Callee {
    address public factory1;
    address public factory2;
    IUniswapV2Router02 public router1;
    IUniswapV2Router02 public router2;

    constructor(address _factory1, address _factory2, address _router1, address _router2) public {
        factory1 = _factory1;
        factory2 = _factory2;
        router1 = IUniswapV2Router02(_router1);
        router2 = IUniswapV2Router02(_router2);
    }

    function setFactoriesAndRouters(address _factory1, address _factory2, address _router1, address _router2) external {
        factory1 = _factory1;
        factory2 = _factory2;
        router1 = IUniswapV2Router02(_router1);
        router2 = IUniswapV2Router02(_router2);
    }

    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        address[] memory path = new address[](2);
        uint amountIn;
        uint amountOutMin;
        { // scope for token{0,1}, avoids stack too deep errors
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            assert(msg.sender == UniswapV2Library.pairFor(factory1, token0, token1)); // ensure that msg.sender is a V2 pair from factory1
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            path[0] = amount0 == 0 ? token0 : token1;
            path[1] = amount0 == 0 ? token1 : token0;
            amountIn = amount0 == 0 ? amount1 : amount0;
        }

        (address _factory2, uint _amountOutMin) = abi.decode(data, (address, uint)); // decode the data parameter
        factory2 = _factory2; // update the factory2 address
        amountOutMin = _amountOutMin; // set the minimum amount of tokens to receive in the second swap

        // Approve the router2 to spend the received tokens
        IERC20(path[0]).approve(address(router2), amountIn);

        // Perform the swap on the second DEX
        router2.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp
        );

        // Calculate the amount of tokens required to repay the flash loan
        uint amountRequired = UniswapV2Library.getAmountsIn(factory1, amountIn, path)[0];

        // Transfer the required amount of tokens back to the V2 pair (msg.sender) to repay the flash loan
        IERC20(path[1]).transfer(msg.sender, amountRequired);

        // Transfer the remaining tokens (profit) to the sender (arbitrage bot)
        uint profit = IERC20(path[1]).balanceOf(address(this));
        IERC20(path[1]).transfer(sender, profit);
    }
}
