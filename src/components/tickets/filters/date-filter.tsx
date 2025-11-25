'use client';

import { Calendar, X } from 'lucide-react';
import { Button } from '@/ui/button';
import { Popover, PopoverTrigger } from '@/ui/popover';
import { cn } from '@/lib/utils';
import type { DateFilter } from '@/types/advanced-filters';
import { useDateFilter } from '@/hooks/filters/use-date-filter';
import { DateFilterPopover } from './date-filter-popover';

type DateFilterProps = {
  label: string;
  dateFilter: DateFilter | null;
  onDateFilterChange: (filter: DateFilter | null) => void;
};

/**
 * Options de période prédéfinies
 */
const PRESET_OPTIONS = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'this_week', label: 'Cette semaine' },
  { value: 'this_month', label: 'Ce mois' },
  { value: 'custom', label: 'Période personnalisée' }
] as const;

/**
 * Composant pour filtrer par date (création ou résolution)
 * 
 * @param label - Label du filtre
 * @param dateFilter - Filtre de date actuel
 * @param onDateFilterChange - Callback appelé lors du changement
 */
/**
 * Obtient le texte du bouton pour un filtre de date
 *
 * @param dateFilter - Filtre de date actuel
 * @returns Texte à afficher sur le bouton
 */
function getButtonText(dateFilter: DateFilter | null): string {
  if (!dateFilter) return 'Toutes les dates';

  if (dateFilter.preset && dateFilter.preset !== 'custom') {
    const presetLabel = PRESET_OPTIONS.find((opt) => opt.value === dateFilter.preset)?.label;
    return presetLabel || 'Période sélectionnée';
  }

  if (dateFilter.preset === 'custom' && dateFilter.range) {
    const { start, end } = dateFilter.range;
    if (start && end) return `${start} → ${end}`;
    if (start) return `Depuis ${start}`;
    if (end) return `Jusqu'à ${end}`;
  }

  return 'Période personnalisée';
}

export function DateFilterComponent({
  label,
  dateFilter,
  onDateFilterChange
}: DateFilterProps) {
  const {
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
  } = useDateFilter({
    dateFilter,
    onDateFilterChange
  });

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start font-normal',
              !dateFilter && 'text-slate-500'
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {getButtonText(dateFilter)}
            {dateFilter && (
              <X
                className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFilter();
                }}
              />
            )}
          </Button>
        </PopoverTrigger>

        <DateFilterPopover
          preset={preset}
          startDate={startDate}
          endDate={endDate}
          onPresetChange={applyPreset}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApplyCustom={applyCustomRange}
          onClear={clearFilter}
          dateFilter={dateFilter}
        />
      </Popover>
    </div>
  );
}

