'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { ContentCard } from './ContentCard';
import { useCatalog } from '@/hooks/useCatalog';
import type { ContentType } from '@/lib/stremio/types';

interface TopTenRowProps {
  title?: string;
  type?: ContentType;
}

export function TopTenRow({
  title = 'Top 10 Today',
  type = 'movie',
}: TopTenRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const { data: items, isLoading } = useCatalog({
    type,
    id: 'top',
  });

  const topTenItems = items.slice(0, 10);

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

  if (isLoading) {
    return (
      <section className="px-4 md:px-12 py-6">
        <div className="h-6 w-48 bg-white/[0.04] rounded-lg animate-shimmer mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[220px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-shimmer"
            />
          ))}
        </div>
      </section>
    );
  }

  if (topTenItems.length === 0) return null;

  return (
    <section className="relative px-4 md:px-12 py-6 group/row" id="top-10">
      {/* Category Header */}
      <div className="flex items-baseline justify-between mb-4 px-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {title}
          </h2>
          <span className="text-xs text-white/50 font-normal hidden sm:inline">
            — Most watched across all services
          </span>
        </div>

        <span className="text-xs text-white/40 font-medium select-none">
          Updated hourly
        </span>
      </div>

      {/* Row with Scroll Controls */}
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

        {/* Scrollable Container with Giant Podium Numerals */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 sm:gap-4 overflow-x-auto pb-4 pt-2 px-1 row-scrollbar scroll-smooth"
        >
          {topTenItems.map((item, index) => {
            const rank = index + 1;

            return (
              <div
                key={item.id}
                className="relative flex items-end flex-shrink-0 group/card"
              >
                {/* Sculptural Podium Rank Numeral */}
                <div className="relative z-0 -mr-6 sm:-mr-8 select-none pointer-events-none pb-2 sm:pb-4">
                  <span className="text-[90px] sm:text-[130px] md:text-[150px] numeral-stroke font-black leading-none inline-block">
                    {rank}
                  </span>
                </div>

                {/* Overlapping Content Card */}
                <div className="relative z-10">
                  <ContentCard
                    item={item}
                    index={index}
                    totalInRow={topTenItems.length}
                  />
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
