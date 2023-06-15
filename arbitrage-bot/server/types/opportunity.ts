import { Quote } from "../../src/exchanges/types/Quote";

export type Opportunity = {
    exchanges: string[];
    profit: number;
    quotes: Quote[];
};
