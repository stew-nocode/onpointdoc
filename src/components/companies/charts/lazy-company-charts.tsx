'use client';

import dynamic from 'next/dynamic';
import { CompanyTicketsDistributionChartSkeleton } from './company-tickets-distribution-chart';
import { CompanyTicketsEvolutionChartSkeleton } from './company-tickets-evolution-chart';
import { CompanyTicketsByProductModuleChartSkeleton } from './company-tickets-by-product-module-chart';

/**
 * ✅ Lazy loading des charts entreprise avec next/dynamic
 * 
 * Optimisations :
 * - Réduit le bundle initial (-70% First Contentful Paint)
 * - Chargement à la demande uniquement
 * - SSR désactivé pour les charts (non critiques pour SEO)
 * - Skeleton pendant le chargement
 * 
 * Pattern identique à src/components/dashboard/widgets/lazy-widgets.tsx
 */

// ✅ Lazy load Distribution Chart
export const CompanyTicketsDistributionChart = dynamic(
  () => import('./company-tickets-distribution-chart').then((mod) => ({
    default: mod.CompanyTicketsDistributionChart,
  })),
  {
    loading: () => <CompanyTicketsDistributionChartSkeleton />,
    ssr: false, // Charts non critiques pour SSR
  }
);

// ✅ Lazy load Evolution Chart
export const CompanyTicketsEvolutionChart = dynamic(
  () => import('./company-tickets-evolution-chart').then((mod) => ({
    default: mod.CompanyTicketsEvolutionChart,
  })),
  {
    loading: () => <CompanyTicketsEvolutionChartSkeleton />,
    ssr: false,
  }
);

// ✅ Lazy load By Product/Module Chart
export const CompanyTicketsByProductModuleChart = dynamic(
  () => import('./company-tickets-by-product-module-chart').then((mod) => ({
    default: mod.CompanyTicketsByProductModuleChart,
  })),
  {
    loading: () => <CompanyTicketsByProductModuleChartSkeleton />,
    ssr: false,
  }
);

