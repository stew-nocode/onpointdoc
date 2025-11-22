'use client';

import { Button } from '@/ui/button';
import { PopoverContent } from '@/ui/popover';
import { cn } from '@/lib/utils';
import { CustomDateRange } from './custom-date-range';
import type { DateFilter } from '@/types/advanced-filters';

type DateFilterPreset = 'today' | 'this_week' | 'this_month' | 'custom';

type DateFilterPopoverProps = {
  preset: DateFilter['preset'];
  startDate: string;
  endDate: string;
  onPresetChange: (preset: DateFilterPreset) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApplyCustom: () => void;
  onClear: () => void;
  dateFilter: DateFilter | null;
};

const PRESET_OPTIONS = [
  { value: 'today' as const, label: "Aujourd'hui" },
  { value: 'this_week' as const, label: 'Cette semaine' },
  { value: 'this_month' as const, label: 'Ce mois' },
  { value: 'custom' as const, label: 'Période personnalisée' }
];

/**
 * Contenu du popover pour le filtre de date
 *
 * Affiche les presets et la sélection personnalisée
 */
export function DateFilterPopover({
  preset,
  startDate,
  endDate,
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
  onApplyCustom,
  onClear,
  dateFilter
}: DateFilterPopoverProps) {
  return (
    <PopoverContent className="w-auto p-0" align="start">
      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">Périodes prédéfinies</p>
          <div className="space-y-1">
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onPresetChange(option.value)}
                className={cn(
                  'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800',
                  preset === option.value && 'bg-slate-100 dark:bg-slate-800'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' && (
          <CustomDateRange
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onApply={onApplyCustom}
          />
        )}

        {dateFilter && (
          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClear} className="w-full">
              Effacer
            </Button>
          </div>
        )}
      </div>
    </PopoverContent>
  );
}


