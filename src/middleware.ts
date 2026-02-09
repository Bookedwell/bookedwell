import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public files and API routes
  if (PUBLIC_FILE.test(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Get hostname
  const hostname = request.headers.get('host') || '';
  const appDomain = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : 'localhost';

  // Extract subdomain
  const subdomain = hostname
    .replace(`.${appDomain}`, '')
    .replace(`:${request.nextUrl.port}`, '');

  // If we're on the main domain (no subdomain), show the landing page
  if (subdomain === appDomain || subdomain === 'localhost' || subdomain === 'www') {
    return updateSession(request);
  }

  // Dashboard routes - require auth
  if (pathname.startsWith('/dashboard')) {
    return updateSession(request);
  }

  // Subdomain detected - rewrite to salon booking page
  const url = request.nextUrl.clone();
  url.pathname = `/salon/${subdomain}${pathname}`;
  const response = NextResponse.rewrite(url);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|logo.png).*)',
  ],
};
