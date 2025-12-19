'use client';

/**
 * Composant pour l'affichage infini des campagnes email
 * 
 * Pattern similaire à TasksInfiniteScroll et ActivitiesInfiniteScroll pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Gère l'affichage et le chargement infini des campagnes
 * - Utilise le hook useCampaignsInfiniteLoad pour la logique de chargement
 * - Utilise CampaignRow pour l'affichage de chaque ligne
 * - Gère la restauration du scroll après chargement
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Button } from '@/ui/button';
import { TooltipProvider } from '@/ui/tooltip';
import { useStableSearchParams } from '@/hooks/use-stable-search-params';
import { useCampaignsInfiniteLoad } from '@/hooks/campaigns/use-campaigns-infinite-load';
import { LoadMoreButton } from '@/components/activities/activities-infinite-scroll/load-more-button';
import { CampaignRow } from './campaign-row';
import { CampaignsTableHeader } from './campaigns-table-header';
import type { BrevoEmailCampaign } from '@/types/brevo';
import type { CampaignQuickFilter } from '@/types/campaign-filters';

type CampaignsInfiniteScrollProps = {
  initialCampaigns: BrevoEmailCampaign[];
  initialHasMore: boolean;
  initialTotal: number;
  search?: string;
  quickFilter?: CampaignQuickFilter;
};

/**
 * Composant CampaignsInfiniteScroll
 * 
 * Gère l'affichage et le chargement infini des campagnes avec pagination.
 * 
 * @param props - Propriétés du composant
 */
export function CampaignsInfiniteScroll({
  initialCampaigns,
  initialHasMore,
  initialTotal,
  search,
  quickFilter
}: CampaignsInfiniteScrollProps) {
  const searchParams = useStableSearchParams();
  
  // Utiliser le hook de chargement infini
  const {
    campaigns,
    hasMore,
    isLoading,
    error,
    loadMore,
    filterKey
  } = useCampaignsInfiniteLoad({
    initialCampaigns,
    initialHasMore,
    search,
    quickFilter,
    searchParams
  });

  // Restaurer le scroll après le chargement de nouvelles campagnes
  useLayoutEffect(() => {
    const storedCampaignId = sessionStorage.getItem('campaigns-scroll-campaign-id');
    if (storedCampaignId && !isLoading && campaigns.length > 0) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        const campaignElement = document.getElementById(storedCampaignId);
        if (campaignElement) {
          campaignElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          sessionStorage.removeItem('campaigns-scroll-campaign-id');
        }
      });
    }
  }, [campaigns, isLoading]);

  // Handler pour loadMore avec sauvegarde du scroll
  const handleLoadMore = async () => {
    // Sauvegarder l'ID de la dernière campagne visible avant le chargement
    const allCampaignRows = document.querySelectorAll<HTMLElement>('tr[data-campaign-id]');
    let lastVisibleCampaignId: string | null = null;
    
    // Trouver la dernière campagne visible à l'écran
    for (let i = allCampaignRows.length - 1; i >= 0; i--) {
      const row = allCampaignRows[i];
      const rect = row.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        lastVisibleCampaignId = row.id;
        break;
      }
    }
    
    // Si aucune campagne visible, prendre la dernière de la liste
    if (!lastVisibleCampaignId && allCampaignRows.length > 0) {
      lastVisibleCampaignId = allCampaignRows[allCampaignRows.length - 1].id;
    }
    
    // Sauvegarder l'ID dans sessionStorage pour restauration
    if (lastVisibleCampaignId) {
      sessionStorage.setItem('campaigns-scroll-campaign-id', lastVisibleCampaignId);
    }
    
    // Charger plus de campagnes
    await loadMore();
  };

  // Aucune campagne
  if (campaigns.length === 0 && !isLoading) {
    return (
      <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Aucune campagne enregistrée pour le moment.
      </p>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3" style={{ overflowAnchor: 'none' }} data-scroll-container>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <CampaignsTableHeader />
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns.map((campaign) => (
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
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
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
            hasMore={hasMore}
            label="Voir plus de campagnes"
          />
        )}

        {/* Message de fin de liste */}
        {!hasMore && !isLoading && campaigns.length > 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Toutes les campagnes ont été chargées ({campaigns.length} sur {initialTotal})
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

