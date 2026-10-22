import type {
  StremioUser,
  StremioSession,
  StremioCloudAddon,
  StremioLibraryItem,
} from './types';

const STREMIO_API_URL = 'https://api.strem.io/api';

class StremioCloudClient {
  private async call<T>(path: string, body: object): Promise<T> {
    try {
      const res = await fetch(`${STREMIO_API_URL}/${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || `Stremio API ${path} error`);
      }

      if (!res.ok) {
        throw new Error(`Stremio API HTTP ${res.status}: ${res.statusText}`);
      }

      return data.result as T;
    } catch (err) {
      console.error(`StremioCloudClient ${path} failed:`, err);
      throw err;
    }
  }

  /**
   * Log into Stremio Cloud using email and password
   */
  async login(email: string, password: string): Promise<StremioSession> {
    const result = await this.call<{ authKey: string; user: StremioUser }>('login', {
      email,
      password,
      facebook: false,
    });

    if (!result?.authKey || !result?.user) {
      throw new Error('Invalid login response from Stremio Cloud.');
    }

    return {
      authKey: result.authKey,
      user: result.user,
    };
  }

  /**
   * Fetch current user profile with an existing authKey
   */
  async getUser(authKey: string): Promise<StremioUser> {
    const user = await this.call<StremioUser>('getUser', { authKey });
    if (!user?._id) {
      throw new Error('Could not retrieve user profile from Stremio Cloud.');
    }
    return user;
  }

  /**
   * Fetch all user-installed addons from Stremio Cloud (e.g. Torrentio, Cyberflix, Debrid)
   */
  async getUserAddons(authKey: string): Promise<StremioCloudAddon[]> {
    const result = await this.call<{ addons: StremioCloudAddon[] }>('addonCollectionGet', {
      authKey,
      type: 'user',
      update: false,
    });

    return result?.addons || [];
  }

  /**
   * Fetch user's entire cloud library (watchlist, watch history, and progress)
   */
  async getLibrary(authKey: string): Promise<StremioLibraryItem[]> {
    // 1. Get list of IDs in datastore
    const ids = await this.call<Array<[string, string]>>('datastoreMeta', {
      authKey,
      collection: 'libraryItem',
    });

    if (!ids || ids.length === 0) {
      return [];
    }

    // 2. Fetch full library items
    const items = await this.call<StremioLibraryItem[]>('datastoreGet', {
      authKey,
      collection: 'libraryItem',
      ids: ids.map(([id]) => id),
      all: true,
    });

    return items || [];
  }

  /**
   * Push playback progress to Stremio Cloud datastore
   */
  async updatePlaybackProgress(
    authKey: string,
    item: {
      id: string;
      type: string;
      name: string;
      poster?: string;
      timeOffsetMs: number;
      durationMs: number;
      season?: number;
      episode?: number;
      videoId?: string;
    }
  ): Promise<void> {
    const now = new Date().toISOString();
    const isCompleted = item.durationMs > 0 && item.timeOffsetMs / item.durationMs >= 0.9;

    const changePayload: StremioLibraryItem = {
      _id: item.id,
      type: item.type as any,
      name: item.name,
      poster: item.poster,
      removed: false,
      temp: false,
      _mtime: now,
      state: {
        timeOffset: item.timeOffsetMs,
        duration: item.durationMs,
        season: item.season,
        episode: item.episode,
        video_id: item.videoId || item.id,
        lastWatched: now,
        timesWatched: isCompleted ? 1 : 0,
        flaggedWatched: isCompleted ? 1 : 0,
      },
    };

    await this.call('datastorePut', {
      authKey,
      collection: 'libraryItem',
      changes: [changePayload],
    });
  }

  /**
   * Log out session
   */
  async logout(authKey: string): Promise<void> {
    try {
      await this.call('logout', { authKey });
    } catch {
      // Ignore network errors on logout
    }
  }
}

export const stremioCloud = new StremioCloudClient();
