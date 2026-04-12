import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  language: 'EN' | 'HI';
  currency: 'USD' | 'INR';
  hasHydrated: boolean;
  exchangeRate: number;
  lastRateUpdate: number;
  setLanguage: (lang: 'EN' | 'HI') => void;
  setCurrency: (cur: 'USD' | 'INR') => void;
  setHasHydrated: (val: boolean) => void;
  fetchExchangeRate: () => Promise<void>;
  formatPrice: (amountInINR: number) => string;
}

const DEFAULT_RATE = 83.5;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'EN',
      currency: 'USD',
      hasHydrated: false,
      exchangeRate: DEFAULT_RATE,
      lastRateUpdate: 0,
      setLanguage: (lang) => set({ language: lang }),
      setCurrency: (cur) => {
        set({ currency: cur });
        if (cur === 'USD') get().fetchExchangeRate();
      },
      setHasHydrated: (val) => set({ hasHydrated: val }),
      
      fetchExchangeRate: async () => {
        const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY || 'f840affdc430baf5dc4513ff';
        const now = Date.now();
        const state = get();
        
        // Cache rate for 12 hours (43,200,000 ms) unless force is needed
        if (state.lastRateUpdate && now - state.lastRateUpdate < 43200000 && state.exchangeRate !== DEFAULT_RATE) {
          console.log('Using cached exchange rate:', state.exchangeRate);
          return;
        }

        try {
          console.log('Fetching fresh exchange rates...');
          const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`);
          const data = await res.json();
          if (data.result === 'success' && data.conversion_rates?.INR) {
            set({ 
              exchangeRate: data.conversion_rates.INR,
              lastRateUpdate: now
            });
            console.log('Exchange rate updated successfully:', data.conversion_rates.INR);
          } else {
            console.warn('Exchange rate API returned success but missing INR rate or failed:', data.result);
          }
        } catch (error) {
          console.error('Failed to fetch exchange rate, using default:', error);
          // Don't overwrite if we already have a reasonably good rate
          if (get().exchangeRate === DEFAULT_RATE) {
            set({ exchangeRate: DEFAULT_RATE });
          }
        }
      },

      formatPrice: (amountInINR: number) => {
        const { currency, exchangeRate } = get();
        if (currency === 'INR') {
          return `₹${Math.round(amountInINR).toLocaleString('en-IN')}`;
        }
        // Assuming input is in INR, convert to USD
        const amountInUSD = amountInINR / exchangeRate;
        return `$${amountInUSD.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
    }),
    {
      name: 'settings-store',
      onRehydrateStorage: (state) => {
        return () => {
          state.setHasHydrated(true);
          state.fetchExchangeRate();
        };
      },
    }
  )
);
