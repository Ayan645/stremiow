'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Film, RefreshCw, Plus } from 'lucide-react';
import { ContentCard } from './ContentCard';
import { useLetterboxdStore } from '@/store/letterboxd-store';
import { LetterboxdModal } from '@/components/letterboxd/LetterboxdModal';

interface LetterboxdRowProps {
  id?: string;
}

export function LetterboxdRow({ id = 'letterboxd' }: LetterboxdRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    username,
    isConnected,
    watchlist,
    popular,
    top250,
    isSyncing,
    initialize,
    sync,
  } = useLetterboxdStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const displayItems =
    watchlist.length > 0 ? watchlist : popular.length > 0 ? popular : top250;

  const isShowingPersonalWatchlist = isConnected && watchlist.length > 0;

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

  if (!displayItems || displayItems.length === 0) {
    return null;
  }

  return (
    <>
      <section className="relative px-4 md:px-12 py-5 group/row" id={id}>
        {/* Row Header */}
        <div className="flex items-baseline justify-between mb-3 px-1">
          <div className="flex items-baseline gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>
                {isShowingPersonalWatchlist
                  ? 'Letterboxd Watchlist'
                  : 'Popular on Letterboxd'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#00E054]" />
            </h2>
            <span className="text-xs text-white/50 font-normal hidden sm:inline">
              {isShowingPersonalWatchlist
                ? `Queued by @${username}`
                : 'Ranked by cinephile reviews and logs'}
            </span>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2">
            {isConnected && username ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sync()}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-white/80 transition"
                  title="Sync with Letterboxd"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">
                    {isSyncing ? 'Syncing...' : 'Sync'}
                  </span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-white text-xs font-medium transition"
                >
                  <Film className="w-3.5 h-3.5 text-[#00E054]" />
                  <span>@{username}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold tracking-tight transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect Letterboxd</span>
              </button>
            )}

            <span className="text-xs text-white/40 font-medium hidden sm:inline select-none">
              {displayItems.length} titles
            </span>
          </div>
        </div>

        {/* Scroll Container */}
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
            className="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 px-1 row-scrollbar scroll-smooth"
          >
            {displayItems.map((item, index) => (
              <ContentCard
                key={item.id}
                item={item}
                index={index}
                totalInRow={displayItems.length}
              />
            ))}
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

      {/* Letterboxd Connect Modal */}
      <LetterboxdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
