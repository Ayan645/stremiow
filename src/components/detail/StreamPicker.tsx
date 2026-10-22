'use client';

import { useState, useMemo } from 'react';
import {
  Play,
  ExternalLink,
  Download,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { sortStreams, type ResolvedStream } from '@/lib/stremio/stream-resolver';
import type { ContentType } from '@/lib/stremio/types';
import { getStremioDeepLink } from '@/lib/stremio/streaming-engine';
import Link from 'next/link';

interface StreamPickerProps {
  type: ContentType;
  id: string;
  title: string;
  streams: ResolvedStream[];
  isLoading: boolean;
  error: string | null;
}

export function StreamPicker({
  type,
  id,
  title,
  streams,
  isLoading,
  error,
}: StreamPickerProps) {
  const [selectedAddon, setSelectedAddon] = useState<string>('all');
  const [selectedQuality, setSelectedQuality] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'seeds' | 'quality' | 'size'>('recommended');
  const [searchFilter, setSearchFilter] = useState('');

  const stremioDeepLink = getStremioDeepLink(type, id);

  // Extract distinct Addons & Qualities for filter tabs
  const addonCategories = useMemo(() => {
    const set = new Set<string>();
    streams.forEach((s) => {
      if (s.addonCategory) set.add(s.addonCategory);
    });
    return ['all', ...Array.from(set)];
  }, [streams]);

  const qualities = useMemo(() => {
    const set = new Set<string>();
    streams.forEach((s) => {
      if (s.quality && s.quality !== 'Unknown') set.add(s.quality);
    });
    return ['all', ...Array.from(set)];
  }, [streams]);

  // Filter & Sort streams
  const processedStreams = useMemo(() => {
    let result = [...streams];

    if (selectedAddon !== 'all') {
      result = result.filter((s) => s.addonCategory === selectedAddon);
    }

    if (selectedQuality !== 'all') {
      result = result.filter((s) => s.quality === selectedQuality);
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.name?.toLowerCase().includes(q) ||
          s.source?.toLowerCase().includes(q) ||
          s.codec?.toLowerCase().includes(q) ||
          s.audioFormat?.toLowerCase().includes(q)
      );
    }

    return sortStreams(result, sortBy);
  }, [streams, selectedAddon, selectedQuality, sortBy, searchFilter]);

  return (
    <div className="rounded-3xl apple-glass-dark p-6 md:p-8 my-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Available Streams ({streams.length})
          </h3>
          <p className="text-xs text-white/50 mt-1 font-normal">
            Direct high-definition web playback via local Stremio engine and cloud providers
          </p>
        </div>

        {/* External Player Link */}
        <div className="flex items-center gap-2">
          <a
            href={stremioDeepLink}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white/80 hover:text-white text-xs font-medium border border-white/10 transition"
            title="Open in native desktop Stremio app / MPV"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Desktop MPV</span>
          </a>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="py-4 space-y-4 border-b border-white/[0.06]">
        {/* Source Addon Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto row-scrollbar pb-1">
          <span className="text-xs text-white/40 font-medium mr-1 flex-shrink-0">
            Source:
          </span>
          {addonCategories.map((cat) => {
            const count =
              cat === 'all'
                ? streams.length
                : streams.filter((s) => s.addonCategory === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedAddon(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex-shrink-0 flex items-center gap-1.5 ${
                  selectedAddon === cat
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'bg-white/[0.05] text-white/70 hover:text-white hover:bg-white/[0.1] border border-white/[0.08]'
                }`}
              >
                <span>{cat === 'all' ? 'All Sources' : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedAddon === cat ? 'bg-black/15 text-black font-bold' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quality Tiers & Sort Order */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Quality pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto row-scrollbar">
            <span className="text-xs text-white/40 font-medium mr-1 flex-shrink-0">
              Quality:
            </span>
            {qualities.map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuality(q)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 flex-shrink-0 ${
                  selectedQuality === q
                    ? 'bg-white/20 text-white border border-white/40 font-semibold'
                    : 'bg-white/[0.05] text-white/60 hover:text-white border border-white/[0.08]'
                }`}
              >
                {q === 'all' ? 'All' : q}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-white/40 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#12131A] border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white/90 outline-none focus:border-white/40 cursor-pointer"
            >
              <option value="recommended">Recommended (Optimal Speed)</option>
              <option value="seeds">Fastest Swarm (Max Seeds)</option>
              <option value="quality">Highest Quality (4K First)</option>
              <option value="size">Smallest File Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/50">
          <div className="w-8 h-8 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Resolving streams from connected addons...</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="py-6 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>Unable to retrieve streaming feeds: {error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && processedStreams.length === 0 && (
        <div className="py-12 text-center text-white/50 space-y-3">
          <p className="text-sm">No streams matching your current filter criteria.</p>
          <button
            onClick={() => {
              setSelectedAddon('all');
              setSelectedQuality('all');
              setSearchFilter('');
            }}
            className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Stream List Tile Grid */}
      {!isLoading && processedStreams.length > 0 && (
        <div className="space-y-2.5 mt-5 max-h-[520px] overflow-y-auto pr-1 row-scrollbar">
          {processedStreams.map((stream, idx) => {
            const playableTargetUrl = stream.playableUrl
              ? `/player?url=${encodeURIComponent(stream.playableUrl)}&title=${encodeURIComponent(
                  title
                )}&type=${type}&id=${id}`
              : `/player?title=${encodeURIComponent(title)}&type=${type}&id=${id}`;

            return (
              <div
                key={idx}
                className={`group relative rounded-2xl p-4 transition-all duration-300 border ${
                  stream.isRecommended
                    ? 'bg-white/[0.07] border-white/20 shadow-md'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15'
                }`}
              >
                {/* Recommended Tag */}
                {stream.isRecommended && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-semibold tracking-wide mb-2">
                    <Sparkles className="w-3 h-3 fill-white" />
                    <span>Recommended Pick · Fast Buffer</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Stream Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* Quality Pill */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          stream.quality === '4K'
                            ? 'bg-white text-black'
                            : 'bg-white/15 text-white'
                        }`}
                      >
                        {stream.quality}
                      </span>

                      {/* Source Provider */}
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.08] text-white/80 text-[10px] font-medium">
                        {stream.addonCategory}
                      </span>

                      {/* HDR */}
                      {stream.hdrFlavor && stream.hdrFlavor !== 'SDR' && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
                          {stream.hdrFlavor}
                        </span>
                      )}

                      {/* Audio */}
                      {stream.audioFormat && (
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-white/70 text-[10px]">
                          {stream.audioFormat}
                        </span>
                      )}

                      {/* Speed / Swarm Health */}
                      {stream.speedRating && (
                        <span className="text-[10px] text-white/60 flex items-center gap-1 font-medium">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              stream.speedRating === 'Ultra Fast'
                                ? 'bg-[#00E054]'
                                : stream.speedRating === 'Fast'
                                ? 'bg-cyan-400'
                                : 'bg-yellow-400'
                            }`}
                          />
                          <span>{stream.speedRating}</span>
                          {stream.seeders !== undefined && (
                            <span className="text-white/40">({stream.seeders} seeds)</span>
                          )}
                        </span>
                      )}

                      {/* File Size */}
                      {stream.size && (
                        <span className="text-xs text-white/40 font-normal">
                          {stream.size}
                        </span>
                      )}
                    </div>

                    {/* Stream Release Title */}
                    <p className="text-xs font-medium text-white/95 truncate group-hover:text-white transition-colors">
                      {stream.title?.split('\n')[0] || stream.name || 'Stream Release'}
                    </p>

                    {/* Extra specs */}
                    <div className="flex items-center gap-2 text-[11px] text-white/40 mt-1 flex-wrap font-normal">
                      {stream.qualityDescription && (
                        <span>{stream.qualityDescription}</span>
                      )}
                      {stream.codec && (
                        <>
                          <span>·</span>
                          <span>{stream.codec}</span>
                        </>
                      )}
                      {stream.languages && stream.languages.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{stream.languages.slice(0, 3).join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Apple Play Button & Magnet Download */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <Link
                      href={playableTargetUrl}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-white/90 text-xs font-semibold rounded-full transition shadow-md hover:scale-105 select-none"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Play Now</span>
                    </Link>

                    {stream.infoHash && (
                      <a
                        href={`magnet:?xt=urn:btih:${stream.infoHash}`}
                        className="p-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white border border-white/10 transition"
                        title="Copy Magnet Link"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
