import { expect } from "chai";
import { deployV2 } from "./deployV2";
import { interExchangeRoute } from "../../server/model/interExchangeRoute";

describe("Coordinate Cycle Swaps", () => {
    it("should find the best cycle swap", async () => {
        const N = 5; // Number of tokens to deploy
        const D = ["uniswap", "apeswap", "uniswap2"]; // Number of Uniswap V2 instances to deploy
        const { uniswapInstances, pairs } = await deployV2(N, D, 0.5); // 50% spread, although it's big, it can actually happen in real life

        const quotes = {};
        for (const uniswapV2 of uniswapInstances) {
            for (const pair of pairs) {
                const token0 = await pair.token0();
                const token1 = await pair.token1();

                const tokenA = {
                    name: "tokenA",
                    address: token0,
                };

                const tokenB = {
                    name: "tokenB",
                    address: token1,
                };

                const price = await uniswapV2.getQuote(10, tokenA, tokenB);
                const pairName = `${token0}-${token1}`;
                quotes[pairName] = quotes[pairName] || {};
                quotes[pairName][uniswapV2.name] = price;
            }
        }

        const interRoute = await interExchangeRoute(quotes);

        console.log(JSON.stringify(interRoute, null, 2));

        expect(interRoute).to.exist;
    });
});
