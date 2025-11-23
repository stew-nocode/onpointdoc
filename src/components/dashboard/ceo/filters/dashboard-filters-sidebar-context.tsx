'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type DashboardFiltersSidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const DashboardFiltersSidebarContext = createContext<DashboardFiltersSidebarContextType | null>(null);

/**
 * Hook pour accéder au contexte de la sidebar de filtres dashboard
 * 
 * @returns État et fonctions de contrôle de la sidebar
 * @throws Erreur si utilisé en dehors du provider
 */
export function useDashboardFiltersSidebar(): DashboardFiltersSidebarContextType {
  const context = useContext(DashboardFiltersSidebarContext);

  if (!context) {
    throw new Error('useDashboardFiltersSidebar must be used within DashboardFiltersSidebarProvider');
  }

  return context;
}

type DashboardFiltersSidebarProviderProps = {
  children: ReactNode;
};

/**
 * Provider pour le contexte de la sidebar de filtres dashboard
 * 
 * Gère l'état d'ouverture/fermeture de la sidebar
 * 
 * @param children - Composants enfants
 */
export function DashboardFiltersSidebarProvider({ children }: DashboardFiltersSidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <DashboardFiltersSidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </DashboardFiltersSidebarContext.Provider>
  );
}

