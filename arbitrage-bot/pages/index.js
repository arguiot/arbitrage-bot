import { ConnectKitButton } from "connectkit";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAccount } from "wagmi";
import { Separator } from "@/components/ui/separator";
import ExchangeCard from "../components/exchange";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
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
import { EstimatedTime } from "../components/ui/estimated-time";
import Pair from "../components/pair";
export default function Index({ environment }) {
    const { connected, decisions, setDecisions, arbitrage } = useClientState();
    const [pair, setPair] = useState(1);
    useEffect(() => {
        Client.shared = new Client();
    }, []);

    const { toast } = useToast();
    const { reset: uniswapReset } = useUniswapStore();

    return (
        <>
            <div className="prose max-w-none mx-auto mt-8 px-8">
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
                    {/* <ConnectKitButton /> */}
                </div>
                <Separator className="mb-8" />

                {/* Repeat Pair component `pair` times */}
                {[...Array(pair)].map((_, i) => (
                    <Pair
                        key={i}
                        connected={connected}
                        environment={environment}
                    />
                ))}
                {Object.keys(PairList[environment]).length > pair && (
                    <button
                        className="flex mt-4 h-[100px] w-full items-center justify-center rounded-md border border-dashed text-sm"
                        onClick={() => {
                            setPair(pair + 1);
                        }}
                    >
                        Add pair
                    </button>
                )}
                {arbitrage && <EstimatedTime expectedTime={15000} />}
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
                                if (!decisions) {
                                    Client.shared.subscribeToDecision();
                                } else {
                                    Client.shared.unsubscribeFromDecision();
                                    toast({
                                        title: "Arbitrage Stopped",
                                        description:
                                            "The bot is no longer looking for arbitrage opportunities",
                                    });
                                }
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
            <TradeBook />
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
