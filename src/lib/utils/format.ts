/**
 * Format runtime string (e.g., "142 min" -> "2h 22m")
 */
export function formatRuntime(runtime?: string): string {
  if (!runtime) return '';
  
  const match = runtime.match(/(\d+)/);
  if (!match) return runtime;
  
  const minutes = parseInt(match[1], 10);
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

/**
 * Format seconds to HH:MM:SS or MM:SS
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Format a year from release date string
 */
export function formatYear(releaseInfo?: string): string {
  if (!releaseInfo) return '';
  const match = releaseInfo.match(/(\d{4})/);
  return match ? match[1] : releaseInfo;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + '...';
}

/**
 * Format file size from bytes
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format IMDb rating with star
 */
export function formatRating(rating?: string): string {
  if (!rating) return '';
  return `★ ${rating}`;
}
