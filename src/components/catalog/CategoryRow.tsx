'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentCard } from './ContentCard';
import { useCatalog } from '@/hooks/useCatalog';
import type { ContentType, MetaPreview } from '@/lib/stremio/types';

interface CategoryRowProps {
  id?: string;
  title: string;
  subtitle?: string;
  type: ContentType;
  catalogId: string;
  extra?: Record<string, string>;
  items?: MetaPreview[];
}

export function CategoryRow({
  id,
  title,
  subtitle,
  type,
  catalogId,
  extra,
  items: directItems,
}: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const { data: fetchedItems, isLoading } = useCatalog({
    type,
    id: catalogId,
    extra,
    enabled: !directItems,
  });

  const items = directItems || fetchedItems;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.85;
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
      <section className="px-4 md:px-12 py-5" id={id}>
        <div className="h-6 w-48 bg-white/[0.04] rounded-lg animate-shimmer mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[145px] sm:w-[175px] md:w-[205px] lg:w-[225px] aspect-[2/3] rounded-2xl bg-white/[0.04] animate-shimmer"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <section className="relative px-4 md:px-12 py-5 group/row" id={id}>
      {/* Apple TV Clean Row Header */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <span className="hidden sm:inline text-xs text-white/50 font-normal">
              {subtitle}
            </span>
          )}
        </div>

        <span className="text-xs text-white/40 font-medium select-none">
          {items.length} titles
        </span>
      </div>

      {/* Row Scroll Container */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-30 flex items-center justify-center bg-black/60 hover:bg-white text-white hover:text-black border border-white/10 backdrop-blur-xl transition-all shadow-xl hover:scale-110"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Content list */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto pb-4 pt-2 px-1 row-scrollbar scroll-smooth"
        >
          {items.map((item, index) => (
            <ContentCard
              key={item.id}
              item={item}
              index={index}
              totalInRow={items.length}
            />
          ))}
        </div>

        {/* Right Arrow */}
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
