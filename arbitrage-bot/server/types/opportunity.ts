import { Quote } from "../../src/exchanges/types/Quote";

export type Opportunity = {
    exchange1: string;
    exchange2: string;
    profit: number;
    percentProfit: number;
    quote1: Quote;
    quote2: Quote;
};
