import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployV2 } from "./deployV2";

describe("Uniswap V2", function() {

    this.beforeAll(async () => {
        await ethers.provider.send("hardhat_reset", []);
    })

    it("Should get quote", async () => {
        const { uniswapV2, tokenA, tokenB } = await deployV2({});
        const quote = await uniswapV2.getQuote(
            BigNumber.from(100),
            tokenA.address,
            tokenB.address
        );
        expect(quote.price).to.be.approximately(1, 0.1);
    });

    it("Should estimate transaction time", async () => {
        const { uniswapV2, tokenA, tokenB } = await deployV2({});
        const time = await uniswapV2.estimateTransactionTime(
            BigNumber.from(100),
            tokenA.address,
            tokenB.address
        );
        expect(time / 1000).to.be.greaterThan(15); // At least 15 seconds
    });
});
