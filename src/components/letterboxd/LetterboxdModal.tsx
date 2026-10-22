'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Film,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  Bookmark,
  Star,
  LogOut,
} from 'lucide-react';
import { useLetterboxdStore } from '@/store/letterboxd-store';
import { useStremioAuthStore } from '@/store/stremio-auth-store';
import { getLetterboxdProfileUrl } from '@/lib/letterboxd/stremboxd';

interface LetterboxdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LetterboxdModal({ isOpen, onClose }: LetterboxdModalProps) {
  const {
    username,
    isConnected,
    watchlist,
    diary,
    isLoading,
    isSyncing,
    error,
    connect,
    sync,
    disconnect,
  } = useLetterboxdStore();

  const { user: stremioUser } = useStremioAuthStore();

  const [inputUsername, setInputUsername] = useState(username || '');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If user has a Stremio login username like "ayanshxikh2", default to that if empty
  useEffect(() => {
    if (!username && stremioUser?.email) {
      const emailPrefix = stremioUser.email.split('@')[0];
      setInputUsername(emailPrefix);
    } else if (username) {
      setInputUsername(username);
    }
  }, [username, stremioUser]);

  if (!isOpen) return null;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUsername.trim()) return;

    setSuccessMsg(null);
    const success = await connect(inputUsername.trim());
    if (success) {
      setSuccessMsg(`Successfully synced Letterboxd account @${inputUsername.trim()}`);
    }
  };

  const handleSync = async () => {
    setSuccessMsg(null);
    await sync();
    setSuccessMsg('Watchlist & cinephile catalogs refreshed from Letterboxd.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in font-sans">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0C0D12] border border-[#00E054]/30 p-6 md:p-8 shadow-[0_0_50px_rgba(0,224,84,0.15)] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#00E054]/10 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#00E054]/20 border border-[#00E054]/40 flex items-center justify-center text-[#00E054] shadow-[0_0_20px_rgba(0,224,84,0.3)]">
            <Film className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00E054]">
                Letterboxd Sync
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Letterboxd Integration
            </h2>
          </div>
        </div>

        {/* Content */}
        {isConnected && username ? (
          <div className="space-y-5">
            {/* Connected Card */}
            <div className="p-5 rounded-2xl bg-[#14151C] border border-[#00E054]/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#00E054] text-black font-black flex items-center justify-center text-sm shadow">
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00E054] animate-pulse" />
                      <span className="text-xs font-mono font-bold text-white">
                        @{username}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Letterboxd account linked & synced
                    </p>
                  </div>
                </div>

                <a
                  href={getLetterboxdProfileUrl(username)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-mono text-[#00E054] hover:underline"
                >
                  <span>PROFILE</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 font-mono text-center">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-lg font-black text-[#00E054]">
                    {watchlist.length}
                  </span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Watchlist Titles
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-lg font-black text-white">
                    {diary.length}
                  </span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                    Logged in Diary
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="p-3 rounded-xl bg-[#00E054]/10 border border-[#00E054]/30 text-[#00E054] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#00E054] hover:bg-[#00c54a] text-black font-black text-xs uppercase tracking-wider rounded-xl transition shadow-[0_0_20px_rgba(0,224,84,0.3)] disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'SYNCING WATCHLIST...' : 'SYNC WATCHLIST NOW'}</span>
              </button>

              <button
                onClick={disconnect}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 text-gray-400 text-xs font-mono font-bold transition flex items-center gap-1.5"
                title="Disconnect Letterboxd Account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">DISCONNECT</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConnect} className="space-y-4">
            <p className="text-xs text-gray-300 leading-relaxed font-sans">
              Enter your public <strong className="text-white">Letterboxd username</strong> to
              instantly sync your Watchlist, stream any queued film directly in your browser, and
              log movies to your diary with one click.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>Letterboxd Username</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-xs">
                  @
                </span>
                <input
                  type="text"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  placeholder="e.g. ayanshxikh2"
                  className="w-full bg-[#14151C] border border-white/10 focus:border-[#00E054] rounded-xl pl-8 pr-4 py-3 text-sm text-white font-mono placeholder:text-gray-600 outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputUsername.trim()}
              className="w-full py-3.5 rounded-xl bg-[#00E054] hover:bg-[#00c54a] text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_25px_rgba(0,224,84,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>SYNCING WITH LETTERBOXD...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>CONNECT LETTERBOXD WATCHLIST</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-500 text-center font-mono">
              Zero passwords needed. Powered by open Stremboxd protocol and Stremio streaming pipelines.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
