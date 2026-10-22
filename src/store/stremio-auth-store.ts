import { create } from 'zustand';
import { stremioCloud } from '@/lib/stremio/cloud-client';
import { addonManager } from '@/lib/stremio/addon-manager';
import { useLibraryStore } from '@/store/library-store';
import type { StremioUser, StremioLibraryItem, WatchHistoryItem, MetaPreview } from '@/lib/stremio/types';

interface StremioAuthState {
  user: StremioUser | null;
  authKey: string | null;
  isLoggedIn: boolean;
  isSyncing: boolean;
  syncStatusMessage: string;
  syncedAddonsCount: number;
  syncedItemsCount: number;
  lastSyncTimestamp: number | null;
  error: string | null;

  // Actions
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  loginWithAuthKey: (authKey: string) => Promise<boolean>;
  logout: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  pushWatchProgress: (item: WatchHistoryItem) => Promise<void>;
  loadSessionFromStorage: () => void;
  clearError: () => void;
}

const STORAGE_KEY_AUTH = 'stremioflix_stremio_session';

export const useStremioAuthStore = create<StremioAuthState>((set, get) => ({
  user: null,
  authKey: null,
  isLoggedIn: false,
  isSyncing: false,
  syncStatusMessage: '',
  syncedAddonsCount: 0,
  syncedItemsCount: 0,
  lastSyncTimestamp: null,
  error: null,

  clearError: () => set({ error: null }),

  loadSessionFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTH);
      if (raw) {
        const { authKey, user, lastSyncTimestamp } = JSON.parse(raw);
        if (authKey && user) {
          set({
            authKey,
            user,
            isLoggedIn: true,
            lastSyncTimestamp: lastSyncTimestamp || null,
          });
          // Auto-trigger background sync
          get().syncFromCloud();
        }
      }
    } catch (e) {
      console.warn('Failed to restore Stremio session:', e);
    }
  },

  loginWithCredentials: async (email: string, password: string) => {
    set({ isSyncing: true, error: null, syncStatusMessage: 'Authenticating with Stremio Cloud...' });
    try {
      const session = await stremioCloud.login(email, password);
      set({
        user: session.user,
        authKey: session.authKey,
        isLoggedIn: true,
        syncStatusMessage: 'Sign in successful. Synchronizing library & addons...',
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({
          authKey: session.authKey,
          user: session.user,
          lastSyncTimestamp: Date.now(),
        }));
      }

      await get().syncFromCloud();
      set({ isSyncing: false, syncStatusMessage: 'Ready' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ error: message, isSyncing: false, syncStatusMessage: '' });
      return false;
    }
  },

  loginWithAuthKey: async (authKey: string) => {
    const cleanKey = authKey.trim();
    if (!cleanKey) return false;

    set({ isSyncing: true, error: null, syncStatusMessage: 'Validating Stremio Auth Key...' });
    try {
      const user = await stremioCloud.getUser(cleanKey);
      set({
        user,
        authKey: cleanKey,
        isLoggedIn: true,
        syncStatusMessage: 'Key validated. Synchronizing library & addons...',
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify({
          authKey: cleanKey,
          user,
          lastSyncTimestamp: Date.now(),
        }));
      }

      await get().syncFromCloud();
      set({ isSyncing: false, syncStatusMessage: 'Ready' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid auth key';
      set({ error: message, isSyncing: false, syncStatusMessage: '' });
      return false;
    }
  },

  syncFromCloud: async () => {
    const { authKey } = get();
    if (!authKey) return;

    set({ isSyncing: true, syncStatusMessage: 'Fetching addons and library from Stremio Cloud...' });

    try {
      // 1. Sync Addons
      const addons = await stremioCloud.getUserAddons(authKey);
      addonManager.importFromStremioCloud(addons);

      // 2. Sync Library Items
      const items = await stremioCloud.getLibrary(authKey);
      const libraryStore = useLibraryStore.getState();

      const newWatchlist: MetaPreview[] = [];
      const newHistory: WatchHistoryItem[] = [];

      for (const item of items) {
        if (item.removed) continue;

        const poster = item.poster;
        const name = item.name;

        // Watchlist (items bookmarked)
        if (!item.temp) {
          newWatchlist.push({
            id: item._id,
            type: item.type || 'movie',
            name,
            poster,
            background: item.background,
          });
        }

        // Continue Watching (items with active playback offset)
        if (item.state && item.state.timeOffset > 0) {
          const durationSec = Math.max(1, Math.round((item.state.duration || 0) / 1000));
          const currentSec = Math.round(item.state.timeOffset / 1000);
          const ratio = durationSec > 0 ? currentSec / durationSec : 0;

          // Only include if not finished (under 90%)
          if (ratio < 0.9) {
            newHistory.push({
              id: item._id,
              type: item.type || 'movie',
              name,
              poster,
              background: item.background,
              progress: Math.min(1, Math.max(0, ratio)),
              currentTime: currentSec,
              duration: durationSec,
              lastWatched: item.state.lastWatched ? Date.parse(item.state.lastWatched) : Date.now(),
              season: item.state.season,
              episode: item.state.episode,
              videoId: item.state.video_id,
            });
          }
        }
      }

      // Merge into local Zustand library store
      if (newWatchlist.length > 0) {
        // Merge without duplicates
        for (const wl of newWatchlist) {
          if (!libraryStore.isInWatchlist(wl.id)) {
            libraryStore.addToWatchlist(wl);
          }
        }
      }

      if (newHistory.length > 0) {
        for (const h of newHistory) {
          libraryStore.updateWatchHistory(h);
        }
      }

      const now = Date.now();
      set({
        isSyncing: false,
        syncedAddonsCount: addons.length,
        syncedItemsCount: items.length,
        lastSyncTimestamp: now,
        syncStatusMessage: `Synced ${addons.length} addons & ${items.length} titles.`,
      });

      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY_AUTH);
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.lastSyncTimestamp = now;
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.error('Stremio Cloud sync error:', err);
      set({
        isSyncing: false,
        syncStatusMessage: 'Sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'),
      });
    }
  },

  pushWatchProgress: async (item: WatchHistoryItem) => {
    const { authKey } = get();
    if (!authKey) return;

    try {
      await stremioCloud.updatePlaybackProgress(authKey, {
        id: item.id,
        type: item.type,
        name: item.name,
        poster: item.poster,
        timeOffsetMs: Math.round(item.currentTime * 1000),
        durationMs: Math.round(item.duration * 1000),
        season: item.season,
        episode: item.episode,
        videoId: item.videoId,
      });
    } catch (e) {
      console.warn('Failed to push watch progress to Stremio Cloud:', e);
    }
  },

  logout: async () => {
    const { authKey } = get();
    if (authKey) {
      await stremioCloud.logout(authKey);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
    set({
      user: null,
      authKey: null,
      isLoggedIn: false,
      syncedAddonsCount: 0,
      syncedItemsCount: 0,
      lastSyncTimestamp: null,
      syncStatusMessage: '',
    });
  },
}));
