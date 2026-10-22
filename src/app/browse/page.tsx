'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Film, Tv, Bookmark } from 'lucide-react';
import { CategoryRow } from '@/components/catalog/CategoryRow';
import { ContentCard } from '@/components/catalog/ContentCard';
import { useLibraryStore } from '@/store/library-store';
import { Footer } from '@/components/layout/Footer';

function BrowseContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const isList = searchParams.get('list') === 'true';

  const { watchlist, loadFromStorage } = useLibraryStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const activeTab = isList ? 'list' : typeParam === 'series' ? 'series' : 'movie';

  return (
    <div className="min-h-screen bg-[#050507] text-white pt-24">
      {/* Header with Apple TV Segmented Capsule */}
      <div className="px-6 sm:px-10 md:px-16 py-8 border-b border-white/[0.06] bg-[#050507]/60 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {activeTab === 'list'
                ? 'Your Watchlist'
                : activeTab === 'series'
                ? 'TV Shows'
                : 'Feature Films'}
            </h1>
            <p className="text-sm text-zinc-400 mt-1.5 font-normal">
              {activeTab === 'list'
                ? 'Titles saved to your personal library'
                : 'Curated catalogs powered by the decentralized Stremio network'}
            </p>
          </div>

          {/* Apple TV Segmented Capsule Tab Switcher */}
          <div className="flex items-center gap-1 bg-white/[0.06] p-1.5 rounded-full border border-white/10 backdrop-blur-2xl self-start sm:self-auto">
            <Link
              href="/browse?type=movie"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition duration-200 ${
                activeTab === 'movie'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Movies
            </Link>
            <Link
              href="/browse?type=series"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition duration-200 ${
                activeTab === 'series'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Series
            </Link>
            <Link
              href="/browse?list=true"
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition duration-200 ${
                activeTab === 'list'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Watchlist ({watchlist.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="py-8 space-y-8">
        {activeTab === 'list' ? (
          <div className="px-6 sm:px-10 md:px-16 max-w-7xl mx-auto py-8">
            {watchlist.length === 0 ? (
              <div className="text-center py-28 text-zinc-400 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mx-auto">
                  <Bookmark className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-white tracking-tight">Your Watchlist is Empty</h3>
                <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Explore trending movies and series, or connect your Letterboxd account to automatically import your watchlist.
                </p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-7 py-3 bg-white text-black text-xs font-semibold rounded-full hover:bg-white/90 transition shadow-lg"
                  >
                    Discover Trending Titles
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-semibold text-white">
                    Saved Titles ({watchlist.length})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {watchlist.map((item, index) => (
                    <div key={item.id} className="relative">
                      <ContentCard item={item} index={index} totalInRow={watchlist.length} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'movie' ? (
          <div className="space-y-6 pb-16">
            <CategoryRow
              title="Trending Feature Films"
              subtitle="High demand cinema across the world"
              type="movie"
              catalogId="top"
            />
            <CategoryRow
              title="Action & Blockbusters"
              subtitle="Pulsing spectacles and high-octane excitement"
              type="movie"
              catalogId="top"
              extra={{ genre: 'Action' }}
            />
            <CategoryRow
              title="Science Fiction & Thrillers"
              subtitle="Mind-bending cinematic sagas"
              type="movie"
              catalogId="top"
              extra={{ genre: 'Sci-Fi' }}
            />
            <CategoryRow
              title="Critically Acclaimed Masterpieces"
              subtitle="Highest rated according to IMDb audiences"
              type="movie"
              catalogId="imdbRating"
            />
            <CategoryRow
              title="New Theatrical Premieres"
              subtitle="Latest releases now available"
              type="movie"
              catalogId="year"
            />
          </div>
        ) : (
          <div className="space-y-6 pb-16">
            <CategoryRow
              title="Popular Television"
              subtitle="The most-watched series worldwide"
              type="series"
              catalogId="top"
            />
            <CategoryRow
              title="Gripping Crime & Drama"
              subtitle="High-stakes serialized storytelling"
              type="series"
              catalogId="top"
              extra={{ genre: 'Action' }}
            />
            <CategoryRow
              title="Critically Acclaimed Shows"
              subtitle="Highest IMDb episodic scores"
              type="series"
              catalogId="imdbRating"
            />
            <CategoryRow
              title="New Seasons & Premieres"
              subtitle="Recently launched television"
              type="series"
              catalogId="year"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050507] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
