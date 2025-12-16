/**
 * Service pour lister les campagnes email avec pagination
 * 
 * Pattern aligné avec listActivitiesPaginated et listTasksPaginated
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (lister les campagnes avec filtres)
 * - Fonction pure (pas d'effets de bord)
 * - Types explicites pour tous les paramètres
 * - Gestion d'erreur centralisée avec handleSupabaseError
 * - Optimisations : count: 'estimated', recherche échappée, index utilisés
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/errors/handlers';
import type { CampaignQuickFilter } from '@/types/campaign-filters';
import type { CampaignSortColumn, SortDirection } from '@/types/campaign-sort';
import type { CampaignsInfiniteScrollResult } from '@/types/campaign-paginated-result';
import type { BrevoEmailCampaign } from '@/types/brevo';

/**
 * Applique un filtre rapide à une requête Supabase
 * 
 * @param query - Requête Supabase à modifier
 * @param quickFilter - Filtre rapide à appliquer
 * @returns Requête modifiée
 */
function applyQuickFilter(
  query: any,
  quickFilter?: CampaignQuickFilter
): any {
  if (!quickFilter || quickFilter === 'all') {
    return query;
  }

  switch (quickFilter) {
    case 'sent':
      return query.eq('status', 'sent');
    case 'draft':
      return query.eq('status', 'draft');
    case 'scheduled':
      return query.eq('status', 'scheduled');
    default:
      return query;
  }
}

/**
 * Liste les campagnes email avec pagination, recherche, filtres et tri
 * 
 * @param offset - Offset pour la pagination
 * @param limit - Nombre d'éléments à retourner (défaut: 25)
 * @param search - Terme de recherche (recherche dans campaign_name et email_subject)
 * @param quickFilter - Filtre rapide (all, sent, draft, scheduled)
 * @param sortColumn - Colonne de tri (défaut: 'sent_at')
 * @param sortDirection - Direction de tri (défaut: 'desc')
 * @returns Résultat paginé avec campagnes, hasMore et total
 * 
 * @example
 * ```typescript
 * const result = await listCampaignsPaginated(0, 25, 'promo', 'sent', 'sent_at', 'desc');
 * // Retourne: { campaigns: [...], hasMore: true, total: 50 }
 * ```
 */
export async function listCampaignsPaginated(
  offset: number,
  limit: number = 25,
  search?: string,
  quickFilter?: CampaignQuickFilter,
  sortColumn: CampaignSortColumn = 'sent_at',
  sortDirection: SortDirection = 'desc'
): Promise<CampaignsInfiniteScrollResult> {
  const supabase = await createSupabaseServerClient();

  try {
    // OPTIMISATION (2025-12-15): Utilisation de count: 'estimated' pour meilleures performances
    // (comme dans listActivitiesPaginated)
    // Pas de relations à charger (structure simple)
    let query = supabase
      .from('brevo_email_campaigns')
      .select('*', { count: 'estimated' });

    // Recherche textuelle sur campaign_name et email_subject
    if (search && search.trim().length > 0) {
      const searchTerm = search.trim();
      // Échapper les caractères spéciaux pour ilike (%, _)
      const escapedSearch = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const searchPattern = `%${escapedSearch}%`;
      
      // Recherche sur campaign_name OU email_subject
      // Pattern Supabase : .or('column1.ilike.pattern,column2.ilike.pattern')
      query = query.or(`campaign_name.ilike.${searchPattern},email_subject.ilike.${searchPattern}`);
    }

    // Appliquer les quick filters
    query = applyQuickFilter(query, quickFilter);

    // Appliquer le tri
    // Note: sent_at peut être null (campagnes non envoyées), donc nullsFirst: false
    const ascending = sortDirection === 'asc';
    query = query.order(sortColumn, { ascending, nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    // Exécuter la requête
    const { data, error, count } = await query;

    if (error) {
      // Logger l'erreur complète pour le débogage
      console.error('[ERROR] Erreur Supabase dans listCampaignsPaginated:');
      console.error('[ERROR] Code:', error.code);
      console.error('[ERROR] Message:', error.message);
      console.error('[ERROR] Details:', error.details);
      console.error('[ERROR] Hint:', error.hint);
      console.error('[ERROR] Erreur complète:', error);
      
      // Créer une ApplicationError avec les détails Supabase
      const supabaseError = new Error(error.message || 'Erreur Supabase inconnue');
      supabaseError.name = 'SupabaseError';
      (supabaseError as any).code = error.code;
      (supabaseError as any).details = error.details;
      (supabaseError as any).hint = error.hint;
      
      throw handleSupabaseError(supabaseError, 'listCampaignsPaginated');
    }

    // Retourner le résultat formaté (pas de transformation nécessaire, pas de relations)
    return {
      campaigns: (data || []) as BrevoEmailCampaign[],
      hasMore: count ? offset + limit < count : false,
      total: count || 0
    };
  } catch (error) {
    // Si l'erreur a déjà été transformée par handleSupabaseError, la relancer
    if (error instanceof Error && error.name === 'ApplicationError') {
      throw error;
    }
    
    // Sinon, transformer en ApplicationError
    throw handleSupabaseError(
      error instanceof Error ? error : new Error('Erreur inconnue lors de la récupération des campagnes'),
      'listCampaignsPaginated'
    );
  }
}

