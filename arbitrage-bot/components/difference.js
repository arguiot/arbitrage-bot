import usePriceStore from "../lib/priceDataStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { calculateProfitProbability } from "@/scripts/arbiter/profitChances";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useEffect } from "react";
import useTradeBookStore from "../lib/tradesStore";
import { useToast } from "./ui/use-toast";

export default function Difference() {
    const { priceData1, priceData2 } = usePriceStore();
    const { addTrade } = useTradeBookStore();
    const { toast } = useToast()

    useEffect(() => {
        // Register a trade if the difference is greater than 1%
        if (priceData1 && priceData2) {
            const difference = Math.abs(priceData1.quote.price - priceData2.quote.price);
            const percentage = difference / priceData1.quote.price;
            if (percentage > 0.00001) {
                async function registerTrade() {
                    const opportunity = await fetch("/api/processOpportunity", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            tokenA: priceData1.tokenA,
                            tokenB: priceData2.tokenB,
                            exchangeA: priceData1.exchange,
                            exchangeB: priceData2.exchange,
                            amountIn: 1
                        })
                    }).then((res) => res.json());
                    console.log(opportunity);
                    addTrade(opportunity);
                }
                try {
                    registerTrade();
                } catch (e) {
                    toast({
                        title: "Error",
                        description: "Error fetching price data",
                    })
                }
            }
        }
    }, [priceData1, priceData2]);

    if (!priceData1 || !priceData2) {
        return <Skeleton />;
    }

    const difference = priceData1.quote.ask ?
        Math.max(
            Math.abs(priceData1.quote.bid - priceData2.quote.ask),
            Math.abs(priceData1.quote.ask - priceData2.quote.bid)
        ) :
        Math.abs(priceData1.quote.price - priceData2.quote.price);
    const percentage = difference / priceData1.quote.price;

    const prob = calculateProfitProbability({
        ttf: 1, // 1 second
        delta: percentage
    })

    const data = [
        {
            subject: 'Difference',
            A: percentage * 100,
            fullMark: 4,
        },
        {
            subject: 'Profit Probability',
            A: prob,
            fullMark: 1,
        },
        {
            subject: 'Time to finality',
            A: priceData1.ttf + priceData2.ttf,
            fullMark: 15,
        },
    ];

    // If exchange supports bid/ask add this to the chart
    if (priceData1.quote.bid) {
        data.push({
            subject: 'Bid/Ask',
            A: priceData1.quote.bid / priceData2.quote.ask,
            fullMark: 1,
        });
    }

    return <>
        <div className="mt-4 flex justify-between items-center gap-4">
            <div className="w-full">
                <div className="text-xl font-bold">Difference: {(percentage * 100).toFixed(3)}%</div>
                <Progress value={(percentage / 0.04) * 100} />
            </div>
            {/* <div className="w-full">
                <div className="text-xl font-bold">Probability of Profit: {(prob * 100).toFixed(2)}%</div>
                <Progress value={prob * 100} />
            </div> */}
        </div>
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarAngleAxis dataKey="fullMark" />
                    <PolarRadiusAxis />
                    <Radar name="Data" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} animationDuration={0} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    </>;
}
