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
    const res = NextResponse.next();
    res.headers.set('x-mw', 'public');
    return res;
  }

  // Détection large des cookies Supabase d'authentification
  // - sb-access-token / sb-refresh-token (helpers SSR)
  // - sb-<project-ref>-auth-token (GoTrue v2)
  const cookieNames = req.cookies.getAll().map((c) => c.name);
  const hasSupabaseAuthCookie = cookieNames.some(
    (name) =>
      name === 'sb-access-token' ||
      name === 'sb-refresh-token' ||
      (name.startsWith('sb-') && name.endsWith('-auth-token'))
  );

  if (!hasSupabaseAuthCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
    const res = NextResponse.redirect(loginUrl);
    res.headers.set('x-mw', 'redirect-login');
    return res;
  }

  const res = NextResponse.next();
  res.headers.set('x-mw', 'auth-ok');
  return res;
}

export const config = {
  // Forcer l'exécution sur toutes les routes, on gère les exceptions dans le code
  matcher: ['/:path*']
};


