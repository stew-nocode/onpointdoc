/**
 * Composant Barre de charge de travail (continue segmentée)
 * 
 * Principe Clean Code :
 * - Composant < 100 lignes
 * - Présentation uniquement (pas de logique métier)
 * - Props typées explicitement
 */

'use client';

import { cn } from '@/lib/utils';
import {
  calculateBarWidths,
  getWorkloadColors,
  formatWorkloadMessage,
  type WorkloadResult
} from '@/services/tasks/workload-calculation';

type WorkloadBarProps = {
  workload: WorkloadResult;
  showDetails?: boolean;
  className?: string;
};

const WORK_DAY_HOURS = 8;

/**
 * Barre de charge de travail continue segmentée
 * 
 * Affiche une barre avec :
 * - Zone normale (0-8h) : vert/jaune
 * - Zone surcharge (>8h) : orange/rouge
 * - Ligne de limite à 8h
 * 
 * @param workload - Résultat du calcul de charge
 * @param showDetails - Afficher les détails (défaut: true)
 * @param className - Classes CSS additionnelles
 */
export function WorkloadBar({
  workload,
  showDetails = true,
  className
}: WorkloadBarProps) {
  const { totalHours, existingHours, newTaskHours, percentage, status, overloadHours } = workload;
  const { normalWidth, overloadWidth } = calculateBarWidths(totalHours);
  const colors = getWorkloadColors(status);
  const message = formatWorkloadMessage(workload);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Barre continue segmentée */}
      <div className="relative w-full h-8 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
        {/* Zone normale (0-8h) */}
        {totalHours > 0 && normalWidth > 0 && (
          <div
            className={cn(
              'absolute left-0 top-0 h-full transition-all duration-300',
              colors.normal
            )}
            style={{ width: `${normalWidth}%` }}
            aria-label={`Zone normale: ${Math.min(totalHours, WORK_DAY_HOURS).toFixed(1)}h`}
          />
        )}

        {/* Zone surcharge (>8h) */}
        {overloadWidth > 0 && (
          <div
            className={cn(
              'absolute h-full transition-all duration-300',
              colors.overload
            )}
            style={{
              left: `${normalWidth}%`,
              width: `${overloadWidth}%`
            }}
            aria-label={`Zone surcharge: ${overloadHours.toFixed(1)}h`}
          />
        )}

        {/* Ligne de limite 8h (si surcharge) */}
        {totalHours > WORK_DAY_HOURS && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-900 dark:bg-slate-100 border-l-2 border-dashed opacity-50"
            style={{ left: `${normalWidth}%` }}
            aria-label="Limite 8h"
          />
        )}

        {/* Texte au centre */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-900 dark:text-slate-100">
          {totalHours.toFixed(1)}h / {WORK_DAY_HOURS}h ({percentage.toFixed(0)}%)
        </div>
      </div>

      {/* Détails */}
      {showDetails && (
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <div className="font-medium text-slate-700 dark:text-slate-300">
            {message}
          </div>
          <div className="space-y-0.5">
            <div>✅ Existantes : {existingHours.toFixed(1)}h</div>
            {newTaskHours > 0 && (
              <div>➕ Nouvelle : {newTaskHours.toFixed(1)}h</div>
            )}
            {overloadHours > 0 && (
              <div className="text-orange-600 dark:text-orange-400">
                ⚠️ Surcharge : +{overloadHours.toFixed(1)}h
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

