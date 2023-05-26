import { z } from "zod";

export const tokenSchema = z.object({
    name: z.string().transform((val) => val.toUpperCase()),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const messageTypeSchema = z.object({
    type: z.enum(["subscribe", "unsubscribe", "silent", "reset", "buy"]),
    topic: z.enum(["priceData", "decision", "reset", "buy"]),
    query: z
        .object({
            exchange: z.string(),
            type: z.enum(["dex", "cex"]).optional(),
            tokenA: tokenSchema,
            tokenB: tokenSchema,
            amountIn: z.number().optional(),
            amountOut: z.number().optional(),
        })
        .optional(),
});

export type Token = z.TypeOf<typeof tokenSchema>;
export type Query = z.TypeOf<typeof messageTypeSchema>["query"];
export type MessageType = z.TypeOf<typeof messageTypeSchema>;
