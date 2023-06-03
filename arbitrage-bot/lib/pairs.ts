export const TokenList = {
    ETH: {
        address: "0x0000000000000000000000000000000000000000",
        name: "Ethereum",
    },
    USDT: {
        address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        name: "Tether",
    },
    WETH_BSCTESTNET: {
        address: "0x272473bFB0C70e7316Ec04cFbae03EB3571A8D8F",
        name: "ETH",
    },
    USDT_BSCTESTNET: {
        address: "0x0a1B8D7450F69d33803e8b084aBA9d2F858f6574",
        name: "USDT",
    },
    USDC: {
        address: "0x3c3aA68bc795e72833218229b0e53eFB4143A152",
        name: "USD Coin",
    },
    BTC: {
        address: null,
        name: "Bitcoin",
    },
    AAVE: {
        address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        name: "Aave",
    },
};

export const PairList = {
    development: {
        "ETH/USDT": {
            tokenA: TokenList.WETH_BSCTESTNET,
            tokenB: TokenList.USDT_BSCTESTNET,
        },
    },
    production: {
        "ETH/USDT": {
            tokenA: TokenList.ETH,
            tokenB: TokenList.USDT,
        },
        "ETH/USDC": {
            tokenA: TokenList.ETH,
            tokenB: TokenList.USDC,
        },
        "ETH/BTC": {
            tokenA: TokenList.ETH,
            tokenB: TokenList.BTC,
        },
        "AAVE/ETH": {
            tokenA: TokenList.AAVE,
            tokenB: TokenList.ETH,
        },
    },
};