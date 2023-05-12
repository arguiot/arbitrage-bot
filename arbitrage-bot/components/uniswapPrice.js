import useSWR, { mutate } from 'swr'
import { Button } from "@/components/ui/button"
export default function UniswapPrice({
    factoryAddress,
    routerAddress,
    tokenA,
    tokenB
}) {
    const fetcher = (url) => fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            exchange: "uniswap",
            factoryAddress,
            routerAddress,
            tokenA,
            tokenB
        }),
    }).then((res) => res.json());

    const { data: priceData, error } = useSWR("/api/priceData", fetcher, {
        refreshInterval: 1000, // refresh every second
    });

    const addLiquidity = async () => {
        const response = await fetch("/api/addLiquidity", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                routerAddress,
                liquidityA: 100,
                liquidityB: 100,
                tokenA,
                tokenB
            }),
        });
        const result = await response.json();
        if (result.success) {
            console.log("Liquidity added");
            // Revalidate the price data
            mutate("/api/priceData");
        }
    }

    if (error) return <div>Error fetching price data</div>;
    if (!priceData) return <div>Loading...</div>;

    return (
        <div>
            { priceData.quote.price == 0 ? <>
                <Button onClick={addLiquidity}>
                    Add sample liquidity
                </Button>
            </> : <>
                <div>Price: {priceData.quote.price}</div>
            </>}
        </div>
    );
}
