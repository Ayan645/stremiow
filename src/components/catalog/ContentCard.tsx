'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Film, Volume2, VolumeX, Star } from 'lucide-react';
import { resolveImageUrl, resolveBackgroundUrl } from '@/lib/utils/image';
import { formatRating, formatYear } from '@/lib/utils/format';
import { getCachedMeta, extractTrailerId } from '@/lib/stremio/meta-cache';
import { useLibraryStore } from '@/store/library-store';
import { LetterboxdLogModal } from '@/components/letterboxd/LetterboxdLogModal';
import type { MetaPreview, Meta } from '@/lib/stremio/types';

interface ContentCardProps {
  item: MetaPreview;
  index?: number;
  totalInRow?: number;
}

export function ContentCard({ item }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useLibraryStore();
  const inWatchlist = isInWatchlist(item.id);

  const handleMouseEnter = () => {
    setIsHovered(true);
    hoverTimerRef.current = setTimeout(async () => {
      const fullMeta = await getCachedMeta(item.type, item.id);
      if (fullMeta) {
        const ytId = extractTrailerId(fullMeta);
        if (ytId) {
          setTrailerId(ytId);
          setIsTrailerPlaying(true);
        }
      }
    }, 450);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsTrailerPlaying(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
  };

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(item.id);
    } else {
      addToWatchlist(item);
    }
  };

  const handleLogClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLogModalOpen(true);
  };

  const posterUrl = resolveImageUrl(item.poster);
  const backdropUrl = resolveBackgroundUrl(item.background || item.poster);

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex-shrink-0 w-[145px] sm:w-[175px] md:w-[205px] lg:w-[225px] select-none"
      >
        {/* Card Frame with Apple TV Focus Lift */}
        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#101116] border border-white/[0.08] transition-all duration-300 ease-out group-hover:scale-[1.04] group-hover:-translate-y-2 group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.9)] group-hover:border-white/25">
          {/* Main Poster Image */}
          <img
            src={posterUrl}
            alt={item.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isTrailerPlaying ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />

          {/* Embedded Trailer on Focus (Auto-plays muted) */}
          {isTrailerPlaying && trailerId && (
            <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&mute=${
                  isMuted ? 1 : 0
                }&controls=0&loop=1&playlist=${trailerId}&modestbranding=1&rel=0&showinfo=0`}
                title={`${item.name} Preview`}
                className="w-full h-full object-cover scale-150"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>
          )}

          {/* Rating Badge (Top Right Corner) */}
          {item.imdbRating && (
            <div className="absolute top-2.5 right-2.5 z-10 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white/90 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-white text-white" />
              <span>{item.imdbRating}</span>
            </div>
          )}

          {/* Apple TV Overlaid Focus Controls (Fades in smoothly on hover) */}
          <div
            className={`absolute inset-0 z-20 flex flex-col justify-end p-3 bg-gradient-to-t from-black via-black/60 to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Title & Metadata */}
            <h4 className="text-sm font-semibold text-white tracking-tight line-clamp-1 drop-shadow">
              {item.name}
            </h4>
            <div className="flex items-center gap-1.5 text-[11px] text-white/60 mt-0.5 mb-2.5 font-normal">
              <span>{formatYear(item.releaseInfo)}</span>
              {item.genres && item.genres.length > 0 && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="truncate">{item.genres[0]}</span>
                </>
              )}
            </div>

            {/* Apple Action Pills Row */}
            <div className="flex items-center gap-1.5">
              <Link
                href={`/player?type=${item.type}&id=${item.id}&title=${encodeURIComponent(
                  item.name
                )}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition shadow-sm"
              >
                <Play className="w-3 h-3 fill-black" />
                <span>Play</span>
              </Link>

              {/* Watchlist toggle */}
              <button
                onClick={toggleWatchlist}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition backdrop-blur-xl ${
                  inWatchlist
                    ? 'bg-white/25 border-white text-white'
                    : 'bg-black/50 border-white/20 text-white/80 hover:text-white hover:bg-white/10'
                }`}
                title={inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              >
                {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>

              {/* Log to Letterboxd */}
              <button
                onClick={handleLogClick}
                className="w-8 h-8 rounded-full bg-black/50 border border-white/20 text-white/80 hover:text-[#00E054] hover:border-[#00E054]/50 flex items-center justify-center transition backdrop-blur-xl"
                title="Log to Letterboxd"
              >
                <Film className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Clean Static Title Below Card (Apple TV Style) */}
        <div className="pt-2 px-0.5">
          <p className="text-xs font-medium text-white/90 line-clamp-1 group-hover:text-white transition-colors">
            {item.name}
          </p>
          <p className="text-[11px] text-white/50 font-normal mt-0.5">
            {formatYear(item.releaseInfo)}
          </p>
        </div>
      </div>

      {/* Letterboxd Cinephile Log Modal */}
      <LetterboxdLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={item.name}
        year={item.releaseInfo}
        poster={item.poster}
        id={item.id}
      />
    </>
  );
}
