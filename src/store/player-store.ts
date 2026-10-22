import { create } from 'zustand';
import type { ResolvedStream } from '@/lib/stremio/stream-resolver';
import type { Subtitle, ContentType } from '@/lib/stremio/types';

interface PlayerState {
  // Playback
  isPlaying: boolean;
  isPaused: boolean;
  currentStream: ResolvedStream | null;
  currentUrl: string | null;
  
  // Media info
  title: string;
  subtitle: string; // e.g., "S1:E3 - Episode Name"
  contentType: ContentType | null;
  contentId: string | null;
  videoId: string | null;
  poster: string | null;
  
  // Progress
  currentTime: number;
  duration: number;
  buffered: number;
  
  // Controls
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  
  // Subtitles
  subtitles: Subtitle[];
  activeSubtitle: string | null;
  
  // Actions
  play: (stream: ResolvedStream, info: {
    title: string;
    subtitle?: string;
    contentType: ContentType;
    contentId: string;
    videoId: string;
    poster?: string;
  }) => void;
  stop: () => void;
  setPlaying: (playing: boolean) => void;
  setPaused: (paused: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setFullscreen: (fullscreen: boolean) => void;
  setShowControls: (show: boolean) => void;
  setSubtitles: (subtitles: Subtitle[]) => void;
  setActiveSubtitle: (id: string | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  isPaused: false,
  currentStream: null,
  currentUrl: null,
  title: '',
  subtitle: '',
  contentType: null,
  contentId: null,
  videoId: null,
  poster: null,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume: 1,
  isMuted: false,
  isFullscreen: false,
  showControls: true,
  subtitles: [],
  activeSubtitle: null,
  
  play: (stream, info) => set({
    isPlaying: true,
    isPaused: false,
    currentStream: stream,
    currentUrl: stream.url || null,
    title: info.title,
    subtitle: info.subtitle || '',
    contentType: info.contentType,
    contentId: info.contentId,
    videoId: info.videoId,
    poster: info.poster || null,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    showControls: true,
  }),
  
  stop: () => set({
    isPlaying: false,
    isPaused: false,
    currentStream: null,
    currentUrl: null,
    title: '',
    subtitle: '',
    contentType: null,
    contentId: null,
    videoId: null,
    poster: null,
    currentTime: 0,
    duration: 0,
    buffered: 0,
    showControls: true,
  }),
  
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setBuffered: (buffered) => set({ buffered }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  setShowControls: (show) => set({ showControls: show }),
  setSubtitles: (subtitles) => set({ subtitles }),
  setActiveSubtitle: (id) => set({ activeSubtitle: id }),
}));
