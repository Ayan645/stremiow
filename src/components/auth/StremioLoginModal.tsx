'use client';

import { useState } from 'react';
import { X, Lock, Mail, Key, CheckCircle2, RefreshCw, AlertCircle, Cloud } from 'lucide-react';
import { useStremioAuthStore } from '@/store/stremio-auth-store';

interface StremioLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StremioLoginModal({ isOpen, onClose }: StremioLoginModalProps) {
  const [tab, setTab] = useState<'credentials' | 'key'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authKey, setAuthKey] = useState('');

  const {
    user,
    isLoggedIn,
    isSyncing,
    syncStatusMessage,
    syncedAddonsCount,
    syncedItemsCount,
    error,
    loginWithCredentials,
    loginWithAuthKey,
    syncFromCloud,
    logout,
    clearError,
  } = useStremioAuthStore();

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    clearError();
    const success = await loginWithCredentials(email, password);
    if (success) {
      setTimeout(() => onClose(), 1200);
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authKey) return;
    clearError();
    const success = await loginWithAuthKey(authKey);
    if (success) {
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0d0e14]/95 border border-white/10 p-7 sm:p-9 shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.12] transition duration-200"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-7">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white mx-auto shadow-sm mb-3">
            <Cloud className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Connect Stremio Account
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Sync your installed addons, watch history, and personal library across all your screens.
          </p>
        </div>

        {/* If already logged in, show status & sync button */}
        {isLoggedIn && user ? (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3.5">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm shadow-md">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{user.email}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  </div>
                  <span className="text-xs text-emerald-400/90 font-medium block mt-0.5">
                    Cloud Sync Connected
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 text-[11px] block">Active Addons</span>
                  <span className="text-white font-semibold">{syncedAddonsCount} Installed</span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px] block">Library Titles</span>
                  <span className="text-white font-semibold">{syncedItemsCount} Synced</span>
                </div>
              </div>

              {syncStatusMessage && (
                <p className="text-xs text-zinc-400 pt-1 text-center truncate">
                  {syncStatusMessage}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => syncFromCloud()}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition shadow-lg disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
              </button>

              <button
                onClick={() => logout()}
                className="px-5 py-3 rounded-full border border-white/15 bg-white/5 text-zinc-300 hover:text-rose-400 hover:border-rose-400/30 text-xs font-medium transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div>
            {/* Segmented Capsule Tabs */}
            <div className="flex rounded-full bg-white/[0.06] p-1 border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setTab('credentials'); clearError(); }}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition duration-200 ${
                  tab === 'credentials'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => { setTab('key'); clearError(); }}
                className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition duration-200 ${
                  tab === 'key'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Auth Key
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-xs text-rose-300 font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}

            {tab === 'credentials' ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 pl-1">
                    Stremio Email
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 pl-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full mt-2 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition shadow-lg disabled:opacity-50"
                >
                  {isSyncing ? 'Connecting & Syncing...' : 'Sign In & Sync Addons'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleKeySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 pl-1">
                    Stremio Auth Key
                  </label>
                  <div className="relative flex items-center">
                    <Key className="absolute left-3.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={authKey}
                      onChange={(e) => setAuthKey(e.target.value)}
                      placeholder="Paste your authKey..."
                      className="w-full bg-white/[0.05] border border-white/10 focus:border-white/30 rounded-full py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 outline-none transition font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5 pl-1">
                    Found in your browser's localStorage under <code className="text-zinc-300">stremio.authKey</code>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSyncing}
                  className="w-full mt-2 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition shadow-lg disabled:opacity-50"
                >
                  {isSyncing ? 'Validating...' : 'Connect With Auth Key'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
