'use client';

import { use, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Star, Clock, Calendar, ArrowLeft, Volume2, Sparkles, X, Tv, Film } from 'lucide-react';
import { useMeta } from '@/hooks/useMeta';
import { useStreams } from '@/hooks/useStreams';
import { useLibraryStore } from '@/store/library-store';
import { resolveBackgroundUrl, resolveImageUrl } from '@/lib/utils/image';
import { formatRating, formatRuntime, formatYear } from '@/lib/utils/format';
import { extractTrailerId } from '@/lib/stremio/meta-cache';
import { StreamPicker } from '@/components/detail/StreamPicker';
import { CategoryRow } from '@/components/catalog/CategoryRow';
import { Footer } from '@/components/layout/Footer';
import { LetterboxdLogModal } from '@/components/letterboxd/LetterboxdLogModal';
import type { ContentType, Video } from '@/lib/stremio/types';

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

function TitleDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const type = resolvedParams.type as ContentType;
  const id = resolvedParams.id;

  const { data: meta, isLoading, error } = useMeta(type, id);

  // For series: selected episode
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);
  const [isLetterboxdLogOpen, setIsLetterboxdLogOpen] = useState(false);

  // Watchlist store
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, loadFromStorage } = useLibraryStore();
  const inList = isInWatchlist(id);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // When series metadata loads, pick first episode of season 1
  useEffect(() => {
    if (meta?.videos && meta.videos.length > 0) {
      const seasonVideos = meta.videos.filter((v) => (v.season || 1) === selectedSeason);
      if (seasonVideos.length > 0) {
        setSelectedVideo(seasonVideos[0]);
      } else {
        setSelectedVideo(meta.videos[0]);
      }
    }
  }, [meta, selectedSeason]);

  // Target videoId for streams
  const targetVideoId = type === 'series' && selectedVideo ? selectedVideo.id : id;

  // Stream addons
  const streamAddonUrls = ['https://torrentio.strem.fun'];

  const { streams, isLoading: isStreamsLoading, error: streamsError } = useStreams(
    type,
    targetVideoId,
    streamAddonUrls
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08090B] pt-24 px-4 sm:px-8 md:px-12">
        <div className="h-[60vh] rounded-3xl bg-[#14151B] animate-shimmer" />
        <div className="mt-8 space-y-4 max-w-2xl">
          <div className="h-12 w-96 bg-[#14151B] rounded animate-shimmer" />
          <div className="h-4 w-64 bg-[#14151B] rounded animate-shimmer" />
          <div className="h-24 w-full bg-[#14151B] rounded animate-shimmer" />
        </div>
      </div>
    );
  }

  if (error || !meta) {
    return (
      <div className="min-h-screen bg-[#050507] pt-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Title Not Found</h2>
        <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
          {error || 'Unable to retrieve metadata from Cinemeta or connected Stremio addons.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-7 py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/90 transition shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Browse
        </Link>
      </div>
    );
  }

  const bgImage = resolveBackgroundUrl(meta.background || meta.poster);
  const trailerId = extractTrailerId(meta);

  const seasons = meta.videos
    ? Array.from(new Set(meta.videos.map((v) => v.season || 1))).sort((a, b) => a - b)
    : [];

  const currentSeasonVideos = meta.videos
    ? meta.videos.filter((v) => (v.season || 1) === selectedSeason)
    : [];

  return (
    <div className="min-h-screen bg-[#08090B] text-white">
      {/* Hero Backdrop Header */}
      <div className="relative w-full h-[70vh] min-h-[500px] max-h-[850px] overflow-hidden select-none bg-[#08090B]">
        {bgImage && (
          <img
            src={bgImage}
            alt={meta.name}
            className="w-full h-full object-cover object-top scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090B] via-[#08090B]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090B] via-transparent to-[#08090B]/60" />

        {/* Back Button */}
        <Link
          href="/"
          className="absolute top-20 left-4 sm:left-8 md:left-14 z-20 flex items-center gap-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-2xl border border-white/15 transition shadow-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Link>

        {/* Hero Meta Info */}
        <div className="absolute bottom-10 left-4 sm:left-8 md:left-14 z-20 max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 text-xs font-medium text-white/80 capitalize">
              {type}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)] leading-tight">
            {meta.name}
          </h1>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-white/70">
            {meta.imdbRating && (
              <span className="flex items-center gap-1 font-semibold text-white bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-md">
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                {formatRating(meta.imdbRating)}
              </span>
            )}
            {meta.releaseInfo && (
              <span className="text-white/80">
                {formatYear(meta.releaseInfo)}
              </span>
            )}
            {meta.runtime && (
              <>
                <span className="text-white/30">·</span>
                <span className="text-white/80">
                  {formatRuntime(meta.runtime)}
                </span>
              </>
            )}
            <span className="text-white/30">·</span>
            <span className="px-1.5 py-0.5 rounded border border-white/20 text-[10px] font-semibold text-white/80 uppercase">
              4K UHD
            </span>
            <span className="px-1.5 py-0.5 rounded border border-white/20 text-[10px] font-semibold text-white/80 uppercase">
              Dolby Vision
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-3 pt-2">
            <Link
              href={`/player?type=${type}&id=${targetVideoId}&title=${encodeURIComponent(meta.name)}`}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Play</span>
            </Link>

            {trailerId && (
              <button
                onClick={() => setIsTrailerModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-white text-sm font-medium transition backdrop-blur-2xl"
              >
                <Tv className="w-4 h-4" />
                <span>Trailer</span>
              </button>
            )}

            <button
              onClick={() => {
                if (inList) {
                  removeFromWatchlist(id);
                } else {
                  addToWatchlist(meta);
                }
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-full border text-sm font-medium transition backdrop-blur-2xl ${
                inList
                  ? 'bg-white/25 border-white text-white shadow-sm'
                  : 'bg-white/[0.08] hover:bg-white/[0.16] border-white/[0.12] text-white'
              }`}
            >
              {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{inList ? 'In Watchlist' : 'Watchlist'}</span>
            </button>

            {/* Log to Letterboxd */}
            <button
              onClick={() => setIsLetterboxdLogOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-white text-sm font-medium transition backdrop-blur-2xl"
              title="Log this film to your Letterboxd Diary"
            >
              <Film className="w-3.5 h-3.5 text-[#00E054]" />
              <span>Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="px-4 sm:px-8 md:px-14 py-10 max-w-7xl mx-auto space-y-10">
        {/* Synopsis & Cast details grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Overview</h2>
            <p className="text-zinc-300 leading-relaxed text-sm md:text-base">
              {meta.description || 'No overview available for this title.'}
            </p>

            {meta.genres && meta.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {meta.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3.5 py-1 bg-white/[0.06] border border-white/10 rounded-full text-xs text-zinc-300 font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 text-xs text-zinc-400 bg-white/[0.03] p-7 rounded-3xl border border-white/[0.08] backdrop-blur-2xl">
            <span className="text-white font-semibold block text-xs tracking-wider uppercase">
              Credits & Cast
            </span>
            {meta.director && meta.director.length > 0 && (
              <div>
                <span className="text-zinc-400 font-medium block">Director</span>
                <span className="text-white">{meta.director.join(', ')}</span>
              </div>
            )}
            {meta.cast && meta.cast.length > 0 && (
              <div>
                <span className="text-zinc-400 font-medium block">Starring</span>
                <span className="text-white">{meta.cast.slice(0, 6).join(', ')}</span>
              </div>
            )}
            {meta.awards && (
              <div>
                <span className="text-zinc-400 font-medium block">Awards</span>
                <span className="text-white">{meta.awards}</span>
              </div>
            )}
          </div>
        </div>

        {/* Series Episodes Selector */}
        {type === 'series' && seasons.length > 0 && (
          <div className="space-y-6 pt-8 border-t border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Episodes</h2>
              </div>

              {seasons.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 row-scrollbar">
                  {seasons.map((season) => (
                    <button
                      key={season}
                      onClick={() => setSelectedSeason(season)}
                      className={`px-5 py-2 rounded-full text-xs font-semibold transition duration-200 flex-shrink-0 ${
                        selectedSeason === season
                          ? 'bg-white text-black shadow-md'
                          : 'bg-white/[0.06] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.1]'
                      }`}
                    >
                      Season {season}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSeasonVideos.map((video) => {
                const isSelected = selectedVideo?.id === video.id;
                return (
                  <div
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`flex gap-4 p-4 rounded-3xl cursor-pointer transition duration-200 border ${
                      isSelected
                        ? 'bg-white/15 border-white/30 text-white shadow-xl'
                        : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/15'
                    }`}
                  >
                    <div className="relative w-36 aspect-video flex-shrink-0 rounded-2xl overflow-hidden bg-black/60 border border-white/10">
                      <img
                        src={resolveImageUrl(video.thumbnail || meta.poster)}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="w-5 h-5 text-white fill-current opacity-90" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white font-semibold">
                          Episode {video.episode || 1}
                        </span>
                        {video.released && (
                          <span className="text-zinc-500 text-xs">
                            {formatYear(video.released)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate mt-1">
                        {video.title}
                      </h4>
                      {video.overview && (
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                          {video.overview}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stream Picker Component */}
        <StreamPicker
          type={type}
          id={targetVideoId}
          title={
            type === 'series' && selectedVideo
              ? `${meta.name} - S${selectedSeason}:E${selectedVideo.episode} "${selectedVideo.title}"`
              : meta.name
          }
          streams={streams}
          isLoading={isStreamsLoading}
          error={streamsError}
        />

        {/* Recommended Row */}
        <div className="pt-10 border-t border-white/[0.08]">
          <CategoryRow
            title="Recommended Masterpieces"
            type={type}
            catalogId="top"
          />
        </div>
      </div>

      {/* Trailer Lightbox Modal */}
      {isTrailerModalOpen && trailerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-3xl p-4">
          <div className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.9)] bg-black">
            <button
              onClick={() => setIsTrailerModalOpen(false)}
              className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-black/70 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition duration-200"
              aria-label="Close Trailer"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&controls=1&modestbranding=1&rel=0`}
              title={`${meta.name} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Letterboxd Cinephile Log Modal */}
      {meta && (
        <LetterboxdLogModal
          isOpen={isLetterboxdLogOpen}
          onClose={() => setIsLetterboxdLogOpen(false)}
          title={meta.name}
          year={meta.releaseInfo}
          poster={meta.poster}
          id={meta.id}
        />
      )}

      <Footer />
    </div>
  );
}

export default function TitleDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050507] pt-24 px-6 sm:px-10 md:px-16 text-white">
          <div className="h-[60vh] rounded-3xl bg-white/[0.04] animate-shimmer" />
        </div>
      }
    >
      <TitleDetailContent params={params} />
    </Suspense>
  );
}
