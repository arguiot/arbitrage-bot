import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { deployV2 } from "./deployV2";
import { UniswapV2 } from "../../scripts/exchanges/UniswapV2";

describe("Uniswap V2 Local", function () {
    this.beforeAll(async () => {
        await ethers.provider.send("hardhat_reset", []);
    });

    it("Should get quote", async () => {
        const { uniswapV2, tokenA, tokenB } = await deployV2({});
        const quote = await uniswapV2.getQuote(
            BigNumber.from(10),
            tokenA,
            tokenB
        );
        expect(quote.price).to.be.approximately(1, 0.1);
    });

    it("Should estimate transaction time", async () => {
        const { uniswapV2, tokenA, tokenB } = await deployV2({});
        const time = await uniswapV2.estimateTransactionTime(
            BigNumber.from(100),
            tokenA,
            tokenB
        );
        expect(time / 1000).to.be.greaterThan(15); // At least 15 seconds
    });
});

describe("Uniswap V2 Live", function () {
    this.beforeAll(async () => {
        await ethers.provider.send("hardhat_reset", []);
    });

    it("Should get quote", async () => {
        // Find provider to connect to mainnet (gateway: eth.pr1mer.tech)
        const provider = new ethers.providers.JsonRpcProvider({
            url: process.env.JSON_RPC_URL,
            headers: {
                "CF-Access-Client-Id":
                    "338db795e927f1cf6e37479542a9be3c.access",
                "CF-Access-Client-Secret":
                    "6932620374a9680656a7286faa846317728c069cbc54d17870a25ec2b488d05c",
            },
        });
        // Check if provider is connected
        const block = await provider.getBlockNumber();
        console.log("Connected to block: ", block);
        const uniswapV2 = new UniswapV2(null, null, provider);

        const quote = await uniswapV2.getQuote(
            BigNumber.from(10),
            {
                name: "ETH",
                address: "0x0000000000000000000000000000000000000000",
            },
            {
                name: "AAVE",
                address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
            }
        );
        expect(quote.price).to.be.approximately(0.04, 0.01);
    });
});
