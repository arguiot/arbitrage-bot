import { expect } from "chai";
import { Opportunity } from "../../server/types/opportunity";
import { findBestArbitrageRoute } from "../../server/model/findBestArbitrageRoute";
const quotes = {
    "ETH-USDT": {
        uniswap: {
            amount: 0.2776084253060302,
            amountOut: 503.080860764934,
            price: 1822.7328560477656,
            transactionPrice: 1812.1959382549262,
            tokenA: {
                name: "ETH",
                address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
            },
            tokenB: {
                name: "USDT",
                address: "0x0a1B8D7450F69d33803e8b084aBA9d2F858f6574",
            },
            meta: {
                routerAddress: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20",
                factoryAddress: "0xADf1687e201d1DCb466D902F350499D008811e84",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x055d4455826544285a",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x2631bac0c58acef810c5",
                },
            },
        },
        pancakeswap: {
            amount: 0.2776084253060302,
            amountOut: 503.57074250521,
            price: 1822.5235660829142,
            transactionPrice: 1813.9605883722127,
            tokenA: {
                name: "ETH",
                address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
            },
            tokenB: {
                name: "USDT",
                address: "0x0a1B8D7450F69d33803e8b084aBA9d2F858f6574",
            },
            meta: {
                routerAddress: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
                factoryAddress: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x058a2c0277d30ab13f",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x27704bbb48c4ff609103",
                },
            },
        },
        apeswap: {
            amount: 0.2776084253060302,
            amountOut: 502.96801861969686,
            price: 1820.5241473226845,
            transactionPrice: 1811.7894587141388,
            tokenA: {
                name: "ETH",
                address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
            },
            tokenB: {
                name: "USDT",
                address: "0x0a1B8D7450F69d33803e8b084aBA9d2F858f6574",
            },
            meta: {
                routerAddress: "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B",
                factoryAddress: "0x5722F3b02b9fe2003b3045D73E9230684707B257",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x05579ca7902f5ed43a",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x25fdaa8bc8a18bd867ea",
                },
            },
        },
    },
    "TKA-TKB": {
        uniswap: {
            amount: 110.80708688479513,
            amountOut: 28.88755067922235,
            price: 0.43272273397349753,
            transactionPrice: 0.2607012916895506,
            tokenA: {
                name: "TKA",
                address: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD",
            },
            tokenB: {
                name: "TKB",
                address: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c",
            },
            meta: {
                routerAddress: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20",
                factoryAddress: "0xADf1687e201d1DCb466D902F350499D008811e84",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x09252c20a3eec464ba",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x03f514193abb840000",
                },
            },
        },
        pancakeswap: {
            amount: 110.76699275186526,
            amountOut: 64.58031205199687,
            price: 1.23,
            transactionPrice: 0.5830284857210711,
            tokenA: {
                name: "TKA",
                address: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD",
            },
            tokenB: {
                name: "TKB",
                address: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c",
            },
            meta: {
                routerAddress: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
                factoryAddress: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x056bc75e2d63100000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x06aaf7c8516d0c0000",
                },
            },
        },
        apeswap: {
            amount: 110.76699275186526,
            amountOut: 64.58031205199687,
            price: 1.23,
            transactionPrice: 0.5830284857210711,
            tokenA: {
                name: "TKA",
                address: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD",
            },
            tokenB: {
                name: "TKB",
                address: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c",
            },
            meta: {
                routerAddress: "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B",
                factoryAddress: "0x5722F3b02b9fe2003b3045D73E9230684707B257",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x056bc75e2d63100000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x06aaf7c8516d0c0000",
                },
            },
        },
    },
};

describe("Find Best Route", () => {
    it("Should find a route for each pair", async () => {
        const opportunities: Opportunity[] = [];

        type Pair = keyof typeof quotes;
        const pairs = Object.keys(quotes) as Pair[];
        for (const pair of pairs) {
            const options = Object.entries(quotes[pair]);
            const opportunity = await findBestArbitrageRoute(options);
            if (opportunity && opportunity.profit > 0) {
                opportunities.push(opportunity);
            }
        }

        expect(opportunities.length).eq(pairs.length);
    });
});
