'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="px-6 sm:px-10 md:px-16 py-16 mt-24 border-t border-white/[0.06] bg-[#050507] text-zinc-400">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3">
            <span className="text-white font-medium text-xs tracking-wider uppercase block">
              Watch Now
            </span>
            <Link href="/" className="block text-zinc-400 hover:text-white transition duration-200">
              Top Shelf Discover
            </Link>
            <Link href="/#top-10" className="block text-zinc-400 hover:text-white transition duration-200">
              Top 10 Today
            </Link>
            <Link href="/browse?type=movie" className="block text-zinc-400 hover:text-white transition duration-200">
              Feature Films
            </Link>
            <Link href="/browse?type=series" className="block text-zinc-400 hover:text-white transition duration-200">
              TV Shows
            </Link>
          </div>

          <div className="space-y-3">
            <span className="text-white font-medium text-xs tracking-wider uppercase block">
              Your Library
            </span>
            <Link href="/browse?list=true" className="block text-zinc-400 hover:text-white transition duration-200">
              Watchlist
            </Link>
            <Link href="/search" className="block text-zinc-400 hover:text-white transition duration-200">
              Search Catalog
            </Link>
            <Link href="/settings" className="block text-zinc-400 hover:text-white transition duration-200">
              Connected Addons
            </Link>
          </div>

          <div className="space-y-3">
            <span className="text-white font-medium text-xs tracking-wider uppercase block">
              Integrations
            </span>
            <span className="block text-zinc-400">Letterboxd Cinephile Sync</span>
            <span className="block text-zinc-400">Stremio Addon Protocol v3</span>
            <span className="block text-zinc-400">Cinemeta Metadata Engine</span>
            <span className="block text-zinc-400">Local Hardware Pipeline (11470)</span>
          </div>

          <div className="space-y-3">
            <span className="text-white font-medium text-xs tracking-wider uppercase block">
              Architecture
            </span>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Curated streaming interface inspired by Apple TV design language. Powered by decentralized community addons and the open Stremio ecosystem.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-semibold text-base tracking-tight">stremio</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white tracking-wide">
                tv
              </span>
            </div>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">Decentralized Web Cinema</span>
          </div>

          <p className="text-zinc-500 text-xs">
            Designed for cinematic clarity, fluid gesture dynamics, and zero visual clutter.
          </p>
        </div>
      </div>
    </footer>
  );
}
