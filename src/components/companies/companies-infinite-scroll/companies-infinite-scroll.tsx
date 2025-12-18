'use client';

/**
 * Composant pour l'affichage infini des entreprises
 * 
 * Pattern similaire à TasksInfiniteScroll pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Gère l'affichage et le chargement infini des entreprises
 * - Utilise le hook useCompaniesInfiniteLoad pour la logique de chargement
 * - Utilise CompanyRow pour l'affichage de chaque ligne
 */

import React, { useCallback } from 'react';
import { Button } from '@/ui/button';
import { TooltipProvider } from '@/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useCompaniesInfiniteLoad } from '@/hooks/data/use-companies-infinite-load';
import { useStableSearchParams } from '@/hooks/use-stable-search-params';
import { CompanyRow } from './company-row';
import { CompaniesTableHeader } from './companies-table-header';
import { LoadMoreButton } from '@/components/activities/activities-infinite-scroll/load-more-button';
import type { CompanyWithRelations } from '@/types/company-with-relations';
import type { CompanyQuickFilter } from '@/types/company-filters';
import type { CompanySortColumn, SortDirection } from '@/types/company-sort';
import { parseCompanySort } from '@/types/company-sort';

type CompaniesInfiniteScrollProps = {
  initialCompanies: CompanyWithRelations[];
  initialHasMore: boolean;
  initialTotal: number;
  search?: string;
  quickFilter?: CompanyQuickFilter;
};

/**
 * Composant CompaniesInfiniteScroll
 * 
 * Gère l'affichage et le chargement infini des entreprises avec pagination.
 * 
 * @param props - Propriétés du composant
 */
export function CompaniesInfiniteScroll({
  initialCompanies,
  initialHasMore,
  initialTotal,
  search,
  quickFilter
}: CompaniesInfiniteScrollProps) {
  const router = useRouter();
  const searchParams = useStableSearchParams();
  
  // Extraire le tri depuis l'URL
  const sortParam = searchParams.get('sort');
  const sort = sortParam ? parseCompanySort(sortParam) : { column: 'name' as CompanySortColumn, direction: 'asc' as SortDirection };

  // Utiliser le hook de chargement infini
  const {
    companies,
    hasMore,
    isLoading,
    error,
    loadMore,
    total
  } = useCompaniesInfiniteLoad({
    initialCompanies,
    initialHasMore,
    initialTotal,
    search,
    quickFilter,
    sort,
    searchParams
  });

  // Déterminer si l'utilisateur peut éditer les entreprises
  // Pour l'instant, on autorise toujours l'édition (à ajuster selon les permissions)
  const canEdit = true;

  // Handler pour l'édition d'une entreprise
  const handleEdit = useCallback((companyId: string) => {
    router.push(`/config/companies/${companyId}?edit=true`);
  }, [router]);

  // Handler pour le changement de tri
  const handleSortChange = useCallback((column: CompanySortColumn, direction: SortDirection) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (column === 'name' && direction === 'asc') {
      // Si c'est le tri par défaut, supprimer le paramètre
      params.delete('sort');
    } else {
      params.set('sort', `${column}:${direction}`);
    }

    params.delete('offset'); // Réinitialiser la pagination lors du tri

    const newUrl = params.toString()
      ? `/config/companies?${params.toString()}`
      : '/config/companies';

    router.push(newUrl, { scroll: false });
  }, [router, searchParams]);

  // Aucune entreprise
  if (companies.length === 0 && !isLoading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Aucune entreprise enregistrée pour le moment.
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3" style={{ overflowAnchor: 'none' }} data-scroll-container>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <CompaniesTableHeader
              companies={companies}
              sortColumn={sort.column}
              sortDirection={sort.direction}
              onSortChange={handleSortChange}
            />
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {companies.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  handleEdit={handleEdit}
                  canEdit={canEdit}
                  search={search}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="flex flex-col items-center gap-2 py-6">
            <p className="text-sm text-status-danger">{error}</p>
            <Button size="sm" onClick={() => loadMore()}>
              Réessayer
            </Button>
          </div>
        )}

        {/* Bouton "Voir plus" */}
        {!error && (
          <LoadMoreButton
            onLoadMore={loadMore}
            isLoading={isLoading}
            hasMore={hasMore}
            label="Voir plus d'entreprises"
          />
        )}

        {/* Message de fin de liste */}
        {!hasMore && !isLoading && companies.length > 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Toutes les entreprises ont été chargées ({companies.length} sur {total || initialTotal})
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
