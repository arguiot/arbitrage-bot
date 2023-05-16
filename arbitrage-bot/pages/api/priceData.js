import { BigNumber, ethers } from 'ethers';
import { UniswapV2 } from '../../scripts/exchanges/UniswapV2';
import { FakeCEX } from '../../scripts/exchanges/FakeCEX';
import { LiveCEX } from '../../scripts/exchanges/LiveCEX';
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import _UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";

export default async function handler(req, res) {
    const { exchange } = req.body;

    switch (exchange) {
        case 'uniswap':
            await uniswap(req, res);
            break;
        case 'local-cex':
            await fakecex(req, res);
            break;
        case 'binance':
            await livecex('binance', req, res);
            break;
        case 'kraken':
            await livecex('kraken', req, res);
            break;
        default:
            res.status(400).json({ error: 'Exchange not supported' });
    }
}

async function uniswap(req, res) {
    // Get router address & factory address from the request body
    const { tokenA, tokenB } = req.body;
    // Connect to the JSON-RPC server
    const provider = new ethers.providers.JsonRpcProvider({
        url: "https://eth.pr1mer.tech/v1/mainnet"
    });

    // Connect to the contract
    const uniswapV2 = new UniswapV2(null, null, provider);

    const quote = await uniswapV2.getQuote(
        BigNumber.from(1),
        tokenA,
        tokenB
    );
    // Call a function on the contract
    // const result = await contract.someFunction();

    res.status(200).json({ quote, exchange: 'uniswap', tokenA, tokenB });
}

async function fakecex(req, res) {
    const { tokenA, tokenB } = req.body;

    const fakeCex = new FakeCEX();
    const quote = await fakeCex.getQuote(
        BigNumber.from(1),
        tokenA,
        tokenB
    );

    res.status(200).json({ quote, exchange: 'local-cex', ttf: 0.1, tokenA, tokenB });
}


async function livecex(exchange, req, res) {
    const { tokenA, tokenB } = req.body;

    const liveCex = new LiveCEX(exchange);
    const quote = await liveCex.getQuote(
        BigNumber.from(1),
        tokenA,
        tokenB
    );

    res.status(200).json({ quote, exchange, ttf: 0.1, tokenA, tokenB });
}
