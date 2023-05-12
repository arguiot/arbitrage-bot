import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { deployUniswapV2 } from "../../scripts/exchanges/deploy/deployUniswapV2";
import { UniswapV2 } from "../../scripts/exchanges/UniswapV2";
import IUniswapV2Pair from "@uniswap/v2-periphery/build/IUniswapV2Pair.json";
export async function deployV2({
    totalLiquidityA = 1000000,
    totalLiquidityB = 1000000,
    liquidityA = 1000000,
    liquidityB = 1000000,
}) {
    await ethers.provider.send("hardhat_reset", []);
    // Deploy Uniswap V2
    const [deployer] = await ethers.getSigners();
    const { factory, router, weth } = await deployUniswapV2(deployer);

    const uniswapV2 = new UniswapV2(router, factory);

    expect(factory).to.be.ok;
    expect(router).to.be.ok;
    expect(weth).to.be.ok;

    // Get contracts
    const tokenA = await ethers.getContractFactory("TokenA");
    const tokenB = await ethers.getContractFactory("TokenB");
    const tokenAContract = await tokenA.deploy("TokenA", "TKA", 18, totalLiquidityA);
    const tokenBContract = await tokenB.deploy("TokenB", "TKB", 18, totalLiquidityB);
    await tokenAContract.deployed();
    await tokenBContract.deployed();

    console.log("Token A deployed at: ", tokenAContract.address);
    console.log("Token B deployed at: ", tokenBContract.address);

    await tokenAContract.approve(router.address, ethers.constants.MaxUint256);
    await tokenBContract.approve(router.address, ethers.constants.MaxUint256);

    await router.connect(deployer).addLiquidity(
        tokenAContract.address,
        tokenBContract.address,
        liquidityA,
        liquidityB,
        0,
        0,
        deployer.address,
        ethers.constants.MaxUint256
    );

    // Check liquidity
    const pairAddress = await factory.getPair(tokenAContract.address, tokenBContract.address);
    const pair = new ethers.Contract(pairAddress, IUniswapV2Pair.abi, deployer);
    const reserves = await pair.getReserves();
    expect(reserves[0].toString()).to.equal(`${liquidityA}`);
    expect(reserves[1].toString()).to.equal(`${liquidityB}`);

    return { uniswapV2, tokenA: tokenAContract, tokenB: tokenBContract }
}
