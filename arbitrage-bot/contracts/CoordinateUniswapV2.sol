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
        address[] calldata factories,
        uint[] calldata initCodeHashes,
        address[] calldata routers,
        address[] calldata tokenRoutes,
        uint amountIn
    ) external {
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

    function _handleFirstPair(
        address[] calldata factories,
        uint[] calldata initCodeHashes,
        address[] calldata tokenRoutes,
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

    // MARK: - IUniswapV2Callee
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        (uint amountRequired, address[] memory meta) = abi.decode(data, (uint, address[]));

        address caller = meta[0];
        address factory1 = meta[1];
        address _router2 = meta[2];

        IUniswapV2Router02 router2 = IUniswapV2Router02(_router2);

        address[] memory path = new address[](2);
        {
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            assert(msg.sender == UniswapV2Library.pairFor(factory1, token0, token1));
            assert(amount0 == 0 || amount1 == 0);
            path[0] = amount0 > 0 ? token0 : token1;
            path[1] = amount0 > 0 ? token1 : token0;
        }

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
        IERC20(path[1]).transfer(caller, profit);
    }

    // MARK: - Helpers
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
}
