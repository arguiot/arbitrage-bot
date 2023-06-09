// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol';
import '@uniswap/v2-core/contracts/interfaces/IERC20.sol';
import '@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol';
import "@openzeppelin/contracts/utils/Strings.sol";

contract CoordinateUniswapV2 is IUniswapV2Callee {
    using Strings for uint256;

    address public factory1;
    address public factory2;
    IUniswapV2Router02 public router1;
    IUniswapV2Router02 public router2;

    constructor() public {}

    function performFlashSwap(
        address _factory1,
        address _factory2,
        address _router1,
        address _router2,
        address token0,
        address token1,
        uint amountBetween // The amount of tokens to be swapped between the two pairs
    ) external {
        factory1 = _factory1;
        factory2 = _factory2;
        router1 = IUniswapV2Router02(_router1);
        router2 = IUniswapV2Router02(_router2);

        address pair1 = UniswapV2Library.pairFor(factory1, token0, token1);
        address pair2 = UniswapV2Library.pairFor(factory2, token0, token1);

        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair1).getReserves();
        (uint reserve2, uint reserve3,) = IUniswapV2Pair(pair2).getReserves();
        uint amount0 = token0 == token1 ? amountBetween : 0;
        uint amount1 = token0 == token1 ? 0 : amountBetween;

        uint amountToRepay = UniswapV2Library.getAmountIn(amountBetween, reserve0, reserve1);
        uint amountWeReceive = UniswapV2Library.getAmountOut(amountBetween, reserve3, reserve2);

        require(amountWeReceive > amountToRepay, string(abi.encodePacked("Not profitable. Amount to repay: ", amountToRepay.toString(), " tokens. Amount we receive: ", amountWeReceive.toString(), " tokens.")));

        IUniswapV2Pair(pair1).swap(
            amount0,
            amount1,
            address(this),
            abi.encode(amountToRepay)
        );
    }


    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        address[] memory path = new address[](2);
        {
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            assert(msg.sender == UniswapV2Library.pairFor(factory1, token0, token1));
            assert(amount0 == 0 || amount1 == 0);
            path[0] = amount0 > 0 ? token0 : token1;
            path[1] = amount0 > 0 ? token1 : token0;
        }

        (uint amountRequired) = abi.decode(data, (uint));

        IERC20(path[0]).approve(address(router2), amount1 == 0 ? amount0 : amount1);

        router2.swapExactTokensForTokens(
            amount1 == 0 ? amount0 : amount1,
            amountRequired, // Let's make sure we get enough tokens
            path,
            address(this),
            block.timestamp
        );

        uint balance = IERC20(path[1]).balanceOf(address(this));
        require(balance >= amountRequired, string(abi.encodePacked("Not enough balance to perform swap. Current balance: ", balance.toString(), " tokens. You need at least ", amountRequired.toString(), " tokens.")));

        IERC20(path[1]).transfer(msg.sender, amountRequired);

        uint profit = IERC20(path[1]).balanceOf(address(this));
        IERC20(path[1]).transfer(sender, profit);
    }
}
