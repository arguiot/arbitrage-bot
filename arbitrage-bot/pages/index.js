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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function Index() {
    const { toast } = useToast()
    const { isConnected } = useAccount();
    const { isDeployed, setTokenA, setTokenB, tokenA, tokenB, deploy, reset: pairReset } = usePairStore();
    const { reset: uniswapReset } = useUniswapStore();

    const selectedPair = async (pair) => {
        switch (pair) {
            case "ETH/USDT":
                setTokenA({
                    name: "ETH",
                    address: "0x0000000000000000000000000000000000000000",
                })
                setTokenB({
                    name: "USDT",
                    address: "0xdac17f958d2ee523a2206206994597c13d831ec7"
                })
                break;
            case "ETH/BTC":
                setTokenA({
                    name: "ETH",
                    address: "0x0000000000000000000000000000000000000000",
                })
                setTokenB({
                    name: "BTC",
                    address: null,
                })
                break;
            case "AAVE/ETH":
                setTokenA({
                    name: "AAVE",
                    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9"
                })
                setTokenB({
                    name: "ETH",
                    address: "0x0000000000000000000000000000000000000000",
                })
                break;
            case "TKA/TKB":
                const { tokenA: addressA, tokenB: addressB } = await deploy();
                toast({
                    title: "Deployed Token A and Token B",
                    description: `Token A address: ${addressA} Token B address: ${addressB}`,
                })
                break;
        }
    }

    return (
        <div className="prose mx-auto mt-8" >
            <div className="flex justify-between items-center">
                <h1>Arbitrage Bot</h1>
                <ConnectKitButton />
            </div>
            <Separator className="mb-8" />
            <div className="flex justify-between items-center">
                <h4>Used Pair</h4>
                <Select onValueChange={selectedPair} defaultValue={`${tokenA?.name}/${tokenB?.name}`}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Pair" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                        <SelectItem value="ETH/BTC">ETH/BTC</SelectItem>
                        <SelectItem value="AAVE/ETH">AAVE/ETH</SelectItem>
                        <SelectItem value="TKA/TKB">TKA/TKB</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-between items-center gap-4">
                <ExchangeCard id={1} />
                <ExchangeCard id={2} />
            </div>
            <Difference />
            <TradeBook />
            <Separator className="mt-8" />
            <Button className="mx-auto mt-12" variant="outline" onClick={() => {
                pairReset();
                uniswapReset();
            }}>
                Reset
            </Button>
        </div >
    );
}
