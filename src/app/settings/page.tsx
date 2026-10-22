'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  Cloud,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { addonManager } from '@/lib/stremio/addon-manager';
import { useStremioAuthStore } from '@/store/stremio-auth-store';
import { probeStremioEngine, type EngineStatus } from '@/lib/stremio/streaming-engine';
import { StremioLoginModal } from '@/components/auth/StremioLoginModal';
import { Footer } from '@/components/layout/Footer';
import type { InstalledAddon } from '@/lib/stremio/types';

const POPULAR_ADDONS = [
  {
    name: 'Torrentio',
    description: 'Scrapes multi-resolution torrent streams with real-time seeder health and audio specs.',
    manifestUrl: 'https://torrentio.strem.fun/manifest.json',
    category: 'Streams',
  },
  {
    name: 'Cyberflix Catalog',
    description: 'Provides categorized catalogs for Netflix, Prime Video, Disney+, Apple TV+, and HBO.',
    manifestUrl: 'https://cyberflix.elfhosted.com/manifest.json',
    category: 'Catalogs',
  },
  {
    name: 'OpenSubtitles v3',
    description: 'Official multi-language subtitles provider for Stremio in over 60+ languages.',
    manifestUrl: 'https://opensubtitles-v3.strem.io/manifest.json',
    category: 'Subtitles',
  },
  {
    name: 'Anime Kitsu',
    description: 'Anime catalog provider with episode rankings, seasonal releases, and Japanese audio links.',
    manifestUrl: 'https://anime-kitsu.strem.fun/manifest.json',
    category: 'Anime',
  },
];

