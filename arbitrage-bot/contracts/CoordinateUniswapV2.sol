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

    constructor() public {}

    function performRouteSwap(
        bytes calldata factoriesBytes,
        bytes calldata initCodeHashesBytes,
        bytes calldata routersBytes,
        bytes calldata tokenRoutesBytes,
        uint amountIn
    ) external {
        address[] memory factories = abi.decode(factoriesBytes, (address[]));
        uint[] memory initCodeHashes = abi.decode(initCodeHashesBytes, (uint[]));
        address[] memory routers = abi.decode(routersBytes, (address[]));
        address[] memory tokenRoutes = abi.decode(tokenRoutesBytes, (address[]));

        require(factories.length > 1, "You must provide at least 2 pairs");
        require(factories.length == tokenRoutes.length && factories.length == initCodeHashes.length, "Factories, initCodeHashes and token routes must have the same length");
        require(routers.length == factories.length - 1, "You must provide one router less than the number of pairs, starting from second router");

        (uint amountToRepay, uint amount0, uint amount1) = _handleFirstPair(factories, initCodeHashes, tokenRoutes, amountIn);

        address pair1 = pairFor(factories[0], tokenRoutes[0], tokenRoutes[1], initCodeHashes[0]);
        IUniswapV2Pair(pair1).swap(
            amount0,
            amount1,
            address(this),
            abi.encode(amountToRepay, factories, initCodeHashes, routers, tokenRoutes)
        );
    }

    // MARK: - IUniswapV2Callee
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        (uint amountRequired, address[] memory factories, uint[] memory initCodeHashes, address[] memory routers, address[] memory tokenRoutes) = abi.decode(data, (uint, address[], uint[], address[], address[]));

        address caller = sender;
        uint tokenInAmount = amount0 > 0 ? amount0 : amount1;
        address tokenIn = amount0 > 0 ? IUniswapV2Pair(msg.sender).token0() : IUniswapV2Pair(msg.sender).token1();
        address tokenOut = amount0 > 0 ? IUniswapV2Pair(msg.sender).token1() : IUniswapV2Pair(msg.sender).token0();

        uint profit = _performCycleArbitrage(factories, initCodeHashes, routers, tokenRoutes, tokenInAmount);

        require(profit >= amountRequired, string(abi.encodePacked("Not enough profit to perform cycle arbitrage. Current profit: ", profit.toString(), " tokens. You need at least ", amountRequired.toString(), " tokens.")));

        IERC20(tokenOut).transfer(msg.sender, amountRequired);
        IERC20(tokenOut).transfer(caller, profit - amountRequired);
    }

    // MARK: - Helpers
    function _performCycleArbitrage(
        address[] memory factories,
        uint[] memory initCodeHashes,
        address[] memory routers,
        address[] memory tokenRoutes,
        uint tokenInAmount
    ) internal returns (uint profit) {
        uint balance = tokenInAmount;

        for (uint i = 2; i < routers.length; i++) {
            address routerAddress = routers[i];
            IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

            address[] memory path = new address[](2);
            path[0] = tokenRoutes[i - 1];
            path[1] = tokenRoutes[i];

            IERC20(path[0]).approve(routerAddress, balance);

            uint[] memory amounts = router.swapExactTokensForTokens(
                balance,
                0, // Accept any amount of output tokens
                path,
                address(this),
                block.timestamp
            );

            balance = amounts[1];
        }

        profit = balance;
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB, uint codeHash) internal pure returns (address pair) {
        (address token0, address token1) = UniswapV2Library.sortTokens(tokenA, tokenB);
        pair = address(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                codeHash // init code hash
            ))));
    }

    function _handleFirstPair(
        address[] memory factories,
        uint[] memory initCodeHashes,
        address[] memory tokenRoutes,
        uint amountIn
    ) internal view returns (uint amountToRepay, uint amount0, uint amount1) {
        address pair1 = pairFor(factories[0], tokenRoutes[0], tokenRoutes[1], initCodeHashes[0]);
        require(pair1 != address(0), "Pair 1 does not exist");

        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair1).getReserves();
        require(reserve0 > 0 && reserve1 > 0, "No liquidity in pair 1");

        amount0 = tokenRoutes[0] > tokenRoutes[1] ? 0 : amountIn;
        amount1 = tokenRoutes[0] > tokenRoutes[1] ? amountIn : 0;
        amountToRepay = UniswapV2Library.getAmountIn(amountIn, reserve0, reserve1);
    }
}
