'use client';

import { ReactNode } from 'react';
import { PageSidebarProvider, usePageSidebar } from './page-sidebar-context';
import { cn } from '@/lib/utils';

type PageSidebarWrapperProps = {
  children: ReactNode;
};

/**
 * Wrapper pour le contenu principal qui s'adapte selon l'état de la sidebar
 * 
 * Structure :
 * - Sidebar menu (navigation) : fixed left-0, w-64 (256px)
 * - Zone de contenu : ml-64 (256px de margin-left pour la sidebar menu)
 * - Sidebar de page : fixed left-64 (256px depuis la gauche = début zone de contenu)
 * 
 * Comportement :
 * - Sidebar ouverte : le contenu a ml-64 supplémentaire (512px total depuis la gauche)
 * - Sidebar fermée : le contenu prend toute la largeur de la zone (256px depuis la gauche)
 * 
 * @param children - Contenu principal à wrapper
 */
function PageContentWrapper({ children }: PageSidebarWrapperProps) {
  const { isOpen } = usePageSidebar();

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

type PageSidebarWrapperPropsWithProvider = {
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * Wrapper complet pour la sidebar de page
 * 
 * Fournit le contexte et gère l'adaptation responsive du contenu
 * 
 * @param sidebar - Contenu de la sidebar (composant spécifique)
 * @param children - Contenu principal à wrapper
 */
export function PageSidebarWrapper({
  sidebar,
  children
}: PageSidebarWrapperPropsWithProvider) {
  return (
    <PageSidebarProvider>
      {sidebar}
      <PageContentWrapper>{children}</PageContentWrapper>
    </PageSidebarProvider>
  );
}