export default function SettingsPage() {
  const [addons, setAddons] = useState<InstalledAddon[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const {
    user,
    isLoggedIn,
    isSyncing,
    syncedAddonsCount,
    syncedItemsCount,
    syncFromCloud,
    loadSessionFromStorage,
  } = useStremioAuthStore();

  useEffect(() => {
    (async () => {
      await addonManager.initialize();
      setAddons(addonManager.getAddons());
      loadSessionFromStorage();
      const status = await probeStremioEngine();
      setEngineStatus(status);
    })();
  }, [loadSessionFromStorage]);

  const handleInstallCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setIsInstalling(true);
    setStatusMessage(null);

    let formattedUrl = customUrl.trim();
    if (!formattedUrl.endsWith('/manifest.json')) {
      formattedUrl = formattedUrl.replace(/\/$/, '') + '/manifest.json';
    }

    try {
      const installed = await addonManager.installAddon(formattedUrl);
      if (installed) {
        setAddons(addonManager.getAddons());
        setStatusMessage({ text: `Successfully installed ${installed.manifest.name}!` });
        setCustomUrl('');
      } else {
        setStatusMessage({
          text: 'Failed to install addon. Please check the URL and ensure CORS is enabled.',
          isError: true,
        });
      }
    } catch (err) {
      setStatusMessage({
        text: 'Error installing addon: ' + (err instanceof Error ? err.message : String(err)),
        isError: true,
      });
    } finally {
      setIsInstalling(false);
    }
  };

  const handleInstallPreset = async (manifestUrl: string) => {
    setIsInstalling(true);
    setStatusMessage(null);

    try {
      const installed = await addonManager.installAddon(manifestUrl);
      if (installed) {
        setAddons(addonManager.getAddons());
        setStatusMessage({ text: `Installed ${installed.manifest.name}!` });
      } else {
        setStatusMessage({ text: 'Could not fetch addon manifest.', isError: true });
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleRemove = (transportUrl: string) => {
    addonManager.removeAddon(transportUrl);
    setAddons(addonManager.getAddons());
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white pt-24 px-6 sm:px-10 md:px-16">
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div className="border-b border-white/[0.06] pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Settings & Connected Addons
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-normal">
            Manage your Stremio cloud synchronization, background streaming engine, and installed addons.
          </p>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-center gap-3 transition ${
              statusMessage.isError
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Section 1: Stremio Cloud Sync Status Card */}
        <section className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-7 backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-md">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Stremio Cloud Sync
                </span>
                <h2 className="text-xl font-semibold text-white tracking-tight mt-0.5">
                  {isLoggedIn && user ? user.email : 'Stremio Account'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {isLoggedIn
                    ? `Synced ${syncedAddonsCount} addons & ${syncedItemsCount} library items.`
                    : 'Connect your Stremio account to automatically sync all your addons and history.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => syncFromCloud()}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition shadow-lg disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
                  </button>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-5 py-2.5 rounded-full border border-white/15 bg-white/5 text-zinc-300 hover:text-white text-xs font-medium transition"
                  >
                    Account
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition shadow-lg"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Connect Stremio</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Local Streaming Engine (Port 11470) */}
        <section className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-7 backdrop-blur-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  Streaming Engine
                </span>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Local Streaming Server (Port 11470)
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  engineStatus?.isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className={engineStatus?.isOnline ? 'text-emerald-300 font-medium' : 'text-amber-300 font-medium'}>
                {engineStatus?.isOnline ? 'Connected (127.0.0.1:11470)' : 'Standalone Web Pipeline'}
              </span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed pt-1">
            {engineStatus?.isOnline
              ? `Connected to Stremio local background engine (${engineStatus.latencyMs}ms latency). Torrent streams and Debrid cache can be decoded directly in-browser.`
              : 'Stremio desktop engine is not detected on 127.0.0.1:11470. Direct HTTP and Debrid streams play in-browser, and torrent streams can be opened in native Stremio with 1-click.'}
          </p>
        </section>

        {/* Section 3: Add Custom Addon */}
        <section className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-7 backdrop-blur-2xl space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-400" />
              Install Addon by Manifest URL
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Paste any Stremio manifest URL (e.g. from stremio-addons.net) to integrate its catalog or stream links.
            </p>
          </div>

          <form onSubmit={handleInstallCustom} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://torrentio.strem.fun/manifest.json"
              className="flex-1 bg-white/[0.05] border border-white/10 rounded-full px-5 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-white/30 transition"
            />
            <button
              type="submit"
              disabled={isInstalling || !customUrl.trim()}
              className="px-7 py-3 bg-white hover:bg-white/90 disabled:opacity-50 text-black font-semibold text-xs rounded-full transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              {isInstalling ? 'Installing...' : 'Install Addon'}
            </button>
          </form>
        </section>

        {/* Section 4: 1-Click Popular Addons */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-400" />
              Popular Community Addons
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {POPULAR_ADDONS.map((preset) => {
              const isInstalled = addons.some(
                (a) => a.transportUrl.replace(/\/manifest\.json$/, '') === preset.manifestUrl.replace(/\/manifest\.json$/, '')
              );

              return (
                <div
                  key={preset.name}
                  className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-5 flex flex-col justify-between space-y-4 hover:border-white/15 transition duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-sm">{preset.name}</h3>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-medium">
                        {preset.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    {isInstalled ? (
                      <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Installed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInstallPreset(preset.manifestUrl)}
                        disabled={isInstalling}
                        className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white hover:text-black text-xs font-semibold transition duration-200 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Install
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Installed Addons List */}
        <section className="space-y-4 pt-6 border-t border-white/[0.06]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-400" />
            Active Installed Addons ({addons.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map((addon) => {
              const isOfficial = addon.flags?.official;
              return (
                <div
                  key={addon.transportUrl}
                  className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-5 flex flex-col justify-between hover:border-white/20 transition duration-200 space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                          {addon.manifest.name}
                          {isOfficial && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-zinc-300 font-medium">
                              Official
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {addon.manifest.description || 'No description provided.'}
                        </p>
                      </div>

                      {!isOfficial && (
                        <button
                          onClick={() => handleRemove(addon.transportUrl)}
                          className="p-2 text-zinc-500 hover:text-rose-400 transition"
                          title="Uninstall Addon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-zinc-500">
                    <span>v{addon.manifest.version || '1.0.0'}</span>
                    <span className="truncate max-w-[200px]">{addon.transportUrl}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Auth Modal */}
      <StremioLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
