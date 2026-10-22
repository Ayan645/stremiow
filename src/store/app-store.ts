import { create } from 'zustand';
import type { InstalledAddon } from '@/lib/stremio/types';

interface AppState {
  // Initialization
  isInitialized: boolean;
  isLoading: boolean;
  
  // Navigation
  isSidebarOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  
  // Addons
  installedAddons: InstalledAddon[];
  
  // Actions
  setInitialized: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setInstalledAddons: (addons: InstalledAddon[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  isLoading: true,
  isSidebarOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  installedAddons: [],
  
  setInitialized: (value) => set({ isInitialized: value }),
  setLoading: (value) => set({ isLoading: value }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setInstalledAddons: (addons) => set({ installedAddons: addons }),
}));
