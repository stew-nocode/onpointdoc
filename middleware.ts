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
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Forcer l'exécution sur toutes les routes, on gère les exceptions dans le code
  matcher: ['/:path*']
};


