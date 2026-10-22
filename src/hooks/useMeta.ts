'use client';

import { useState, useEffect } from 'react';
import { StremioAddonClient, CINEMETA_URL } from '@/lib/stremio/addon-client';
import type { Meta, ContentType } from '@/lib/stremio/types';

const client = new StremioAddonClient(CINEMETA_URL);

interface UseMetaResult {
  data: Meta | null;
  isLoading: boolean;
  error: string | null;
}

export function useMeta(type: ContentType | null, id: string | null): UseMetaResult {
  const [data, setData] = useState<Meta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !id) {
      setData(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    client.getMeta(type, id).then((meta) => {
      if (!cancelled) {
        setData(meta);
        setIsLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  return { data, isLoading, error };
}
