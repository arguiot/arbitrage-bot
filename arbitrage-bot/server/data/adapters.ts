import { ExchangesList } from "../../lib/exchanges";
import { Exchange } from "../../scripts/exchanges/adapters/exchange";
import { LiveCEX } from "../../scripts/exchanges/LiveCEX";
import { UniswapV2, UniType } from "../../scripts/exchanges/UniswapV2";
import { Wallet } from "ethers";

export function getAdapter(
    exchange: string,
    wallet: Wallet,
    routerAddress?: string,
    factoryAddress?: string
): Exchange<any> {
    const environment = process.env.USE_TESTNET ? "development" : "production";
    const adapter = ExchangesList[environment][exchange].adapter ?? exchange;

    switch (adapter) {
        case "uniswap": {
            const uniswap = new UniswapV2(
                routerAddress,
                factoryAddress,
                wallet
            );
            uniswap.name = exchange as UniType; // Let the adapter know which exchange it is. Because PancakeSwap uses a different pair definition, we need to know which exchange we're using.
            return uniswap;
        }
        case "binance":
        case "kraken":
        default:
            return new LiveCEX(exchange);
    }
}
