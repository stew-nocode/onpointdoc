'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/ui/button';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
import { getCompanySortIndicator, getNextCompanySortDirection } from '@/lib/utils/company-sort';

type SortableCompanyTableHeaderProps = {
  column: CompanySortColumn;
  label: string;
  currentSortColumn: CompanySortColumn;
  currentSortDirection: SortDirection;
  onSort: (column: CompanySortColumn, direction: SortDirection) => void;
  className?: string;
};

/**
 * En-tête de colonne triable pour le tableau des companies
 * Affiche un indicateur visuel (flèche ↑↓) pour la colonne triée
 */
export function SortableCompanyTableHeader({
  column,
  label,
  currentSortColumn,
  currentSortDirection,
  onSort,
  className = ''
}: SortableCompanyTableHeaderProps) {
  const isActive = currentSortColumn === column;
  const indicator = getCompanySortIndicator(currentSortColumn, column, currentSortDirection);

  const handleClick = () => {
    const nextDirection = getNextCompanySortDirection(
      currentSortColumn,
      column,
      currentSortDirection
    );
    onSort(column, nextDirection);
  };

  return (
    <th className={`pb-2.5 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-auto p-0 font-semibold uppercase tracking-wide hover:bg-transparent hover:text-slate-700 dark:hover:text-slate-200"
      >
        <span className="flex items-center gap-1">
          {label}
          {isActive && (
            <span className="ml-1 text-slate-700 dark:text-slate-200">
              {indicator === '↑' ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
            </span>
          )}
        </span>
      </Button>
    </th>
  );
}

