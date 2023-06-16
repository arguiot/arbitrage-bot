import { expect } from "chai";
import { ethers } from "hardhat";
import { deployV2 } from "./deployV2";
import { interExchangeRoute } from "../../server/model/interExchangeRoute";

describe("Coordinate Cycle Swaps", () => {
    it("should find the best cycle swap", async () => {
        const N = 4; // Number of tokens to deploy
        const D = ["uniswap", "pancakeswap", "apeswap"]; // Number of Uniswap V2 instances to deploy
        const { uniswapInstances, tokens, pairs } = await deployV2(N, D);

        const quotes = {};
        for (const uniswapV2 of uniswapInstances) {
            for (const pair of pairs) {
                const token0 = await pair.token0();
                const token1 = await pair.token1();

                const tokenA = {
                    name: "tokenA",
                    address: token0,
                }

                const tokenB = {
                    name: "tokenB",
                    address: token1,
                }

                const price = await uniswapV2.getQuote(10, tokenA, tokenB);
                const pairName = `${token0}-${token1}`;
                quotes[pairName] = quotes[pairName] || {};
                quotes[pairName][uniswapV2.name] = price;
            }
        }
        console.log(quotes);
        const interRoute = await interExchangeRoute(quotes);
        expect(interRoute).to.exist;
    });
});
