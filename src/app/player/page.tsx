'use client';

import { Suspense, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Layers,
  Subtitles,
  ExternalLink,
  Check,
  AlertCircle,
  RefreshCw,
  Film,
} from 'lucide-react';
import { formatTime } from '@/lib/utils/format';
import { StremioAddonClient } from '@/lib/stremio/addon-client';
import { addonManager } from '@/lib/stremio/addon-manager';
import { resolveStreams, sortStreams, getBestStream, type ResolvedStream } from '@/lib/stremio/stream-resolver';
import { getStremioDeepLink, probeStremioEngine, type EngineStatus } from '@/lib/stremio/streaming-engine';
import { useLibraryStore } from '@/store/library-store';
import { useStremioAuthStore } from '@/store/stremio-auth-store';
import { LetterboxdLogModal } from '@/components/letterboxd/LetterboxdLogModal';
import type { ContentType, Stream, Subtitle } from '@/lib/stremio/types';

function PlayerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const directUrl = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Playing Media';
  const type = (searchParams.get('type') || 'movie') as ContentType;
  const id = searchParams.get('id') || '';

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const syncIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stremioflix_volume');
      return saved ? parseFloat(saved) : 1;
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Stremio Pipeline & Stream Resolution State
  const [availableStreams, setAvailableStreams] = useState<ResolvedStream[]>([]);
  const [currentStream, setCurrentStream] = useState<ResolvedStream | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(directUrl);
  const [isResolvingStreams, setIsResolvingStreams] = useState(false);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isStreamDrawerOpen, setIsStreamDrawerOpen] = useState(false);
  const [selectedAddonFilter, setSelectedAddonFilter] = useState<string>('all');
  const [selectedQualityFilter, setSelectedQualityFilter] = useState<string>('all');

  // Subtitles
  const [availableSubtitles, setAvailableSubtitles] = useState<Subtitle[]>([]);
  const [activeSubtitleUrl, setActiveSubtitleUrl] = useState<string | null>(null);
  const [isSubtitlesOpen, setIsSubtitlesOpen] = useState(false);
  const [isLetterboxdLogOpen, setIsLetterboxdLogOpen] = useState(false);

  const { updateWatchHistory } = useLibraryStore();
  const { pushWatchProgress } = useStremioAuthStore();

  // Auto-hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isStreamDrawerOpen && !isSubtitlesOpen) {
        setShowControls(false);
      }
    }, 3800);
  }, [isPlaying, isStreamDrawerOpen, isSubtitlesOpen]);

  // 1. Probe local Stremio Engine (port 11470) on mount
  useEffect(() => {
    probeStremioEngine().then(setEngineStatus);
  }, []);

  // 2. Fetch all streams from Stremio Addon Pipeline
  useEffect(() => {
    if (!id || !type) return;

    let cancelled = false;
    setIsResolvingStreams(true);

    const loadStreamsAndSubtitles = async () => {
      try {
        await addonManager.initialize();

        const addonUrls = Array.from(
          new Set([
            'https://torrentio.strem.fun',
            ...addonManager.getStreamAddonUrls(type),
          ])
        );

        const streamPromises = addonUrls.map(async (url) => {
          try {
            const client = new StremioAddonClient(url);
            return await client.getStreams(type, id);
          } catch {
            return [] as Stream[];
          }
        });

        const results = await Promise.all(streamPromises);
        if (cancelled) return;

        const allRawStreams: Stream[] = results.flat();
        const resolved = resolveStreams(allRawStreams);
        const sorted = sortStreams(resolved, 'recommended');

        setAvailableStreams(sorted);

        // If no direct URL was supplied, pick the best recommended stream automatically
        if (!directUrl && sorted.length > 0) {
          const best = getBestStream(sorted);
          if (best && best.playableUrl) {
            setCurrentStream(best);
            setActiveStreamUrl(best.playableUrl);
          }
        } else if (directUrl) {
          const matched = sorted.find((s) => s.playableUrl === directUrl);
          if (matched) setCurrentStream(matched);
        }

        // Fetch Subtitles from OpenSubtitles
        try {
          const openSubsClient = new StremioAddonClient('https://opensubtitles-v3.strem.io');
          const subs = await openSubsClient.getSubtitles(type, id);
          if (!cancelled && subs) {
            setAvailableSubtitles(subs);
          }
        } catch {
          // Ignore subtitle fetch errors
        }
      } catch (err) {
        console.error('Failed to resolve streams from pipeline:', err);
      } finally {
        if (!cancelled) {
          setIsResolvingStreams(false);
        }
      }
    };

    loadStreamsAndSubtitles();

    return () => {
      cancelled = true;
    };
  }, [id, type, directUrl]);

  // 3. Attach Video Source (Direct, HLS, or Stremio Engine HTTP)
  useEffect(() => {
    if (!videoRef.current || !activeStreamUrl) return;

    const video = videoRef.current;
    setPlaybackError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = activeStreamUrl.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(activeStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPlaybackError(`HLS stream playback error (${data.type})`);
        }
      });
    } else {
      video.src = activeStreamUrl;
      video.load();
      video.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Auto-play prevented or stream error:', err);
        setIsPlaying(false);
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl]);

  // 4. Bi-Directional Watch Progress Sync
  const saveProgress = useCallback(() => {
    if (!videoRef.current || !id) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 1;
    if (current <= 0 || !dur) return;

    const historyItem = {
      id,
      type,
      name: title,
      progress: Math.min(1, current / dur),
      currentTime: Math.round(current),
      duration: Math.round(dur),
      lastWatched: Date.now(),
    };

    updateWatchHistory(historyItem);
    pushWatchProgress(historyItem);
  }, [id, type, title, updateWatchHistory, pushWatchProgress]);

  // Periodic progress sync every 10 seconds
  useEffect(() => {
    syncIntervalRef.current = setInterval(saveProgress, 10000);
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      saveProgress();
    };
  }, [saveProgress]);

  // Video control handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        setPlaybackError('Browser could not decode format. Try another stream or desktop MPV: ' + e.message);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  };

  const seek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    resetControlsTimeout();
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.buffered.length > 0) {
      setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
    resetControlsTimeout();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('stremioflix_volume', String(vol));
    }
    resetControlsTimeout();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        seek(10);
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        seek(-10);
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'Escape') {
        setIsStreamDrawerOpen(false);
        setIsSubtitlesOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Extract distinct addons for in-player filtering
  const distinctAddons = useMemo(() => {
    const set = new Set<string>();
    availableStreams.forEach((s) => {
      if (s.addonCategory) set.add(s.addonCategory);
    });
    return ['all', ...Array.from(set)];
  }, [availableStreams]);

  // Filtered streams for drawer
  const filteredDrawerStreams = useMemo(() => {
    let list = [...availableStreams];
    if (selectedAddonFilter !== 'all') {
      list = list.filter((s) => s.addonCategory === selectedAddonFilter);
    }
    if (selectedQualityFilter !== 'all') {
      list = list.filter((s) => s.quality === selectedQualityFilter);
    }
    return list;
  }, [availableStreams, selectedAddonFilter, selectedQualityFilter]);

  const stremioDeepLink = getStremioDeepLink(type, id);

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      className="relative w-screen h-screen bg-[#050507] overflow-hidden select-none font-sans"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setPlaybackError(
            'Format requires hardware passthrough or local Stremio engine.'
          );
        }}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      >
        {activeSubtitleUrl && (
          <track
            src={activeSubtitleUrl}
            kind="subtitles"
            srcLang="en"
            label="Active Subtitle"
            default
          />
        )}
      </video>

      {/* Top Floating Glass Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-6 sm:p-8 flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Back Button */}
        <button
          onClick={() => {
            saveProgress();
            router.back();
          }}
          className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.18] backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white transition duration-200"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Title & Active Stream Info */}
        <div className="text-center max-w-lg px-4 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-white truncate drop-shadow-md tracking-tight">
            {title}
          </h2>
          {currentStream && (
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 mt-1">
              <span className="font-medium text-white">{currentStream.quality || '1080p'}</span>
              <span>·</span>
              <span>{currentStream.addonCategory || currentStream.source}</span>
              {currentStream.size && <span>· {currentStream.size}</span>}
              {currentStream.hdrFlavor && currentStream.hdrFlavor !== 'SDR' && (
                <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] text-white font-medium">
                  {currentStream.hdrFlavor}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Controls: Engine Status, Letterboxd Log & Stream Drawer */}
        <div className="flex items-center gap-2.5">
          {/* Engine indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/10 text-xs text-zinc-300">
            <span
              className={`w-2 h-2 rounded-full ${
                engineStatus?.isOnline ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="font-medium">
              {engineStatus?.isOnline ? 'Local Engine' : 'Web Stream'}
            </span>
          </div>

          {/* Log to Letterboxd */}
          <button
            onClick={() => setIsLetterboxdLogOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#00E054]/15 hover:bg-[#00E054]/25 border border-[#00E054]/30 text-[#00E054] text-xs font-medium backdrop-blur-2xl transition duration-200"
            title="Log film to Letterboxd"
          >
            <Film className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">Log</span>
          </button>

          {/* Stream Switcher Drawer Toggle */}
          <button
            onClick={() => {
              setIsStreamDrawerOpen(!isStreamDrawerOpen);
              setIsSubtitlesOpen(false);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/10 text-white text-xs font-medium backdrop-blur-2xl transition duration-200"
            title="Switch Stream Source"
          >
            <Layers className="w-4 h-4 text-zinc-400" />
            <span className="hidden md:inline">Streams ({availableStreams.length})</span>
          </button>
        </div>
      </div>

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !playbackError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-20">
          <button
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl transition duration-300 hover:scale-105"
            aria-label="Play"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        </div>
      )}

      {/* Playback Error Modal with 1-Click Fallback to Native Stremio */}
      {playbackError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
          <div className="max-w-md w-full rounded-3xl bg-[#111218]/95 border border-white/15 p-7 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-white tracking-tight">
                Browser Playback Notice
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {playbackError}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setPlaybackError(null);
                  setIsStreamDrawerOpen(true);
                }}
                className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-xs transition duration-200"
              >
                Try Another Stream
              </button>

              <a
                href={stremioDeepLink}
                className="flex-1 py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Desktop</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* In-Player Stream Selector Drawer */}
      {isStreamDrawerOpen && (
        <div className="absolute top-24 right-6 sm:right-8 bottom-28 z-40 w-[340px] sm:w-[420px] rounded-3xl bg-[#0d0e14]/90 backdrop-blur-3xl border border-white/10 p-6 shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-400" />
              Available Streams
            </span>
            <button
              onClick={() => setIsStreamDrawerOpen(false)}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Done
            </button>
          </div>

          {/* Addon Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 row-scrollbar">
            {distinctAddons.map((addon) => (
              <button
                key={addon}
                onClick={() => setSelectedAddonFilter(addon)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition flex-shrink-0 ${
                  selectedAddonFilter === addon
                    ? 'bg-white text-black'
                    : 'bg-white/[0.06] text-zinc-400 hover:text-white'
                }`}
              >
                {addon === 'all' ? 'All Addons' : addon}
              </button>
            ))}
          </div>

          {/* Quality Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-white/[0.06] row-scrollbar">
            {['all', '4K', '1080p', '720p'].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQualityFilter(q)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition flex-shrink-0 ${
                  selectedQualityFilter === q
                    ? 'bg-white text-black'
                    : 'bg-white/[0.06] text-zinc-400 hover:text-white'
                }`}
              >
                {q === 'all' ? 'All Qualities' : q}
              </button>
            ))}
          </div>

          {/* Streams List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 row-scrollbar">
            {isResolvingStreams && availableStreams.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-5 h-5 text-white/50 animate-spin mx-auto" />
                <p className="text-xs text-zinc-400">Discovering high-speed streams...</p>
              </div>
            ) : filteredDrawerStreams.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-12">
                No streams found for this filter.
              </p>
            ) : (
              filteredDrawerStreams.map((stream, idx) => {
                const isSelected = currentStream?.playableUrl === stream.playableUrl;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (stream.playableUrl) {
                        setCurrentStream(stream);
                        setActiveStreamUrl(stream.playableUrl);
                        setIsStreamDrawerOpen(false);
                      }
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition duration-200 ${
                      isSelected
                        ? 'bg-white/15 border-white/30 text-white shadow-lg'
                        : stream.isRecommended
                        ? 'bg-white/[0.05] border-white/15 hover:bg-white/[0.1] text-zinc-300'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.08] hover:border-white/15 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">
                          {stream.quality || '1080p'}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                          {stream.addonCategory}
                        </span>
                        {stream.hdrFlavor && stream.hdrFlavor !== 'SDR' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">
                            {stream.hdrFlavor}
                          </span>
                        )}
                        {stream.isRecommended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-black font-semibold">
                            Recommended
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>

                    <p className="text-xs text-zinc-200 truncate">
                      {stream.title?.split('\n')[0] || stream.name || 'Stream Option'}
                    </p>

                    <div className="flex items-center gap-2.5 text-xs text-zinc-400 mt-1.5 flex-wrap">
                      {stream.speedRating && (
                        <span className="text-emerald-400 font-medium">
                          {stream.speedRating}
                        </span>
                      )}
                      {stream.size && <span>{stream.size}</span>}
                      {stream.seeders !== undefined && <span>· {stream.seeders} seeds</span>}
                      {stream.audioFormat && <span>· {stream.audioFormat}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Subtitles Picker Drawer */}
      {isSubtitlesOpen && (
        <div className="absolute top-24 right-6 sm:right-8 bottom-28 z-40 w-[280px] sm:w-[320px] rounded-3xl bg-[#0d0e14]/90 backdrop-blur-3xl border border-white/10 p-6 shadow-2xl flex flex-col animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-zinc-400" />
              Subtitles
            </span>
            <button
              onClick={() => setIsSubtitlesOpen(false)}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Done
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 row-scrollbar">
            <button
              onClick={() => {
                setActiveSubtitleUrl(null);
                setIsSubtitlesOpen(false);
              }}
              className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition duration-200 ${
                activeSubtitleUrl === null
                  ? 'bg-white/15 border-white/30 text-white'
                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              Off
            </button>

            {availableSubtitles.map((sub, i) => {
              const isSelected = activeSubtitleUrl === sub.url;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setActiveSubtitleUrl(sub.url);
                    setIsSubtitlesOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition duration-200 ${
                    isSelected
                      ? 'bg-white/15 border-white/30 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{sub.lang || `Track #${i + 1}`}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Floating Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-6 sm:p-10 space-y-4 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Slider */}
        <div className="relative flex items-center group py-2">
          {/* Buffered track */}
          <div className="absolute left-0 right-0 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/35 transition-all"
              style={{ width: `${(buffered / (duration || 1)) * 100}%` }}
            />
          </div>

          {/* Played track */}
          <div
            className="absolute left-0 h-1.5 bg-white rounded-full pointer-events-none transition-all shadow-[0_0_12px_rgba(255,255,255,0.7)]"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />

          {/* Scrub input */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="relative w-full h-1.5 bg-transparent appearance-none cursor-pointer progress-bar z-10"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white">
          {/* Left Controls: Play, Seek, Volume, Time */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={togglePlay}
              className="p-1 text-white/80 hover:text-white transition duration-200"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            <button
              onClick={() => seek(-10)}
              className="p-1 text-white/80 hover:text-white transition duration-200"
              title="Seek -10s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => seek(10)}
              className="p-1 text-white/80 hover:text-white transition duration-200"
              title="Seek +10s"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1 text-white/80 hover:text-white transition duration-200"
                aria-label="Toggle mute"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer hidden sm:block accent-white"
              />
            </div>

            {/* Timestamps */}
            <div className="text-xs text-zinc-400 font-medium">
              <span className="text-white">{formatTime(currentTime)}</span>
              <span className="text-zinc-600 mx-1.5">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Subtitles, Open in Stremio Desktop, Fullscreen */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Subtitles Button */}
            <button
              onClick={() => {
                setIsSubtitlesOpen(!isSubtitlesOpen);
                setIsStreamDrawerOpen(false);
              }}
              className={`p-2 rounded-full border transition duration-200 ${
                activeSubtitleUrl
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/[0.08] border-white/10 text-zinc-300 hover:text-white hover:bg-white/[0.15]'
              }`}
              title="Subtitles"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* Native Stremio App Deep-Link */}
            <a
              href={stremioDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/10 text-xs font-medium text-white transition duration-200"
              title="Open stream in native desktop Stremio app"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Open in Desktop</span>
            </a>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1 text-white/80 hover:text-white transition duration-200"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Letterboxd Cinephile Log Modal */}
      <LetterboxdLogModal
        isOpen={isLetterboxdLogOpen}
        onClose={() => setIsLetterboxdLogOpen(false)}
        title={title}
        id={id}
      />
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#050507] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-medium">Connecting to stream...</p>
          </div>
        </div>
      }
    >
      <PlayerContent />
    </Suspense>
  );
}
