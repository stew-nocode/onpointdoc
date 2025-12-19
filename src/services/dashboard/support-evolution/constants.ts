/**
 * Constantes pour le widget Support Evolution
 * 
 * Centralise les valeurs magiques pour améliorer la maintenabilité
 */

/**
 * Délai de debouncing pour les filtres (en millisecondes)
 */
export const DEBOUNCE_DELAY_MS = 300;

/**
 * Seuil de jours pour déterminer la granularité (hebdomadaire vs mensuelle)
 * Si la période est <= 31 jours, on génère des dates par semaine
 */
export const WEEKLY_GRANULARITY_THRESHOLD_DAYS = 31;

/**
 * Nombre de jours dans une semaine
 */
export const DAYS_PER_WEEK = 7;

/**
 * Nombre maximum de points à afficher sur le graphique
 */
export const MAX_CHART_POINTS = 5;

/**
 * Nombre maximum d'itérations pour éviter les boucles infinies
 */
export const MAX_DATE_ITERATIONS = 50;

