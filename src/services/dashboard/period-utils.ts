import type { Period } from '@/types/dashboard';

/**
 * Calcule les dates de début et fin pour une période donnée
 * 
 * @param period - Type de période (week, month, quarter, year)
 * @returns Objet avec startDate et endDate (ISO strings)
 */
export function getPeriodDates(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date(now);

  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

/**
 * Calcule les dates de la période précédente pour comparaison
 * 
 * @param period - Type de période
 * @returns Objet avec startDate et endDate de la période précédente
 */
export function getPreviousPeriodDates(period: Period): { startDate: string; endDate: string } {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 14);
      endDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 2);
      endDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 6);
      endDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 2);
      endDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

