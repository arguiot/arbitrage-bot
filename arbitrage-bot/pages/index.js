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
import { PairList } from "../lib/pairs";
export default function Index({ environment }) {
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
        const { tokenA, tokenB } = PairList[environment][pair];
        setTokenA(tokenA);
        setTokenB(tokenB);
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
                                {Object.keys(PairList[environment]).map(
                                    (pair) => (
                                        <SelectItem key={pair} value={pair}>
                                            {pair}
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Skeleton className="w-1/4 h-12" />
                    )}
                </div>
                <div className="flex justify-between gap-4">
                    {connected ? (
                        <>
                            <ExchangeCard environment={environment} />
                            <ExchangeCard environment={environment} />
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

export async function getStaticProps() {
    const env = process.env.USE_TESTNET ? "development" : "production";
    return {
        props: {
            environment: env,
        },
    };
}
