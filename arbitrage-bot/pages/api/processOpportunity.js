import { BigNumber, ethers } from 'ethers';
import { UniswapV2 } from '../../scripts/exchanges/UniswapV2';
import { FakeCEX } from '../../scripts/exchanges/FakeCEX';
import { LiveCEX } from '../../scripts/exchanges/LiveCEX';
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import _UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";
import { validateOpportunity } from '../../scripts/arbiter/opportunity';

export default async function handler(req, res) {
    const { tokenA, tokenB, exchangeA, exchangeB, amountIn } = req.body;

    // Sort the tokens alphabetically
    const [token0, token1] = [tokenA, tokenB].sort((a, b) => a.name.localeCompare(b.name));

    const ExchangeA = await getExchange(exchangeA, req, res);
    const ExchangeB = await getExchange(exchangeB, req, res);

    // Get price data from the exchanges
    const priceA = await ExchangeA.getQuote(BigNumber.from(amountIn), token0, token1);
    const priceB = await ExchangeB.getQuote(BigNumber.from(amountIn), token0, token1);

    const _priceA = priceA.ask || priceA.price;
    const _priceB = priceB.bid || priceB.price;

    const opportunity = await validateOpportunity({
        tokenA,
        tokenB,
        priceA: _priceA,
        priceB: _priceB,
        amountIn,
        exchangeA: ExchangeA,
        exchangeB: ExchangeB,
    });

    if (!opportunity) {
        res.status(400).json({ error: 'No opportunity found' });
    }

    // Calculate the amount out from the amount in (number) and the price
    const amountOut = amountIn * _priceA / _priceB;
    // Calculate the profit
    const profit = (amountOut - amountIn) * _priceB;

    // Opportunity found, execute the trade
    res.status(200).json({
        timestamp: Date.now(),
        pair: `${tokenA.name}/${tokenB.name}`,
        exchange1: exchangeA,
        exchange2: exchangeB,
        price1: _priceA,
        price2: _priceB,
        profit,
    });
}

async function getExchange(exchange, req, res) {
    switch (exchange) {
        case 'uniswap':
            return await uniswap(req, res);
        case 'fakecex':
            return await fakecex(req, res);
        case 'binance':
            return await livecex('binance', req, res);
        case 'kraken':
            return await livecex('kraken', req, res);
        default:
            res.status(400).json({ error: 'Exchange not supported' });
    }
}

async function uniswap(req, res) {
    const provider = new ethers.providers.JsonRpcProvider({
        url: process.env.JSON_RPC_URL,
    });

    // Connect to the contract
    const uniswapV2 = new UniswapV2(null, null, provider);

    // Process the opportunity
    return uniswapV2;
}

async function fakecex(req, res) {
    const fakeCex = new FakeCEX();

    // Process the opportunity
    return fakeCex;
}


async function livecex(exchange, req, res) {
    const liveCex = new LiveCEX(exchange);
    return liveCex;
}
