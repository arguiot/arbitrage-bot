import { PairList } from "../lib/pairs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import ExchangeCard from "./exchange";
import { createContext, useEffect, useReducer, useState } from "react";
import { useClientState } from "../lib/client";

export const PairContext = createContext();
export const PairContextDispatch = createContext(); // Reducer dispatch

export default function Pair({ connected, environment }) {
    const { pairs, setPairs } = useClientState();

    const [currentPair, setCurrentPair] = useState(null);

    const [pair, dispatch] = useReducer(pairReducer, {
        tokenA: {},
        tokenB: {},
        followings: [],
    });

    const selectedPair = async (pair) => {
        setPairs([...pairs.filter((name) => name !== currentPair), pair]);
        const { tokenA, tokenB } = PairList[environment][pair];
        dispatch({ type: "setTokenA", payload: tokenA });
        dispatch({ type: "setTokenB", payload: tokenB });
        setCurrentPair(pair);
    };

    useEffect(() => {
        const initialPair = Object.values(PairList[environment]).find(
            (pair) => {
                const name = `${pair.tokenA?.name}/${pair.tokenB?.name}`;
                return !pairs.includes(name);
            }
        );
        const name = `${initialPair.tokenA?.name}/${initialPair.tokenB?.name}`;

        selectedPair(name);
    }, []);

    return (
        <PairContext.Provider value={pair}>
            <PairContextDispatch.Provider value={dispatch}>
                <div className="flex justify-between items-center">
                    <h4>Used Pair</h4>
                    {connected ? (
                        <Select
                            onValueChange={selectedPair}
                            value={currentPair}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Pair" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(PairList[environment])
                                    .filter(
                                        (pair) =>
                                            !pairs.includes(pair) ||
                                            pair === currentPair
                                    )
                                    .map((pair) => (
                                        <SelectItem key={pair} value={pair}>
                                            {pair}
                                        </SelectItem>
                                    ))}
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
                            <ExchangeCard environment={environment} />
                        </>
                    ) : (
                        <>
                            <Skeleton className="w-1/2 h-96" />
                            <Skeleton className="w-1/2 h-96" />
                            <Skeleton className="w-1/2 h-96" />
                        </>
                    )}
                </div>
            </PairContextDispatch.Provider>
        </PairContext.Provider>
    );
}

function pairReducer(state, action) {
    switch (action.type) {
        case "setTokenA":
            return { ...state, tokenA: action.payload };
        case "setTokenB":
            return { ...state, tokenB: action.payload };
        case "addFollowing":
            return {
                ...state,
                followings: [...state.followings, action.payload],
            };
        case "removeFollowing":
            return {
                ...state,
                followings: state.followings.filter(
                    (following) => following !== action.payload
                ),
            };
        default:
            throw new Error();
    }
}
