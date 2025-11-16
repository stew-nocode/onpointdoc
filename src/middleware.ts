import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Pages non protégées
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

  // Autoriser les chemins publics
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Vérifier présence des cookies Supabase (via @supabase/ssr)
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
  matcher: [
    /*
     * Appliquer le middleware à toutes les routes sauf les assets et publics.
     * On exclut explicitement /auth pour éviter les boucles de redirection.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|auth).*)'
  ]
};


