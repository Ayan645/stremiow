import { StremioAddonClient, CINEMETA_URL } from './addon-client';
import type { MetaPreview, Meta, ContentType } from './types';

const client = new StremioAddonClient(CINEMETA_URL);

export interface CatalogConfig {
  type: ContentType;
  id: string;
  name: string;
  extra?: Record<string, string>;
}

// Pre-defined catalog configurations for the home page
export const HOMEPAGE_CATALOGS: CatalogConfig[] = [
  { type: 'movie', id: 'top', name: 'Trending Movies' },
  { type: 'series', id: 'top', name: 'Trending Series' },
  { type: 'movie', id: 'year', name: 'New Releases' },
  { type: 'series', id: 'year', name: 'New Series' },
  { type: 'movie', id: 'imdbRating', name: 'Top Rated Movies' },
  { type: 'series', id: 'imdbRating', name: 'Top Rated Series' },
];

export async function fetchCatalog(config: CatalogConfig): Promise<MetaPreview[]> {
  return client.getCatalog(config.type, config.id, config.extra);
}

export async function fetchMeta(type: ContentType, id: string): Promise<Meta | null> {
  return client.getMeta(type, id);
}

export async function searchCinemeta(query: string, type: ContentType = 'movie'): Promise<MetaPreview[]> {
  return client.getCatalog(type, 'top', { search: query });
}

export { client as cinemetaClient };
