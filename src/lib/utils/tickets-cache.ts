import { unstable_cache } from 'next/cache';
import type { TicketsPaginatedResult } from '@/types/ticket-with-relations';
import { listTicketsPaginated } from '@/services/tickets';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';
import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';

/**
 * Tags de cache pour l'invalidation ciblée
 * 
 * Principe Clean Code - Niveau Senior :
 * - Constantes centralisées pour les tags de cache
 * - Facilite l'invalidation ciblée depuis les Server Actions
 * - Évite les erreurs de typo avec des strings magiques
 */
export const TICKETS_CACHE_TAGS = {
  TICKETS_LIST: 'tickets:list',
  TICKETS_KPI: 'tickets:kpi',
  TICKETS_DETAIL: (ticketId: string) => `tickets:detail:${ticketId}`,
  TICKETS_BY_TYPE: (type: string) => `tickets:type:${type}`,
  TICKETS_BY_STATUS: (status: string) => `tickets:status:${status}`,
} as const;

/**
 * Options de cache pour les tickets
 * 
 * Principe Clean Code - Niveau Senior :
 * - Configuration centralisée et réutilisable
 * - Paramètres de cache optimisés pour données temps réel
 * - Revalidation de 10 secondes pour équilibrer fraîcheur et performance
 * - Les Server Actions invalideront le cache immédiatement après modifications
 */
const TICKETS_CACHE_OPTIONS = {
  revalidate: 10, // Revalider après 10 secondes (équilibre optimal pour données temps réel)
  tags: [TICKETS_CACHE_TAGS.TICKETS_LIST],
} as const;

/**
 * Charge les tickets avec cache optimisé
 * 
 * Principe Clean Code - Niveau Senior :
 * - Utilise unstable_cache() pour un cache déterministe
 * - Tags de cache pour invalidation ciblée
 * - Type-safe avec génériques
 * - Pas de noStore() : utilise le cache avec revalidation courte
 * 
 * Cette fonction met en cache les résultats de listTicketsPaginated
 * avec une revalidation de 10 secondes. Le cache peut être invalidé
 * immédiatement via revalidateTag() dans les Server Actions (ex: createTicketAction).
 * 
 * ✅ PHASE 4 : Optimisation - Pas de noStore() car :
 * - Le cache de 10s réduit les appels répétés
 * - revalidateTag() invalide immédiatement après modifications
 * - Équilibre optimal entre fraîcheur et performance
 * 
 * @param params - Paramètres de filtrage et pagination
 * @returns Les tickets paginés avec cache
 */
export async function getCachedTickets(
  typeParam?: string,
  statusParam?: string,
  searchParam?: string,
  quickFilterParam?: QuickFilter,
  currentProfileId?: string | null,
  sortColumnParam?: TicketSortColumn,
  sortDirectionParam?: SortDirection,
  advancedFilters?: AdvancedFiltersInput,
  offset = 0,
  limit = 25
): Promise<TicketsPaginatedResult> {
  // Créer une clé de cache déterministe basée sur tous les paramètres
  const cacheKey = JSON.stringify({
    typeParam,
    statusParam,
    searchParam,
    quickFilterParam,
    currentProfileId,
    sortColumnParam,
    sortDirectionParam,
    advancedFilters: advancedFilters ? JSON.stringify(advancedFilters) : null,
    offset,
    limit,
  });

  // Créer les tags de cache dynamiques pour invalidation ciblée
  const cacheTags = [
    TICKETS_CACHE_TAGS.TICKETS_LIST,
    ...(typeParam ? [TICKETS_CACHE_TAGS.TICKETS_BY_TYPE(typeParam)] : []),
    ...(statusParam ? [TICKETS_CACHE_TAGS.TICKETS_BY_STATUS(statusParam)] : []),
  ];

  return unstable_cache(
    async () => {
      // ✅ OPTIMISATION PHASE 4 : Pas de noStore() ici
      // Le cache avec revalidation de 30s + revalidateTag() dans les Server Actions
      // est suffisant pour équilibrer fraîcheur des données et performance
      
      // Normaliser les paramètres
      const normalizedType =
        typeParam === 'BUG' || typeParam === 'REQ' || typeParam === 'ASSISTANCE'
          ? typeParam
          : undefined;

      const normalizedStatus = statusParam || undefined;

      // Appeler le service de récupération des tickets
      return await listTicketsPaginated(
        normalizedType,
        normalizedStatus,
        offset,
        limit,
        searchParam,
        quickFilterParam,
        currentProfileId ?? undefined,
        sortColumnParam,
        sortDirectionParam,
        advancedFilters
      );
    },
    [`tickets:${cacheKey}`], // Clé de cache unique
    {
      ...TICKETS_CACHE_OPTIONS,
      tags: cacheTags, // Tags pour invalidation ciblée
    }
  )();
}

/**
 * Invalide le cache des tickets
 * 
 * Principe Clean Code - Niveau Senior :
 * - Fonction utilitaire pour invalider le cache
 * - Utilise revalidateTag() pour invalidation ciblée
 * - Peut être appelée depuis les Server Actions
 * 
 * Cette fonction doit être appelée dans les Server Actions
 * après modification des tickets pour invalider le cache.
 * 
 * @example
 * ```tsx
 * import { revalidateTag } from 'next/cache';
 * import { TICKETS_CACHE_TAGS } from '@/lib/utils/tickets-cache';
 * 
 * export async function createTicketAction(...) {
 *   await createTicket(...);
 *   revalidateTag(TICKETS_CACHE_TAGS.TICKETS_LIST);
 * }
 * ```
 */
export function invalidateTicketsCache(): void {
  // Cette fonction sera implémentée dans les Server Actions
  // via revalidateTag() de Next.js
  // C'est une fonction utilitaire pour documenter l'usage
}

