'use client';

import type { ActivityQuickFilter } from '@/types/activity-filters';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type ActivitiesQuickFiltersProps = {
  activeFilter?: ActivityQuickFilter;
  currentProfileId?: string | null;
  /**
   * Filtres rapides disponibles selon le rôle
   * Si non fourni, tous les filtres sont disponibles
   */
  availableFilters?: ActivityQuickFilter[];
};

const QUICK_FILTERS: Array<{
  id: ActivityQuickFilter;
  label: string;
  description: string;
  requiresProfile?: boolean;
}> = [
  { id: 'all', label: 'Toutes les activités', description: 'Afficher toutes les activités accessibles' },
  { id: 'mine', label: 'Mes activités', description: 'Activités créées par moi ou où je participe', requiresProfile: true },
  { id: 'planned', label: 'Planifiées', description: 'Activités avec dates de début et fin' },
  { id: 'unplanned', label: 'Non planifiées', description: 'Activités sans dates' },
  { id: 'week', label: 'Cette semaine', description: 'Créées cette semaine' },
  { id: 'month', label: 'Ce mois', description: 'Créées ce mois-ci' }
];

/**
 * Composant de filtres rapides pour les activités
 * 
 * Pattern similaire à TicketsQuickFilters pour cohérence
 * 
 * ✅ Clean Code :
 * - Gestion des filtres via URL params
 * - Réinitialise l'offset lors du changement de filtre
 * - Support des filtres conditionnels selon le profil utilisateur
 * 
 * @param activeFilter - Filtre actuellement actif
 * @param currentProfileId - ID du profil utilisateur actuel (pour filtres conditionnels)
 * @param availableFilters - Liste des filtres disponibles (optionnel, tous par défaut)
 */
export function ActivitiesQuickFilters({ 
  activeFilter, 
  currentProfileId,
  availableFilters = QUICK_FILTERS.map(f => f.id) // Par défaut, tous les filtres
}: ActivitiesQuickFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (filterId: ActivityQuickFilter, disabled?: boolean) => {
    if (disabled) return;

    const params = new URLSearchParams(searchParams.toString());

    // ✅ Si on clique sur "Toutes les activités" (all), supprimer le paramètre 'quick'
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
        // ✅ "Toutes les activités" (all) est actif si activeFilter est 'all' ou undefined
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
