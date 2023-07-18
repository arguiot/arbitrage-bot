import { ethers } from "ethers";
import _TokenA from "../../artifacts/contracts/TokenA.sol/TokenA.json";
import _TokenB from "../../artifacts/contracts/TokenB.sol/TokenB.json";

export default async function handler(req, res) {
    const provider = new ethers.providers.JsonRpcProvider(
        "http://127.0.0.1:8545/"
    );
    const privateKey =
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const walletWithPK = new ethers.Wallet(privateKey);
    const deployer = walletWithPK.connect(provider);

    const TokenA = new ethers.ContractFactory(
        _TokenA.abi,
        _TokenA.bytecode,
        deployer
    );
    const TokenB = new ethers.ContractFactory(
        _TokenB.abi,
        _TokenB.bytecode,
        deployer
    );

    const tokenA = await TokenA.deploy("TokenA", "TKA", 18, 10e9);
    const tokenB = await TokenB.deploy("TokenB", "TKB", 18, 10e9);

    await tokenA.deployed();
    await tokenB.deployed();

    res.status(200).json({ tokenA: tokenA.address, tokenB: tokenB.address });
}
