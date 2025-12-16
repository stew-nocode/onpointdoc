import type { Metadata } from 'next';
import { Inter, Poiret_One } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { ErrorBoundary } from '@/components/errors/error-boundary';
import { PerformanceMonitor } from '@/components/performance/performance-monitor';
import { NavigationProvider } from '@/contexts/navigation-context';
import { PortalCleanup } from '@/components/utils/portal-cleanup';
import { cn } from '@/lib/utils';

import './globals.css';
import { Toaster } from '@/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poiretOne = Poiret_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-poiret'
});

export const metadata: Metadata = {
  title: 'OnpointDoc',
  description: 'Pilotage centralisé des tickets, activités et tâches OnpointDoc.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn('bg-slate-50 text-slate-900 antialiased', inter.variable, poiretOne.variable)}>
        <ThemeProvider>
          <NavigationProvider>
            <ErrorBoundary>
              {children}
              <Toaster />
              {/* Performance Monitor - visible uniquement en développement */}
              <PerformanceMonitor />
              {/* Nettoie les portails nextjs-portal vides */}
              <PortalCleanup />
            </ErrorBoundary>
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

