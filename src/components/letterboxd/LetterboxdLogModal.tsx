'use client';

import { useState } from 'react';
import {
  X,
  Star,
  Heart,
  Calendar,
  Check,
  ExternalLink,
  Film,
  Sparkles,
} from 'lucide-react';
import { useLetterboxdStore } from '@/store/letterboxd-store';
import { getLetterboxdFilmUrl } from '@/lib/letterboxd/stremboxd';
import { resolveImageUrl } from '@/lib/utils/image';

interface LetterboxdLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  year?: string | number;
  poster?: string;
  id?: string;
}

export function LetterboxdLogModal({
  isOpen,
  onClose,
  title,
  year,
  poster,
  id,
}: LetterboxdLogModalProps) {
  const { logFilm, username, isConnected } = useLetterboxdStore();

  const [rating, setRating] = useState<number>(4);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [review, setReview] = useState<string>('');
  const [isLogged, setIsLogged] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (openLetterboxd = false) => {
    logFilm({
      id,
      title,
      year,
      rating,
      review: review.trim() || undefined,
    });

    setIsLogged(true);

    if (openLetterboxd) {
      const url = getLetterboxdFilmUrl(title, year);
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => {
      setIsLogged(false);
      onClose();
    }, 1200);
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in font-sans">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0D0E14] border border-[#00E054]/30 p-6 md:p-7 shadow-[0_0_50px_rgba(0,224,84,0.15)] overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00E054]/10 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-[#00E054]/20 text-[#00E054] flex items-center justify-center">
            <Film className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#00E054]">
            Log to Diary
          </span>
        </div>

        {/* Film Card Banner */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-5">
          {poster && (
            <img
              src={resolveImageUrl(poster)}
              alt={title}
              className="w-12 h-16 rounded-xl object-cover flex-shrink-0 border border-white/10"
            />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-white truncate">{title}</h3>
            <p className="text-xs text-zinc-400">
              {year ? `${year} · ` : ''}Feature Film
            </p>
          </div>
        </div>

        {/* Rating Picker (1 to 5 Stars) */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              Rating
            </label>
            <span className="text-xs font-mono font-bold text-[#00E054]">
              {displayRating} / 5.0 Stars
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#14151C] border border-white/10">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    star <= displayRating
                      ? 'text-[#00E054] fill-[#00E054] drop-shadow-[0_0_10px_rgba(0,224,84,0.6)]'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}

            {/* Like Heart */}
            <div className="h-6 w-px bg-white/10 mx-2" />
            <button
              type="button"
              onClick={() => setLiked(!liked)}
              className={`p-2 rounded-xl transition-all ${
                liked
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-500 hover:text-white bg-white/5'
              }`}
              title="Like this film"
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Review / Diary Notes */}
        <div className="space-y-1.5 mb-5">
          <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
            Review / Diary Note (Optional)
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write your thoughts, favorite scenes, or review..."
            rows={3}
            className="w-full bg-[#14151C] border border-white/10 focus:border-[#00E054] rounded-2xl p-3 text-xs text-white placeholder:text-gray-600 outline-none transition resize-none"
          />
        </div>

        {/* Success Confirmation State */}
        {isLogged && (
          <div className="p-3 mb-4 rounded-xl bg-[#00E054]/15 border border-[#00E054]/40 text-[#00E054] text-xs font-mono flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            <span>SAVED TO CINEPHILE DIARY</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => handleSave(true)}
            className="w-full py-3.5 rounded-xl bg-[#00E054] hover:bg-[#00c54a] text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,224,84,0.3)] flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>LOG & OPEN ON LETTERBOXD</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleSave(false)}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-mono text-xs font-bold transition border border-white/10"
          >
            SAVE LOCALLY ONLY
          </button>
        </div>
      </div>
    </div>
  );
}
