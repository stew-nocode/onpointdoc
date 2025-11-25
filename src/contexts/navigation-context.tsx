/**
 * Contexte de navigation pour gérer les transitions de page
 * 
 * Permet de déclencher les transitions au moment du clic sur un lien,
 * plutôt qu'après le changement de route.
 * 
 * Respecte les principes Clean Code :
 * - SRP : Gestion de l'état de navigation uniquement
 * - DRY : Réutilisable dans toute l'application
 * - KISS : API simple et claire
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type NavigationContextType = {
  /**
   * Indique si une navigation est en cours
   */
  isNavigating: boolean;

  /**
   * Démarre une navigation (appelé au clic sur un lien)
   */
  startNavigation: () => void;

  /**
   * Termine une navigation (appelé quand la page est chargée)
   */
  completeNavigation: () => void;
};

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

type NavigationProviderProps = {
  /**
   * Composants enfants
   */
  children: ReactNode;
};

/**
 * Provider pour le contexte de navigation
 * 
 * Doit être placé au niveau du layout principal pour être accessible
 * dans toute l'application.
 * 
 * @param children - Composants enfants
 * 
 * @example
 * <NavigationProvider>
 *   <AppShell>{children}</AppShell>
 * </NavigationProvider>
 */
export function NavigationProvider({ children }: NavigationProviderProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  /**
   * Démarre une navigation
   * 
   * Appelé immédiatement au clic sur un lien pour déclencher
   * la transition avant même que la route change.
   */
  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  /**
   * Termine une navigation
   * 
   * Appelé quand la nouvelle page est chargée pour terminer
   * la transition.
   */
  const completeNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        startNavigation,
        completeNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte de navigation
 * 
 * @returns Contexte de navigation avec isNavigating, startNavigation, completeNavigation
 * 
 * @throws Error si utilisé en dehors de NavigationProvider
 * 
 * @example
 * const { isNavigating, startNavigation } = useNavigation();
 */
export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
