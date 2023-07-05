// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "./IntermediaryArbitrageStep.sol";
import "./LapExchangeInterface.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "./SwapRouteCoordinator.sol";

import "hardhat/console.sol";

contract ArbitrageUniswapV2 is
    IntermediaryArbitrageStep,
    LapExchangeInterface,
    IUniswapV2Callee
{
    constructor() public {}

    // MARK: - IntermediaryArbitrageStep
    function prepareStep(
        address coordinator,
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amount,
        bytes calldata data
    )
        external
        override
        returns (address contractToCall, bytes memory callData)
    {
        address router = abi.decode(data, (address));

        contractToCall = router;

        address[2] memory path = [address(tokenA), address(tokenB)];

        console.log(
            "Swapping %s %s for %s",
            amount,
            address(tokenA),
            address(tokenB)
        );

        // Call swapExactTokensForTokens
        callData = abi.encodeWithSelector(
            IUniswapV2Router01.swapExactTokensForTokens.selector,
            amount,
            0, // Accept any amount of output tokens
            path,
            coordinator,
            block.timestamp
        );
    }

    // MARK: - LapExchangeInterface
    function initialize(
        address coordinator,
        IERC20 tokenA,
        IERC20 tokenB,
        uint256 amount,
        Step[] calldata steps
    )
        external
        override
        returns (address contractToCall, bytes memory callData)
    {
        // Get amounts
        (
            address pair,
            uint amount0,
            uint amount1,
            uint amountToRepay
        ) = getAmounts(steps[0].data, amount, tokenA, tokenB);

        // Call Swap
        contractToCall = pair;

        // Encode Steps[], coordinator and amountToRepay
        bytes memory data = abi.encode(
            steps,
            amount,
            amountToRepay,
            tokenA,
            tokenB
        );

        console.log("Amount to repay: %s", amountToRepay);

        callData = abi.encodeWithSelector(
            IUniswapV2Pair.swap.selector,
            amount0,
            amount1,
            address(this), // To this contract, which implements IUniswapV2Callee
            data
        );
    }

    // MARK: - IUniswapV2Callee
    function uniswapV2Call(
        address sender,
        uint amount0,
        uint amount1,
        bytes calldata data
    ) external override {
        // Decode data
        (Step[] memory steps, uint startAmount, uint amountToRepay) = abi
            .decode(data, (Step[], uint, uint));

        // Send tokens to SwapRouteCoordinator
        uint amountReceived = amount0 > 0 ? amount0 : amount1; // Whichever is greater, since one will be 0
        console.log(
            "Token 1 balance: %s",
            IERC20(address(steps[1].token)).balanceOf(address(this))
        );
        IERC20(address(steps[1].token)).transfer(sender, amountReceived);

        console.log("Transfered %s to %s", amountReceived, sender);

        SwapRouteCoordinator(sender).performArbitrage(startAmount, steps);
        // Repay the flash loan
        try
            SwapRouteCoordinator(sender).repay(
                address(steps[0].token),
                amountToRepay,
                msg.sender
            )
        {
            console.log("Repayed %s to %s", amountToRepay, msg.sender);
        } catch Error(string memory reason) {
            console.log("Repay failed: %s", reason);
        }
    }

    // MARK: - Helpers
    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(
        address factory,
        address tokenA,
        address tokenB,
        uint codeHash
    ) internal pure returns (address pair) {
        (address token0, address token1) = UniswapV2Library.sortTokens(
            tokenA,
            tokenB
        );
        pair = address(
            uint(
                keccak256(
                    abi.encodePacked(
                        hex"ff",
                        factory,
                        keccak256(abi.encodePacked(token0, token1)),
                        codeHash // init code hash
                    )
                )
            )
        );
    }

    function getAmounts(
        bytes memory data,
        uint amount,
        IERC20 tokenA,
        IERC20 tokenB
    )
        internal
        view
        returns (address pair, uint amount0, uint amount1, uint amountToRepay)
    {
        (address router, address factory, uint initCodeHash) = abi.decode(
            data,
            (address, address, uint)
        );

        pair = pairFor(factory, address(tokenA), address(tokenB), initCodeHash);

        require(pair != address(0), "LapExchange: PAIR_NOT_FOUND");

        (uint reserve0, uint reserve1, ) = IUniswapV2Pair(pair).getReserves();
        require(reserve0 != 0 && reserve1 != 0, "LapExchange: NO_RESERVES"); // ensure that there's liquidity in the pair

        amount0 = address(tokenA) > address(tokenB) ? amount : 0;
        amount1 = address(tokenA) > address(tokenB) ? 0 : amount;

        // Calculate amount to repay
        amountToRepay = UniswapV2Library.getAmountIn(
            amount,
            reserve0,
            reserve1
        );
    }
}
