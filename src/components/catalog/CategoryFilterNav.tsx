'use client';

import { Flame, Trophy, Film, Sparkles, Clock, Bookmark, Clapperboard, Compass } from 'lucide-react';

interface CategoryFilterNavProps {
  activeCategory: string;
  onSelectCategory: (id: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'top-10', label: 'Top 10', icon: Trophy },
  { id: 'letterboxd', label: 'Letterboxd', icon: Film },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'action', label: 'Action & Thrillers', icon: Clapperboard },
  { id: 'critics', label: 'Critically Acclaimed', icon: Sparkles },
  { id: 'series', label: 'TV Dramas', icon: Film },
  { id: 'scifi', label: 'Sci-Fi & Fantasy', icon: Sparkles },
  { id: 'history', label: 'Continue Watching', icon: Clock },
  { id: 'watchlist', label: 'My List', icon: Bookmark },
];

export function CategoryFilterNav({
  activeCategory,
  onSelectCategory,
}: CategoryFilterNavProps) {
  const handleClick = (id: string) => {
    onSelectCategory(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-[58px] z-40 bg-black/40 backdrop-blur-2xl border-y border-white/[0.06] py-3 px-4 md:px-12">
      <div className="flex items-center gap-2 overflow-x-auto row-scrollbar no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-300 flex-shrink-0 select-none ${
                isActive
                  ? 'bg-white text-black font-semibold shadow-sm scale-105'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/[0.08]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
