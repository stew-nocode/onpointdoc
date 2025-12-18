'use client';

/**
 * Composant de filtres rapides pour les entreprises
 * 
 * Pattern identique à TicketsQuickFilters pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (afficher et gérer les filtres rapides)
 * - Réutilisation des patterns existants
 * - Style visuel cohérent avec les autres pages
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';
import type { CompanyQuickFilter } from '@/types/company-filters';

type CompaniesQuickFiltersProps = {
  activeFilter?: CompanyQuickFilter;
  currentProfileId?: string | null;
  /**
   * Filtres rapides disponibles selon le rôle
   * Si non fourni, tous les filtres sont disponibles
   */
  availableFilters?: CompanyQuickFilter[];
};

const QUICK_FILTERS: Array<{
  id: CompanyQuickFilter;
  label: string;
  description: string;
  requiresProfile?: boolean;
}> = [
  { id: 'all', label: 'Toutes les entreprises', description: 'Afficher toutes les entreprises accessibles' },
  { id: 'with_users', label: 'Avec utilisateurs', description: 'Entreprises ayant au moins un utilisateur' },
  { id: 'without_users', label: 'Sans utilisateurs', description: 'Entreprises sans utilisateurs' },
  { id: 'with_tickets', label: 'Avec tickets', description: 'Entreprises ayant au moins un ticket' },
  { id: 'with_open_tickets', label: 'Tickets ouverts', description: 'Entreprises avec des tickets ouverts' },
  { id: 'with_assistance', label: 'Avec assistance', description: 'Entreprises avec des tickets d\'assistance' }
];

export function CompaniesQuickFilters({ 
  activeFilter, 
  currentProfileId,
  availableFilters = QUICK_FILTERS.map(f => f.id) // Par défaut, tous les filtres
}: CompaniesQuickFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (filterId: CompanyQuickFilter, disabled?: boolean) => {
    if (disabled) return;

    const params = new URLSearchParams(searchParams.toString());

    // ✅ Si on clique sur "Toutes les entreprises" (all), supprimer le paramètre 'quick'
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
        // ✅ "Toutes les entreprises" (all) est actif si activeFilter est 'all' ou undefined
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
