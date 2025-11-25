'use client';

import type { Period } from '@/types/dashboard';
import { cn } from '@/lib/utils';

type PeriodSelectorProps = {
  value: Period;
  onChange: (period: Period) => void;
};

/**
 * Sélecteur de période pour le dashboard
 * 
 * @param value - Période actuelle
 * @param onChange - Callback de changement
 */
export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Period)}
      className={cn(
        'h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
        'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
      )}
    >
      <option value="week">7 derniers jours</option>
      <option value="month">30 derniers jours</option>
      <option value="quarter">3 derniers mois</option>
      <option value="year">12 derniers mois</option>
    </select>
  );
}

