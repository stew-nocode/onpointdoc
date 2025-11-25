'use client';

import { useId } from 'react';
import { Button } from '@/ui/button';

type CustomDateRangeProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
};

/**
 * Composant pour sélectionner une plage de dates personnalisée
 *
 * @param startDate - Date de début
 * @param endDate - Date de fin
 * @param onStartDateChange - Callback lors du changement de date de début
 * @param onEndDateChange - Callback lors du changement de date de fin
 * @param onApply - Callback lors de l'application de la plage
 */
export function CustomDateRange({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply
}: CustomDateRangeProps) {
  const startId = useId();
  const endId = useId();
  return (
    <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
      <p className="text-xs font-medium text-slate-500">Période personnalisée</p>
      <div className="space-y-2">
        <div>
          <label htmlFor={startId} className="mb-1 block text-xs text-slate-500">
            Date de début
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            id={startId}
            name="custom-range-start-date"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label htmlFor={endId} className="mb-1 block text-xs text-slate-500">
            Date de fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            id={endId}
            name="custom-range-end-date"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <Button type="button" size="sm" onClick={onApply} className="w-full">
          Appliquer
        </Button>
      </div>
    </div>
  );
}


