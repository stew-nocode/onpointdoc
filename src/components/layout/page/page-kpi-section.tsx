'use client';

import { ReactNode } from 'react';

type PageKPISectionProps = {
  children: ReactNode;
};

/**
 * Section wrapper standardisée pour les KPIs
 * 
 * Wrapper minimal qui permet au contenu KPI spécifique
 * de gérer sa propre mise en page (grille, flex, etc.)
 * 
 * @param children - Contenu KPIs spécifique à la page (gère sa propre mise en page)
 */
export function PageKPISection({ children }: PageKPISectionProps) {
  return <div>{children}</div>;
}

