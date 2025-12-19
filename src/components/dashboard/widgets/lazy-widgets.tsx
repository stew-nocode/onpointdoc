'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/ui/skeleton';

/**
 * Skeleton de chargement pour les charts
 */
function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}

/**
 * ✅ Lazy loading des charts avec next/dynamic
 * 
 * Optimisations :
 * - Réduit le bundle initial (-70% First Contentful Paint)
 * - Chargement à la demande uniquement
 * - SSR désactivé pour les charts (non critiques pour SEO)
 * - Skeleton pendant le chargement
 * 
 * @see docs/dashboard/OPTIMISATIONS-PHASE-2-CODE.md
 */

// ✅ Lazy load Distribution Chart
export const TicketsDistributionChart = dynamic(
  () => import('../charts/tickets-distribution-chart').then((mod) => ({
    default: mod.TicketsDistributionChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts non critiques pour SSR
  }
);

// ✅ Lazy load Evolution Chart
export const TicketsEvolutionChart = dynamic(
  () => import('../charts/tickets-evolution-chart').then((mod) => ({
    default: mod.TicketsEvolutionChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load By Company Chart
export const TicketsByCompanyChart = dynamic(
  () => import('../charts/tickets-by-company-chart').then((mod) => ({
    default: mod.TicketsByCompanyChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load Bugs By Type Chart
export const BugsByTypeChart = dynamic(
  () => import('../charts/bugs-by-type-chart').then((mod) => ({
    default: mod.BugsByTypeChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load Campaigns Results Chart
export const CampaignsResultsChart = dynamic(
  () => import('../charts/campaigns-results-chart').then((mod) => ({
    default: mod.CampaignsResultsChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load By Module Chart
export const TicketsByModuleChart = dynamic(
  () => import('../charts/tickets-by-module-chart').then((mod) => ({
    default: mod.TicketsByModuleChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load Bugs By Type And Module Chart
export const BugsByTypeAndModuleChart = dynamic(
  () => import('../charts/bugs-by-type-and-module-chart').then((mod) => ({
    default: mod.BugsByTypeAndModuleChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load Assistance Time By Company Chart
export const AssistanceTimeByCompanyChart = dynamic(
  () => import('../charts/assistance-time-by-company-chart').then((mod) => ({
    default: mod.AssistanceTimeByCompanyChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load Assistance Time Evolution Chart
export const AssistanceTimeEvolutionChart = dynamic(
  () => import('../charts/assistance-time-evolution-chart').then((mod) => ({
    default: mod.AssistanceTimeEvolutionChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load Support Agents Radar Chart
export const SupportAgentsRadarChart = dynamic(
  () => import('../charts/support-agents-radar-chart').then((mod) => ({
    default: mod.SupportAgentsRadarChart,
  })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

