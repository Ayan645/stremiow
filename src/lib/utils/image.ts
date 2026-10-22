/**
 * Ensure an image URL is absolute and handle common Stremio/TMDB patterns
 */
export function resolveImageUrl(url: string | undefined, width: number = 500): string {
  if (!url) return '/placeholder-poster.svg';
  
  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // TMDB path (starts with /)
  if (url.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w${width}${url}`;
  }

  return url;
}

/**
 * Get a background image URL (higher resolution)
 */
export function resolveBackgroundUrl(url: string | undefined): string {
  if (!url) return '';
  
  if (url.startsWith('/')) {
    return `https://image.tmdb.org/t/p/original${url}`;
  }
  
  return url;
}

/**
 * Generate a blurred placeholder color based on the title
 */
export function getPlaceholderColor(title: string): string {
  const colors = [
    '#1a1a2e', '#16213e', '#0f3460', '#533483',
    '#2c2c54', '#474787', '#1e3799', '#0c2461',
    '#6a1b9a', '#283593', '#1565c0', '#00695c',
  ];
  
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
