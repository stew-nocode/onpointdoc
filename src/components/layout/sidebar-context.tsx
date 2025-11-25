'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type SidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

/**
 * Hook pour accéder au contexte de la sidebar de navigation
 *
 * @returns État et fonctions de contrôle de la sidebar
 * @throws Erreur si utilisé en dehors du provider
 */
export function useSidebar(): SidebarContextType {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }

  return context;
}

type SidebarProviderProps = {
  children: ReactNode;
};

/**
 * Provider pour le contexte de la sidebar de navigation
 *
 * Gère l'état d'ouverture/fermeture de la sidebar
 * et le partage avec tous les composants enfants
 */
export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false); // Sidebar fermée par défaut sur mobile

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
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}


