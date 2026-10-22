import type { Stream, ContentType } from './types';
import { resolvePlayableStreamUrl } from './streaming-engine.ts';

export interface ResolvedStream extends Stream {
  quality: '4K' | '1080p' | '720p' | '480p' | 'Unknown';
  qualityTier: '4K Ultra HD' | '1080p Full HD' | '720p HD' | 'Standard Definition';
  qualityDescription?: string;
  size?: string;
  sizeBytes?: number;
  seeders?: number;
  speedRating?: 'Ultra Fast' | 'Fast' | 'Normal' | 'Slow';
  speedExplanation?: string;
  source: string;
  addonCategory: string;
  isWebReady: boolean;
  playableUrl: string | null;
  streamType: 'http' | 'torrent' | 'hls' | 'external';
  hdrFlavor?: 'Dolby Vision' | 'HDR10+' | 'HDR' | 'SDR';
  audioFormat?: string;
  codec?: string;
  languages?: string[];
  isRecommended?: boolean;
  isDebrid?: boolean;
  debridProvider?: string;
}

/**
 * Parse stream title/name to extract quality, size, seeders, audio, and addon categorization
 */
function parseStreamInfo(stream: Stream): Partial<ResolvedStream> {
  const text = `${stream.title || ''} ${stream.name || ''} ${stream.description || ''}`;

  // 1. Detect Quality & Tier with Human Explanation
  let quality: '4K' | '1080p' | '720p' | '480p' | 'Unknown' = '1080p';
  let qualityTier: '4K Ultra HD' | '1080p Full HD' | '720p HD' | 'Standard Definition' = '1080p Full HD';
  let qualityDescription = 'Universal crisp picture, zero lag & instant streaming';

  if (/4k|2160p|uhd/i.test(text)) {
    quality = '4K';
    qualityTier = '4K Ultra HD';
    qualityDescription = 'Cinema-grade 2160p resolution. Best for large 4K displays';
  } else if (/1080p|full\s*hd/i.test(text)) {
    quality = '1080p';
    qualityTier = '1080p Full HD';
    qualityDescription = 'Universal crisp picture, rapid buffer & instant start';
  } else if (/720p|hd/i.test(text)) {
    quality = '720p';
    qualityTier = '720p HD';
    qualityDescription = 'Data-saver standard HD. Ideal for mobile or slower networks';
  } else if (/480p|sd|dvdrip/i.test(text)) {
    quality = '480p';
    qualityTier = 'Standard Definition';
    qualityDescription = 'Standard definition for minimal bandwidth usage';
  }

  // 2. Extract File Size
  const sizeMatch = text.match(/(\d+\.?\d*)\s*(GB|MB|TB)/i);
  let size: string | undefined = undefined;
  let sizeBytes: number | undefined = undefined;

  if (sizeMatch) {
    const num = parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toUpperCase();
    size = `${num} ${unit}`;
    if (unit === 'GB') sizeBytes = num * 1024 * 1024 * 1024;
    else if (unit === 'MB') sizeBytes = num * 1024 * 1024;
    else if (unit === 'TB') sizeBytes = num * 1024 * 1024 * 1024 * 1024;
  }

  // 3. Extract Seeders & Compute Human Speed Rating
  // Handles both "👤 214" (Torrentio style) and "214 seeds" / "214 seeders"
  const seedersMatch = text.match(/(?:👤\s*(\d+))|(?:\b(\d+)\s*(?:seeds?|seeders?))/i);
  const seeders = seedersMatch ? parseInt(seedersMatch[1] || seedersMatch[2], 10) : undefined;
  let speedRating: 'Ultra Fast' | 'Fast' | 'Normal' | 'Slow' = 'Normal';
  let speedExplanation = 'Standard streaming speed';

  if (seeders !== undefined) {
    if (seeders >= 100) {
      speedRating = 'Ultra Fast';
      speedExplanation = 'Instant start · 100+ active peers';
    } else if (seeders >= 30) {
      speedRating = 'Fast';
      speedExplanation = 'Smooth playback · 30+ active peers';
    } else if (seeders >= 10) {
      speedRating = 'Normal';
      speedExplanation = 'Moderate peer health';
    } else {
      speedRating = 'Slow';
      speedExplanation = 'Low peer swarm · May take time to buffer';
    }
  }

  // 4. Detect Source Addon & Category
  let source = 'Stremio Addon';
  let addonCategory = 'Community';

  const rawName = stream.name ? stream.name.split('\n')[0].trim() : '';

  if (/torrentio/i.test(rawName) || /torrentio/i.test(text)) {
    source = 'Torrentio';
    addonCategory = 'Torrentio';
  } else if (/cyberflix/i.test(rawName) || /cyberflix/i.test(text)) {
    source = 'Cyberflix';
    addonCategory = 'Cyberflix';
  } else if (/annatar/i.test(rawName) || /annatar/i.test(text)) {
    source = 'Annatar';
    addonCategory = 'Annatar';
  } else if (/comet/i.test(rawName) || /comet/i.test(text)) {
    source = 'Comet';
    addonCategory = 'Comet';
  } else if (/mediafusion/i.test(rawName) || /mediafusion/i.test(text)) {
    source = 'MediaFusion';
    addonCategory = 'MediaFusion';
  } else if (/knightcrawler/i.test(rawName) || /knightcrawler/i.test(text)) {
    source = 'KnightCrawler';
    addonCategory = 'KnightCrawler';
  } else if (/piratebay|tpb/i.test(rawName) || /piratebay|tpb/i.test(text)) {
    source = 'ThePirateBay';
    addonCategory = 'ThePirateBay';
  } else if (/orion/i.test(rawName) || /orion/i.test(text)) {
    source = 'Orion';
    addonCategory = 'Orion';
  } else if (/cinemeta/i.test(rawName)) {
    source = 'Cinemeta';
    addonCategory = 'Cinemeta';
  } else if (rawName) {
    source = rawName;
    addonCategory = rawName;
  }

  // 5. Detect Debrid Cache (RD, AD, PM, TB, DL)
  const isDebrid = /\[(RD|AD|PM|TB|DL)\+?\]|realdebrid|alldebrid|premiumize|torbox/i.test(text) || /\[(RD|AD|PM|TB|DL)\+?\]/i.test(rawName);
  let debridProvider = '';
  if (/\[?RD\+?\]?|realdebrid/i.test(text) || /\[?RD\+?\]?/i.test(rawName)) debridProvider = 'RealDebrid';
  else if (/\[?AD\+?\]?|alldebrid/i.test(text) || /\[?AD\+?\]?/i.test(rawName)) debridProvider = 'AllDebrid';
  else if (/\[?PM\+?\]?|premiumize/i.test(text) || /\[?PM\+?\]?/i.test(rawName)) debridProvider = 'Premiumize';
  else if (/\[?TB\+?\]?|torbox/i.test(text) || /\[?TB\+?\]?/i.test(rawName)) debridProvider = 'TorBox';
  else if (/\[?DL\+?\]?|debrid-link/i.test(text) || /\[?DL\+?\]?/i.test(rawName)) debridProvider = 'Debrid-Link';

  if (isDebrid) {
    addonCategory = debridProvider ? `Debrid (${debridProvider})` : 'Debrid Cloud';
    speedRating = 'Ultra Fast';
    speedExplanation = 'High-speed cloud cached stream (No torrenting needed)';
  }

  // 6. Detect HDR flavor
  let hdrFlavor: 'Dolby Vision' | 'HDR10+' | 'HDR' | 'SDR' | undefined = undefined;
  if (/dv|dolby\s*vision/i.test(text)) hdrFlavor = 'Dolby Vision';
  else if (/hdr10\+/i.test(text)) hdrFlavor = 'HDR10+';
  else if (/hdr/i.test(text)) hdrFlavor = 'HDR';
  else hdrFlavor = 'SDR';

  // 7. Detect Audio Format & Channels (Lossless HD & Atmos prioritized)
  let audioFormat = 'Stereo';
  const hasAtmos = /atmos/i.test(text);
  const hasTrueHD = /truehd/i.test(text);
  const hasDtsHd = /dts[\s-]?hd|dts[\s-]?x/i.test(text);
  const has71 = /7\.1/i.test(text);
  const has51 = /5\.1/i.test(text);
  const hasOpus = /opus/i.test(text);
  const hasAac = /aac/i.test(text);

  if (hasAtmos) audioFormat = has71 ? 'Dolby Atmos 7.1' : 'Dolby Atmos';
  else if (hasDtsHd) audioFormat = has51 ? 'Lossless HD (DTS-HD 5.1)' : 'Lossless HD';
  else if (hasTrueHD) audioFormat = 'Lossless HD (TrueHD)';
  else if (has71) audioFormat = '7.1 Surround';
  else if (has51) audioFormat = '5.1 Surround';
  else if (hasOpus) audioFormat = 'Opus Audio';
  else if (hasAac) audioFormat = 'AAC Stereo';

  // 8. Detect Video Codec
  let codec = 'H.264';
  if (/av1/i.test(text)) codec = 'AV1';
  else if (/hevc|x265|h\.265/i.test(text)) codec = 'HEVC / x265';
  else if (/x264|avc|h\.264/i.test(text)) codec = 'AVC / x264';

  // 9. Detect Languages & Country Flags
  const languages: string[] = [];
  if (/(?:🇬🇧|en|eng|english)/i.test(text)) languages.push('English');
  if (/(?:🇪🇸|es|spa|spanish|castellano)/i.test(text)) languages.push('Spanish');
  if (/(?:🇫🇷|fr|fra|french|vff)/i.test(text)) languages.push('French');
  if (/(?:🇩🇪|de|ger|german)/i.test(text)) languages.push('German');
  if (/(?:🇮🇹|it|ita|italian)/i.test(text)) languages.push('Italian');
  if (/(?:🇯🇵|ja|jpn|japanese)/i.test(text)) languages.push('Japanese');
  if (/(?:dual[\s-]?audio|multi)/i.test(text)) languages.push('Multi-Audio');

  // 10. Stream Type & Playable URL via Stremio Pipeline
  let streamType: 'http' | 'torrent' | 'hls' | 'external' = 'http';
  if (stream.infoHash) {
    streamType = 'torrent';
  } else if (stream.url && stream.url.includes('.m3u8')) {
    streamType = 'hls';
  } else if (stream.externalUrl) {
    streamType = 'external';
  }

  const playableUrl = resolvePlayableStreamUrl(stream);

  return {
    quality,
    qualityTier,
    qualityDescription,
    size,
    sizeBytes,
    seeders,
    speedRating,
    speedExplanation,
    source,
    addonCategory,
    isDebrid,
    debridProvider,
    hdrFlavor,
    audioFormat,
    codec,
    languages: Array.from(new Set(languages)),
    streamType,
    playableUrl,
  };
}

