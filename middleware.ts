import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Chemins publics (sans garde d'auth)
const PUBLIC_PATHS = [
  '/auth',
  '/api',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Laisser passer les chemins publics
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Cookies Supabase (set par @supabase/ssr)
  const hasAccess = req.cookies.has('sb-access-token');
  const hasRefresh = req.cookies.has('sb-refresh-token');

  if (!hasAccess || !hasRefresh) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|auth).*)']
};


