/**
 * Types pour les filtres d'activités
 * 
 * Définit les filtres rapides disponibles pour les activités
 */

/**
 * Filtre rapide pour les activités
 */
export type ActivityQuickFilter =
  | 'all'              // Toutes les activités
  | 'mine'             // Mes activités (créées par moi ou où je participe)
  | 'planned'          // Activités planifiées (avec dates)
  | 'unplanned'        // Activités non planifiées (sans dates)
  | 'week'             // Cette semaine (créées cette semaine)
  | 'month';           // Ce mois (créées ce mois-ci)