/**
 * Resolve and enrich raw streams with parsed metadata and compute human recommendations
 */
export function resolveStreams(streams: Stream[]): ResolvedStream[] {
  const resolved = streams.map(stream => {
    const info = parseStreamInfo(stream);
    const isWebReady = !!info.playableUrl;

    return {
      ...stream,
      ...info,
      isWebReady,
    } as ResolvedStream;
  });

  // Calculate recommendation badge:
  // Best balance of 1080p/4K with top seeders or Debrid cached
  const maxSeeds = Math.max(...resolved.map(s => s.seeders || 0), 0);

  return resolved.map((s, index) => {
    const isTopSeed = maxSeeds > 0 && (s.seeders || 0) >= maxSeeds * 0.75;
    const isRecommended = (index === 0 && (s.seeders || 0) > 15) || (isTopSeed && s.quality === '1080p') || s.isDebrid;

    return {
      ...s,
      isRecommended: isRecommended || undefined,
    };
  });
}

/**
 * Sort streams by user preference:
 * - 'recommended': optimal balance of speed & quality
 * - 'seeds': highest seeders first
 * - 'quality': 4K -> 1080p -> 720p
 * - 'size': smallest file size first
 */
export function sortStreams(
  streams: ResolvedStream[],
  sortBy: 'recommended' | 'seeds' | 'quality' | 'size' = 'recommended'
): ResolvedStream[] {
  const qualityOrder: Record<string, number> = {
    '4K': 4,
    '1080p': 3,
    '720p': 2,
    '480p': 1,
    'Unknown': 0,
  };

  return [...streams].sort((a, b) => {
    // Web-ready streams always precede unplayable
    if (!!a.playableUrl !== !!b.playableUrl) return a.playableUrl ? -1 : 1;

    if (sortBy === 'seeds') {
      return (b.seeders || 0) - (a.seeders || 0);
    }

    if (sortBy === 'size') {
      return (a.sizeBytes || 0) - (b.sizeBytes || 0);
    }

    if (sortBy === 'quality') {
      const qDiff = (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
      if (qDiff !== 0) return qDiff;
      return (b.seeders || 0) - (a.seeders || 0);
    }

    // Default 'recommended': Recommended first, then Debrid, then 1080p/4K balance with high seeds
    if (a.isRecommended !== b.isRecommended) return a.isRecommended ? -1 : 1;
    if (a.isDebrid !== b.isDebrid) return a.isDebrid ? -1 : 1;

    const aQ = qualityOrder[a.quality] || 0;
    const bQ = qualityOrder[b.quality] || 0;
    if (aQ >= 3 && bQ >= 3) {
      // Both 1080p or 4K: sort by seeders
      return (b.seeders || 0) - (a.seeders || 0);
    }

    return bQ - aQ;
  });
}

/**
 * Get the best stream for instant direct play
 */
export function getBestStream(streams: ResolvedStream[]): ResolvedStream | null {
  const sorted = sortStreams(streams, 'recommended');
  return sorted[0] || null;
}
