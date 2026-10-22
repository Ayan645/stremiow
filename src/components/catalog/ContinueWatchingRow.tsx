'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLibraryStore } from '@/store/library-store';
import { resolveImageUrl } from '@/lib/utils/image';

export function ContinueWatchingRow() {
  const { watchHistory, removeFromHistory } = useLibraryStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!watchHistory || watchHistory.length === 0) {
    return null;
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const newPosition =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 20);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 20
    );
  };

  return (
    <section className="relative px-4 sm:px-8 md:px-12 py-5 group/row" id="history">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Continue Watching
          </h2>
          <span className="text-xs text-white/50 font-normal hidden sm:inline">
            — Pick up where you left off
          </span>
        </div>

        <span className="text-xs text-white/40 font-medium select-none">
          {watchHistory.length} in progress
        </span>
      </div>

      {/* Scrollable Container */}
      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-30 flex items-center justify-center bg-black/60 hover:bg-white text-white hover:text-black border border-white/10 backdrop-blur-xl transition-all shadow-xl hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 row-scrollbar scroll-smooth"
        >
          {watchHistory.map((item) => {
            const progressPercent = Math.round(item.progress * 100);
            const remainingSec = Math.max(0, item.duration - item.currentTime);
            const subtitle = item.season
              ? `S${item.season}:E${item.episode || 1}`
              : `${Math.round(remainingSec / 60)}m left`;

            return (
              <div
                key={item.id}
                className="relative flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] group rounded-2xl overflow-hidden bg-[#101116] border border-white/[0.08] hover:border-white/25 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
              >
                {/* 16:9 Thumbnail Image */}
                <div className="relative aspect-video w-full bg-black/80 overflow-hidden">
                  <img
                    src={resolveImageUrl(item.background || item.poster)}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Play Overlay */}
                  <Link
                    href={`/player?type=${item.type}&id=${item.id}&title=${encodeURIComponent(
                      item.name
                    )}`}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromHistory(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                    title="Remove from history"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Apple TV Progress Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div
                      className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Info Strip */}
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-white tracking-tight truncate">
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-white/50 mt-1">
                    <span>{subtitle}</span>
                    <span className="font-medium text-white/70">{progressPercent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-30 flex items-center justify-center bg-black/60 hover:bg-white text-white hover:text-black border border-white/10 backdrop-blur-xl transition-all shadow-xl hover:scale-110"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
}
