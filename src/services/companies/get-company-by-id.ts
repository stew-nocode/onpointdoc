/**
 * Service pour récupérer une entreprise par son ID avec toutes ses relations
 * 
 * Pattern identique à getTicketById pour cohérence
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (charger une entreprise avec relations)
 * - Gestion d'erreur centralisée
 * - Types explicites partout
 * 
 * ✅ Optimisation Phase 2 : React.cache() pour déduplication
 * - Évite les requêtes DB dupliquées dans la même requête
 * - Cache automatique par requête (déduplication)
 */

import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { handleSupabaseError } from '@/lib/errors/handlers';
import type { CompanyWithRelations } from '@/types/company-with-relations';
import { transformCompanyRelation } from '@/types/company-with-relations';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Charge une entreprise par son ID avec toutes ses relations et insights
 * 
 * ✅ Optimisation Phase 2 : Wrapped avec cache() pour déduplication
 * - Si appelé plusieurs fois dans la même requête, une seule requête DB
 * - Cache automatique par requête (pas de cache cross-request)
 * 
 * ✅ Optimisation Phase 3 : Pas de noStore() → Cache possible
 * - Les données d'entreprise sont relativement stables
 * - Next.js peut mettre en cache le résultat
 * - Améliore le TTFB pour les requêtes suivantes
 * 
 * @param companyId - ID de l'entreprise
 * @returns Entreprise avec relations ou null si non trouvée
 * @throws ApplicationError en cas d'erreur Supabase
 */
export const getCompanyById = cache(async (companyId: string): Promise<CompanyWithRelations | null> => {
  // Valider l'ID avant de faire la requête
  if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
    console.error('[getCompanyById] ID d\'entreprise invalide:', companyId);
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // Charger l'entreprise avec ses relations
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      country_id,
      focal_user_id,
      created_at,
      jira_company_id,
      company_sector_link(
        sector:sectors!company_sector_link_sector_id_fkey(id, name)
      )
    `)
    .eq('id', companyId)
    .single();

  if (companyError) {
    console.error('[getCompanyById] Erreur Supabase:', companyError);
    console.error('[getCompanyById] Code:', companyError.code);
    console.error('[getCompanyById] Message:', companyError.message);
    
    // Si l'entreprise n'existe pas, retourner null
    if (companyError.code === 'PGRST116') {
      return null;
    }
    
    throw handleSupabaseError(companyError, 'getCompanyById');
  }

  if (!company) {
    return null;
  }

  // Charger les relations séparément (country et focal_user)
  const [countryData, focalUserData, insights] = await Promise.all([
    company.country_id
      ? supabase
          .from('countries')
          .select('id, name')
          .eq('id', company.country_id)
          .single()
          .then(({ data, error }) => (error ? null : data))
      : Promise.resolve(null),
    company.focal_user_id
      ? supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', company.focal_user_id)
          .single()
          .then(({ data, error }) => (error ? null : data))
      : Promise.resolve(null),
    calculateCompanyInsights(supabase, companyId)
  ]);

  // Transformer les secteurs depuis company_sector_link
  const sectors = company.company_sector_link
    ?.map((link: any) => transformCompanyRelation(link.sector))
    .filter((sector: any) => sector !== null) || [];

  // Construire l'objet CompanyWithRelations
  const companyWithRelations: CompanyWithRelations = {
    ...company,
    country: countryData ? { id: countryData.id, name: countryData.name } : null,
    focal_user: focalUserData
      ? { id: focalUserData.id, full_name: focalUserData.full_name || '' }
      : null,
    sectors: sectors,
    users_count: insights.users_count,
    tickets_count: insights.tickets_count,
    open_tickets_count: insights.open_tickets_count,
    assistance_duration_minutes: insights.assistance_duration_minutes
  };

  return companyWithRelations;
});

/**
 * Calcule les insights agrégés pour une entreprise
 * 
 * ✅ Optimisation Phase 6 : Parallélisation des requêtes DB
 * - Toutes les requêtes en parallèle avec Promise.all()
 * - Réduction du temps total d'exécution
 * 
 * @param supabase - Client Supabase
 * @param companyId - ID de l'entreprise
 * @returns Objet avec tous les insights
 */
async function calculateCompanyInsights(
  supabase: SupabaseClient,
  companyId: string
): Promise<{
  users_count: number;
  tickets_count: number;
  open_tickets_count: number;
  assistance_duration_minutes: number;
}> {
  const openStatuses = ['Nouveau', 'En_cours', 'To_Do', 'In_Progress'];

  // ✅ Toutes les requêtes en parallèle pour réduire le temps total
  const [
    { count: usersCount },
    { count: ticketsDirectCount },
    { count: ticketsLinkCount },
    { count: openTicketsDirectCount },
    { data: assistanceTickets }
  ] = await Promise.all([
    // Compter les utilisateurs liés à l'entreprise
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    
    // Compter les tickets liés via company_id direct
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    
    // Compter les tickets liés via ticket_company_link
    supabase
      .from('ticket_company_link')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId),
    
    // Compter les tickets ouverts (statuts non résolus)
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .in('status', openStatuses),
    
    // Calculer la durée totale des assistances
    supabase
      .from('tickets')
      .select('duration_minutes')
      .eq('company_id', companyId)
      .eq('ticket_type', 'ASSISTANCE')
      .not('duration_minutes', 'is', null)
  ]);

  const assistanceDuration = (assistanceTickets || [])
    .reduce((sum, ticket) => sum + (ticket.duration_minutes || 0), 0);

  return {
    users_count: usersCount || 0,
    tickets_count: (ticketsDirectCount || 0) + (ticketsLinkCount || 0),
    open_tickets_count: openTicketsDirectCount || 0,
    assistance_duration_minutes: assistanceDuration
  };
}

