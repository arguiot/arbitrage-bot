import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import useUniswapStore from "../lib/uniswapStore";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import UniswapPrice from "./uniswapPrice";
import usePairStore from "../lib/tokenStore";
import CexPrice from "./cexPrice";
import { Client } from "../lib/client";


export default function ExchangeCard({ id }) {
    const [exchange, setExchange] = useState(null); // ["local-cex", "local-uniswap", "binance", "kraken"]
    const { tokenA, tokenB } = usePairStore();
    const { isDeployed, deploy, factory, router } = useUniswapStore();

    const [isDeploying, setIsDeploying] = useState(false);

    async function deployExchange(value) {
        setIsDeploying(true);
        switch (value) {
            case "local-cex":
                // return;
                break;
            case "binance":
                Client.shared.subscribeToPriceData(value, "cex", tokenA, tokenB);
                break;
            case "kraken":
                Client.shared.subscribeToPriceData(value, "cex", tokenA, tokenB);
                break;
            case "local-uniswap":
                await deploy();
                break;
            case "uniswap":
                Client.shared.subscribeToPriceData(value, "dex", tokenA, tokenB);
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
                return <CexPrice id={id} exchange={exchange} />;
            case "binance":
                return <CexPrice id={id} exchange={exchange} />;
            case "kraken":
                return <CexPrice id={id} exchange={exchange} />;
            case "local-uniswap":
                return <UniswapPrice factoryAddress={factory} routerAddress={router} tokenA={tokenA} tokenB={tokenB} />;
            case "uniswap":
                return <CexPrice id={id} exchange={exchange} />;
            default:
                return null;
        }
    }

    return <Card className="w-1/2">
        {exchange !== null ? <>
            <CardHeader>
                <CardTitle>Exchange</CardTitle>
                <CardDescription>{
                    nameFor(exchange)
                }</CardDescription>
            </CardHeader>
            <CardContent>
                {
                    getExchange(exchange)
                }
            </CardContent>
        </> : <div className="relative">
            <Skeleton className="relative h-96 w-full z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <Select onValueChange={(value) => {
                    deployExchange(value);
                }}>
                    <SelectTrigger className="w-[180px]">
                        {isDeploying && <Loader2 className="animate-spin" />}
                        <SelectValue placeholder="Connect exchange" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="local-cex">FakeCEX</SelectItem>
                        <SelectItem value="local-uniswap">FakeDEX</SelectItem>
                        <SelectItem value="uniswap">Uniswap V2</SelectItem>
                        <SelectItem value="binance">Binance</SelectItem>
                        <SelectItem value="kraken">Kraken</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>}
    </Card>
}
