/**
 * Calculates the recommended bet size based on the profit probability, profit delta, and maximum slippage.
 *
 * @param param0 - The options object.
 * @returns The recommended bet size, expressed as a decimal between 0 and 1.
 */
export function betSize({
    profitProbability,
    profitDelta,
    maximumSlippage,
}: {
    profitProbability: number; // Chances of winning
    profitDelta: number; // The percentage of profit you want to make
    maximumSlippage: number; // The maximum slippage you are willing to take
}): number {
    const winningOutcome = profitProbability / (1 - maximumSlippage);
    const loosingOutcome = (1 - profitProbability) / profitDelta;
    return winningOutcome - loosingOutcome;
}
