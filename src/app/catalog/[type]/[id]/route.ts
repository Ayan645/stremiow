import { NextRequest, NextResponse } from 'next/server';
import { StremioAddonClient, CINEMETA_URL } from '@/lib/stremio/addon-client';

const client = new StremioAddonClient(CINEMETA_URL);

interface RouteProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { type, id } = await params;
  const cleanId = id.replace(/\.json$/, '');

  try {
    // Map our custom Netflix / Prime catalog IDs to Cinemeta source catalogs
    let sourceCatalog = 'top';
    if (cleanId.includes('prime')) {
      sourceCatalog = 'year';
    }

    const contentType = (type === 'series' ? 'series' : 'movie');
    const metas = await client.getCatalog(contentType, sourceCatalog);

    // Decorate titles with Netflix / Prime styled badges
    const brandedMetas = metas.map((meta, index) => {
      let badge = cleanId.includes('netflix') ? '🔴 NETFLIX' : '🔷 PRIME';
      if (index < 10) {
        badge += ` TOP ${index + 1}`;
      }

      return {
        ...meta,
        description: `[${badge}] ${meta.description || ''}`,
      };
    });

    return NextResponse.json(
      { metas: brandedMetas },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ metas: [] }, { status: 200 });
  }
}
