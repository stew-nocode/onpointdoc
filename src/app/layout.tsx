import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { ErrorBoundary } from '@/components/errors/error-boundary';
import { cn } from '@/lib/utils';

import './globals.css';
import { Toaster } from '@/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'OnpointDoc',
  description: 'Pilotage centralisé des tickets, activités et tâches OnpointDoc.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn('bg-slate-50 text-slate-900 antialiased', inter.variable)}>
        <ThemeProvider>
          <ErrorBoundary>
            {children}
            <Toaster />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

