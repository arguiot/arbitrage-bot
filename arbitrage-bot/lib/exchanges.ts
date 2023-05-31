type Exchange = {
    name: string;
    type: "dex" | "cex";
    adapter?: string;
    routerAddress?: string;
    factoryAddress?: string;
};

type IExchangesList = {
    development: {
        [key: string]: Exchange;
    };
    production: {
        [key: string]: Exchange;
    };
};

export const ExchangesList: IExchangesList = {
    development: {
        uniswap: {
            name: "Uniswap V2",
            type: "dex",
            adapter: "uniswap",
            factoryAddress: "0xADf1687e201d1DCb466D902F350499D008811e84",
            routerAddress: "0xF76921660f6fcDb161A59c77d5daE6Be5ae89D20",
        },
        pancakeswap: {
            name: "PancakeSwap",
            type: "dex",
            adapter: "uniswap",
            factoryAddress: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
            routerAddress: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
        },
    },
    production: {
        uniswap: {
            name: "Uniswap V2",
            type: "dex",
        },
        binance: {
            name: "Binance",
            type: "cex",
        },
        kraken: {
            name: "Kraken",
            type: "cex",
        },
    },
};
