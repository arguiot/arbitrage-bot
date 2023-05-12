import { create } from 'zustand';

const usePriceStore = create((set) => ({
    priceData1: null,
    priceData2: null,
    setPriceData1: (data) => set({ priceData1: data }),
    setPriceData2: (data) => set({ priceData2: data }),
}));

export default usePriceStore;
