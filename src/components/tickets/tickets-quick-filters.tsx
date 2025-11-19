'use client';

import type { QuickFilter } from '@/types/ticket-filters';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type TicketsQuickFiltersProps = {
  activeFilter?: QuickFilter;
  currentProfileId?: string | null;
};

const QUICK_FILTERS: Array<{
  id: QuickFilter;
  label: string;
  description: string;
  requiresProfile?: boolean;
}> = [
  { id: 'mine', label: 'Mes tickets', description: 'Tickets qui me sont assignés', requiresProfile: true },
  { id: 'unassigned', label: 'Non assignés', description: 'Tickets sans assignation' },
  { id: 'overdue', label: 'En retard', description: 'Target date dépassée' },
  { id: 'to_validate', label: 'À valider', description: 'Statut transféré' },
  { id: 'week', label: 'Cette semaine', description: 'Créés cette semaine' },
  { id: 'month', label: 'Ce mois', description: 'Créés ce mois-ci' }
];

export function TicketsQuickFilters({ activeFilter, currentProfileId }: TicketsQuickFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (filterId: QuickFilter, disabled?: boolean) => {
    if (disabled) return;

    const params = new URLSearchParams(searchParams.toString());

    if (activeFilter === filterId) {
      params.delete('quick');
    } else {
      params.set('quick', filterId);
    }

    // Réinitialiser la pagination
    params.delete('offset');

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((filter) => {
        const disabled = filter.requiresProfile && !currentProfileId;
        const isActive = activeFilter === filter.id;
        return (
          <Button
            key={filter.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => handleFilterChange(filter.id, disabled)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium',
              isActive
                ? 'border-brand bg-brand text-white hover:bg-brand/90'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-pressed={isActive}
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}

