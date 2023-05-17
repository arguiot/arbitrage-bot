import { BigNumber, ethers } from 'ethers';
import { UniswapV2 } from '../../scripts/exchanges/UniswapV2';
import { FakeCEX } from '../../scripts/exchanges/FakeCEX';
import { LiveCEX } from '../../scripts/exchanges/LiveCEX';
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import _UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";

export default async function handler({ exchange, tokenA, tokenB, provider }) {
    switch (exchange) {
        case 'uniswap':
            return await uniswap({ tokenA, tokenB, provider });
        case 'local-cex':
            return await fakecex({ tokenA, tokenB });
        case 'binance':
            return await livecex('binance', { tokenA, tokenB });
        case 'kraken':
            return await livecex('kraken', { tokenA, tokenB });
        default:
            throw new Error('Exchange not supported');
    }
}

async function uniswap({ tokenA, tokenB, provider }) {
    // Connect to the contract
    const uniswapV2 = new UniswapV2(null, null, provider);

    const quote = await uniswapV2.getQuote(
        BigNumber.from(1),
        tokenA,
        tokenB
    );
    // Call a function on the contract
    // const result = await contract.someFunction();
    return { quote, exchange: 'uniswap', tokenA, tokenB }
}

async function fakecex({ tokenA, tokenB }) {
    const fakeCex = new FakeCEX();
    const quote = await fakeCex.getQuote(
        BigNumber.from(1),
        tokenA,
        tokenB
    );

    return { quote, exchange: 'local-cex', ttf: 0.1, tokenA, tokenB }
}


async function livecex(exchange, { tokenA, tokenB }) {
    const liveCex = new LiveCEX(exchange);
    const quote = await liveCex.getQuote(
        BigNumber.from(1),
        tokenA,
        tokenB
    );

    return { quote, exchange, ttf: 0.1, tokenA, tokenB }
}
