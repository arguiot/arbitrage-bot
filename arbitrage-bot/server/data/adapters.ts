import { Exchange } from '../../scripts/exchanges/adapters/exchange';
import { FakeCEX } from '../../scripts/exchanges/FakeCEX';
import { LiveCEX } from '../../scripts/exchanges/LiveCEX';
import { UniswapV2 } from '../../scripts/exchanges/UniswapV2';

export function getAdapter(exchange, wallet): Exchange<any> {
    switch (exchange) {
        case "uniswap":
            return new UniswapV2(null, null, wallet);
        case "local-cex":
            return new FakeCEX();
        case "binance":
        case "kraken":
        default:
            return new LiveCEX(exchange);
    }
}
