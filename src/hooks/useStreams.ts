'use client';

import { useState, useEffect } from 'react';
import { StremioAddonClient, CINEMETA_URL } from '@/lib/stremio/addon-client';
import { resolveStreams, sortStreams, type ResolvedStream } from '@/lib/stremio/stream-resolver';
import type { ContentType } from '@/lib/stremio/types';

// For now, we only use Cinemeta (which doesn't provide streams).
// In a real setup, you'd aggregate from Torrentio and other stream addons.
// We'll set up a configurable list of stream addons.

interface UseStreamsResult {
  streams: ResolvedStream[];
  isLoading: boolean;
  error: string | null;
}

export function useStreams(
  type: ContentType | null,
  videoId: string | null,
  addonUrls: string[] = []
): UseStreamsResult {
  const [streams, setStreams] = useState<ResolvedStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type || !videoId || addonUrls.length === 0) {
      setStreams([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const fetchStreams = async () => {
      try {
        const clients = addonUrls.map(url => new StremioAddonClient(url));
        const results = await Promise.allSettled(
          clients.map(client => client.getStreams(type, videoId))
        );

        if (cancelled) return;

        const allStreams: ResolvedStream[] = [];
        for (const result of results) {
          if (result.status === 'fulfilled') {
            allStreams.push(...resolveStreams(result.value));
          }
        }

        setStreams(sortStreams(allStreams));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch streams');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchStreams();

    return () => {
      cancelled = true;
    };
  }, [type, videoId, addonUrls]);

  return { streams, isLoading, error };
}
