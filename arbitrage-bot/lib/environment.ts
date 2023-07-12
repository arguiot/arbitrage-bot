import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useEnvironment = create(
    persist(
        (set, get) => ({
            environment: "development" as "development" | "production",
            setEnvironment: (env) => set({ environment: env }),
        }),
        {
            name: "environment",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
