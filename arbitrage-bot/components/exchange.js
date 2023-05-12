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


export default function ExchangeCard({ id }) {
    const [exchange, setExchange] = useState(null); // ["local-cex", "local-uniswap"
    const { tokenA, tokenB } = usePairStore();
    const { isDeployed, deploy, factory, router } = useUniswapStore();

    const [isDeploying, setIsDeploying] = useState(false);

    async function deployExchange(value) {
        setIsDeploying(true);
        if (value === "local-cex") {
            // return;
        }
        if (value === "local-uniswap") {
            await deploy();
        }
        setExchange(value);
        setIsDeploying(false);
    }

    return <Card className="w-1/2">
        {exchange !== null ? <>
            <CardHeader>
                <CardTitle>Exchange</CardTitle>
                <CardDescription>{
                    exchange === "local-cex" ? "FakeCEX" : "FakeDEX"
                }</CardDescription>
            </CardHeader>
            <CardContent>
                {
                    exchange === "local-cex" ? <CexPrice id={id} /> : <UniswapPrice factoryAddress={factory} routerAddress={router} tokenA={tokenA} tokenB={tokenB} />
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
                    </SelectContent>
                </Select>
            </div>
        </div>}
    </Card>
}
