/**
 * Type pour le résultat paginé des campagnes email (pour infinite scroll)
 * 
 * Format aligné avec TasksPaginatedResult et ActivitiesPaginatedResult
 * 
 * Note: Il existe déjà un type CampaignsPaginatedResult dans brevo.ts avec une structure différente
 * (page, limit, totalPages). Ce type est spécifique pour le pattern infinite scroll utilisé
 * dans les tableaux de l'application.
 */

import type { BrevoEmailCampaign } from './brevo';

/**
 * Résultat paginé des campagnes email (pour infinite scroll)
 */
export type CampaignsInfiniteScrollResult = {
  /** Liste des campagnes */
  campaigns: BrevoEmailCampaign[];
  
  /** Indique s'il reste des campagnes à charger */
  hasMore: boolean;
  
  /** Nombre total de campagnes correspondant aux filtres */
  total: number;
};

