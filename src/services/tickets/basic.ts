/**
 * Fonctions utilitaires pour récupérer des informations basiques sur les tickets
 * Pour utilisation dans les formulaires (activités, tâches, etc.)
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type BasicTicket = {
  id: string;
  title: string;
  ticket_type: string;
};

/**
 * Récupère une liste basique de tickets pour les formulaires
 * Limite à 100 tickets pour éviter les performances
 * 
 * @returns Liste des tickets avec id, title, ticket_type
 */
export async function listBasicTickets(): Promise<BasicTicket[]> {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('tickets')
    .select('id, title, ticket_type')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    return [];
  }
  
  return (data || []).map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    ticket_type: ticket.ticket_type || 'ASSISTANCE'
  }));
}
