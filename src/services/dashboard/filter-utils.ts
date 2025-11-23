import type { DashboardFiltersInput } from '@/types/dashboard-filters';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

/**
 * Type pour une requête Supabase avec méthodes de filtrage
 */
type FilterableQuery = PostgrestFilterBuilder<any, any, any, any>;

/**
 * Applique les filtres dashboard à une requête Supabase
 * 
 * @param query - Requête Supabase (PostgrestFilterBuilder)
 * @param filters - Filtres à appliquer
 * @returns Requête avec filtres appliqués
 */
export function applyDashboardFilters<T extends FilterableQuery>(
  query: T,
  filters?: Partial<DashboardFiltersInput>
): T {
  if (!filters) return query;

  let filteredQuery: FilterableQuery = query;

  // Filtrer par produits
  if (filters.products && filters.products.length > 0) {
    filteredQuery = filteredQuery.in('product_id', filters.products);
  }

  // Filtrer par types de tickets
  if (filters.types && filters.types.length > 0) {
    filteredQuery = filteredQuery.in('ticket_type', filters.types);
  }

  // Filtrer par équipes (via le rôle du profil assigné)
  // Note: Ce filtre nécessite une jointure avec profiles
  // Pour l'instant, on l'applique côté application après récupération
  // TODO: Optimiser avec une vraie jointure si nécessaire

  return filteredQuery as T;
}

/**
 * Filtre les tickets par équipe côté application
 * 
 * @param tickets - Liste de tickets avec assigned_to_profile
 * @param teams - Équipes à filtrer
 * @returns Tickets filtrés
 */
export function filterTicketsByTeam<T extends { assigned_to_profile?: { role?: string } | { role?: string }[] | null }>(
  tickets: T[],
  teams?: string[]
): T[] {
  if (!teams || teams.length === 0) return tickets;

  const teamRoleMap: Record<string, string[]> = {
    support: ['agent', 'manager', 'support'],
    it: ['it', 'admin', 'developer'],
    marketing: ['marketing']
  };

  return tickets.filter((ticket) => {
    const profile = ticket.assigned_to_profile
      ? Array.isArray(ticket.assigned_to_profile)
        ? ticket.assigned_to_profile[0]
        : ticket.assigned_to_profile
      : null;
    
    const role = profile?.role?.toLowerCase() || '';
    
    return teams.some((team) => {
      const roles = teamRoleMap[team] || [];
      return roles.some((r) => role.includes(r));
    });
  });
}

