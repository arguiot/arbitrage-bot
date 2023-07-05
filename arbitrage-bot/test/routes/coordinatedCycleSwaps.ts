import { expect } from "chai";
import { ethers } from "hardhat";
import { deployV2 } from "./deployV2";
import { interExchangeRoute } from "../../server/model/interExchangeRoute";
import { hashes } from "../../src/exchanges/UniswapV2";

describe("Coordinate Cycle Swaps", () => {
    // it("should find the best cycle swap", async () => {
    //     const N = 5; // Number of tokens to deploy
    //     const D = ["uniswap", "apeswap", "uniswap2"]; // Number of Uniswap V2 instances to deploy
    //     const { uniswapInstances, pairs } = await deployV2(N, D, 0.5); // 50% spread, although it's big, it can actually happen in real life

    //     const quotes = {};
    //     for (const uniswapV2 of uniswapInstances) {
    //         for (const pair of pairs) {
    //             const token0 = await pair.token0();
    //             const token1 = await pair.token1();

    //             const tokenA = {
    //                 name: "tokenA",
    //                 address: token0,
    //             };

    //             const tokenB = {
    //                 name: "tokenB",
    //                 address: token1,
    //             };

    //             const price = await uniswapV2.getQuote(10, tokenA, tokenB);
    //             const pairName = `${token0}-${token1}`;
    //             quotes[pairName] = quotes[pairName] || {};
    //             quotes[pairName][uniswapV2.name] = price;
    //         }
    //     }

    //     const interRoute = await interExchangeRoute(quotes);

    //     console.log(JSON.stringify(interRoute, null, 2));

    //     expect(interRoute).to.exist;
    // });

    it("should execute cycle swap", async () => {
        const N = 5; // Number of tokens to deploy
        const D = ["uniswap", "apeswap", "uniswap2"]; // Number of Uniswap V2 instances to deploy
        const { uniswapInstances, pairs } = await deployV2(N, D, 0.5); // 50% spread, although it's big, it can actually happen in real life

        // Deploy SwapRouteCoordinator
        const SwapRouteCoordinator = await ethers.getContractFactory(
            "SwapRouteCoordinator"
        );
        const swapRouteCoordinator = await SwapRouteCoordinator.deploy();
        await swapRouteCoordinator.deployed();
        console.log(
            "SwapRouteCoordinator deployed to:",
            swapRouteCoordinator.address
        );

        // Deploy ArbitrageUniswapV2
        const ArbitrageUniswapV2 = await ethers.getContractFactory(
            "ArbitrageUniswapV2"
        );
        const arbitrageUniswapV2 = await ArbitrageUniswapV2.deploy(); // We'll use the same intermediary for all the swaps
        await arbitrageUniswapV2.deployed();
        console.log(
            "ArbitrageUniswapV2 deployed to:",
            arbitrageUniswapV2.address
        );

        const startAmount = ethers.utils.parseEther("1");

        const route = [
            {
                token: await pairs[0].token0(),
                intermediary: arbitrageUniswapV2.address,
                data: ethers.utils.defaultAbiCoder.encode(
                    ["address", "address", "uint256"],
                    [
                        uniswapInstances[0].delegate.address,
                        uniswapInstances[0].source.address,
                        hashes[uniswapInstances[0].name],
                    ]
                ),
            },
            {
                token: await pairs[0].token1(),
                intermediary: arbitrageUniswapV2.address,
                data: ethers.utils.defaultAbiCoder.encode(
                    ["address", "address", "uint256"],
                    [
                        uniswapInstances[0].delegate.address,
                        uniswapInstances[0].source.address,
                        hashes[uniswapInstances[0].name],
                    ]
                ),
            },
            {
                token: await pairs[0].token0(),
                intermediary: arbitrageUniswapV2.address,
                data: ethers.utils.defaultAbiCoder.encode(
                    ["address", "address", "uint256"],
                    [
                        uniswapInstances[1].delegate.address,
                        uniswapInstances[1].source.address,
                        hashes[uniswapInstances[0].name],
                    ]
                ),
            }
        ];

        console.log("Route: ", route.map((r) => r.token));

        const tx = await swapRouteCoordinator.startArbitrage(
            startAmount,
            arbitrageUniswapV2.address,
            route
        );

        const receipt = await tx.wait();
        // Amount out is returned from the call
        const event = receipt.events?.find(e => e.event == 'Arbitrage');

        const eventResult = swapRouteCoordinator.interface.parseLog(event as any);
        console.log(eventResult.args.amountOut.toString());
    });
});
