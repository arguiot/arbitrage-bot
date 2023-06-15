import { expect } from "chai";
import { Opportunity } from "../../server/types/opportunity";
import { interPairOpportunity } from "../../server/model/interPairOpportunity";
import { interExchangeRoute } from "../../server/model/interExchangeRoute";
const quotes = {
    "ETH-USDT": {
        uniswap: {
            exchange: "uniswap",
            amount: 0.3,
            amountOut: 543.5364999753085,
            price: 1822.7328560477656,
            transactionPrice: 1811.7883332510285,
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
        apeswap: {
            exchange: "apeswap",
            amount: 0.3,
            amountOut: 543.4139568025587,
            price: 1820.5241473226845,
            transactionPrice: 1811.379856008529,
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
        pancakeswap: {
            exchange: "pancakeswap",
            amount: 0.3,
            amountOut: 544.0695217717414,
            price: 1822.5235660829142,
            transactionPrice: 1813.5650725724713,
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
    },
    "TKA-TKB": {
        uniswap: {
            exchange: "uniswap",
            amount: 59931.300751569775,
            amountOut: 72.79447592160619,
            price: 0.43272273397349753,
            transactionPrice: 0.001214632003789764,
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
            exchange: "pancakeswap",
            amount: 59931.300751569775,
            amountOut: 122.79469696639245,
            price: 1.23,
            transactionPrice: 0.002048924275403385,
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
            exchange: "apeswap",
            amount: 59931.300751569775,
            amountOut: 122.79469696639245,
            price: 1.23,
            transactionPrice: 0.002048924275403385,
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
    "ETH-TKA": {
        pancakeswap: {
            exchange: "pancakeswap",
            amount: 0.3,
            amountOut: 119.0471456915987,
            price: 400,
            transactionPrice: 396.8238189719957,
            tokenA: {
                name: "ETH",
                address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
            },
            tokenB: {
                name: "TKA",
                address: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD",
            },
            meta: {
                routerAddress: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
                factoryAddress: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x02b5e3af16b1880000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x043c33c1937564800000",
                },
            },
        },
        apeswap: {
            exchange: "apeswap",
            amount: 0.3,
            amountOut: 118.34272749551373,
            price: 400,
            transactionPrice: 394.4757583183791,
            tokenA: {
                name: "ETH",
                address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
            },
            tokenB: {
                name: "TKA",
                address: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD",
            },
            meta: {
                routerAddress: "0x1c6f40e550421D4307f9D5a878a1628c50be0C5B",
                factoryAddress: "0x5722F3b02b9fe2003b3045D73E9230684707B257",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x015af1d78b58c40000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x021e19e0c9bab2400000",
                },
            },
        },
        uniswap: {
            exchange: "uniswap",
            amount: 0.3,
            amountOut: 118.22554952547719,
            price: 400,
            transactionPrice: 394.085165084924,
            tokenA: {
                name: "ETH",
                address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
            },
            tokenB: {
                name: "TKA",
                address: "0x9c36c0a6FFD4322c647572CACfc1d5C475c854CD",
            },
            meta: {
                routerAddress: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20",
                factoryAddress: "0xADf1687e201d1DCb466D902F350499D008811e84",
                reserveA: {
                    type: "BigNumber",
                    hex: "0x015af1d78b58c40000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x021e19e0c9bab2400000",
                },
            },
        },
    },
    "TKB-USDT": {
        uniswap: {
            exchange: "uniswap",
            amount: 70050,
            amountOut: 4373.746318411169,
            price: 0.5,
            transactionPrice: 0.062437492054406414,
            tokenA: {
                name: "TKB",
                address: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c",
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
                    hex: "0x021e19e0c9bab2400000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x010f0cf064dd59200000",
                },
            },
        },
        pancakeswap: {
            exchange: "pancakeswap",
            amount: 70050,
            amountOut: 4374.295300081717,
            price: 0.5,
            transactionPrice: 0.06244532905184464,
            tokenA: {
                name: "TKB",
                address: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c",
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
                    hex: "0x021e19e0c9bab2400000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x010f0cf064dd59200000",
                },
            },
        },
        apeswap: {
            exchange: "apeswap",
            amount: 70050,
            amountOut: 4374.295300081717,
            price: 0.5,
            transactionPrice: 0.06244532905184464,
            tokenA: {
                name: "TKB",
                address: "0xBf8C59a713927773f9Bf1BCcE21269f7bd95BC6c",
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
                    hex: "0x021e19e0c9bab2400000",
                },
                reserveB: {
                    type: "BigNumber",
                    hex: "0x010f0cf064dd59200000",
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
            const opportunity = await interPairOpportunity(options);
            if (opportunity && opportunity.profit > 0) {
                opportunities.push(opportunity);
            }
        }

        expect(opportunities.length).eq(pairs.length);
    });

    it("Should find the best route", async () => {
        const interRoute = await interExchangeRoute(quotes);
        expect(interRoute).to.exist;
    });
});
