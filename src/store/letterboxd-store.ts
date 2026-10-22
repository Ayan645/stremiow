'use client';

import { create } from 'zustand';
import type { MetaPreview } from '@/lib/stremio/types';
import {
  fetchLetterboxdWatchlist,
  fetchLetterboxdPopular,
  fetchLetterboxdTop250,
  getLetterboxdManifestUrl,
  getLetterboxdFilmUrl,
} from '@/lib/letterboxd/stremboxd';
import { addonManager } from '@/lib/stremio/addon-manager';

export interface LetterboxdDiaryEntry {
  id?: string;
  title: string;
  year?: string | number;
  rating: number; // 0.5 to 5.0
  review?: string;
  dateLogged: number;
}

interface LetterboxdState {
  username: string | null;
  isConnected: boolean;
  watchlist: MetaPreview[];
  popular: MetaPreview[];
  top250: MetaPreview[];
  diary: LetterboxdDiaryEntry[];
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: number | null;
  error: string | null;

  // Actions
  initialize: () => void;
  connect: (username: string) => Promise<boolean>;
  sync: () => Promise<void>;
  disconnect: () => void;
  logFilm: (entry: Omit<LetterboxdDiaryEntry, 'dateLogged'>) => void;
  removeDiaryEntry: (dateLogged: number) => void;
}

const STORAGE_KEY_USER = 'stremioflix_letterboxd_user';
const STORAGE_KEY_WATCHLIST = 'stremioflix_letterboxd_watchlist';
const STORAGE_KEY_DIARY = 'stremioflix_letterboxd_diary';

export const useLetterboxdStore = create<LetterboxdState>((set, get) => ({
  username: null,
  isConnected: false,
  watchlist: [],
  popular: [],
  top250: [],
  diary: [],
  isLoading: false,
  isSyncing: false,
  lastSynced: null,
  error: null,

  initialize: () => {
    if (typeof window === 'undefined') return;

    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      const savedWatchlist = localStorage.getItem(STORAGE_KEY_WATCHLIST);
      const savedDiary = localStorage.getItem(STORAGE_KEY_DIARY);

      const parsedWatchlist = savedWatchlist ? JSON.parse(savedWatchlist) : [];
      const parsedDiary = savedDiary ? JSON.parse(savedDiary) : [];

      if (savedUser) {
        set({
          username: savedUser,
          isConnected: true,
          watchlist: parsedWatchlist,
          diary: parsedDiary,
        });

        // Trigger background sync
        get().sync();
      } else {
        // Even without login, prefetch Letterboxd Top 250 & Popular cinephile lists
        fetchLetterboxdTop250().then((top250) => set({ top250 })).catch(() => {});
        fetchLetterboxdPopular().then((popular) => set({ popular })).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to initialize Letterboxd store:', e);
    }
  },

  connect: async (username: string) => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) return false;

    set({ isLoading: true, error: null });

    try {
      // 1. Fetch Watchlist & Catalogs
      const [watchlist, popular, top250] = await Promise.all([
        fetchLetterboxdWatchlist(cleanUser),
        fetchLetterboxdPopular(cleanUser),
        fetchLetterboxdTop250(cleanUser),
      ]);

      // 2. Auto-install Stremboxd addon into Stremio Addon Manager
      const manifestUrl = getLetterboxdManifestUrl(cleanUser);
      addonManager.installAddon(manifestUrl, false).catch(() => {});

      // 3. Persist to storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USER, cleanUser);
        localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
      }

      set({
        username: cleanUser,
        isConnected: true,
        watchlist,
        popular,
        top250,
        isLoading: false,
        lastSynced: Date.now(),
        error: null,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect Letterboxd';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  sync: async () => {
    const { username } = get();
    if (!username) return;

    set({ isSyncing: true, error: null });

    try {
      const [watchlist, popular, top250] = await Promise.all([
        fetchLetterboxdWatchlist(username),
        fetchLetterboxdPopular(username),
        fetchLetterboxdTop250(username),
      ]);

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(watchlist));
      }

      set({
        watchlist,
        popular,
        top250,
        isSyncing: false,
        lastSynced: Date.now(),
      });
    } catch (err) {
      set({ isSyncing: false });
    }
  },

  disconnect: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_USER);
      localStorage.removeItem(STORAGE_KEY_WATCHLIST);
    }

    set({
      username: null,
      isConnected: false,
      watchlist: [],
      error: null,
    });
  },

  logFilm: (entry) => {
    const newEntry: LetterboxdDiaryEntry = {
      ...entry,
      dateLogged: Date.now(),
    };

    set((state) => {
      const updated = [newEntry, ...state.diary];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_DIARY, JSON.stringify(updated));
      }
      return { diary: updated };
    });
  },

  removeDiaryEntry: (dateLogged: number) => {
    set((state) => {
      const updated = state.diary.filter((d) => d.dateLogged !== dateLogged);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_DIARY, JSON.stringify(updated));
      }
      return { diary: updated };
    });
  },
}));
