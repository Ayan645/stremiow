'use client';

import { useState, useEffect, useRef } from 'react';
import { StremioAddonClient, CINEMETA_URL } from '@/lib/stremio/addon-client';
import type { MetaPreview, ContentType } from '@/lib/stremio/types';

const client = new StremioAddonClient(CINEMETA_URL);

interface UseSearchResult {
  results: MetaPreview[];
  isLoading: boolean;
  error: string | null;
}

export function useSearch(query: string, type?: ContentType): UseSearchResult {
  const [results, setResults] = useState<MetaPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    debounceRef.current = setTimeout(async () => {
      try {
        const types: ContentType[] = type ? [type] : ['movie', 'series'];
        const allResults: MetaPreview[] = [];
        const seenIds = new Set<string>();

        const promises = types.map(t =>
          client.getCatalog(t, 'top', { search: query }).catch(() => [] as MetaPreview[])
        );

        const responses = await Promise.all(promises);
        
        for (const metas of responses) {
          for (const meta of metas) {
            if (!seenIds.has(meta.id)) {
              seenIds.add(meta.id);
              allResults.push(meta);
            }
          }
        }

        setResults(allResults);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, type]);

  return { results, isLoading, error };
}
