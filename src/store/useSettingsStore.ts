import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  language: 'EN' | 'HI';
  currency: 'USD' | 'INR';
  setLanguage: (lang: 'EN' | 'HI') => void;
  setCurrency: (cur: 'USD' | 'INR') => void;
  getDisplayedPrice: (amountInUSD: number) => string;
}

// Mock exchange rate (1 USD = 83 INR)
const EXCHANGE_RATE = 83;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'EN',
      currency: 'USD',
      setLanguage: (lang) => set({ language: lang }),
      setCurrency: (cur) => set({ currency: cur }),
      getDisplayedPrice: (amountInUSD: number) => {
        const { currency } = get();
        if (currency === 'INR') {
          return `₹${Math.round(amountInUSD * EXCHANGE_RATE).toLocaleString('en-IN')}`;
        }
        return `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }),
    {
      name: 'settings-store',
    }
  )
);
