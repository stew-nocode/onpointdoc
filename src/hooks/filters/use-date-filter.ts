'use client';

import { useState, useEffect } from 'react';
import type { DateFilter } from '@/types/advanced-filters';

type UseDateFilterOptions = {
  dateFilter: DateFilter | null;
  onDateFilterChange: (filter: DateFilter | null) => void;
};

/**
 * Hook pour gérer l'état et la logique d'un filtre de date
 *
 * @param dateFilter - Filtre de date actuel
 * @param onDateFilterChange - Callback appelé lors du changement de filtre
 * @returns État et fonctions pour gérer le filtre de date
 */
export function useDateFilter({
  dateFilter,
  onDateFilterChange
}: UseDateFilterOptions) {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<DateFilter['preset']>(dateFilter?.preset || null);
  const [startDate, setStartDate] = useState<string>(dateFilter?.range?.start || '');
  const [endDate, setEndDate] = useState<string>(dateFilter?.range?.end || '');

  useEffect(() => {
    setPreset(dateFilter?.preset || null);
    setStartDate(dateFilter?.range?.start || '');
    setEndDate(dateFilter?.range?.end || '');
  }, [dateFilter]);

  /**
   * Applique un preset
   */
  function applyPreset(selectedPreset: 'today' | 'this_week' | 'this_month' | 'custom'): void {
    setPreset(selectedPreset);

    if (selectedPreset === 'custom') {
      return;
    }

    onDateFilterChange({
      preset: selectedPreset,
      range: null
    });
    setOpen(false);
  }

  /**
   * Applique une période personnalisée
   */
  function applyCustomRange(): void {
    if (!startDate && !endDate) {
      onDateFilterChange(null);
      setOpen(false);
      return;
    }

    onDateFilterChange({
      preset: 'custom',
      range: {
        start: startDate || null,
        end: endDate || null
      }
    });
    setOpen(false);
  }

  /**
   * Efface le filtre
   */
  function clearFilter(): void {
    setPreset(null);
    setStartDate('');
    setEndDate('');
    onDateFilterChange(null);
    setOpen(false);
  }

  return {
    open,
    setOpen,
    preset,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    applyPreset,
    applyCustomRange,
    clearFilter
  };
}

