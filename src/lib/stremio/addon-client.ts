import type { AddonManifest, MetaPreview, Meta, Stream, Subtitle, ContentType } from './types';

const DEFAULT_TIMEOUT = 15000;

export class StremioAddonClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    // Normalize URL - remove trailing slash
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.json();
    } catch (primaryError) {
      clearTimeout(timeoutId);

      // Automatic Fallback to Next.js API Proxy
      // Bypasses browser CORS, ISP/DNS blocks, adblockers, and 307 redirect issues
      if (typeof window !== 'undefined') {
        try {
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
          const proxyRes = await fetch(proxyUrl);
          if (proxyRes.ok) {
            return await proxyRes.json();
          }
        } catch {
          // If proxy fails, rethrow primaryError
        }
      }

      if (primaryError instanceof DOMException && primaryError.name === 'AbortError') {
        throw new Error(`Request timeout for ${url}`);
      }
      throw primaryError;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getManifest(): Promise<AddonManifest> {
    return this.fetchJson<AddonManifest>('/manifest.json');
  }

  async getCatalog(
    type: ContentType,
    id: string,
    extra?: Record<string, string>
  ): Promise<MetaPreview[]> {
    let path = `/catalog/${type}/${id}`;
    if (extra && Object.keys(extra).length > 0) {
      const params = Object.entries(extra)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      path += `/${params}`;
    }
    path += '.json';
    const data = await this.fetchJson<{ metas?: MetaPreview[] }>(path);
    return data.metas || [];
  }

  async getMeta(type: ContentType, id: string): Promise<Meta | null> {
    try {
      const data = await this.fetchJson<{ meta?: Meta }>(`/meta/${type}/${id}.json`);
      return data.meta || null;
    } catch {
      return null;
    }
  }

  async getStreams(type: ContentType, videoId: string): Promise<Stream[]> {
    try {
      const data = await this.fetchJson<{ streams?: Stream[] }>(`/stream/${type}/${videoId}.json`);
      return data.streams || [];
    } catch {
      return [];
    }
  }

  async getSubtitles(type: ContentType, videoId: string): Promise<Subtitle[]> {
    try {
      const data = await this.fetchJson<{ subtitles?: Subtitle[] }>(`/subtitles/${type}/${videoId}.json`);
      return data.subtitles || [];
    } catch {
      return [];
    }
  }
}

// ============================================================
// Default addon instances
// ============================================================

export const CINEMETA_URL = 'https://v3-cinemeta.strem.io';

export const DEFAULT_ADDONS = [
  {
    name: 'Cinemeta',
    url: CINEMETA_URL,
    description: 'The official Stremio catalog provider',
    official: true,
  },
];

export function createClient(baseUrl: string): StremioAddonClient {
  return new StremioAddonClient(baseUrl);
}
