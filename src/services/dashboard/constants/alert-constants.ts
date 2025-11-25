/**
 * Constantes pour les alertes opérationnelles
 */

import type { OperationalAlert } from '@/types/dashboard';

/**
 * Nombre de jours avant qu'un ticket non assigné soit considéré comme une alerte
 */
export const UNASSIGNED_ALERT_DAYS = 7;

/**
 * Nombre de jours à l'avance pour considérer une activité comme "à venir"
 */
export const UPCOMING_ACTIVITY_DAYS = 7;

/**
 * Nombre maximum d'alertes à retourner par type
 */
export const MAX_ALERTS_PER_TYPE = 5;

/**
 * Ordre de priorité pour le tri des alertes (0 = plus haute priorité)
 */
export const ALERT_PRIORITY_ORDER: Record<OperationalAlert['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
} as const;


