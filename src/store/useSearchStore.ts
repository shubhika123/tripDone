import { create } from 'zustand';

export interface SearchState {
  tripType: 'one-way' | 'round-trip';
  from: string;
  to: string;
  departureDate: string | null;
  returnDate: string | null;
  time: string | null;
  flexibility: 'exact' | '±1' | '±2' | '±3';
  adults: number;
  selectedRoute: any | null;
  selectedModes: string[];
  routes: any[];
  flights: any[];
  trains: any[];
  buses: any[];
  taxi: any[];
  completedSteps: string[];
  skippedModes: string[];
  selectedFlight: any | null;
  selectedFlightPlatform: string | null;
  selectedTrain: any | null;
  selectedTrainPlatform: string | null;
  selectedTrainSeat: string | null;
  selectedBus: any | null;
  selectedBusPlatform: string | null;
  selectedCab: any | null;
  pickupTime: string | null;
  dropOffTime: string | null;
  alertEnabled: boolean;
  phoneNumber: string;
  isProUnlocked: boolean;
  setProUnlocked: () => void;
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
  adults: 1,
  selectedRoute: null,
  selectedModes: [],
  routes: [],
  flights: [],
  trains: [],
  buses: [],
  taxi: [],
  completedSteps: [],
  skippedModes: [],
  selectedFlight: null,
  selectedFlightPlatform: null,
  selectedTrain: null,
  selectedTrainPlatform: null,
  selectedTrainSeat: null,
  selectedBus: null,
  selectedBusPlatform: null,
  selectedCab: null,
  pickupTime: null,
  dropOffTime: null,
  alertEnabled: false,
  phoneNumber: '',
  isProUnlocked: false,
  setProUnlocked: () => set({ isProUnlocked: true }),
  setSearch: (data) => set((state) => ({ ...state, ...data })),
}));
