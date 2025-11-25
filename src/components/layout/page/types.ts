import { ReactNode } from 'react';

/**
 * Configuration du header standardisé pour les pages de gestion
 */
export type PageHeaderConfig = {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

/**
 * Configuration de la card principale pour les pages de gestion
 */
export type PageCardConfig = {
  title: string;
  titleSuffix?: ReactNode;
  search?: ReactNode;
  quickFilters?: ReactNode;
};

