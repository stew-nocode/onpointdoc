/**
 * Types pour le tri des tableaux de campagnes email
 */

export type CampaignSortColumn = 
  | 'sent_at'        // Date d'envoi (par défaut, DESC)
  | 'created_at'     // Date de création
  | 'campaign_name'  // Nom de la campagne (alphabétique)
  | 'open_rate'      // Taux d'ouverture
  | 'click_rate'     // Taux de clic
  | 'emails_sent';   // Nombre d'emails envoyés

export type SortDirection = 'asc' | 'desc';

export type CampaignSort = {
  column: CampaignSortColumn;
  direction: SortDirection;
};

/**
 * Vérifie si une colonne de tri est valide
 */
export function isValidCampaignSortColumn(column: string): column is CampaignSortColumn {
  return ['sent_at', 'created_at', 'campaign_name', 'open_rate', 'click_rate', 'emails_sent'].includes(column);
}

/**
 * Vérifie si une direction de tri est valide
 */
export function isValidSortDirection(direction: string): direction is SortDirection {
  return direction === 'asc' || direction === 'desc';
}

/**
 * Parse les paramètres de tri depuis l'URL
 * 
 * Format attendu : "column:direction" (ex: "sent_at:desc")
 * 
 * @param sortParam - Paramètre de tri depuis l'URL (format "column:direction")
 * @returns Configuration de tri ou tri par défaut
 */
export function parseCampaignSort(sortParam?: string): CampaignSort {
  const DEFAULT_SORT: CampaignSort = {
    column: 'sent_at',
    direction: 'desc'
  };

  if (!sortParam) {
    return DEFAULT_SORT;
  }

  const [column, direction] = sortParam.split(':');

  if (!column || !isValidCampaignSortColumn(column)) {
    return DEFAULT_SORT;
  }

  const validDirection = isValidSortDirection(direction || '') ? direction : 'desc';

  return {
    column,
    direction: validDirection as SortDirection
  };
}

