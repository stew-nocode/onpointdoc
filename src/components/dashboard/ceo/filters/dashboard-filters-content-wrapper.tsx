'use client';

import { ReactNode } from 'react';
import { useDashboardFiltersSidebar } from './dashboard-filters-sidebar-context';
import { cn } from '@/lib/utils';

type DashboardFiltersContentWrapperProps = {
  children: ReactNode;
};

/**
 * Wrapper pour le contenu principal qui s'adapte selon l'état de la sidebar de filtres
 * 
 * Comportement :
 * - Sidebar filtre ouverte : le contenu a ml-64 supplémentaire (512px total depuis la gauche)
 * - Sidebar filtre fermée : le contenu prend toute la largeur (256px depuis la gauche)
 * 
 * @param children - Contenu principal à wrapper
 */
export function DashboardFiltersContentWrapper({ children }: DashboardFiltersContentWrapperProps) {
  const { isOpen } = useDashboardFiltersSidebar();

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        // Mobile : pas de marge (la sidebar est en overlay)
        // Desktop : 256px supplémentaire quand la sidebar est ouverte
        isOpen && 'lg:ml-64'
      )}
    >
      {children}
    </div>
  );
}

