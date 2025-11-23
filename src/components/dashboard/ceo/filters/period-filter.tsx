'use client';

import { PeriodSelector } from '../period-selector';
import type { Period } from '@/types/dashboard';

type PeriodFilterProps = {
  value: Period;
  onChange: (period: Period) => void;
};

/**
 * Filtre de période pour le dashboard
 * 
 * @param value - Période actuelle
 * @param onChange - Callback de changement
 */
export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="space-y-2 p-3">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Période
      </label>
      <PeriodSelector value={value} onChange={onChange} />
    </div>
  );
}

