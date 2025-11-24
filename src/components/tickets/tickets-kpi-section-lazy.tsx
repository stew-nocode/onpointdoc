/**
 * Lazy loading wrapper pour TicketsKPISection
 * 
 * Permet de réduire le bundle initial et d'améliorer FCP/LCP.
 */

import dynamic from 'next/dynamic';
import type { SupportTicketKPIs } from '@/services/tickets/support-kpis';

type TicketsKPISectionProps = {
  kpis: SupportTicketKPIs;
  hasProfile: boolean;
};

/**
 * Chargement différé de TicketsKPISection pour améliorer les performances initiales
 * 
 * Les KPIs ne sont pas critiques pour le First Contentful Paint.
 */
export const TicketsKPISectionLazy = dynamic(
  () => import('./tickets-kpi-section').then((mod) => ({ default: mod.TicketsKPISection })),
  {
    loading: () => (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    ),
    ssr: true, // On garde SSR pour le SEO, mais avec code splitting
  }
) as React.ComponentType<TicketsKPISectionProps>;

