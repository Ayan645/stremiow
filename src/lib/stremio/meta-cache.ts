import { cinemetaClient } from './cinemeta';
import type { Meta, ContentType } from './types';

// In-memory cache for metadata requests to make hover previews instantaneous
const metaPromiseCache = new Map<string, Promise<Meta | null>>();
const metaDataCache = new Map<string, Meta>();

/**
 * Fetch and cache full metadata (including YouTube trailers) for a title
 */
export async function getCachedMeta(type: ContentType, id: string): Promise<Meta | null> {
  const cacheKey = `${type}:${id}`;

  if (metaDataCache.has(cacheKey)) {
    return metaDataCache.get(cacheKey)!;
  }

  if (metaPromiseCache.has(cacheKey)) {
    return metaPromiseCache.get(cacheKey)!;
  }

  const promise = cinemetaClient.getMeta(type, id)
    .then((meta) => {
      if (meta) {
        metaDataCache.set(cacheKey, meta);
      }
      return meta;
    })
    .catch((err) => {
      console.warn(`Failed to fetch meta for ${cacheKey}:`, err);
      return null;
    });

  metaPromiseCache.set(cacheKey, promise);
  return promise;
}

/**
 * Extract YouTube trailer ID from a Meta object
 */
export function extractTrailerId(meta: Meta | null): string | null {
  if (!meta || !meta.trailers || meta.trailers.length === 0) {
    return null;
  }

  // Find the first official trailer or first clip
  const trailer = meta.trailers.find(t => t.type?.toLowerCase() === 'trailer') || meta.trailers[0];
  if (!trailer || !trailer.source) return null;

  // Sometimes source is full URL, sometimes just ID
  const source = trailer.source;
  if (source.includes('youtube.com/watch?v=')) {
    const match = source.match(/v=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }
  if (source.includes('youtu.be/')) {
    const match = source.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  return source;
}
