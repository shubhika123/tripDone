import { create } from 'zustand';

export interface SearchState {
  tripType: 'one-way' | 'round-trip';
  from: string;
  to: string;
  departureDate: string | null;
  returnDate: string | null;
  time: string | null;
  flexibility: 'exact' | '±1' | '±2' | '±3';
  setSearch: (data: Partial<SearchState>) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  tripType: 'one-way',
  from: '',
  to: '',
  departureDate: null,
  returnDate: null,
  time: null,
  flexibility: 'exact',
  setSearch: (data) => set((state) => ({ ...state, ...data })),
}));
