// ============================================================
// Stremio Addon Protocol Types
// ============================================================

export interface AddonManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  resources: ResourceDescriptor[];
  types: ContentType[];
  catalogs: CatalogDescriptor[];
  idPrefixes?: string[];
  background?: string;
  logo?: string;
  behaviorHints?: {
    adult?: boolean;
    p2p?: boolean;
    configurable?: boolean;
    configurationRequired?: boolean;
  };
}

export type ContentType = 'movie' | 'series' | 'channel' | 'tv' | 'anime' | 'other';

export type ResourceName = 'catalog' | 'meta' | 'stream' | 'subtitles' | 'addon_catalog';

export type ResourceDescriptor = ResourceName | {
  name: ResourceName;
  types: ContentType[];
  idPrefixes?: string[];
};

export interface CatalogDescriptor {
  type: ContentType;
  id: string;
  name?: string;
  extra?: ExtraDescriptor[];
  extraSupported?: string[];
  extraRequired?: string[];
}

export interface ExtraDescriptor {
  name: string;
  isRequired?: boolean;
  options?: string[];
  optionsLimit?: number;
}

export interface MetaPreview {
  id: string;
  type: ContentType;
  name: string;
  poster?: string;
  posterShape?: 'square' | 'poster' | 'landscape';
  background?: string;
  logo?: string;
  description?: string;
  releaseInfo?: string;
  imdbRating?: string;
  genres?: string[];
  runtime?: string;
  year?: number;
}

export interface Meta extends MetaPreview {
  cast?: string[];
  director?: string[];
  writer?: string[];
  awards?: string;
  website?: string;
  country?: string;
  trailers?: Trailer[];
  videos?: Video[];
  links?: MetaLink[];
  behaviorHints?: {
    defaultVideoId?: string;
    hasScheduledVideos?: boolean;
  };
}

export interface Trailer {
  source: string;
  type: string;
}

export interface Video {
  id: string;
  title: string;
  season?: number;
  episode?: number;
  released?: string;
  thumbnail?: string;
  overview?: string;
  available?: boolean;
}

export interface MetaLink {
  name: string;
  category: string;
  url: string;
}

export interface Stream {
  title?: string;
  url?: string;
  ytId?: string;
  infoHash?: string;
  fileIdx?: number;
  externalUrl?: string;
  name?: string;
  description?: string;
  subtitles?: Subtitle[];
  behaviorHints?: {
    notWebReady?: boolean;
    bingeGroup?: string;
    countryWhitelist?: string[];
    proxyHeaders?: {
      request?: Record<string, string>;
      response?: Record<string, string>;
    };
    filename?: string;
    videoSize?: number;
  };
}

export interface Subtitle {
  id: string;
  url: string;
  lang: string;
}

// ============================================================
// App-specific types
// ============================================================

export interface InstalledAddon {
  manifest: AddonManifest;
  transportUrl: string;
  flags?: {
    official?: boolean;
    protected?: boolean;
  };
}

export interface CatalogRequest {
  type: ContentType;
  id: string;
  extra?: Record<string, string>;
}

export interface WatchHistoryItem {
  id: string;
  type: ContentType;
  name: string;
  poster?: string;
  background?: string;
  progress: number; // 0-1 percentage
  currentTime: number; // seconds
  duration: number; // seconds
  lastWatched: number; // timestamp
  season?: number;
  episode?: number;
  videoId?: string;
}

export interface UserPreferences {
  addons: InstalledAddon[];
  theme: 'dark' | 'light';
  autoplay: boolean;
  defaultQuality: 'auto' | '4k' | '1080p' | '720p' | '480p';
  subtitleLanguage: string;
}

// ============================================================
// Stremio Cloud API Types (Account & Sync)
// ============================================================

export interface StremioUser {
  _id: string;
  email: string;
  fullname?: string;
  avatar?: string;
  premium_expire?: string | null;
}

export interface StremioSession {
  authKey: string;
  user: StremioUser;
}

export interface StremioLibraryState {
  timeOffset: number; // in milliseconds
  duration: number; // in milliseconds
  season?: number;
  episode?: number;
  timeWatched?: number;
  flaggedWatched?: number;
  timesWatched?: number;
  watched?: string;
  video_id?: string;
  lastWatched?: string; // ISO date string
}

export interface StremioLibraryItem {
  _id: string;
  type: ContentType;
  name: string;
  poster?: string;
  background?: string;
  state?: StremioLibraryState;
  removed?: boolean;
  temp?: boolean;
  _ctime?: string;
  _mtime?: string;
}

export interface StremioCloudAddon {
  transportUrl: string;
  transportName?: string;
  manifest: AddonManifest;
  flags?: {
    official?: boolean;
    protected?: boolean;
  };
}

