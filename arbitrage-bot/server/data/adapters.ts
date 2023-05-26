import { Exchange } from "../../scripts/exchanges/adapters/exchange";
import { FakeCEX } from "../../scripts/exchanges/FakeCEX";
import { LiveCEX } from "../../scripts/exchanges/LiveCEX";
import { UniswapV2 } from "../../scripts/exchanges/UniswapV2";
import { Wallet } from "ethers";

export function getAdapter(
    exchange: string,
    wallet: Wallet,
    routerAddress?: string,
    factoryAddress?: string
): Exchange<any> {
    switch (exchange) {
        case "uniswap":
            return new UniswapV2(routerAddress, factoryAddress, wallet);
        case "binance":
        case "kraken":
        default:
            return new LiveCEX(exchange);
    }
}
