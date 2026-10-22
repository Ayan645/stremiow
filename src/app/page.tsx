'use client';

import { useState } from 'react';
import { HeroBanner } from '@/components/hero/HeroBanner';
import { CategoryFilterNav } from '@/components/catalog/CategoryFilterNav';
import { ContinueWatchingRow } from '@/components/catalog/ContinueWatchingRow';
import { TopTenRow } from '@/components/catalog/TopTenRow';
import { LetterboxdRow } from '@/components/catalog/LetterboxdRow';
import { CategoryRow } from '@/components/catalog/CategoryRow';
import { Footer } from '@/components/layout/Footer';
import { useLibraryStore } from '@/store/library-store';

const ACTION_EXTRA = { genre: 'Action' };
const SCIFI_EXTRA = { genre: 'Sci-Fi' };

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const { watchlist } = useLibraryStore();

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      {/* Apple TV Cinematic Hero Banner */}
      <HeroBanner />

      {/* Sleek Floating Category Navigation */}
      <CategoryFilterNav
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
      />

      {/* Curated Media Rails */}
      <div className="relative z-10 space-y-4 pb-20 pt-2">
        {/* Row 0: Continue Watching (Synced from Stremio Cloud) */}
        <ContinueWatchingRow />

        {/* Row 1: Top 10 Worldwide Today */}
        <TopTenRow
          title="Top 10 Today"
          type="movie"
        />

        {/* Row 2: Letterboxd Watchlist & Cinephile Picks */}
        <LetterboxdRow id="letterboxd" />

        {/* Row 3: Trending Blockbusters */}
        <CategoryRow
          id="trending"
          title="Trending Blockbusters"
          subtitle="Most watched titles across all streaming services"
          type="movie"
          catalogId="top"
        />

        {/* Row 4: Action & High-Octane Thrillers */}
        <CategoryRow
          id="action"
          title="Action & High-Octane"
          subtitle="Fast pursuits, motorsport thrillers, and explosive stunts"
          type="movie"
          catalogId="top"
          extra={ACTION_EXTRA}
        />

        {/* Row 5: Critically Acclaimed Masterpieces */}
        <CategoryRow
          id="critics"
          title="Critically Acclaimed"
          subtitle="Highest rated cinema in history"
          type="movie"
          catalogId="imdbRating"
        />

        {/* Row 6: Binge-Worthy Television */}
        <CategoryRow
          id="series"
          title="Binge-Worthy TV Dramas"
          subtitle="Multi-season dramas and premium television"
          type="series"
          catalogId="top"
        />

        {/* Row 7: Sci-Fi & Speculative Futures */}
        <CategoryRow
          id="scifi"
          title="Sci-Fi & Mind-Benders"
          subtitle="Synthetic realms, time loops, and speculative futures"
          type="movie"
          catalogId="top"
          extra={SCIFI_EXTRA}
        />

        {/* Row 8: New Premieres */}
        <CategoryRow
          id="premieres"
          title="New Releases"
          subtitle="Fresh off the festival and theatrical circuit"
          type="movie"
          catalogId="year"
        />

        {/* Row 9: All-Time Greatest TV */}
        <CategoryRow
          id="top-series"
          title="All-Time Greatest Series"
          subtitle="Ranked by global audience score"
          type="series"
          catalogId="imdbRating"
        />

        {/* Row 10: User's Watchlist */}
        {watchlist.length > 0 && (
          <CategoryRow
            id="watchlist"
            title="My Saved List"
            subtitle="Titles queued in your personal collection"
            type="movie"
            catalogId="watchlist"
            items={watchlist}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
