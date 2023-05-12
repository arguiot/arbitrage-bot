import useSWR, { mutate } from 'swr'
import { Button } from "@/components/ui/button"
import usePriceStore from '../lib/priceDataStore';
export default function CexPrice({ id }) {
    const { setPriceData1, setPriceData2 } = usePriceStore();
    const fetcher = (url) => fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            exchange: "fakecex",
        }),
    }).then((res) => res.json());

    const { data: priceData, error } = useSWR(`/api/priceData?id=${id}`, fetcher, {
        refreshInterval: 1000, // refresh every second
        onSuccess: (data) => {
            if (id == 1) {
                setPriceData1(data);
            } else {
                setPriceData2(data);
            }
        }
    });

    if (error) return <div>Error fetching price data</div>;
    if (!priceData) return <div>Loading...</div>;

    return (
        <div>
            <h3><span className='text-green-500'>·</span> Live Price: {(priceData.quote.price / 10e9).toFixed(2)}$</h3>
        </div>
    );
}
