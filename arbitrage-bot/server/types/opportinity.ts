import { Token } from "../../scripts/exchanges/adapters/exchange";
import { Quote } from "../../scripts/exchanges/types/Quote";

export type Opportunity = {
    exchange1: string;
    exchange2: string;
    profit: number;
    percentProfit: number;
    quote1: Quote;
    quote2: Quote;
    tokenA: Token;
    tokenB: Token;
};
