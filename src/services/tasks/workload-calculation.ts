/**
 * Service de calcul de charge de travail pour les tâches
 * 
 * Principe Clean Code :
 * - Fonctions pures (pas de side effects)
 * - Une responsabilité par fonction
 * - Types explicites
 * - Calcul basé sur : 1 journée = 8h
 */

const WORK_DAY_HOURS = 8;

export type WorkloadStatus = 'none' | 'available' | 'busy' | 'full' | 'overloaded';

export type WorkloadResult = {
  existingHours: number;
  newTaskHours: number;
  totalHours: number;
  percentage: number;
  status: WorkloadStatus;
  overloadHours: number;
};

/**
 * Calcule le statut de charge selon le pourcentage
 * 
 * @param percentage - Pourcentage de charge (0-100+)
 * @returns Statut de charge
 */
function calculateWorkloadStatus(percentage: number): WorkloadStatus {
  if (percentage === 0) return 'none';
  if (percentage <= 80) return 'available';
  if (percentage <= 100) return 'busy';
  if (percentage <= 150) return 'full';
  return 'overloaded';
}

/**
 * Calcule la charge de travail totale
 * 
 * @param existingHours - Heures des tâches existantes
 * @param newTaskHours - Heures de la nouvelle tâche
 * @returns Résultat du calcul de charge
 */
export function calculateWorkload(
  existingHours: number,
  newTaskHours: number
): WorkloadResult {
  const totalHours = existingHours + newTaskHours;
  const percentage = totalHours > 0 ? (totalHours / WORK_DAY_HOURS) * 100 : 0;
  const overloadHours = Math.max(0, totalHours - WORK_DAY_HOURS);
  const status = calculateWorkloadStatus(percentage);

  return {
    existingHours,
    newTaskHours,
    totalHours,
    percentage,
    status,
    overloadHours
  };
}

/**
 * Calcule les largeurs de la barre (en pourcentage)
 * 
 * @param totalHours - Total d'heures
 * @returns Largeurs pour la zone normale et surcharge
 */
export function calculateBarWidths(totalHours: number): {
  normalWidth: number;
  overloadWidth: number;
} {
  if (totalHours === 0) {
    return { normalWidth: 0, overloadWidth: 0 };
  }

  const normalHours = Math.min(totalHours, WORK_DAY_HOURS);
  const overloadHours = Math.max(0, totalHours - WORK_DAY_HOURS);

  const normalWidth = (normalHours / totalHours) * 100;
  const overloadWidth = (overloadHours / totalHours) * 100;

  return { normalWidth, overloadWidth };
}

/**
 * Obtient les couleurs de la barre selon le statut
 * 
 * @param status - Statut de charge
 * @returns Couleurs pour les zones normale et surcharge
 */
export function getWorkloadColors(status: WorkloadStatus): {
  normal: string;
  overload: string;
} {
  switch (status) {
    case 'none':
      return { normal: 'bg-slate-300', overload: '' };
    case 'available':
      return { normal: 'bg-green-500', overload: '' };
    case 'busy':
      return { normal: 'bg-yellow-500', overload: '' };
    case 'full':
      return { normal: 'bg-green-500', overload: 'bg-orange-500' };
    case 'overloaded':
      return { normal: 'bg-green-500', overload: 'bg-red-500' };
  }
}

/**
 * Formate le message de statut pour l'affichage
 * 
 * @param result - Résultat du calcul de charge
 * @returns Message formaté
 */
export function formatWorkloadMessage(result: WorkloadResult): string {
  const { totalHours, percentage, status, overloadHours } = result;

  switch (status) {
    case 'none':
      return 'Aucune charge';
    case 'available':
      return `✅ Disponible (${totalHours.toFixed(1)}h / ${WORK_DAY_HOURS}h)`;
    case 'busy':
      return `⚠️ Presque plein (${totalHours.toFixed(1)}h / ${WORK_DAY_HOURS}h)`;
    case 'full':
      return `🔶 Chargé (${totalHours.toFixed(1)}h / ${WORK_DAY_HOURS}h - ${percentage.toFixed(0)}%)`;
    case 'overloaded':
      return `🔴 Surchargé (${totalHours.toFixed(1)}h / ${WORK_DAY_HOURS}h - ${percentage.toFixed(0)}% | +${overloadHours.toFixed(1)}h)`;
  }
}

