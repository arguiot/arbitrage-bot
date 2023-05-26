import { expect } from "chai";
import { calculateProfitProbability } from "../../scripts/arbiter/profitChances";

describe("Profit Chances", function () {
    it("Should be low for long transactions", async () => {
        const long = calculateProfitProbability({ delta: 0.63, ttf: 100 }); // 0.63% profit, 100 seconds
        expect(long).to.be.lessThan(0.5);
    });
});
