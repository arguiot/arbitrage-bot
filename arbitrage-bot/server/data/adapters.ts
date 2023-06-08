import { ExchangesList } from "../../lib/exchanges";
import { Exchange } from "../../src/exchanges/adapters/exchange";
import { LiveCEX } from "../../src/exchanges/LiveCEX";
import { UniswapV2, UniType } from "../../src/exchanges/UniswapV2";
import { Wallet } from "ethers";

export function getAdapter(
    exchange: string,
    wallet: Wallet,
    routerAddress?: string,
    factoryAddress?: string
): Exchange<any> {
    const environment = process.env.USE_TESTNET ? "development" : "production";
    const metadata = ExchangesList[environment][exchange];
    const adapter = metadata.adapter ?? exchange;

    switch (adapter) {
        case "uniswap": {
            const uniswap = new UniswapV2(
                routerAddress,
                factoryAddress,
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
