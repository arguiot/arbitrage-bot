import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { FakeCEX } from "../../scripts/exchanges/FakeCEX";

describe("FakeCEX", function () {
    this.beforeAll(async () => {
        await ethers.provider.send("hardhat_reset", []);
    });

    it("Should get quote", async () => {
        const fakeCex = new FakeCEX();
        const quote = await fakeCex.getQuote(
            BigNumber.from(100),
            { name: "TKA" },
            { name: "TKB" }
        );
        expect(quote.price / 10e9).to.be.approximately(1, 0.1);
    });

    it("Should estimate transaction time", async () => {
        const fakeCex = new FakeCEX();
        const time = await fakeCex.estimateTransactionTime(
            BigNumber.from(100),
            { name: "TKA" },
            { name: "TKB" }
        );
        expect(time / 1000).to.be.greaterThan(1); // At least 1 seconds
    });
});
