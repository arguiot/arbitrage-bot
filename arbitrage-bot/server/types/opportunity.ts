import { Token } from "@/src/exchanges/adapters/exchange";
import { Quote } from "../../src/exchanges/types/Quote";

export type Opportunity = {
    exchanges: string[];
    exchangesNames: string[];
    path: Token[];
    profit: number;
    quotes: Quote[];
};
