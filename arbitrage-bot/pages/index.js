import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import useUniswapStore from "../lib/uniswapStore";
import TradeBook from "../components/tradeBook";

import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Client, useClientState } from "../lib/client";
import { PairList } from "../lib/pairs";
import { EstimatedTime } from "../components/ui/estimated-time";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokensView } from "../components/tokens";
import { PairsView } from "../components/pairsview";

export default function Index({ environment }) {
    const { connected, decisions, setDecisions, arbitrage } = useClientState();

    const { toast } = useToast();
    const { reset: uniswapReset } = useUniswapStore();

    useEffect(() => {
        Client.shared = new Client();
        if (!connected) {
            setTimeout(() => {
                Client.shared.subscribeToAll();
            }, 1000);
        }
    }, []);

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
                <Tabs defaultValue="tokens" className="w-full">
                    <TabsList>
                        <TabsTrigger value="tradebook">Tradebook</TabsTrigger>
                        <TabsTrigger value="pairs">Pairs</TabsTrigger>
                        <TabsTrigger value="tokens">Tokens</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tradebook">
                        <TradeBook />
                    </TabsContent>
                    <TabsContent value="tokens">
                        <TokensView />
                    </TabsContent>
                    <TabsContent value="pairs">
                        <PairsView />
                    </TabsContent>
                </Tabs>

                {arbitrage && <EstimatedTime expectedTime={15000} />}
                <Separator className="mt-8" />
                <div className="flex justify-between mt-12">
                    <Button
                        variant="outline"
                        onClick={() => {
                            // reset storage
                            localStorage.clear();

                            {/* uniswapReset();
                            Client.shared.reset(); */}
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
