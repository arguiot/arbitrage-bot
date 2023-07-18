import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TradeBook from "../components/tradeBook";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Client, useClientState } from "../lib/client";
import { EstimatedTime } from "../components/ui/estimated-time";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TokensView } from "../components/tokens";
import { PairsView } from "../components/pairsview";
import { useEnvironment } from "../lib/environment";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Status } from "@/components/pulse"

export default function Index() {
    const { connected, decisions, setDecisions, arbitrage } = useClientState();

    const { toast } = useToast();

    const { environment, setEnvironment } = useEnvironment();

    useEffect(() => {
        Client.shared.connect();
    }, []);

    return (
        <>
            <div className="prose max-w-none mx-auto mt-8 px-8">
                <div className="flex justify-between items-center">
                    <h1>
                        Arbitrage Bot{" "}
                        <Status connected={connected} />
                    </h1>
                    <Select value={environment} onValueChange={(env) => setEnvironment(env)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Environment" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="development">🛠️ Development</SelectItem>
                            <SelectItem value="production">🌐 Production</SelectItem>
                        </SelectContent>
                    </Select>
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
