'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/ui/button';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';
import { getSortIndicator, getNextSortDirection } from '@/lib/utils/ticket-sort';

type SortableTableHeaderProps = {
  column: TicketSortColumn;
  label: string;
  currentSortColumn: TicketSortColumn;
  currentSortDirection: SortDirection;
  onSort: (column: TicketSortColumn, direction: SortDirection) => void;
  className?: string;
};

/**
 * En-tête de colonne triable pour le tableau des tickets
 * Affiche un indicateur visuel (flèche ↑↓) pour la colonne triée
 * 
 * @param column - Colonne à trier
 * @param label - Libellé de la colonne
 * @param currentSortColumn - Colonne actuellement triée
 * @param currentSortDirection - Direction actuelle du tri
 * @param onSort - Callback appelé lors du clic sur l'en-tête
 * @param className - Classes CSS additionnelles
 */
export function SortableTableHeader({
  column,
  label,
  currentSortColumn,
  currentSortDirection,
  onSort,
  className = ''
}: SortableTableHeaderProps) {
  const isActive = currentSortColumn === column;
  const indicator = getSortIndicator(currentSortColumn, column, currentSortDirection);

  const handleClick = () => {
    const nextDirection = getNextSortDirection(
      currentSortColumn,
      column,
      currentSortDirection
    );
    onSort(column, nextDirection);
  };

  return (
    <th className={`pb-2 pr-4 text-[10px] font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-auto p-0 text-[10px] font-medium uppercase tracking-normal hover:bg-transparent hover:text-slate-700 dark:hover:text-slate-200"
      >
        <span className="flex items-center gap-1 text-[10px]">
          {label}
          {isActive && (
            <span className="ml-1 text-slate-700 dark:text-slate-200">
              {indicator === '↑' ? (
                <ArrowUp className="h-2.5 w-2.5" />
              ) : (
                <ArrowDown className="h-2.5 w-2.5" />
              )}
            </span>
          )}
        </span>
      </Button>
    </th>
  );
}

