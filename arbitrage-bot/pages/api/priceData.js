import { BigNumber, ethers } from 'ethers';
import { UniswapV2 } from '../../scripts/exchanges/UniswapV2';
import { FakeCEX } from '../../scripts/exchanges/FakeCEX';
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import _UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";

export default async function handler(req, res) {
    const { exchange } = req.body;

    switch (exchange) {
        case 'uniswap':
            await uniswap(req, res);
            break;
        case 'fakecex':
            await fakecex(req, res);
            break;
        default:
            res.status(400).json({ error: 'Exchange not supported' });
    }
}

async function uniswap(req, res) {
    // Get router address & factory address from the request body
    const { routerAddress, factoryAddress, tokenA, tokenB } = req.body;
    // Connect to the JSON-RPC server
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');

    // Connect to the contract
    const router = new ethers.Contract(routerAddress, _UniswapV2Router02.abi, provider);
    const factory = new ethers.Contract(factoryAddress, _UniswapV2Factory.abi, provider);

    const uniswapV2 = new UniswapV2(router, factory);

    const quote = await uniswapV2.getQuote(
        BigNumber.from(100),
        tokenA,
        tokenB
    );
    // Call a function on the contract
    // const result = await contract.someFunction();

    res.status(200).json({ quote });
}

async function fakecex(req, res) {
    const { tokenA, tokenB } = req.body;

    const fakeCex = new FakeCEX();
    const quote = await fakeCex.getQuote(
        BigNumber.from(100),
        "TKA",
        "TKB"
    );

    res.status(200).json({ quote });
}