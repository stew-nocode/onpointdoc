'use client';

import { useState, useEffect } from 'react';
import type { Period } from '@/types/dashboard';
import { cn } from '@/lib/utils';

type PeriodYearSelectorProps = {
  value: Period | string; // Period OU année ("2024")
  onChange: (periodOrYear: Period | string) => void;
};

/**
 * Vérifie si une chaîne représente une année (4 chiffres)
 */
function isYearString(value: string): boolean {
  return /^\d{4}$/.test(value);
}

/**
 * Génère la liste des années disponibles (3 dernières années + année en cours + année suivante)
 */
function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  return [
    currentYear - 3,
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1
  ];
}

/**
 * Sélecteur combiné période/année pour le dashboard
 *
 * Permet de choisir soit :
 * - Une période relative (7j, 30j, 3m, 12m)
 * - Une année spécifique (2023, 2024, 2025...)
 *
 * @param value - Période ou année actuelle
 * @param onChange - Callback de changement
 */
export function PeriodYearSelector({ value, onChange }: PeriodYearSelectorProps) {
  const years = getAvailableYears();
  const isYear = typeof value === 'string' && isYearString(value);

  // Mode : 'period' ou 'year'
  const [mode, setMode] = useState<'period' | 'year'>(isYear ? 'year' : 'period');

  // Valeur actuelle selon le mode
  const [periodValue, setPeriodValue] = useState<Period>(
    !isYear ? (value as Period) : 'month'
  );
  const [yearValue, setYearValue] = useState<string>(
    isYear ? value : String(new Date().getFullYear())
  );

  // Synchroniser avec la valeur externe
  useEffect(() => {
    const isExternalYear = typeof value === 'string' && isYearString(value);
    if (isExternalYear) {
      setMode('year');
      setYearValue(value);
    } else {
      setMode('period');
      setPeriodValue(value as Period);
    }
  }, [value]);

  /**
   * Change le mode (période <-> année)
   */
  const handleModeChange = (newMode: 'period' | 'year') => {
    setMode(newMode);
    if (newMode === 'period') {
      onChange(periodValue);
    } else {
      onChange(yearValue);
    }
  };

  /**
   * Change la période
   */
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriodValue(newPeriod);
    onChange(newPeriod);
  };

  /**
   * Change l'année
   */
  const handleYearChange = (newYear: string) => {
    setYearValue(newYear);
    onChange(newYear);
  };

  return (
    <div className="space-y-3">
      {/* Sélecteur de mode */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('period')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            mode === 'period'
              ? 'bg-brand text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          )}
        >
          Période
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('year')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            mode === 'year'
              ? 'bg-brand text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          )}
        >
          Année
        </button>
      </div>

      {/* Sélecteur selon le mode */}
      {mode === 'period' ? (
        <select
          value={periodValue}
          onChange={(e) => handlePeriodChange(e.target.value as Period)}
          className={cn(
            'w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
            'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
          )}
        >
          <option value="week">7 derniers jours</option>
          <option value="month">30 derniers jours</option>
          <option value="quarter">3 derniers mois</option>
          <option value="year">12 derniers mois</option>
        </select>
      ) : (
        <select
          value={yearValue}
          onChange={(e) => handleYearChange(e.target.value)}
          className={cn(
            'w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2',
            'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
          )}
        >
          {years.map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
