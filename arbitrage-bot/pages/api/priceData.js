import { BigNumber, ethers } from 'ethers';
import { UniswapV2 } from '../../scripts/exchanges/UniswapV2';
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import _UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";
// Replace with the address of your contract
const routerAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
const factoryAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export default async function handler(req, res) {
    // Connect to the JSON-RPC server
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');

    // Connect to the contract
    const router = new ethers.Contract(routerAddress, _UniswapV2Router02.abi, provider);
    const factory = new ethers.Contract(factoryAddress, _UniswapV2Factory.abi, provider);

    const uniswapV2 = new UniswapV2(router, factory);

    const quote = await uniswapV2.getQuote(
        BigNumber.from(100),
        "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
        "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
    );
    // Call a function on the contract
    // const result = await contract.someFunction();

    res.status(200).json({ quote });
}
