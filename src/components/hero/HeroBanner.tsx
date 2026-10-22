'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Play, Plus, Check, Info, Volume2, VolumeX, Film, Star } from 'lucide-react';
import { useCatalog } from '@/hooks/useCatalog';
import { resolveBackgroundUrl, resolveImageUrl } from '@/lib/utils/image';
import { formatRating, formatYear } from '@/lib/utils/format';
import { getCachedMeta, extractTrailerId } from '@/lib/stremio/meta-cache';
import { useLibraryStore } from '@/store/library-store';
import { LetterboxdLogModal } from '@/components/letterboxd/LetterboxdLogModal';

export function HeroBanner() {
  const { data: trendingMovies, isLoading } = useCatalog({ type: 'movie', id: 'top' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [isTrailerActive, setIsTrailerActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useLibraryStore();

  const heroItems = trendingMovies.slice(0, 6);
  const currentItem = heroItems[currentIndex];
  const inWatchlist = currentItem ? isInWatchlist(currentItem.id) : false;

  const trailerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback((index: number) => {
    setIsTransitioning(true);
    setIsTrailerActive(false);
    setTrailerId(null);

    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  }, []);

  const goNext = useCallback(() => {
    if (heroItems.length === 0) return;
    goToSlide((currentIndex + 1) % heroItems.length);
  }, [currentIndex, heroItems.length, goToSlide]);

  // Load trailer for current hero item after 2.5s
  useEffect(() => {
    if (!currentItem) return;

    if (trailerTimerRef.current) {
      clearTimeout(trailerTimerRef.current);
    }

    trailerTimerRef.current = setTimeout(async () => {
      const fullMeta = await getCachedMeta(currentItem.type, currentItem.id);
      if (fullMeta) {
        const ytId = extractTrailerId(fullMeta);
        if (ytId) {
          setTrailerId(ytId);
          setIsTrailerActive(true);
        }
      }
    }, 2800);

    return () => {
      if (trailerTimerRef.current) {
        clearTimeout(trailerTimerRef.current);
      }
    };
  }, [currentItem]);

  // Auto-advance
  useEffect(() => {
    if (heroItems.length <= 1 || !isMuted) return;
    const timer = setInterval(goNext, 12000);
    return () => clearInterval(timer);
  }, [goNext, heroItems.length, isMuted]);

  if (isLoading || !currentItem) {
    return (
      <header className="relative w-full h-[85vh] min-h-[580px] bg-[#050507]">
        <div className="absolute inset-0 animate-shimmer" />
      </header>
    );
  }

  const bgImage = resolveBackgroundUrl(currentItem.background || currentItem.poster);

  const toggleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(currentItem.id);
    } else {
      addToWatchlist(currentItem);
    }
  };

  return (
    <>
      <section className="relative w-full h-[90vh] min-h-[620px] max-h-[980px] overflow-hidden select-none bg-[#050507]">
        {/* Background Artwork / Cinematic Video */}
        <div className="absolute inset-0">
          {isTrailerActive && trailerId ? (
            <div className="relative w-full h-full overflow-hidden">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailerId}?autoplay=1&mute=${
                  isMuted ? 1 : 0
                }&controls=0&loop=1&playlist=${trailerId}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1`}
                title={`${currentItem.name} Live Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full object-cover scale-125 pointer-events-none transition-opacity duration-1000"
              />
            </div>
          ) : (
            <div
              className={`w-full h-full transition-all duration-700 ${
                isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
              }`}
            >
              {bgImage && (
                <img
                  src={bgImage}
                  alt={currentItem.name}
                  className="w-full h-full object-cover object-center"
                />
              )}
            </div>
          )}

          {/* Apple TV Cinematic Vignette (Deep bottom & soft left gradient) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507]/95 via-[#050507]/50 to-transparent max-w-4xl" />
        </div>

        {/* Hero Metadata & Actions Container */}
        <div className="absolute bottom-16 sm:bottom-20 left-4 sm:left-12 md:left-16 z-20 max-w-2xl space-y-4 sm:space-y-5">
          {/* Subtle Editorial Kicker */}
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-[11px] font-medium tracking-wide text-white/80">
              Featured Premiere
            </span>
            {currentItem.genres && currentItem.genres.length > 0 && (
              <span className="text-xs text-white/50 font-normal">
                {currentItem.genres.slice(0, 2).join(' · ')}
              </span>
            )}
          </div>

          {/* Film Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.05] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            {currentItem.name}
          </h1>

          {/* Metadata Specs Strip */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs text-white/70">
            {currentItem.imdbRating && (
              <span className="flex items-center gap-1 font-semibold text-white bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">
                <Star className="w-3 h-3 fill-white text-white" />
                {formatRating(currentItem.imdbRating)}
              </span>
            )}
            <span>{formatYear(currentItem.releaseInfo)}</span>
            <span className="text-white/30">·</span>
            <span className="px-1.5 py-0.5 rounded border border-white/20 text-[10px] font-semibold text-white/80 uppercase">
              4K HDR
            </span>
            <span className="px-1.5 py-0.5 rounded border border-white/20 text-[10px] font-semibold text-white/80 uppercase">
              Dolby Atmos
            </span>
          </div>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-white/70 leading-relaxed line-clamp-3 max-w-xl font-normal">
            {currentItem.description || 'Watch now streaming in cinema resolution with master audio.'}
          </p>

          {/* Apple TV Signature Capsule Button Group */}
          <div className="flex items-center flex-wrap gap-3 pt-2">
            {/* Play Button */}
            <Link
              href={`/player?type=${currentItem.type}&id=${currentItem.id}&title=${encodeURIComponent(
                currentItem.name
              )}`}
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:scale-105 select-none"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Play</span>
            </Link>

            {/* In My List */}
            <button
              onClick={toggleWatchlist}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 backdrop-blur-2xl border select-none ${
                inWatchlist
                  ? 'bg-white/20 border-white/40 text-white shadow-sm'
                  : 'bg-white/[0.08] hover:bg-white/[0.16] border-white/[0.12] text-white'
              }`}
            >
              {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{inWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
            </button>

            {/* Log to Letterboxd */}
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-white text-sm font-medium backdrop-blur-2xl transition-all duration-300 select-none"
              title="Log film to Letterboxd"
            >
              <Film className="w-3.5 h-3.5 text-[#00E054]" />
              <span>Log</span>
            </button>

            {/* Details */}
            <Link
              href={`/title/${currentItem.type}/${currentItem.id}`}
              className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] flex items-center justify-center text-white backdrop-blur-2xl transition-all duration-300"
              title="View Title Details"
            >
              <Info className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Floating Sound Toggle (Bottom Right) */}
        {isTrailerActive && trailerId && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-16 right-4 sm:right-12 z-30 w-10 h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-xl"
            title={isMuted ? 'Unmute Trailer' : 'Mute Trailer'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Apple TV Carousel Capsule Indicators (Bottom Right) */}
        <div className="hidden sm:flex items-center gap-2 absolute bottom-6 right-12 z-20">
          {heroItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex
                  ? 'w-8 bg-white shadow-sm'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Letterboxd Log Modal */}
      {currentItem && (
        <LetterboxdLogModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          title={currentItem.name}
          year={currentItem.releaseInfo}
          poster={currentItem.poster}
          id={currentItem.id}
        />
      )}
    </>
  );
}
