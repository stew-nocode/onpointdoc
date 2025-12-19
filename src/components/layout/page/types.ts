import { ReactNode } from 'react';

/**
 * Noms d'icônes disponibles pour les en-têtes standardisés
 */
export type PageHeaderIconName =
  | 'Mail'
  | 'Building2'
  | 'Package'
  | 'Layers'
  | 'Sparkles'
  | 'Users'
  | 'Building'
  | 'Ticket'
  | 'Calendar'
  | 'CheckSquare';

/**
 * Configuration du header standardisé pour les pages de gestion
 * 
 * Supporte deux styles :
 * - Style classique : label + title + description + action
 * - Style standardisé (marketing) : icon + title + description + actions
 */
export type PageHeaderConfig = {
  /**
   * Style classique : Label au-dessus du titre (optionnel)
   */
  label?: string;
  
  /**
   * Titre principal de la page
   */
  title: string;
  
  /**
   * Description sous le titre (optionnel)
   */
  description?: string;
  
  /**
   * Style classique : Action unique à droite (optionnel)
   */
  action?: ReactNode;
  
  /**
   * Style standardisé : Nom de l'icône à côté du titre (optionnel)
   * Doit correspondre à une icône disponible dans iconMap
   */
  icon?: PageHeaderIconName;
  
  /**
   * Style standardisé : Actions multiples à droite (optionnel)
   */
  actions?: ReactNode;
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

