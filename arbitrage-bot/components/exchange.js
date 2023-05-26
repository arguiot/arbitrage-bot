import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import useUniswapStore from "../lib/uniswapStore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import UniswapPrice from "./uniswapPrice";
import usePriceStore from "../lib/priceDataStore";
import usePairStore from "../lib/tokenStore";
import CexPrice from "./cexPrice";
import { Client } from "../lib/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExchangeCard({ id }) {
    const [exchange, setExchange] = useState(null); // ["local-cex", "local-uniswap", "binance", "kraken"]
    const { tokenA, tokenB } = usePairStore();
    const { getQuote } = usePriceStore();

    const { isDeployed, deploy, factory, router } = useUniswapStore();

    const [isDeploying, setIsDeploying] = useState(false);
    const [buy, setBuy] = useState(null);

    const priceData = getQuote(exchange);

    async function deployExchange(value) {
        setIsDeploying(true);
        switch (value) {
            case "local-cex":
                // return;
                break;
            case "binance":
                Client.shared.subscribeToPriceData(
                    value,
                    "cex",
                    tokenA,
                    tokenB
                );
                break;
            case "kraken":
                Client.shared.subscribeToPriceData(
                    value,
                    "cex",
                    tokenA,
                    tokenB
                );
                break;
            case "local-uniswap":
                await deploy();
                break;
            case "uniswap":
                Client.shared.subscribeToPriceData(
                    value,
                    "dex",
                    tokenA,
                    tokenB
                );
                break;
        }
        setExchange(value);
        setIsDeploying(false);
    }

    function nameFor(exchange) {
        switch (exchange) {
            case "local-cex":
                return "Local CEX";
            case "binance":
                return "Binance";
            case "kraken":
                return "Kraken";
            case "local-uniswap":
                return "Local Uniswap";
            case "uniswap":
                return "Uniswap V2";
            default:
                return "Unknown";
        }
    }

    function getExchange(exchange) {
        switch (exchange) {
            case "local-cex":
                return <CexPrice priceData={priceData} />;
            case "binance":
                return <CexPrice priceData={priceData} />;
            case "kraken":
                return <CexPrice priceData={priceData} />;
            case "local-uniswap":
                return (
                    <UniswapPrice
                        factoryAddress={factory}
                        routerAddress={router}
                        tokenA={tokenA}
                        tokenB={tokenB}
                    />
                );
            case "uniswap":
                return <CexPrice priceData={priceData} />;
            default:
                return null;
        }
    }

    function buyTokens() {
        const _tokenA = buy.token === tokenA ? tokenB : tokenA;
        const _tokenB = buy.token === tokenA ? tokenA : tokenB;
        const amountIn =
            buy.token == tokenB
                ? buy.amount / priceData.price
                : buy.amount * priceData.price;
        Client.shared.buy(
            buy.exchange,
            _tokenA,
            _tokenB,
            amountIn,
            parseFloat(buy.amount)
        );
    }

    const select = (
        <Select
            onValueChange={(value) => {
                deployExchange(value);
            }}
            value={exchange}
        >
            <SelectTrigger className="w-[180px]">
                {isDeploying && <Loader2 className="animate-spin" />}
                <SelectValue placeholder="Connect exchange" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="uniswap">Uniswap V2</SelectItem>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="kraken">Kraken</SelectItem>
            </SelectContent>
        </Select>
    );

    return (
        <Card className="w-1/2">
            {exchange !== null ? (
                <>
                    <CardHeader>
                        <CardTitle>Exchange</CardTitle>
                        <CardDescription>{select}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between flex-col">
                            {getExchange(exchange)}
                            <div className="flex justify-between">
                                {priceData && (
                                    <>
                                        <Button
                                            onClick={() =>
                                                setBuy({
                                                    exchange,
                                                    token: tokenA,
                                                    amount: 0,
                                                    buying: false,
                                                })
                                            }
                                        >
                                            Buy {tokenA.name}
                                        </Button>
                                        <Button
                                            onClick={() =>
                                                setBuy({
                                                    exchange,
                                                    token: tokenB,
                                                    amount: 0,
                                                    buying: false,
                                                })
                                            }
                                        >
                                            Buy {tokenB.name}
                                        </Button>
                                    </>
                                )}
                                <Dialog
                                    open={buy !== null}
                                    onOpenChange={(open) => {
                                        if (open === false) setBuy(null);
                                    }}
                                >
                                    {buy && (
                                        <>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Buy {buy.token.name} on{" "}
                                                        {nameFor(buy.exchange)}
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Current balance:{" "}
                                                        {priceData.balanceA}{" "}
                                                        {priceData.tokenA.name}{" "}
                                                        / {priceData.balanceB}{" "}
                                                        {priceData.tokenB.name}
                                                    </DialogDescription>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label
                                                                htmlFor="name"
                                                                className="text-right"
                                                            >
                                                                Amount
                                                            </Label>
                                                            <Input
                                                                id="name"
                                                                value={
                                                                    buy.amount
                                                                }
                                                                onChange={(e) =>
                                                                    setBuy({
                                                                        ...buy,
                                                                        amount: e
                                                                            .target
                                                                            .value,
                                                                    })
                                                                }
                                                                className="col-span-3"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label
                                                                htmlFor="name"
                                                                className="text-right"
                                                            >
                                                                You pay
                                                            </Label>
                                                            <Input
                                                                id="name"
                                                                value={`${
                                                                    buy.token ==
                                                                    tokenB
                                                                        ? buy.amount /
                                                                          priceData.price
                                                                        : buy.amount *
                                                                          priceData.price
                                                                } ${
                                                                    buy.token ==
                                                                    tokenB
                                                                        ? priceData
                                                                              .tokenA
                                                                              .name
                                                                        : priceData
                                                                              .tokenB
                                                                              .name
                                                                }`}
                                                                className="col-span-3"
                                                                disabled
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={buyTokens}
                                                        disabled={buy.buying}
                                                    >
                                                        {buy.buying && (
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        )}
                                                        🤑 Buy {buy.amount}{" "}
                                                        {buy.token.name}
                                                    </Button>
                                                </DialogHeader>
                                            </DialogContent>
                                        </>
                                    )}
                                </Dialog>
                            </div>
                        </div>
                    </CardContent>
                </>
            ) : (
                <div className="relative">
                    <Skeleton className="relative h-96 w-full z-0" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        {select}
                    </div>
                </div>
            )}
        </Card>
    );
}
