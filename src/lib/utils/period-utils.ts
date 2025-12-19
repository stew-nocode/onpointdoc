/**
 * Utilitaires pour la gestion des périodes
 * 
 * Réutilisables pour le dashboard et les pages de détails
 */

import type { Period } from '@/types/dashboard';

/**
 * Calcule la plage de dates pour une période donnée
 * 
 * @param period - Période (week, month, quarter, year)
 * @returns Objet avec periodStart et periodEnd (ISO strings)
 */
export function getPeriodRange(period: Period): { 
  periodStart: string; 
  periodEnd: string 
} {
  const now = new Date();
  const end = now.toISOString();

  const start = new Date(now);
  if (period === 'week') start.setDate(now.getDate() - 7);
  if (period === 'month') start.setDate(1);
  if (period === 'quarter') start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === 'year') start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);

  return { periodStart: start.toISOString(), periodEnd: end };
}

/**
 * Parse une période depuis les searchParams
 * 
 * @param periodParam - Paramètre de période depuis l'URL
 * @returns Période valide ou 'month' par défaut
 */
export function parsePeriodFromParams(
  periodParam: string | string[] | undefined
): Period {
  if (!periodParam || typeof periodParam !== 'string') return 'month';
  if (['week', 'month', 'quarter', 'year'].includes(periodParam)) {
    return periodParam as Period;
  }
  return 'month';
}

