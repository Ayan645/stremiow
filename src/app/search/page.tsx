'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, Film, Tv, X } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { ContentCard } from '@/components/catalog/ContentCard';
import { CategoryRow } from '@/components/catalog/CategoryRow';
import { Footer } from '@/components/layout/Footer';
import type { ContentType } from '@/lib/stremio/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<ContentType | undefined>(undefined);

  const { results, isLoading, error } = useSearch(query, typeFilter);

  return (
    <div className="min-h-screen bg-[#050507] text-white pt-24 px-6 sm:px-10 md:px-16">
      {/* Search Input Bar */}
      <div className="max-w-3xl mx-auto my-8">
        <div className="relative flex items-center bg-white/[0.06] border border-white/10 rounded-full px-6 py-4 shadow-xl focus-within:border-white/30 backdrop-blur-3xl transition duration-200">
          <SearchIcon className="w-5 h-5 text-zinc-400 mr-3.5 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, actors, genres..."
            className="bg-transparent text-white placeholder-zinc-500 outline-none w-full text-base font-normal"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setTypeFilter(undefined)}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition duration-200 ${
              typeFilter === undefined
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.06] border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            All Content
          </button>
          <button
            onClick={() => setTypeFilter('movie')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition duration-200 ${
              typeFilter === 'movie'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.06] border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Movies
          </button>
          <button
            onClick={() => setTypeFilter('series')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition duration-200 ${
              typeFilter === 'series'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.06] border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            TV Shows
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto my-10">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-2xl bg-white/[0.04] animate-shimmer"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {!isLoading && query.length >= 2 && results.length === 0 && (
          <div className="text-center py-20 text-zinc-400 space-y-2">
            <p className="text-xl font-semibold text-white tracking-tight">
              No results found for &quot;{query}&quot;
            </p>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Try searching with another spelling, genre, or check your connected Stremio addons.
            </p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">
              Search Results ({results.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {results.map((item, idx) => (
                <div key={item.id} className="flex justify-center">
                  <ContentCard item={item} index={idx} totalInRow={results.length} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* When no query entered, show trending */}
        {!query && (
          <div className="space-y-8 pt-6">
            <h2 className="text-2xl font-bold text-white px-2 tracking-tight">Trending Across Stremio</h2>
            <CategoryRow title="Top Feature Films" type="movie" catalogId="top" />
            <CategoryRow title="Popular TV Shows" type="series" catalogId="top" />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050507] pt-24 text-center text-zinc-400">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
