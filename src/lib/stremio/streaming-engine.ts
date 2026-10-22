import type { Stream, ContentType } from './types';

export const STREMIO_DEFAULT_PORT = 11470;
export const STREMIO_SERVER_URL = `http://127.0.0.1:${STREMIO_DEFAULT_PORT}`;

export interface EngineStatus {
  isOnline: boolean;
  serverUrl: string;
  version?: string;
  latencyMs?: number;
}

/**
 * Probe if the local Stremio Streaming Engine (server.js on port 11470) is alive
 */
export async function probeStremioEngine(): Promise<EngineStatus> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${STREMIO_SERVER_URL}/settings`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        isOnline: true,
        serverUrl: STREMIO_SERVER_URL,
        version: data?.values?.serverVersion || 'stremio-server',
        latencyMs: Math.round(performance.now() - start),
      };
    }
    return { isOnline: false, serverUrl: STREMIO_SERVER_URL };
  } catch {
    return { isOnline: false, serverUrl: STREMIO_SERVER_URL };
  }
}

/**
 * Convert any Stremio stream (HTTP URL, torrent infoHash, or Debrid cache) into a direct playable URL
 */
export function resolvePlayableStreamUrl(stream: Stream): string | null {
  // 1. Direct web stream / Debrid URL
  if (stream.url && (stream.url.startsWith('http://') || stream.url.startsWith('https://'))) {
    return stream.url;
  }

  // 2. Torrent infoHash streamed through local Stremio Engine (port 11470)
  if (stream.infoHash) {
    const fileIndex = typeof stream.fileIdx === 'number' ? stream.fileIdx : 0;
    return `${STREMIO_SERVER_URL}/${stream.infoHash}/${fileIndex}`;
  }

  // 3. Fallback to external URL if provided
  if (stream.externalUrl) {
    return stream.externalUrl;
  }

  return null;
}

/**
 * Generate native Stremio deep link for seamless handoff to desktop/mobile apps
 */
export function getStremioDeepLink(type: ContentType, id: string, videoId?: string): string {
  const targetId = videoId || id;
  return `stremio:///detail/${type}/${id}/${targetId}`;
}
