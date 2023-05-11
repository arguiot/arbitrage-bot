import { ethers } from "ethers";
import { deployUniswapV2 } from "../../scripts/exchanges/deploy/deployUniswapV2"

export default async function handler(req, res) {
    const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/');
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const walletWithPK = new ethers.Wallet(privateKey);
    const deployer = walletWithPK.connect(provider);
    const {
        factory,
        router,
        weth
    } = await deployUniswapV2(deployer);
    res.status(200).json({ factory: factory.address, router: router.address, weth: weth.address });
}
