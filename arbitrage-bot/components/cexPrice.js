import usePriceStore from "../lib/priceDataStore";

export default function CexPrice({ exchange }) {
    const { getQuote } = usePriceStore();

    const priceData = getQuote(exchange);

    if (!priceData) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h3><span className='text-green-500'>·</span> Live Price: {(priceData.price).toFixed(2)}$</h3>
            {priceData.bid && <>
                <h3><span className='text-green-500'>·</span> Bid: {(priceData.bid).toFixed(2)}</h3>
                <h3><span className='text-green-500'>·</span> Ask: {(priceData.ask).toFixed(2)}</h3>
            </>}
        </div>
    );
}
