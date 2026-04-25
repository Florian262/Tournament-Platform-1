import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TournamentFilters {
  gameId: string;
  platform: string;
  region: string;
  status: string;
  search: string;
}

interface TournamentState {
  filters: TournamentFilters;
  setFilter: (key: keyof TournamentFilters, value: string) => void;
  clearFilters: () => void;
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
}

const initialFilters: TournamentFilters = {
  gameId: '',
  platform: '',
  region: '',
  status: '',
  search: '',
};

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set) => ({
      filters: initialFilters,
      setFilter: (key, value) => 
        set((state) => ({ 
          filters: { ...state.filters, [key]: value } 
        })),
      clearFilters: () => set({ filters: initialFilters }),
      showMobileFilters: false,
      setShowMobileFilters: (show) => set({ showMobileFilters: show }),
    }),
    {
      name: 'tournament-storage',
      partialize: (state) => ({ filters: state.filters }), // Only persist filters
    }
  )
);
