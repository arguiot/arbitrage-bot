import { ethers } from "ethers";
import _UniswapV2Router02 from "@uniswap/v2-periphery/build/UniswapV2Router02.json";
import _TokenA from "../../artifacts/contracts/TokenA.sol/TokenA.json";
import _TokenB from "../../artifacts/contracts/TokenB.sol/TokenB.json";

export default async function handler(req, res) {
    // Get router address & factory address from the request body
    const { routerAddress, liquidityA, liquidityB, tokenA, tokenB } = req.body;

    // Connect to the JSON-RPC server
    const provider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545/"
    );
    const privateKey =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const walletWithPK = new ethers.Wallet(privateKey);
    const deployer = walletWithPK.connect(provider);

    const router = new ethers.Contract(
        routerAddress,
        _UniswapV2Router02.abi,
        deployer
    );

    const tokenAContract = new ethers.Contract(tokenA, _TokenA.abi, deployer);
    const tokenBContract = new ethers.Contract(tokenB, _TokenB.abi, deployer);

    // Check balance of deployer
    const balanceA = await tokenAContract.balanceOf(deployer.address);
    const balanceB = await tokenBContract.balanceOf(deployer.address);

    console.log("Deployer balance of token A: " + balanceA.toString());
    console.log("Deployer balance of token B: " + balanceB.toString());

    // Approve the router to spend the tokens
    await tokenAContract.approve(routerAddress, ethers.constants.MaxUint256);
    await tokenBContract.approve(routerAddress, ethers.constants.MaxUint256);

    console.log(
        "Adding liquidity, with token A: " +
            liquidityA +
            " and token B: " +
            liquidityB
    );

    const [amountA, amountB, liquidity] = await router
        .connect(deployer)
        .addLiquidity(
            tokenA,
            tokenB,
            liquidityA,
            liquidityB,
            0,
            0,
            deployer.address,
            ethers.constants.MaxUint256,
            { gasLimit: 5000000 } // set the gas limit to 500,000
        );

    res.status(200).json({ success: true, amountA, amountB, liquidity });
}
