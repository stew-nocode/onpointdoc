'use client';

import { ReactNode } from 'react';
import { PageHeader } from './page-header';
import { PageKPISection } from './page-kpi-section';
import { PageCard } from './page-card';
import type { PageHeaderConfig, PageCardConfig } from './types';

type PageContentProps = {
  header: PageHeaderConfig;
  banner?: ReactNode;
  kpis?: ReactNode;
  card: PageCardConfig;
  children: ReactNode;
};

/**
 * Contenu standardisé pour les pages de gestion
 * 
 * Extrait pour éviter la duplication entre PageLayout et PageLayoutWithFilters
 * 
 * @param header - Configuration du header
 * @param banner - Banner optionnel (affiché entre Header et KPIs)
 * @param kpis - Section KPIs optionnelle
 * @param card - Configuration de la card principale
 * @param children - Contenu principal de la card
 */
export function PageContent({ header, banner, kpis, card, children }: PageContentProps) {
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <PageHeader
        label={header.label}
        title={header.title}
        description={header.description}
        action={header.action}
        icon={header.icon}
        actions={header.actions}
      />

      {banner && <div>{banner}</div>}

      {kpis && <PageKPISection>{kpis}</PageKPISection>}

      <PageCard
        title={card.title}
        titleSuffix={card.titleSuffix}
        search={card.search}
        quickFilters={card.quickFilters}
      >
        {children}
      </PageCard>
    </div>
  );
}

