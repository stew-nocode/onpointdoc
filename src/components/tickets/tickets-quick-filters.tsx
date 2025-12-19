'use client';

import type { QuickFilter } from '@/types/ticket-filters';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type TicketsQuickFiltersProps = {
  activeFilter?: QuickFilter;
  currentProfileId?: string | null;
  /**
   * Filtres rapides disponibles selon le rôle
   * Si non fourni, tous les filtres sont disponibles
   */
  availableFilters?: QuickFilter[];
};

const QUICK_FILTERS: Array<{
  id: QuickFilter;
  label: string;
  description: string;
  requiresProfile?: boolean;
}> = [
  { id: 'all', label: 'Tous les tickets', description: 'Afficher tous les tickets accessibles' },
  { id: 'mine', label: 'Mes tickets', description: 'Tickets qui me sont assignés', requiresProfile: true },
  { id: 'unassigned', label: 'Non assignés', description: 'Tickets sans assignation' },
  { id: 'overdue', label: 'En retard', description: 'Target date dépassée' },
  { id: 'to_validate', label: 'À valider', description: 'Statut transféré' },
  { id: 'week', label: 'Cette semaine', description: 'Créés cette semaine' },
  { id: 'month', label: 'Ce mois', description: 'Créés ce mois-ci' },
  { id: 'bug_in_progress', label: 'Bug en cours', description: 'Bugs en traitement ou en test' },
  { id: 'req_in_progress', label: 'Requête en cours', description: 'Requêtes en traitement ou en test' }
];

export function TicketsQuickFilters({ 
  activeFilter, 
  currentProfileId,
  availableFilters = QUICK_FILTERS.map(f => f.id) // Par défaut, tous les filtres
}: TicketsQuickFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (filterId: QuickFilter, disabled?: boolean) => {
    if (disabled) return;

    const params = new URLSearchParams(searchParams.toString());

    // ✅ NOUVEAU : Si on clique sur "Tous les tickets" (all), supprimer le paramètre 'quick'
    // Sinon, si on clique sur le filtre déjà actif, supprimer aussi le paramètre (retour à 'all')
    if (filterId === 'all' || activeFilter === filterId) {
      params.delete('quick');
    } else {
      params.set('quick', filterId);
    }

    // Réinitialiser la pagination
    params.delete('offset');

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  // ✅ Filtrer les filtres selon availableFilters (configuration par rôle)
  const visibleFilters = QUICK_FILTERS.filter(filter => 
    availableFilters.includes(filter.id)
  );

  return (
    <div className="flex flex-wrap gap-2">
      {visibleFilters.map((filter) => {
        const disabled = filter.requiresProfile && !currentProfileId;
        // ✅ NOUVEAU : "Tous les tickets" (all) est actif si activeFilter est 'all' ou undefined
        const isActive = filter.id === 'all' 
          ? (activeFilter === 'all' || !activeFilter)
          : activeFilter === filter.id;
        
        // Si le filtre est actif, utiliser un border avec couleur
        if (isActive) {
          return (
            <Button
              key={filter.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => handleFilterChange(filter.id, disabled)}
              className={cn(
                'rounded-full border-2 border-indigo-600 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-indigo-400 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
                disabled && 'cursor-not-allowed opacity-50'
              )}
              aria-pressed={true}
            >
              {filter.label}
            </Button>
          );
        }
        
        // Filtre inactif : style normal
        return (
          <Button
            key={filter.id}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => handleFilterChange(filter.id, disabled)}
            className={cn(
              'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-pressed={false}
          >
            {filter.label}
          </Button>
        );
      })}
    </div>
  );
}

