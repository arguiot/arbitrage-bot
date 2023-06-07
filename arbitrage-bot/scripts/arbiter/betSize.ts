/**
 * Calculates the recommended bet size for a given arbitrage opportunity.
 */

import { BigNumber } from "ethers";

export type UniData = {
    inputBalance: number;
    fee: number;
    reserve0: BigNumber;
    reserve1: BigNumber;
};

export type CexData = {
    inputBalance: number;
    fee: number;
    price: number;
    ask?: number;
    bid?: number;
};

type ExecutionQuote = {
    // We should always have amountOutA = amountInB, the profit is the difference between amountInA and amountOutB
    amountInA: number;
    amountOutA: number;
    amountInB: number;
    amountOutB: number;
};

export function betSize({
    exchange1,
    exchange2,
}: {
    exchange1: UniData | CexData;
    exchange2: UniData | CexData;
}): ExecutionQuote {
    // If we're dealing with two CEXs, we can just use the balance
    if (!("reserve0" in exchange1 || "reserve0" in exchange2)) {
        const amountInA = Math.min(
            exchange1.inputBalance,
            exchange2.inputBalance * exchange2.price
        );
        const amountOutA = amountInA * exchange1.price * (1 - exchange1.fee);
        const amountInB = amountOutA;
        const amountOutB = amountInB * exchange2.price * (1 - exchange2.fee);
        return {
            amountInA,
            amountOutA,
            amountInB,
            amountOutB,
        };
    }
    // One of the exchanges is a DEX, so we need to calculate the optimal input
    // Helper function to calculate true price for UniData
    const calculateTruePriceUniData = (data: UniData) => ({
        truePriceTokenA: BigNumber.from(data.reserve0),
        truePriceTokenB: BigNumber.from(data.reserve1),
    });

    // Helper function to calculate true price for CexData
    const calculateTruePriceCexData = (data: CexData) => ({
        truePriceTokenA: data.price,
        truePriceTokenB: 1 / data.price,
    });

    // Determine the Dex exchange object
    const dex = "reserve0" in exchange1 ? exchange1 : (exchange2 as UniData);

    // Calculate the true price of tokens on the other exchange
    const otherExchange = "reserve0" in exchange2 ? exchange2 : exchange1;
    const otherTruePrices =
        "reserve0" in otherExchange
            ? calculateTruePriceUniData(otherExchange as UniData)
            : calculateTruePriceCexData(otherExchange as CexData);

    // Convert the true price values to BigNumber objects
    const toBigNumber = (value: BigNumber | number) =>
        value instanceof BigNumber ? value : BigNumber.from(value).mul(1e18);

    const truePriceTokenAInBigNumber = toBigNumber(
        otherTruePrices.truePriceTokenA
    );
    const truePriceTokenBInBigNumber = toBigNumber(
        otherTruePrices.truePriceTokenB
    );

    const [aToB, _amountIn, _amountOutA, _amountOutB] =
        computeProfitMaximizingTrade(
            truePriceTokenAInBigNumber,
            truePriceTokenBInBigNumber,
            dex.reserve0,
            dex.reserve1,
            dex.fee
        );

    const amountInA = _amountIn.div(1e12).toNumber() / 1e6;
    const amountOutA = _amountOutA.div(1e12).toNumber() / 1e6;
    const amountInB = _amountOutA.div(1e12).toNumber() / 1e6;
    const amountOutB = _amountOutB.div(1e12).toNumber() / 1e6;

    if (aToB) {
        const executionQuote = {
            amountInA,
            amountOutA,
            amountInB,
            amountOutB,
        };
        return adjustAmounts(
            executionQuote.amountInA,
            executionQuote.amountOutA,
            executionQuote.amountInB,
            executionQuote.amountOutB,
            exchange1.inputBalance,
            exchange2.inputBalance
        );
    }
    const executionQuote = {
        amountInA: amountOutB,
        amountOutA: amountInB,
        amountInB: amountOutA,
        amountOutB: amountInA,
    };
    return adjustAmounts(
        executionQuote.amountInA,
        executionQuote.amountOutA,
        executionQuote.amountInB,
        executionQuote.amountOutB,
        exchange1.inputBalance,
        exchange2.inputBalance
    );
}

function computeProfitMaximizingTrade(
    truePriceTokenA: BigNumber,
    truePriceTokenB: BigNumber,
    reserveA: BigNumber,
    reserveB: BigNumber,
    fee: number
): [boolean, BigNumber, BigNumber, BigNumber] {
    const aToB = BigNumber.from(reserveA)
        .mul(truePriceTokenB)
        .div(reserveB)
        .lt(truePriceTokenA);

    const invariant = BigNumber.from(reserveA).mul(reserveB);

    function sqrt(number: BigNumber): BigNumber {
        const a = number.toBigInt();
        if (a < 0n)
            throw new Error("square root of negative numbers is not supported");
        if (a < 2n) return number;
        function newtonIteration(n: bigint, x0: bigint): bigint {
            const x1 = (n / x0 + x0) >> 1n;
            if (x0 === x1 || x0 === x1 - 1n) return x0;
            return newtonIteration(n, x1);
        }
        return BigNumber.from(newtonIteration(a, 1n));
    }

    const Fee = 1000 - Math.floor(fee * 1000);

    const leftSide = sqrt(
        invariant
            .mul(1000)
            .mul(aToB ? truePriceTokenA : truePriceTokenB)
            .div((aToB ? truePriceTokenB : truePriceTokenA).mul(Fee))
    );
    const rightSide = (aToB ? reserveA.mul(1000) : reserveB.mul(1000)).div(Fee);

    if (leftSide.lt(rightSide))
        return [false, BigNumber.from(0), BigNumber.from(0), BigNumber.from(0)];

    // compute the amount that must be sent to move the price to the profit-maximizing price
    const amountIn = leftSide.sub(rightSide);

    // compute the amount out using the constant product formula for both exchanges
    const amountOutA = aToB
        ? reserveB.sub(invariant.div(reserveA.add(amountIn)))
        : reserveA.sub(invariant.div(reserveB.add(amountIn)));

    // compute the amount out using the constant product formula for the second exchange
    const amountOutB = aToB
        ? reserveA.sub(invariant.div(reserveB.add(amountOutA)))
        : reserveB.sub(invariant.div(reserveA.add(amountOutA)));

    return [aToB, amountIn, amountOutA, amountOutB];
}

function adjustAmounts(
    amountInA: number,
    amountOutA: number,
    amountInB: number,
    amountOutB: number,
    inputBalanceA: number,
    inputBalanceB: number
): ExecutionQuote {
    let scaleFactorA = 1;
    let scaleFactorB = 1;

    if (amountInA > inputBalanceA) {
        scaleFactorA = inputBalanceA / amountInA;
    }

    if (amountInB > inputBalanceB) {
        scaleFactorB = inputBalanceB / amountInB;
    }

    const scaleFactor = Math.min(scaleFactorA, scaleFactorB);

    return {
        amountInA: amountInA * scaleFactor,
        amountOutA: amountOutA * scaleFactor,
        amountInB: amountInB * scaleFactor,
        amountOutB: amountOutB * scaleFactor,
    };
}
