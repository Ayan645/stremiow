import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    id: 'org.stremioflix.netflixprime',
    version: '1.0.0',
    name: 'StremioFlix (Netflix & Prime Catalogs)',
    description: 'Brings Netflix Top 10, Prime Video Originals, and curated cinema catalogs to your Stremio app.',
    resources: ['catalog'],
    types: ['movie', 'series'],
    catalogs: [
      {
        type: 'movie',
        id: 'netflix_movies',
        name: 'Netflix: Trending Movies',
        extra: [{ name: 'search' }, { name: 'genre' }],
      },
      {
        type: 'series',
        id: 'netflix_series',
        name: 'Netflix: Top TV Series',
        extra: [{ name: 'search' }, { name: 'genre' }],
      },
      {
        type: 'movie',
        id: 'prime_movies',
        name: 'Prime Video: Popular Cinema',
        extra: [{ name: 'search' }, { name: 'genre' }],
      },
      {
        type: 'series',
        id: 'prime_series',
        name: 'Prime Video: Featured Shows',
        extra: [{ name: 'search' }, { name: 'genre' }],
      },
    ],
    idPrefixes: ['tt'],
    behaviorHints: {
      configurable: false,
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json',
    },
  });
}
