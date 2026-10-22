'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Sliders,
  Menu,
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Film,
  Tv,
} from 'lucide-react';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { useAppStore } from '@/store/app-store';
import { useStremioAuthStore } from '@/store/stremio-auth-store';
import { useLetterboxdStore } from '@/store/letterboxd-store';
import { StremioLoginModal } from '@/components/auth/StremioLoginModal';
import { LetterboxdModal } from '@/components/letterboxd/LetterboxdModal';

const NAV_TABS = [
  { href: '/', label: 'Watch Now' },
  { href: '/#top-10', label: 'Top 10' },
  { href: '/#letterboxd', label: 'Letterboxd' },
  { href: '/browse?type=movie', label: 'Movies' },
  { href: '/browse?type=series', label: 'TV Shows' },
  { href: '/browse?list=true', label: 'My List' },
];

export function Navbar() {
  const pathname = usePathname();
  const isScrolled = useScrollPosition(20);
  const { isSearchOpen, setSearchOpen, searchQuery, setSearchQuery } = useAppStore();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLetterboxdModalOpen, setIsLetterboxdModalOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const { user, isLoggedIn, isSyncing, loadSessionFromStorage } = useStremioAuthStore();
  const { username: letterboxdUser, isConnected: isLetterboxdConnected, initialize: initLetterboxd } = useLetterboxdStore();

  useEffect(() => {
    loadSessionFromStorage();
    initLetterboxd();
  }, [loadSessionFromStorage, initLetterboxd]);

  useEffect(() => {
    if (isSearchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-3.5 transition-all duration-500 ${
          isScrolled
            ? 'bg-black/60 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
            : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent'
        }`}
      >
        {/* Left: Apple TV Style Monogram Logo */}
        <Link href="/" className="flex items-center gap-2 group select-none">
          <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-transform group-hover:scale-105">
            <Tv className="w-4 h-4 fill-white" />
          </div>
          <div className="flex items-baseline">
            <span className="text-base font-semibold tracking-tight text-white">Stremio</span>
            <span className="text-base font-light tracking-tight text-white/70 ml-0.5">tv</span>
          </div>
        </Link>

        {/* Center: Apple TV Segmented Capsule Navigation */}
        <nav className="hidden lg:flex items-center p-1 rounded-full apple-pill-nav">
          {NAV_TABS.map((tab) => {
            const isActive = pathname === tab.href || (tab.href === '/' && pathname === '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative px-4 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-300 select-none ${
                  isActive
                    ? 'text-white bg-white/[0.16] shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search, Letterboxd, Stremio Cloud, Settings */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Letterboxd Cinephile Pill */}
          {isLetterboxdConnected && letterboxdUser ? (
            <button
              onClick={() => setIsLetterboxdModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-medium text-white transition"
              title="Letterboxd Watchlist Connected"
            >
              <span className="w-2 h-2 rounded-full bg-[#00E054]" />
              <span className="truncate max-w-[110px] text-white/90">
                @{letterboxdUser}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsLetterboxdModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-white/70 hover:text-white transition"
              title="Connect your Letterboxd ID"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Letterboxd</span>
            </button>
          )}

          {/* Stremio Cloud Sync Status */}
          {isLoggedIn && user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-medium text-white transition"
              title="Stremio Account Connected"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="truncate max-w-[120px] text-white/80">
                {user.email.split('@')[0]}
              </span>
              {isSyncing && <RefreshCw className="w-3 h-3 text-white/60 animate-spin" />}
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-semibold tracking-tight transition shadow-sm"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Minimalist Search Expandable Pill */}
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <div
              className={`flex items-center rounded-full transition-all duration-300 ${
                isSearchOpen
                  ? 'w-[180px] sm:w-[240px] bg-white/[0.12] border border-white/20 px-3 py-1'
                  : 'w-8 h-8 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 justify-center'
              }`}
            >
              <button
                type="button"
                onClick={() => setSearchOpen(!isSearchOpen)}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              {isSearchOpen && (
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, TV..."
                  className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-full pl-2"
                />
              )}
            </div>
          </form>

          {/* Settings Pill */}
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
            title="Settings & Addons"
          >
            <Sliders className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden w-8 h-8 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Glass Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[60px] z-40 bg-black/90 backdrop-blur-3xl border-b border-white/10 px-6 py-6 space-y-4 animate-fade-in">
          {NAV_TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-medium text-white/80 hover:text-white py-1.5"
            >
              {tab.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <span>Stremio Cloud</span>
            <span className={isLoggedIn ? 'text-white' : 'text-white/40'}>
              {isLoggedIn ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      )}

      {/* Login / Sync Modal */}
      <StremioLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Letterboxd Cinephile Sync Modal */}
      <LetterboxdModal
        isOpen={isLetterboxdModalOpen}
        onClose={() => setIsLetterboxdModalOpen(false)}
      />
    </>
  );
}
