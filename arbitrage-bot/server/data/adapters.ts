import { ExchangesList } from "../../lib/exchanges";
import { Exchange } from "../../src/exchanges/adapters/exchange";
import { LiveCEX } from "../../src/exchanges/LiveCEX";
import { UniswapV2, UniType } from "../../src/exchanges/UniswapV2";
import { Wallet } from "ethers";
import Credentials from "../credentials/Credentials";

export function getAdapter(
    exchange: string,
    wallet: Wallet = Credentials.shared.wallet,
    routerAddress?: string,
    factoryAddress?: string
): Exchange<any, any> {
    const environment = process.env.USE_TESTNET ? "development" : "production";
    const metadata = ExchangesList[environment][exchange];
    const adapter = metadata.adapter ?? exchange;

    switch (adapter) {
        case "uniswap": {
            const uniswap = new UniswapV2(
                routerAddress || metadata.routerAddress,
                factoryAddress || metadata.factoryAddress,
                wallet
            );
            uniswap.name = exchange as UniType; // Let the adapter know which exchange it is. Because PancakeSwap uses a different pair definition, we need to know which exchange we're using.
            uniswap.coordinator = metadata.coordinatorAddress;
            return uniswap;
        }
        case "binance":
        case "kraken":
        default:
            return new LiveCEX(exchange);
    }
}
