'use client';

import { PeriodYearSelector } from '../period-year-selector';
import type { Period } from '@/types/dashboard';

type PeriodFilterProps = {
  value: Period | string; // Accepte Period OU année ("2024")
  onChange: (periodOrYear: Period | string) => void;
};

/**
 * Filtre de période/année pour le dashboard
 *
 * Permet de sélectionner soit une période relative (7j, 30j, 3m, 12m)
 * soit une année spécifique (2023, 2024, 2025...)
 *
 * @param value - Période ou année actuelle
 * @param onChange - Callback de changement
 */
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="space-y-2 p-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Période / Année
      </label>
      <PeriodYearSelector value={value} onChange={onChange} />
    </div>
  );
}

