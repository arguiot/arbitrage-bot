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
            routerAddress: z.string().optional(),
            factoryAddress: z.string().optional(),
        })
        .optional()
        .refine(
            (data) => {
                if (data?.type === "dex") {
                    return (
                        (data.routerAddress === undefined &&
                            data.factoryAddress === undefined) ||
                        (data.routerAddress !== undefined &&
                            data.factoryAddress !== undefined)
                    );
                } else {
                    return true;
                }
            },
            {
                message:
                    "When type is 'dex', both routerAddress and factoryAddress should be either present or absent.",
            }
        ),
});

export type Token = z.TypeOf<typeof tokenSchema>;
export type Query = z.TypeOf<typeof messageTypeSchema>["query"];
export type MessageType = z.TypeOf<typeof messageTypeSchema>;
