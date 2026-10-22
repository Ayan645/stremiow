import type { MetaPreview } from '@/lib/stremio/types';

/**
 * URL-safe Base64 encoder for Stremboxd Letterboxd Addon protocol
 */
export function encodeStremboxdToken(username: string): string {
  const config = {
    c: { popular: true, top250: true, watchlist: true },
    l: [],
    r: true,
    u: username.trim().toLowerCase(),
  };

  const jsonStr = JSON.stringify(config);
  const uint8 = new TextEncoder().encode(jsonStr);
  let binary = '';
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates installable Stremio Addon manifest URL for Letterboxd
 */
export function getLetterboxdManifestUrl(username: string): string {
  const token = encodeStremboxdToken(username);
  return `https://api.stremboxd.com/${token}/manifest.json`;
}

/**
 * Helper to fetch a Stremboxd endpoint with automatic CORS proxy fallback
 */
async function fetchStremboxdJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // If client fetch fails, fallback to Next.js server-side proxy
  }

  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      return await proxyRes.json();
    }
  } catch (err) {
    console.warn(`Failed to fetch Stremboxd from ${url}:`, err);
  }

  return null;
}

/**
 * Fetch a user's Letterboxd Watchlist
 */
export async function fetchLetterboxdWatchlist(username: string): Promise<MetaPreview[]> {
  if (!username) return [];
  const token = encodeStremboxdToken(username);
  const url = `https://api.stremboxd.com/${token}/catalog/movie/letterboxd-watchlist.json`;

  const data = await fetchStremboxdJson<{ metas?: MetaPreview[] }>(url);
  return data?.metas || [];
}

/**
 * Fetch Letterboxd Popular This Week catalog
 */
export async function fetchLetterboxdPopular(username: string = 'cinephile'): Promise<MetaPreview[]> {
  const token = encodeStremboxdToken(username);
  const url = `https://api.stremboxd.com/${token}/catalog/movie/letterboxd-popular.json`;

  const data = await fetchStremboxdJson<{ metas?: MetaPreview[] }>(url);
  return data?.metas || [];
}

/**
 * Fetch Letterboxd Top 250 Narrative Features catalog
 */
export async function fetchLetterboxdTop250(username: string = 'cinephile'): Promise<MetaPreview[]> {
  const token = encodeStremboxdToken(username);
  const url = `https://api.stremboxd.com/${token}/catalog/movie/letterboxd-top250.json`;

  const data = await fetchStremboxdJson<{ metas?: MetaPreview[] }>(url);
  return data?.metas || [];
}

/**
 * Generates direct one-click deep link to log or view a film on Letterboxd
 */
export function getLetterboxdFilmUrl(title: string, year?: string | number): string {
  const cleanTitle = encodeURIComponent(title.trim());
  if (year) {
    return `https://letterboxd.com/search/${cleanTitle}+${year}/`;
  }
  return `https://letterboxd.com/search/${cleanTitle}/`;
}

/**
 * Generates direct link to user's public Letterboxd profile
 */
export function getLetterboxdProfileUrl(username: string): string {
  return `https://letterboxd.com/${encodeURIComponent(username.trim())}/`;
}
