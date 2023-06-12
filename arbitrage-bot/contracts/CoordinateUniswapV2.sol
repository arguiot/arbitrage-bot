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

    function performFlashSwap(
        address factory1,
        uint initCodeHash1,
        address factory2,
        uint initCodeHash2,
        address router2,
        address token0,
        address token1,
        uint amountBetween // The amount of tokens to be swapped between the two pairs
    ) external {
        uint amountToRepay;
        uint amount0;
        uint amount1;

        address pair1 = pairFor(factory1, token0, token1, initCodeHash1);
        {
            address pair2 = pairFor(factory2, token0, token1, initCodeHash2);

            require(pair1 != address(0), "Pair 1 does not exist");
            require(pair2 != address(0), "Pair 2 does not exist");
            
            (uint reserve0, uint reserve1,) = IUniswapV2Pair(pair1).getReserves();
            (uint reserve2, uint reserve3,) = IUniswapV2Pair(pair2).getReserves();

            require(reserve0 > 0 && reserve1 > 0, "No liquidity in pair 1");
            require(reserve2 > 0 && reserve3 > 0, "No liquidity in pair 2");

            // Sort tokens
            amount0 = token0 > token1 ? 0 : amountBetween;
            amount1 = token0 > token1 ? amountBetween : 0;

            amountToRepay = UniswapV2Library.getAmountIn(amountBetween, reserve0, reserve1);
            uint amountWeReceive = UniswapV2Library.getAmountOut(amountBetween, reserve3, reserve2);

            require(amountWeReceive > amountToRepay, "Not profitable");
        }

        address[] memory meta = new address[](3);
        meta[0] = msg.sender;
        meta[1] = factory1;
        meta[2] = router2;

        IUniswapV2Pair(pair1).swap(
            amount0,
            amount1,
            address(this),
            abi.encode(amountToRepay, meta)
        );
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
