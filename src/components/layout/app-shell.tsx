'use client';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/navigation/top-bar';

type AppShellProps = {
  children: ReactNode;
};

export const AppShell = ({ children }: AppShellProps) => {
  const router = useRouter();
  const pathname = usePathname() || '/';

  useEffect(() => {
    // Rediriger côté client si non authentifié et hors /auth
    if (pathname.startsWith('/auth')) return;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      }
    });
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar role="agent" />
      <div className="flex min-h-screen flex-col lg:ml-64">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <TopBar />
        </div>
        <main className="flex-1 overflow-y-auto p-6 lg:min-h-0 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

