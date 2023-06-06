import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const usePairStore = create(
    persist(
        (set) => ({
            tokenA: null,
            tokenB: null,
            isDeployed: false,
            deploy: async function () {
                // Call the `/api/deploy` endpoint
                const response = await fetch("/api/deployPair");
                const { tokenA, tokenB } = await response.json();
                set({
                    tokenA: { name: "TKA", address: tokenA },
                    tokenB: { name: "TKB", address: tokenB },
                    isDeployed: true,
                });
                return { tokenA, tokenB };
            },
            setTokenA: (tokenA) => set({ tokenA }),
            setTokenB: (tokenB) => set({ tokenB }),
            reset: () => set({ tokenA: null, tokenB: null, isDeployed: false }),
        }),
        {
            name: "token-store",
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default usePairStore;
