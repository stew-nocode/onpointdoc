'use client';

import { ReactNode } from 'react';
import { useFiltersSidebar } from './filters-sidebar-context';
import { cn } from '@/lib/utils';

type FiltersContentWrapperProps = {
  children: ReactNode;
};

/**
 * Wrapper pour le contenu principal qui s'adapte selon l'état de la sidebar
 * 
 * Structure :
 * - Sidebar menu (navigation) : fixed left-0, w-64 (256px)
 * - Zone de contenu : ml-64 (256px de margin-left pour la sidebar menu)
 * - Sidebar filtre : fixed left-64 (256px depuis la gauche = début zone de contenu)
 * 
 * Comportement :
 * - Sidebar filtre ouverte : le tableau a ml-64 supplémentaire (512px total depuis la gauche)
 * - Sidebar filtre fermée : le tableau prend toute la largeur de la zone de contenu (256px depuis la gauche)
 */
export function FiltersContentWrapper({ children }: FiltersContentWrapperProps) {
  const { isOpen } = useFiltersSidebar();

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        // Mobile : pas de marge (la sidebar est en overlay)
        // Desktop : 256px supplémentaire quand la sidebar de filtres est ouverte
        isOpen && 'lg:ml-64'
      )}
    >
      {children}
    </div>
  );
}

