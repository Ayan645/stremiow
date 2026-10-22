'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StremioAddonClient, CINEMETA_URL } from '@/lib/stremio/addon-client';
import type { MetaPreview, ContentType } from '@/lib/stremio/types';

const client = new StremioAddonClient(CINEMETA_URL);

// Global In-Memory Catalog Cache (persists across component mounts and re-renders)
const catalogMemoryCache = new Map<string, MetaPreview[]>();

// In-flight Request Deduplication (prevents 10 components from firing duplicate HTTP requests)
const inflightRequests = new Map<string, Promise<MetaPreview[]>>();

interface UseCatalogOptions {
  type: ContentType;
  id: string;
  extra?: Record<string, string>;
  enabled?: boolean;
}

interface UseCatalogResult {
  data: MetaPreview[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCatalog({
  type,
  id,
  extra,
  enabled = true,
}: UseCatalogOptions): UseCatalogResult {
  const extraKey = useMemo(() => JSON.stringify(extra || {}), [extra]);
  const cacheKey = `${type}:${id}:${extraKey}`;

  // Check if we already have this catalog cached in memory
  const cachedData = catalogMemoryCache.get(cacheKey);

  const [data, setData] = useState<MetaPreview[]>(cachedData || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedData && enabled);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchCatalog = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // If already cached, populate immediately without blocking UI
    const existing = catalogMemoryCache.get(cacheKey);
    if (existing && existing.length > 0) {
      setData(existing);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    setError(null);

    try {
      // In-flight request deduplication
      let requestPromise = inflightRequests.get(cacheKey);
      if (!requestPromise) {
        requestPromise = client.getCatalog(type, id, extra);
        inflightRequests.set(cacheKey, requestPromise);
      }

      const metas = await requestPromise;
      inflightRequests.delete(cacheKey);

      if (isMountedRef.current) {
        if (metas && metas.length > 0) {
          catalogMemoryCache.set(cacheKey, metas);
          setData(metas);
        } else if (!existing || existing.length === 0) {
          // If empty, try fallback to proxy or local catalog endpoint
          try {
            const fallbackRes = await fetch(`/catalog/${type}/${id}.json`);
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              if (fallbackData.metas && fallbackData.metas.length > 0) {
                catalogMemoryCache.set(cacheKey, fallbackData.metas);
                setData(fallbackData.metas);
              }
            }
          } catch {
            // Ignore fallback error
          }
        }
      }
    } catch (err) {
      inflightRequests.delete(cacheKey);
      const message = err instanceof Error ? err.message : 'Failed to fetch catalog';
      console.warn(`Catalog fetch warning (${type}/${id}): ${message}. Trying local fallback...`);

      // Try local fallback
      try {
        const fallbackRes = await fetch(`/catalog/${type}/${id}.json`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (fallbackData.metas && fallbackData.metas.length > 0) {
            catalogMemoryCache.set(cacheKey, fallbackData.metas);
            if (isMountedRef.current) {
              setData(fallbackData.metas);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {}

      if (isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [type, id, extraKey, enabled, cacheKey]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCatalog();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCatalog]);

  return { data, isLoading, error, refetch: fetchCatalog };
}
