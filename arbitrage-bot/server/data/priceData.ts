import { BigNumber } from "ethers";
import { PriceDataStore } from "../store/priceData";
import { getAdapter } from "./adapters";

export default async function priceData({ exchange, tokenA, tokenB, provider }) {
    const adapter = getAdapter(exchange, provider);
    const quote = await adapter.getQuote(
        BigNumber.from(1),
        tokenA,
        tokenB
    );

    PriceDataStore.shared.addQuote(exchange, quote);

    return { quote, exchange, ttf: 0.1, tokenA, tokenB };
}
