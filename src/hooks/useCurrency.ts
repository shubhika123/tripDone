import { useSettingsStore } from '@/store/useSettingsStore';

export const useCurrency = () => {
  const { formatPrice, currency, hasHydrated } = useSettingsStore();

  // Hydration safety: Return INR formatted string until client hydrates
  // to avoid server/client mismatch (server doesn't have access to localStorage/Persist)
  const tPrice = (amountInINR: number): string => {
    if (!hasHydrated) return `₹${Math.round(amountInINR).toLocaleString('en-IN')}`;
    return formatPrice(amountInINR);
  };

  return { tPrice, currency, hasHydrated };
};
