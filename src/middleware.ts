import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Stremio Shell heartbeat & settings handshake
  if (pathname === '/settings' || pathname === '/stats.json' || pathname === '/version') {
    const accept = request.headers.get('accept') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // If request is from Stremio shell (reqwest) or requesting JSON
    if (
      pathname !== '/settings' ||
      accept.includes('application/json') ||
      userAgent.toLowerCase().includes('reqwest') ||
      request.nextUrl.searchParams.has('json')
    ) {
      return NextResponse.json(
        {
          serverVersion: '4.20.0',
          appPath: '/tmp/stremio-server',
          cacheRoot: '/tmp/stremio-server',
          cacheSize: 2147483648,
          btMaxConnections: 55,
          btHandshakeTimeout: 20000,
          btRequestTimeout: 4000,
          btDownloadSpeedSoftLimit: 2621440,
          btDownloadSpeedHardLimit: 3670016,
          btMinPeersForStable: 5,
          remoteHttps: '',
          localAddonEnabled: false,
          btProfile: 'default',
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/settings', '/stats.json', '/version'],
};
