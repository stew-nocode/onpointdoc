'use client';

import type { CampaignQuickFilter } from '@/types/campaign-filters';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type CampaignsQuickFiltersProps = {
  activeFilter?: CampaignQuickFilter;
};

const QUICK_FILTERS: Array<{
  id: CampaignQuickFilter;
  label: string;
  description: string;
}> = [
  { id: 'all', label: 'Toutes les campagnes', description: 'Afficher toutes les campagnes' },
  { id: 'sent', label: 'Envoyées', description: 'Campagnes envoyées' },
  { id: 'draft', label: 'Brouillons', description: 'Brouillons non envoyés' },
  { id: 'scheduled', label: 'Planifiées', description: 'Campagnes planifiées' }
];

/**
 * Composant de filtres rapides pour les campagnes email
 * 
 * Pattern similaire à TasksQuickFilters et ActivitiesQuickFilters pour cohérence
 * 
 * ✅ Clean Code :
 * - Gestion des filtres via URL params
 * - Réinitialise l'offset lors du changement de filtre
 * 
 * @param activeFilter - Filtre actuellement actif
 */
export function CampaignsQuickFilters({ activeFilter }: CampaignsQuickFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (filterId: CampaignQuickFilter) => {
    const params = new URLSearchParams(searchParams.toString());

    // ✅ Si on clique sur "Toutes" (all), supprimer le paramètre 'quick'
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

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((filter) => {
        // ✅ "Toutes les campagnes" (all) est actif si activeFilter est 'all' ou undefined
        const isActive = filter.id === 'all' 
          ? (activeFilter === 'all' || !activeFilter)
          : activeFilter === filter.id;
        
        if (isActive) {
          return (
            <Button
              key={filter.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange(filter.id)}
              className={cn(
                'rounded-full border-2 border-indigo-600 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-indigo-400 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              )}
              aria-pressed={true}
            >
              {filter.label}
            </Button>
          );
        }
        
        return (
          <Button
            key={filter.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFilterChange(filter.id)}
            className={cn(
              'rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
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

