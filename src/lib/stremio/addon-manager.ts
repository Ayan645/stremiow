import { StremioAddonClient, CINEMETA_URL } from './addon-client';
import type { InstalledAddon, AddonManifest, MetaPreview, Meta, Stream, ContentType } from './types';

class AddonManager {
  private addons: InstalledAddon[] = [];
  private clients: Map<string, StremioAddonClient> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load saved addons from localStorage
    const saved = typeof window !== 'undefined'
      ? localStorage.getItem('stremioflix_addons')
      : null;

    if (saved) {
      try {
        this.addons = JSON.parse(saved);
      } catch {
        this.addons = [];
      }
    }

    // Always ensure Cinemeta is present
    const hasCinemeta = this.addons.some(a => a.transportUrl === CINEMETA_URL);
    if (!hasCinemeta) {
      await this.installAddon(CINEMETA_URL, true);
    }

    // Create clients for all addons
    for (const addon of this.addons) {
      this.clients.set(addon.transportUrl, new StremioAddonClient(addon.transportUrl));
    }

    this.initialized = true;
  }

  async installAddon(url: string, official = false): Promise<InstalledAddon | null> {
    try {
      const client = new StremioAddonClient(url);
      const manifest = await client.getManifest();
      
      const addon: InstalledAddon = {
        manifest,
        transportUrl: url,
        flags: { official },
      };

      // Replace if already exists
      this.addons = this.addons.filter(a => a.transportUrl !== url);
      this.addons.push(addon);
      this.clients.set(url, client);
      this.save();
      
      return addon;
    } catch (error) {
      console.error(`Failed to install addon from ${url}:`, error);
      return null;
    }
  }

  removeAddon(url: string): void {
    this.addons = this.addons.filter(a => a.transportUrl !== url);
    this.clients.delete(url);
    this.save();
  }

  getAddons(): InstalledAddon[] {
    return [...this.addons];
  }

  getClient(url: string): StremioAddonClient | undefined {
    return this.clients.get(url);
  }

  // Get all addons that support a specific resource and type
  getAddonsForResource(resource: string, type: ContentType): InstalledAddon[] {
    return this.addons.filter(addon => {
      const manifest = addon.manifest;
      return manifest.resources.some(r => {
        if (typeof r === 'string') return r === resource;
        return r.name === resource && r.types.includes(type);
      }) && manifest.types.includes(type);
    });
  }

  // Fetch catalog from all addons that support this catalog type
  async getCatalogFromAllAddons(type: ContentType, catalogId: string): Promise<MetaPreview[]> {
    const addons = this.getAddonsForResource('catalog', type);
    const results = await Promise.allSettled(
      addons.map(addon => {
        const client = this.clients.get(addon.transportUrl);
        if (!client) return Promise.resolve([]);
        return client.getCatalog(type, catalogId);
      })
    );
    
    const metas: MetaPreview[] = [];
    const seenIds = new Set<string>();
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const meta of result.value) {
          if (!seenIds.has(meta.id)) {
            seenIds.add(meta.id);
            metas.push(meta);
          }
        }
      }
    }
    
    return metas;
  }

  // Fetch metadata from the first addon that responds
  async getMetaFromAddons(type: ContentType, id: string): Promise<Meta | null> {
    const addons = this.getAddonsForResource('meta', type);
    
    for (const addon of addons) {
      const client = this.clients.get(addon.transportUrl);
      if (!client) continue;
      const meta = await client.getMeta(type, id);
      if (meta) return meta;
    }
    
    return null;
  }

  // Fetch streams from ALL addons (aggregate results)
  async getStreamsFromAllAddons(type: ContentType, videoId: string): Promise<Stream[]> {
    const addons = this.getAddonsForResource('stream', type);
    const results = await Promise.allSettled(
      addons.map(addon => {
        const client = this.clients.get(addon.transportUrl);
        if (!client) return Promise.resolve([]);
        return client.getStreams(type, videoId);
      })
    );
    
    const streams: Stream[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        streams.push(...result.value);
      }
    }
    
    return streams;
  }

  // Search across all addon catalogs
  async searchAll(query: string, type?: ContentType): Promise<MetaPreview[]> {
    const types: ContentType[] = type ? [type] : ['movie', 'series'];
    const allResults: MetaPreview[] = [];
    const seenIds = new Set<string>();

    for (const t of types) {
      const addons = this.getAddonsForResource('catalog', t);
      const results = await Promise.allSettled(
        addons.flatMap(addon => {
          const client = this.clients.get(addon.transportUrl);
          if (!client) return [];
          // Try searching each catalog that supports search
          return addon.manifest.catalogs
            .filter(cat => cat.type === t)
            .map(cat => client.getCatalog(t, cat.id, { search: query }));
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const meta of result.value) {
            if (!seenIds.has(meta.id)) {
              seenIds.add(meta.id);
              allResults.push(meta);
            }
          }
        }
      }
    }

    return allResults;
  }

  importFromStremioCloud(cloudAddons: import('./types').StremioCloudAddon[]): void {
    for (const addon of cloudAddons) {
      if (!addon.transportUrl || !addon.manifest) continue;
      const baseUrl = addon.transportUrl.replace(/\/manifest\.json$/, '');
      const installed: InstalledAddon = {
        manifest: addon.manifest,
        transportUrl: baseUrl,
        flags: addon.flags,
      };
      this.addons = this.addons.filter(a => a.transportUrl !== baseUrl);
      this.addons.push(installed);
      this.clients.set(baseUrl, new StremioAddonClient(baseUrl));
    }
    this.save();
  }

  getStreamAddonUrls(type: ContentType): string[] {
    return this.getAddonsForResource('stream', type).map(a => a.transportUrl);
  }

  private save(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stremioflix_addons', JSON.stringify(this.addons));
    }
  }
}

// Singleton instance
export const addonManager = new AddonManager();
