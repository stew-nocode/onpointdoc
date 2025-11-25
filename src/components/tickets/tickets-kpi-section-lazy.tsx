/**
 * Lazy loading wrapper pour TicketsKPISection
 * 
 * Permet de réduire le bundle initial et d'améliorer FCP/LCP.
 */

import dynamic from 'next/dynamic';
import type { SupportTicketKPIs } from '@/services/tickets/support-kpis';
import { TicketsKPIsSkeleton } from './skeletons/tickets-kpis-skeleton';

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
    loading: () => <TicketsKPIsSkeleton />,
    ssr: true // On garde SSR pour le SEO, mais avec code splitting
  }
) as React.ComponentType<TicketsKPISectionProps>;

