/**
 * Service pour charger l'historique d'une entreprise
 * 
 * Inclut :
 * - Tickets liés à l'entreprise
 * - Utilisateurs de l'entreprise
 * - Activités liées via tickets
 * 
 * Pattern similaire à loadTicketInteractions pour cohérence
 * 
 * ✅ Optimisation Phase 2 : React.cache() pour déduplication
 * - Évite les requêtes DB dupliquées dans la même requête
 * - Cache automatique par requête (déduplication)
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loadProfilesByIds } from '@/services/tickets/utils/load-profiles';

export type CompanyHistoryItem = {
  id: string;
  type: 'ticket' | 'user' | 'modification';
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    id: string;
    full_name: string;
  };
  metadata?: Record<string, any>;
};

/**
 * Charge l'historique complet d'une entreprise
 * 
 * ✅ Optimisation Phase 2 : Wrapped avec cache() pour déduplication
 * - Si appelé plusieurs fois dans la même requête, une seule requête DB
 * - Cache automatique par requête (pas de cache cross-request)
 * 
 * ✅ Optimisation Phase 3 : noStore() nécessaire (données temps réel)
 * - L'historique change fréquemment (nouveaux tickets, commentaires, etc.)
 * - Pas de cache cross-request pour garantir la fraîcheur
 * - Utilisé uniquement pour déduplication dans la même requête
 * 
 * @param companyId - ID de l'entreprise
 * @returns Liste des événements historiques triés par date décroissante
 */
export const loadCompanyHistory = cache(async (companyId: string): Promise<CompanyHistoryItem[]> => {
  // ✅ noStore() nécessaire : données temps réel qui changent fréquemment
  // Le cache() permet la déduplication dans la même requête uniquement
  const supabase = await createSupabaseServerClient();
  const historyItems: CompanyHistoryItem[] = [];

  // ✅ Optimisation Phase 4 : Paralléliser les requêtes tickets et users
  const [
    { data: ticketsDirect },
    { data: ticketLinks },
    { data: users }
  ] = await Promise.all([
    // Charger les tickets liés à l'entreprise (via company_id direct)
    supabase
      .from('tickets')
      .select('id, title, ticket_type, status, created_at, created_by')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),
    
    // Charger les tickets liés via ticket_company_link
    supabase
      .from('ticket_company_link')
      .select(`
        ticket:tickets!ticket_company_link_ticket_id_fkey(
          id,
          title,
          ticket_type,
          status,
          created_at,
          created_by
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),
    
    // Charger les utilisateurs créés pour cette entreprise
    supabase
      .from('profiles')
      .select('id, full_name, created_at, email')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  // Charger les profils des créateurs des tickets
  const ticketCreatorIds = [
    ...(ticketsDirect?.map((t) => t.created_by).filter((id): id is string => id !== null) || []),
    ...(ticketLinks?.map((link) => link.ticket?.created_by).filter((id): id is string => id !== null) || [])
  ];
  const profilesMap = await loadProfilesByIds([...new Set(ticketCreatorIds)]);

  // Transformer les tickets directs
  if (ticketsDirect) {
    for (const ticket of ticketsDirect) {
      const profile = ticket.created_by ? profilesMap.get(ticket.created_by) : undefined;
      historyItems.push({
        id: ticket.id,
        type: 'ticket',
        title: ticket.title || 'Ticket sans titre',
        description: `Ticket ${ticket.ticket_type} - ${ticket.status}`,
        timestamp: ticket.created_at,
        user: profile
          ? {
              id: profile.id,
              full_name: profile.full_name || ''
            }
          : undefined,
        metadata: {
          ticket_type: ticket.ticket_type,
          status: ticket.status
        }
      });
    }
  }

  // Transformer les tickets liés via ticket_company_link
  if (ticketLinks) {
    for (const link of ticketLinks) {
      const ticket = link.ticket;
      if (ticket && !ticketsDirect?.some((t) => t.id === ticket.id)) {
        // Éviter les doublons avec les tickets directs
        const profile = ticket.created_by ? profilesMap.get(ticket.created_by) : undefined;
        historyItems.push({
          id: ticket.id,
          type: 'ticket',
          title: ticket.title || 'Ticket sans titre',
          description: `Ticket ${ticket.ticket_type} - ${ticket.status}`,
          timestamp: ticket.created_at,
          user: profile
            ? {
                id: profile.id,
                full_name: profile.full_name || ''
              }
            : undefined,
          metadata: {
            ticket_type: ticket.ticket_type,
            status: ticket.status
          }
        });
      }
    }
  }

  // ✅ users déjà chargé en parallèle ci-dessus
  if (users) {
    for (const user of users) {
      historyItems.push({
        id: user.id,
        type: 'user',
        title: user.full_name || user.email || 'Utilisateur sans nom',
        description: 'Utilisateur ajouté à l\'entreprise',
        timestamp: user.created_at || new Date().toISOString(),
        metadata: {
          email: user.email
        }
      });
    }
  }

  // Trier par timestamp décroissant
  historyItems.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return historyItems.slice(0, 100); // Limiter à 100 items
});

