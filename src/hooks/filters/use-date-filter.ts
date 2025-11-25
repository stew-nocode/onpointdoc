'use client';

import { useState, useEffect, useReducer, useCallback } from 'react';
import type { DateFilter } from '@/types/advanced-filters';

type UseDateFilterOptions = {
  dateFilter: DateFilter | null;
  onDateFilterChange: (filter: DateFilter | null) => void;
};

type DateFilterState = {
  preset: DateFilter['preset'];
  startDate: string;
  endDate: string;
};

type DateFilterAction =
  | { type: 'sync'; payload: DateFilter | null }
  | { type: 'setPreset'; payload: DateFilter['preset'] }
  | { type: 'setStartDate'; payload: string }
  | { type: 'setEndDate'; payload: string }
  | { type: 'reset' };

function buildStateFromFilter(filter: DateFilter | null): DateFilterState {
  return {
    preset: filter?.preset || null,
    startDate: filter?.range?.start || '',
    endDate: filter?.range?.end || ''
  };
}

function reducer(state: DateFilterState, action: DateFilterAction): DateFilterState {
  switch (action.type) {
    case 'sync':
      return buildStateFromFilter(action.payload);
    case 'setPreset':
      return {
        ...state,
        preset: action.payload
      };
    case 'setStartDate':
      return {
        ...state,
        startDate: action.payload
      };
    case 'setEndDate':
      return {
        ...state,
        endDate: action.payload
      };
    case 'reset':
      return buildStateFromFilter(null);
    default:
      return state;
  }
}

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
  const [state, dispatch] = useReducer(reducer, dateFilter, buildStateFromFilter);
  const { preset, startDate, endDate } = state;

  useEffect(() => {
    dispatch({ type: 'sync', payload: dateFilter });
  }, [dateFilter]);

  const handleStartDateChange = useCallback((value: string) => {
    dispatch({ type: 'setStartDate', payload: value });
  }, []);

  const handleEndDateChange = useCallback((value: string) => {
    dispatch({ type: 'setEndDate', payload: value });
  }, []);

  /**
   * Applique un preset
   */
  function applyPreset(selectedPreset: 'today' | 'this_week' | 'this_month' | 'custom'): void {
    dispatch({ type: 'setPreset', payload: selectedPreset });

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
    dispatch({ type: 'reset' });
    onDateFilterChange(null);
    setOpen(false);
  }

  return {
    open,
    setOpen,
    preset,
    startDate,
    endDate,
    setStartDate: handleStartDateChange,
    setEndDate: handleEndDateChange,
    applyPreset,
    applyCustomRange,
    clearFilter
  };
}


