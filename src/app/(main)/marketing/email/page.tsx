/**
 * Page Email Marketing
 *
 * Affiche la liste des campagnes email Brevo avec statistiques
 */

import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { Button } from '@/ui/button';
import { Mail, Plus } from 'lucide-react';
import { PageLayoutWithFilters } from '@/components/layout/page';
import { Banner, BannerCode } from '@/components/ui/banner';
import { 
  EmailMarketingKPISectionLazy,
  CampaignsSearchBar,
  CampaignsQuickFilters,
  CampaignsInfiniteScroll,
  SyncCampaignsButton
} from '@/components/email-marketing';
import { getCachedEmailMarketingKPIs } from '@/lib/cache/email-marketing-kpis-cache';
import { getCachedCurrentUserProfileId } from '@/lib/auth/cached-auth';
import { listCampaignsPaginated } from '@/services/email-marketing/list-campaigns-paginated';
import type { CampaignsInfiniteScrollResult } from '@/types/campaign-paginated-result';
import type { CampaignQuickFilter } from '@/types/campaign-filters';
import { parseCampaignSort } from '@/types/campaign-sort';
import { isApplicationError } from '@/lib/errors/types';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getCachedSearchParams, stabilizeSearchParams } from '@/lib/utils/search-params';

type EmailMarketingPageProps = {
  searchParams?: Promise<{
    search?: string;
    quick?: CampaignQuickFilter;
    sort?: string;
  }>;
};

/**
 * Charge les campagnes initiales pour la page
 * 
 * Pattern similaire à loadInitialTasks et loadInitialActivities pour cohérence
 * 
 * Principe Clean Code :
 * - noStore() nécessaire car les campagnes peuvent être mises à jour par synchronisation
 * - Gestion d'erreur améliorée : propage l'erreur au lieu de retourner un résultat vide
 * 
 * @param searchParam - Terme de recherche
 * @param quickFilterParam - Filtre rapide
 * @param sortParam - Paramètre de tri (format "column:direction")
 * @returns Résultat paginé avec campagnes
 * @throws ApplicationError si une erreur survient lors du chargement
 */
async function loadInitialCampaigns(
  searchParam?: string,
  quickFilterParam?: CampaignQuickFilter,
  sortParam?: string
): Promise<CampaignsInfiniteScrollResult> {
  // ✅ noStore() nécessaire : campagnes peuvent être mises à jour par synchronisation
  noStore();
  
  try {
    // Parser le tri
    const sort = parseCampaignSort(sortParam);
    
    const result = await listCampaignsPaginated(
      0,
      25,
      searchParam,
      quickFilterParam,
      sort.column,
      sort.direction
    );
    
    return result;
  } catch (error) {
    // Logger l'erreur pour le débogage
    console.error('[ERROR] Erreur dans loadInitialCampaigns:', error);
    
    // Normaliser l'erreur en ApplicationError si ce n'est pas déjà le cas
    const { normalizeError } = await import('@/lib/errors/types');
    const normalizedError = isApplicationError(error) 
      ? error 
      : normalizeError(error);
    
    // Logger les détails supplémentaires si c'est une ApplicationError
    if (isApplicationError(normalizedError)) {
      console.error('[ERROR] Code:', normalizedError.code);
      console.error('[ERROR] StatusCode:', normalizedError.statusCode);
      if (normalizedError.details) {
        console.error('[ERROR] Details:', normalizedError.details);
      }
    }
    
    // Propager l'erreur pour qu'elle soit gérée par le composant parent
    throw normalizedError;
  }
}

/**
 * Loader pour les campagnes
 */
function CampaignsLoader() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Composant interne pour gérer le chargement des campagnes avec Suspense
 */
async function CampaignsContent({
  search,
  quickFilter,
  sort
}: {
  search?: string;
  quickFilter?: CampaignQuickFilter;
  sort?: string;
}) {
  try {
    const result = await loadInitialCampaigns(search, quickFilter, sort);

    return (
      <CampaignsInfiniteScroll
        initialCampaigns={result.campaigns}
        initialHasMore={result.hasMore}
        initialTotal={result.total}
        search={search}
        quickFilter={quickFilter}
      />
    );
  } catch (error) {
    // Gérer l'erreur en affichant un message à l'utilisateur
    const errorMessage = isApplicationError(error)
      ? error.message
      : 'Une erreur est survenue lors du chargement des campagnes';

    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur de chargement</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }
}

/**
 * Composant principal de la page
 */
export default async function EmailMarketingPage({ searchParams }: EmailMarketingPageProps) {
  // Récupérer le profile ID pour hasProfile (cohérence avec les autres pages)
  const currentProfileId = await getCachedCurrentUserProfileId();

  // Récupérer les KPIs côté serveur avec cache
  const kpis = await getCachedEmailMarketingKPIs();

  // ✅ Utiliser cache() pour mémoriser la résolution des searchParams
  const resolvedSearchParams = await getCachedSearchParams(searchParams || Promise.resolve({}));
  
  // Stabiliser et normaliser les searchParams pour une comparaison stable
  const stabilizedParams = await stabilizeSearchParams(resolvedSearchParams);
  
  // Extraire les paramètres avec types appropriés
  const search = stabilizedParams.search;
  const quickFilter = stabilizedParams.quick as CampaignQuickFilter | undefined;
  const sort = stabilizedParams.sort as string | undefined;

  return (
    <PageLayoutWithFilters
      sidebar={null}
      header={{
        icon: 'Mail',
        title: 'Email Marketing',
        description: 'Gestion des campagnes email Brevo',
        actions: (
          <>
            <SyncCampaignsButton />
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle campagne
            </Button>
          </>
        )
      }}
      banner={
        <Banner
          title="🚀 Configuration requise"
          description="Avant d'utiliser l'email marketing, vous devez :"
          variant="info"
          storageKey="email-marketing-config-banner"
        >
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Appliquer la migration Supabase</strong> :{' '}
              <BannerCode>
                supabase/migrations/2025-12-15-add-brevo-email-marketing.sql
              </BannerCode>
            </li>
            <li>
              <strong>Configurer votre clé API Brevo</strong> dans{' '}
              <BannerCode>.env.local</BannerCode>
            </li>
            <li>
              <strong>Synchroniser les campagnes</strong> depuis Brevo
            </li>
          </ol>
        </Banner>
      }
      kpis={<EmailMarketingKPISectionLazy kpis={kpis} hasProfile={!!currentProfileId} />}
      card={{
        title: 'Campagnes récentes',
        titleSuffix: undefined,
        search: <CampaignsSearchBar initialSearch={search} />,
        quickFilters: <CampaignsQuickFilters activeFilter={quickFilter} />
      }}
    >
      <Suspense fallback={<CampaignsLoader />}>
        <CampaignsContent search={search} quickFilter={quickFilter} sort={sort} />
      </Suspense>
    </PageLayoutWithFilters>
  );
}
