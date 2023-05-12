import { ConnectKitButton } from 'connectkit';
import { useState } from 'react';
import useSWR from 'swr'
import { useAccount } from "wagmi";
import { Separator } from "@/components/ui/separator"
import ExchangeCard from '../components/exchange';
import { Button } from "@/components/ui/button"
import { Check } from 'lucide-react';
import usePairStore from '../lib/tokenStore';
import useUniswapStore from '../lib/uniswapStore';
import Difference from '../components/difference';
import TradeBook from '../components/tradeBook';

export default function Index() {
    const { isConnected } = useAccount();
    const { isDeployed, deploy, reset: pairReset } = usePairStore();
    const { reset: uniswapReset } = useUniswapStore();

    return (
        <div className="prose mx-auto mt-8">
            <div className="flex justify-between items-center">
                <h1>Arbitrage Bot</h1>
                <ConnectKitButton />
            </div>
            <Separator className="mb-8" />
            <div className="flex justify-between items-center">
                <h4>Token A/B</h4>
                <Button variant="outline" disabled={isDeployed} onClick={() => {
                    deploy();
                }}>
                    {isDeployed ? <><Check className="mr-2 h-4 w-4" /> Available</> : "Deploy"}
                </Button>
            </div>
            <div className="flex justify-between items-center gap-4">
                <ExchangeCard id={1}/>
                <ExchangeCard id={2} />
            </div>
            <Difference />
            <TradeBook />
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
            <Separator className="mt-8" />
            <Button className="mx-auto mt-12" variant="outline" onClick={() => {
                pairReset();
                uniswapReset();
            }}>
                Reset
            </Button>
        </div>
    );
}
