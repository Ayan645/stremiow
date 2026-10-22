import { create } from 'zustand';
import type { MetaPreview, WatchHistoryItem } from '@/lib/stremio/types';

interface LibraryState {
  // Watchlist (My List)
  watchlist: MetaPreview[];
  
  // Continue Watching
  watchHistory: WatchHistoryItem[];
  
  // Actions
  addToWatchlist: (item: MetaPreview) => void;
  removeFromWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
  
  updateWatchHistory: (item: WatchHistoryItem) => void;
  removeFromHistory: (id: string) => void;
  getWatchProgress: (id: string) => WatchHistoryItem | undefined;
  
  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  watchlist: [],
  watchHistory: [],
  
  addToWatchlist: (item) => {
    set((state) => {
      if (state.watchlist.some(w => w.id === item.id)) return state;
      const updated = { ...state, watchlist: [item, ...state.watchlist] };
      return updated;
    });
    get().saveToStorage();
  },
  
  removeFromWatchlist: (id) => {
    set((state) => ({
      watchlist: state.watchlist.filter(w => w.id !== id),
    }));
    get().saveToStorage();
  },
  
  isInWatchlist: (id) => {
    return get().watchlist.some(w => w.id === id);
  },
  
  updateWatchHistory: (item) => {
    set((state) => {
      const existing = state.watchHistory.filter(h => h.id !== item.id);
      return { watchHistory: [item, ...existing].slice(0, 50) }; // Keep last 50
    });
    get().saveToStorage();
  },
  
  removeFromHistory: (id) => {
    set((state) => ({
      watchHistory: state.watchHistory.filter(h => h.id !== id),
    }));
    get().saveToStorage();
  },
  
  getWatchProgress: (id) => {
    return get().watchHistory.find(h => h.id === id);
  },
  
  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    
    try {
      const watchlist = localStorage.getItem('stremioflix_watchlist');
      const history = localStorage.getItem('stremioflix_history');
      
      set({
        watchlist: watchlist ? JSON.parse(watchlist) : [],
        watchHistory: history ? JSON.parse(history) : [],
      });
    } catch (error) {
      console.error('Failed to load library from storage:', error);
    }
  },
  
  saveToStorage: () => {
    if (typeof window === 'undefined') return;
    
    const state = get();
    try {
      localStorage.setItem('stremioflix_watchlist', JSON.stringify(state.watchlist));
      localStorage.setItem('stremioflix_history', JSON.stringify(state.watchHistory));
    } catch (error) {
      console.error('Failed to save library to storage:', error);
    }
  },
}));
