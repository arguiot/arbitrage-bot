import { ConnectKitButton } from 'connectkit';
import { useState } from 'react';
import useSWR from 'swr'
import { useAccount } from "wagmi";

export default function Index() {
    const { address, isConnected } = useAccount();
    const { data: priceData, error } = useSWR("/api/priceData", {
        refreshInterval: 1000, // refresh every second
    });

    return (
        <div>
            <h1>Live Price Data</h1>
            <ConnectKitButton />
            {isConnected && (
                <div>
                    {error && <div>Error fetching price data</div>}
                    {!error && priceData && (
                        <div>
                            <p>Uniswap Price: {priceData.uniswapPrice}</p>
                            <p>Binance Price: {priceData.binancePrice}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
