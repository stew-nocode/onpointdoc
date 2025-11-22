'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type FiltersSidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const FiltersSidebarContext = createContext<FiltersSidebarContextType | null>(null);

/**
 * Hook pour accéder au contexte de la sidebar de filtres
 * 
 * @returns État et fonctions de contrôle de la sidebar
 * @throws Erreur si utilisé en dehors du provider
 */
export function useFiltersSidebar(): FiltersSidebarContextType {
  const context = useContext(FiltersSidebarContext);

  if (!context) {
    throw new Error('useFiltersSidebar must be used within FiltersSidebarProvider');
  }

  return context;
}

type FiltersSidebarProviderProps = {
  children: ReactNode;
};

/**
 * Provider pour le contexte de la sidebar de filtres
 * 
 * Gère l'état d'ouverture/fermeture de la sidebar
 * et le partage avec tous les composants enfants
 */
export function FiltersSidebarProvider({ children }: FiltersSidebarProviderProps) {
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
    <FiltersSidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </FiltersSidebarContext.Provider>
  );
}

