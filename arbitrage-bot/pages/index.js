import { ConnectKitButton } from "connectkit";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAccount } from "wagmi";
import { Separator } from "@/components/ui/separator";
import ExchangeCard from "../components/exchange";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import usePairStore from "../lib/tokenStore";
import useUniswapStore from "../lib/uniswapStore";
import Difference from "../components/difference";
import TradeBook from "../components/tradeBook";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Client, useClientState } from "../lib/client";

export default function Index() {
    const { connected, decisions, setDecisions } = useClientState();
    useEffect(() => {
        Client.shared = new Client();
    }, []);

    const { toast } = useToast();
    const { isConnected } = useAccount();
    const {
        isDeployed,
        setTokenA,
        setTokenB,
        tokenA,
        tokenB,
        deploy,
        reset: pairReset,
    } = usePairStore();
    const { reset: uniswapReset } = useUniswapStore();

    const selectedPair = async (pair) => {
        switch (pair) {
            case "ETH/USDT":
                setTokenA({
                    name: "ETH",
                    address: "0x0000000000000000000000000000000000000000",
                });
                setTokenB({
                    name: "USDT",
                    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
                });
                break;
            case "ETH/USDC":
                setTokenA({
                    name: "ETH",
                    address: "0x0000000000000000000000000000000000000000",
                });
                setTokenB({
                    name: "USDC",
                    address: "0x3c3aA68bc795e72833218229b0e53eFB4143A152",
                });
                break;
            case "ETH/BTC":
                setTokenA({
                    name: "ETH",
                    address: "0x0000000000000000000000000000000000000000",
                });
                setTokenB({
                    name: "BTC",
                    address: null,
                });
                break;
            case "AAVE/ETH":
                setTokenA({
                    name: "AAVE",
                    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
                });
                setTokenB({
                    name: "ETH",
                    address: "0x0000000000000000000000000000000000000000",
                });
                break;
            case "TKA/TKB":
                const { tokenA: addressA, tokenB: addressB } = await deploy();
                toast({
                    title: "Deployed Token A and Token B",
                    description: `Token A address: ${addressA} Token B address: ${addressB}`,
                });
                break;
        }
    };

    return (
        <>
            <div className="prose mx-auto mt-8">
                <div className="flex justify-between items-center">
                    <h1>
                        Arbitrage Bot{" "}
                        <span
                            className={
                                connected ? "text-green-500" : "text-red-500"
                            }
                        >
                            ·
                        </span>
                    </h1>
                    <ConnectKitButton />
                </div>
                <Separator className="mb-8" />
                <div className="flex justify-between items-center">
                    <h4>Used Pair</h4>
                    {connected ? (
                        <Select
                            onValueChange={selectedPair}
                            defaultValue={`${tokenA?.name}/${tokenB?.name}`}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Pair" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ETH/USDT">
                                    ETH/USDT
                                </SelectItem>
                                <SelectItem value="ETH/USDC">
                                    ETH/USDC
                                </SelectItem>
                                <SelectItem value="ETH/BTC">ETH/BTC</SelectItem>
                                <SelectItem value="AAVE/ETH">
                                    AAVE/ETH
                                </SelectItem>
                                <SelectItem value="TKA/TKB">TKA/TKB</SelectItem>
                            </SelectContent>
                        </Select>
                    ) : (
                        <Skeleton className="w-1/4 h-12" />
                    )}
                </div>
                <div className="flex justify-between gap-4">
                    {connected ? (
                        <>
                            <ExchangeCard id={1} />
                            <ExchangeCard id={2} />
                        </>
                    ) : (
                        <>
                            <Skeleton className="w-1/2 h-96" />
                            <Skeleton className="w-1/2 h-96" />
                        </>
                    )}
                </div>
                {connected && <Difference />}
                <Separator className="mt-8" />
                <div className="flex justify-between mt-12">
                    <Button
                        variant="outline"
                        onClick={() => {
                            pairReset();
                            uniswapReset();
                            Client.shared.reset();
                            toast({
                                title: "Reset",
                                description: "Reset all data",
                            });
                        }}
                    >
                        Reset
                    </Button>
                    {connected ? (
                        <Button
                            variant={decisions ? "destructive" : "primary"}
                            onClick={() => {
                                Client.shared.subscribeToDecision();
                                setDecisions(!decisions);
                            }}
                        >
                            {decisions ? "Stop" : "Start"} Arbitrage
                        </Button>
                    ) : (
                        <Skeleton className="w-1/4 h-12" />
                    )}
                </div>
            </div>
            {connected ? (
                <TradeBook />
            ) : (
                <div className="py-10 px-8">
                    <Skeleton className="w-full h-32" />
                </div>
            )}
        </>
    );
}
