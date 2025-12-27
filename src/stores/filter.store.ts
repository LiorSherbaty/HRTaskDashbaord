import { create } from 'zustand';
import type { FilterState } from '@/types';
import { TaskStatus } from '@/types';

interface FilterStore extends FilterState {
  setSearchTerm: (term: string) => void;
  setShowBlockedOnly: (show: boolean) => void;
  setShowDueSoonOnly: (show: boolean) => void;
  setShowStaleOnly: (show: boolean) => void;
  setStatusFilter: (status: TaskStatus | 'all') => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

const initialState: FilterState = {
  searchTerm: '',
  showBlockedOnly: false,
  showDueSoonOnly: false,
  showStaleOnly: false,
  statusFilter: 'all',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  ...initialState,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setShowBlockedOnly: (showBlockedOnly) => set({ showBlockedOnly }),
  setShowDueSoonOnly: (showDueSoonOnly) => set({ showDueSoonOnly }),
  setShowStaleOnly: (showStaleOnly) => set({ showStaleOnly }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  clearFilters: () => set(initialState),

  hasActiveFilters: () => {
    const state = get();
    return (
      state.searchTerm !== '' ||
      state.showBlockedOnly ||
      state.showDueSoonOnly ||
      state.showStaleOnly ||
      state.statusFilter !== 'all'
    );
  },
}));
