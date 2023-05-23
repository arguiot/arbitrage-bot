import { BigNumber } from "ethers";
import { Exchange, Cost, Token } from "./adapters/exchange";
import { Quote } from "./types/Quote";
import { version, exchanges, Exchange as CCXTExchange, pro } from 'ccxt';
import Credentials, { ExchangeCredentials } from "../../server/credentials/Credentials";
type ExchangeKey = keyof typeof exchanges;
type ProKey = keyof typeof pro;
type CombinedExchanges = ExchangeKey | ProKey;

export class LiveCEX implements Exchange<CCXTExchange> {
    delegate: CCXTExchange;

    constructor(exchange: CombinedExchanges, credentials?: ExchangeCredentials) {
        const args = (credentials ?? Credentials.shared.exchanges[exchange]) ?? {};
        if (pro[exchange]) {
            this.delegate = new pro[exchange](args) as unknown as CCXTExchange;
        } else {
            this.delegate = new exchanges[exchange](args) as unknown as CCXTExchange;
        }
    }

    async getQuote(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<Quote> {
        // First we need to sort the tokens by their symbol
        const [token1, token2] = [tokenA, tokenB].sort((a, b) => a.name.localeCompare(b.name));
        const price = await this.delegate.watchTicker(`${token1.name}/${token2.name}`);

        return {
            amount: amountIn,
            amountOut: amountIn.toNumber() * (price.last ?? 0),
            price: price.last ?? 0,
            bid: price.bid ?? 0,
            ask: price.ask ?? 0,
            tokenA,
            tokenB,
        }
    }

    async estimateTransactionTime(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<number> {
        // Random time in ms, between 1-3 seconds
        return Math.random() * 2000 + 1000;
    }

    async estimateTransactionCost(amountIn: BigNumber, tokenA: Token, tokenB: Token): Promise<Cost> {
        // Random cost in wei, between 0.001-0.01 ETH
        return { costInDollars: Math.random() * 0.009 + 0.001 };
    }

    async swapExactTokensForTokens(amountIn: BigNumber, amountOutMin: BigNumber, path: string[], to: string, deadline: number): Promise<void> {
        // First we need to sort the tokens by their symbol
        const [token1, token2] = [tokenA, tokenB].sort((a, b) => a.name.localeCompare(b.name));
        const symbol = `${token1.name}/${token2.name}`;
        const side = token1.name === symbol.split("/")[0] ? "buy" : "sell";
        const type = this.delegate.has.createMarketOrder ? "market" : "limit";
        const order = await this.delegate.createOrder(symbol, type, side, amountIn.toNumber());
        console.log(order);
    }
}
