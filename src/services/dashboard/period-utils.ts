import type { Period } from '@/types/dashboard';

/**
 * Vérifie si une chaîne représente une année (4 chiffres)
 */
function isYearString(value: string): boolean {
  return /^\d{4}$/.test(value);
}

/**
 * Calcule les dates de début et fin pour une période donnée
 * 
 * @param period - Type de période (week, month, quarter, year) ou année spécifique (ex: "2024")
 * @param customStartDate - Date de début personnalisée (optionnelle, prioritaire)
 * @param customEndDate - Date de fin personnalisée (optionnelle, prioritaire)
 * @returns Objet avec startDate et endDate (ISO strings)
 */
export function getPeriodDates(
  period: Period | string,
  customStartDate?: string,
  customEndDate?: string
): { startDate: string; endDate: string } {
  // Si des dates personnalisées sont fournies, les utiliser directement
  if (customStartDate && customEndDate) {
    return {
      startDate: customStartDate,
      endDate: customEndDate,
    };
  }
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  // Gérer les années spécifiques (ex: "2024")
  if (typeof period === 'string' && isYearString(period)) {
    const year = parseInt(period, 10);
    // Créer les dates en UTC pour éviter les problèmes de fuseau horaire
    startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)); // 1er janvier à 00:00:00 UTC
    endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)); // 31 décembre à 23:59:59.999 UTC
  } else {
    // Périodes standard
    startDate = new Date();
    endDate = new Date(now);
    
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
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

/**
 * Calcule les dates de la période précédente pour comparaison
 * 
 * @param period - Type de période ou année spécifique (ex: "2024")
 * @returns Objet avec startDate et endDate de la période précédente
 */
export function getPreviousPeriodDates(
  period: Period | string,
  customStartDate?: string,
  customEndDate?: string
): { startDate: string; endDate: string } {
  let baseStartDate: Date;
  let baseEndDate: Date;

  if (customStartDate && customEndDate) {
    baseStartDate = new Date(customStartDate);
    baseEndDate = new Date(customEndDate);
  } else {
    const currentPeriodDates = getPeriodDates(period);
    baseStartDate = new Date(currentPeriodDates.startDate);
    baseEndDate = new Date(currentPeriodDates.endDate);
  }

  let startDate: Date;
  let endDate: Date;

  // Gérer les années spécifiques (ex: "2024")
  if (typeof period === 'string' && isYearString(period)) {
    const year = baseStartDate.getFullYear();
    // Période précédente = année précédente (en UTC)
    startDate = new Date(Date.UTC(year - 1, 0, 1, 0, 0, 0, 0)); // 1er janvier de l'année précédente
    endDate = new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59, 999)); // 31 décembre de l'année précédente
  } else {
    // Calculer la période précédente relative à la période actuelle
    const diff = baseEndDate.getTime() - baseStartDate.getTime();
    startDate = new Date(baseStartDate.getTime() - diff - (1000 * 60 * 60 * 24)); // Soustraire la durée de la période + 1 jour pour éviter chevauchement
    endDate = new Date(baseStartDate.getTime() - (1000 * 60 * 60 * 24)); // Fin la veille du début de la période actuelle
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
}

