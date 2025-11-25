'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type PageSidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const PageSidebarContext = createContext<PageSidebarContextType | null>(null);

/**
 * Hook pour accéder au contexte de la sidebar de page
 * 
 * @returns État et fonctions de contrôle de la sidebar
 * @throws Erreur si utilisé en dehors du provider
 */
export function usePageSidebar(): PageSidebarContextType {
  const context = useContext(PageSidebarContext);

  if (!context) {
    throw new Error('usePageSidebar must be used within PageSidebarProvider');
  }

  return context;
}

type PageSidebarProviderProps = {
  children: ReactNode;
};

/**
 * Provider pour le contexte de la sidebar de page
 * 
 * Gère l'état d'ouverture/fermeture de la sidebar
 * et le partage avec tous les composants enfants
 * 
 * @param children - Composants enfants
 */
export function PageSidebarProvider({ children }: PageSidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Ouvre la sidebar
   */
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Ferme la sidebar
   */
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Bascule l'état de la sidebar
   */
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <PageSidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </PageSidebarContext.Provider>
  );
}

