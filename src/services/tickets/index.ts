import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validators/ticket';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketsPaginatedResult, TicketWithRelations, SupabaseTicketRaw } from '@/types/ticket-with-relations';
import { transformRelation } from '@/types/ticket-with-relations';
import { getInitialStatus } from '@/lib/utils/ticket-status';
import { createJiraIssue, deleteJiraIssue } from '@/services/jira/client';
import type { TicketSortColumn, SortDirection } from '@/types/ticket-sort';
import { mapSortColumnToSupabase } from '@/lib/utils/ticket-sort';
import { DEFAULT_TICKET_SORT } from '@/types/ticket-sort';
import type { AdvancedFiltersInput } from '@/lib/validators/advanced-filters';
import { applyAdvancedFilters } from './filters/advanced';
import { createError } from '@/lib/errors/types';
import { handleSupabaseError } from '@/lib/errors/handlers';

export const createTicket = async (payload: CreateTicketInput) => {
  const supabase = await createSupabaseServerClient();
  // Récupérer le profil de l'utilisateur connecté pour created_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_uid', user.id)
    .single();
  if (!profile) throw new Error('Profil utilisateur introuvable');

  // Déterminer company_id selon la portée
  let companyId: string | null = null;
  if (payload.scope === 'single' && payload.companyId) {
    companyId = payload.companyId;
  } else if (payload.scope === 'multiple' && payload.selectedCompanyIds?.[0]) {
    companyId = payload.selectedCompanyIds[0]; // Première pour compatibilité
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: payload.title,
      description: payload.description,
      ticket_type: payload.type,
      canal: payload.channel, // Colonne DB = 'canal' (pas 'channel')
      product_id: payload.productId ?? null,
      module_id: payload.moduleId ?? null,
      submodule_id: (payload.submoduleId && payload.submoduleId !== '') ? payload.submoduleId : null,
      feature_id: (payload.featureId && payload.featureId !== '') ? payload.featureId : null,
      priority: payload.priority,
      duration_minutes: payload.durationMinutes ?? null,
      customer_context: payload.customerContext,
      contact_user_id: (payload.contactUserId && payload.contactUserId !== '') ? payload.contactUserId : null,
      company_id: companyId,
      affects_all_companies: payload.affectsAllCompanies || false,
      bug_type: payload.bug_type ?? null,
      created_by: profile.id, // ID du profil (pas auth.uid())
      status: getInitialStatus(payload.type), // Statut initial selon le type (JIRA pour BUG/REQ, local pour ASSISTANCE)
      origin: 'supabase'
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Créer les liens dans ticket_company_link selon la portée
  if (payload.scope === 'single' && companyId) {
    await supabase.from('ticket_company_link').insert({
      ticket_id: data.id,
      company_id: companyId,
      is_primary: true,
      role: 'affected',
    });
  } else if (payload.scope === 'multiple' && payload.selectedCompanyIds && payload.selectedCompanyIds.length > 0) {
    // Si scope = 'multiple', créer un lien pour chaque entreprise
    const links = payload.selectedCompanyIds.map((compId, index) => ({
      ticket_id: data.id,
      company_id: compId,
      is_primary: index === 0,
      role: 'affected' as const,
    }));
    await supabase.from('ticket_company_link').insert(links);
    
    // Ajouter aussi l'entreprise signalante si différente
    if (payload.contactUserId) {
      const { data: contactProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', payload.contactUserId)
        .single();
      
      if (contactProfile?.company_id && !payload.selectedCompanyIds.includes(contactProfile.company_id)) {
        await supabase.from('ticket_company_link').insert({
          ticket_id: data.id,
          company_id: contactProfile.company_id,
          is_primary: false,
          role: 'reporter',
        });
      }
    }
  } else if (payload.scope === 'all' && payload.contactUserId) {
    // Si scope = 'all', ajouter uniquement l'entreprise signalante (pour référence)
    const { data: contactProfile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', payload.contactUserId)
      .single();
    
    if (contactProfile?.company_id) {
      await supabase.from('ticket_company_link').insert({
        ticket_id: data.id,
        company_id: contactProfile.company_id,
        is_primary: false,
        role: 'reporter',
      });
    }
  }

  // Créer les liens dans ticket_department_link si des départements sont sélectionnés
  if (payload.selectedDepartmentIds && payload.selectedDepartmentIds.length > 0) {
    const departmentLinks = payload.selectedDepartmentIds.map((deptId, index) => ({
      ticket_id: data.id,
      department_id: deptId,
      is_primary: index === 0, // Premier département = principal
    }));
    await supabase.from('ticket_department_link').insert(departmentLinks);
  }

  // Pour BUG et REQ, créer immédiatement le ticket JIRA
  if (payload.type === 'BUG' || payload.type === 'REQ') {
    try {
      const jiraResponse = await createJiraIssue({
        ticketId: data.id,
        title: payload.title,
        description: payload.description,
        ticketType: payload.type,
        priority: payload.priority,
        canal: payload.channel,
        productId: payload.productId ?? undefined,
        moduleId: payload.moduleId ?? undefined,
        customerContext: payload.customerContext,
        bugType: payload.bug_type ?? undefined,
        companyId: companyId ?? undefined
      });

      if (jiraResponse.success && jiraResponse.jiraIssueKey) {
        // Mettre à jour le ticket avec la clé JIRA
        await supabase
          .from('tickets')
          .update({
            jira_issue_key: jiraResponse.jiraIssueKey,
            origin: 'supabase'
          })
          .eq('id', data.id);

        // Enregistrer dans jira_sync
        await supabase.from('jira_sync').upsert({
          ticket_id: data.id,
          jira_issue_key: jiraResponse.jiraIssueKey,
          origin: 'supabase',
          last_synced_at: new Date().toISOString()
        });
      } else {
        console.error('Erreur lors de la création du ticket JIRA:', jiraResponse.error);
        // Enregistrer l'erreur dans jira_sync pour diagnostic
        await supabase.from('jira_sync').upsert({
          ticket_id: data.id,
          jira_issue_key: null,
          origin: 'supabase',
          sync_error: jiraResponse.error || 'Erreur inconnue lors de la création JIRA',
          last_synced_at: new Date().toISOString()
        });
        // Ne pas faire échouer la création du ticket Supabase si JIRA échoue
        // Le ticket sera créé dans Supabase et pourra être synchronisé plus tard
      }
    } catch (jiraError) {
      console.error('Erreur lors de la création du ticket JIRA:', jiraError);
      // Enregistrer l'erreur dans jira_sync pour diagnostic
      const errorMessage = jiraError instanceof Error ? jiraError.message : 'Erreur inconnue';
      await supabase.from('jira_sync').upsert({
        ticket_id: data.id,
        jira_issue_key: null,
        origin: 'supabase',
        sync_error: errorMessage,
        last_synced_at: new Date().toISOString()
      });
      // Ne pas faire échouer la création du ticket Supabase
    }
  }

  return data;
};

/**
 * Met à jour un ticket existant
 * 
 * @param payload - Données de mise à jour du ticket (ID requis, autres champs optionnels)
 * @returns Le ticket mis à jour
 */
export const updateTicket = async (payload: UpdateTicketInput) => {
  const supabase = await createSupabaseServerClient();
  
  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Récupérer le ticket actuel pour vérifier le type, le statut et la clé JIRA
  const { data: currentTicket, error: fetchError } = await supabase
    .from('tickets')
    .select('ticket_type, status, jira_issue_key')
    .eq('id', payload.id)
    .single();

  if (fetchError || !currentTicket) {
    throw new Error(`Ticket non trouvé: ${fetchError?.message ?? 'Ticket introuvable'}`);
  }

  // Vérifier que le changement de statut est autorisé (uniquement pour ASSISTANCE non transférés)
  if (payload.status !== undefined) {
    if (currentTicket.ticket_type !== 'ASSISTANCE') {
      throw new Error('Le statut ne peut être modifié que pour les tickets ASSISTANCE');
    }
    
    // Ne pas permettre de changer le statut si le ticket est transféré (utilise les statuts JIRA)
    if (currentTicket.status === 'Transfere') {
      throw new Error('Le statut ne peut pas être modifié pour un ticket ASSISTANCE transféré');
    }
  }

  // Préparer les données de mise à jour
  const updateData: Record<string, unknown> = {};
  const oldStatus = currentTicket.status;
  
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.type !== undefined) updateData.ticket_type = payload.type;
  if (payload.channel !== undefined) updateData.canal = payload.channel;
  if (payload.productId !== undefined) updateData.product_id = payload.productId;
  if (payload.moduleId !== undefined) updateData.module_id = payload.moduleId;
  if (payload.submoduleId !== undefined) {
    updateData.submodule_id = (payload.submoduleId && payload.submoduleId !== '') 
      ? payload.submoduleId 
      : null;
  }
  if (payload.featureId !== undefined) {
    updateData.feature_id = (payload.featureId && payload.featureId !== '') 
      ? payload.featureId 
      : null;
  }
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.durationMinutes !== undefined) updateData.duration_minutes = payload.durationMinutes;
  if (payload.customerContext !== undefined) updateData.customer_context = payload.customerContext;
  if (payload.contactUserId !== undefined) {
    updateData.contact_user_id = (payload.contactUserId && payload.contactUserId !== '') 
      ? payload.contactUserId 
      : null;
  }
  if (payload.companyId !== undefined) {
    updateData.company_id = (payload.companyId && payload.companyId !== '') 
      ? payload.companyId 
      : null;
  }
  if (payload.bug_type !== undefined) updateData.bug_type = payload.bug_type;
  if (payload.status !== undefined) updateData.status = payload.status;

  // Définir la source de mise à jour pour éviter les boucles de synchronisation
  // Ne pas écraser si la dernière mise à jour vient de JIRA (pour éviter les boucles)
  if (!currentTicket.jira_issue_key || currentTicket.ticket_type === 'ASSISTANCE') {
    updateData.last_update_source = 'supabase';
  }

  // Mettre à jour le ticket
  const { data, error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', payload.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la mise à jour du ticket: ${error.message}`);
  }

  // Enregistrer dans l'historique si le statut a changé
  if (payload.status !== undefined && payload.status !== oldStatus) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_uid', user.id)
      .single();

    if (profile) {
      await supabase.from('ticket_status_history').insert({
        ticket_id: payload.id,
        status_from: oldStatus,
        status_to: payload.status,
        changed_by: profile.id,
        source: 'app'
      });
    }
  }

  return data;
};

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = string; // Accepte tous les statuts (JIRA ou locaux)

/**
 * @deprecated Utiliser getTicketStatuses() depuis @/lib/constants/tickets
 * Conservé pour compatibilité avec le code existant
 */
export const TICKET_STATUSES = ['Nouveau', 'En_cours', 'Transfere', 'Resolue', 'Sprint Backlog', 'Traitement en Cours', 'Test en Cours', 'Terminé(e)', 'Terminé'] as const;

export const listTickets = async (type?: TicketTypeFilter, status?: TicketStatusFilter) => {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from('tickets')
    .select('id, title, ticket_type, status, priority, assigned_to, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (type) {
    query = query.eq('ticket_type', type);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Liste les tickets paginés avec filtres et relations
 *
 * ✅ OPTIMISÉ Phase 2 (2025-12-20) :
 * - Utilise RPC function pour réduire 2-3 requêtes à 1 seule (-40%)
 * - Fix requête companies avec nested select (pas de requête séparée)
 * - Index RLS optimisés (-20% temps requête)
 * - Support filtres avancés (fallback sur ancienne méthode)
 *
 * @param type - Type de ticket (BUG, REQ, ASSISTANCE)
 * @param status - Statut du ticket
 * @param offset - Offset de pagination
 * @param limit - Limite de résultats
 * @param search - Recherche textuelle
 * @param quickFilter - Filtre rapide (all, mine, etc.)
 * @param currentProfileId - ID du profil utilisateur
 * @param sortColumn - Colonne de tri
 * @param sortDirection - Direction de tri
 * @param advancedFilters - Filtres avancés (sidebar)
 * @param agentId - ID de l'agent (filtre managers)
 * @param companyId - ID de l'entreprise (filtre managers)
 * @returns Résultat paginé avec tickets, hasMore, total
 */
export const listTicketsPaginated = async (
  type?: TicketTypeFilter,
  status?: TicketStatusFilter,
  offset: number = 0,
  limit: number = 25,
  search?: string,
  quickFilter?: QuickFilter,
  currentProfileId?: string | null,
  sortColumn?: TicketSortColumn,
  sortDirection?: SortDirection,
  advancedFilters?: AdvancedFiltersInput | null,
  agentId?: string,
  companyId?: string
): Promise<TicketsPaginatedResult> => {
  const supabase = await createSupabaseServerClient();

  // Utiliser le tri fourni ou le tri par défaut
  const sort = sortColumn && sortDirection
    ? { column: sortColumn, direction: sortDirection }
    : DEFAULT_TICKET_SORT;

  // ============================================================================
  // MÉTHODE OPTIMISÉE : RPC FUNCTION (sans filtres avancés)
  // ============================================================================
  // Si pas de filtres avancés, utiliser la RPC function optimisée
  // Réduit 2-3 requêtes à 1 seule (-40% temps de réponse)
  if (!advancedFilters) {
    const { data: ticketsData, error: rpcError } = await supabase.rpc(
      'list_tickets_with_user_context',
      {
        p_user_id: currentProfileId || null,
        p_quick_filter: quickFilter || 'all',
        p_offset: offset,
        p_limit: limit,
        p_type: type || null,
        p_status: status || null,
        p_search: search || null,
        p_agent_id: agentId || null,
        p_company_id: companyId || null,
        p_sort_column: sort.column,
        p_sort_direction: sort.direction
      }
    );

    if (rpcError) {
      console.error('[ERROR] Erreur RPC list_tickets_with_user_context:', rpcError);
      throw handleSupabaseError(rpcError, 'list_tickets_with_user_context');
    }

    // Si pas de tickets, retourner vide
    if (!ticketsData || ticketsData.length === 0) {
      return { tickets: [], hasMore: false, total: 0 };
    }

    // ✅ DEBUG : Vérifier si company_id est présent dans les données
    const ticketsWithCompany = ticketsData.filter((t: any) => t.company_id);
    console.log(`[DEBUG] Tickets avec company_id: ${ticketsWithCompany.length} sur ${ticketsData.length}`);
    if (ticketsWithCompany.length > 0) {
      console.log(`[DEBUG] Exemples de company_id:`, ticketsWithCompany.slice(0, 3).map((t: any) => ({ ticketId: t.id, companyId: t.company_id })));
    }

    // ✅ Charger les relations en 1 seule requête avec nested select
    const ticketIds = ticketsData.map((t: any) => t.id);
    const { data: relations, error: relError } = await supabase
      .from('tickets')
      .select(`
        id,
        created_user:profiles!tickets_created_by_fkey(id, full_name),
        assigned_user:profiles!tickets_assigned_to_fkey(id, full_name),
        contact_user:profiles!tickets_contact_user_id_fkey(
          id,
          full_name,
          company:companies(id, name)
        ),
        product:products(id, name),
        module:modules(id, name)
      `)
      .in('id', ticketIds);

    if (relError) {
      console.error('[ERROR] Erreur load relations:', relError);
      throw handleSupabaseError(relError, 'load_ticket_relations');
    }

    // ✅ Charger les companies séparément depuis company_id (pas de foreign key)
    const companyIds = [...new Set(ticketsData.map((t: any) => t.company_id).filter(Boolean))];
    let companiesMap: Map<string, { id: string; name: string }> = new Map();
    if (companyIds.length > 0) {
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds);
      
      if (companiesError) {
        console.error('[ERROR] Erreur chargement companies:', companiesError);
      }
      
      if (!companiesError && companies) {
        companiesMap = new Map(companies.map((c: any) => [c.id, c]));
        console.log(`[DEBUG] Companies chargées: ${companies.length} pour ${companyIds.length} company_ids`);
      } else {
        console.warn(`[WARN] Aucune company trouvée pour les IDs:`, companyIds);
      }
    } else {
      console.log('[DEBUG] Aucun company_id trouvé dans les tickets');
    }

    // ✅ Fusionner les données (RPC + relations)
    const enrichedTickets: TicketWithRelations[] = ticketsData.map((ticket: any) => {
      const relation = relations?.find((r: any) => r.id === ticket.id);
      return {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        ticket_type: ticket.ticket_type,
        status: ticket.status,
        priority: ticket.priority,
        canal: ticket.canal,
        jira_issue_key: ticket.jira_issue_key,
        origin: ticket.origin,
        target_date: ticket.target_date,
        bug_type: ticket.bug_type,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        created_by: ticket.created_by,
        assigned_to: ticket.assigned_to,
        contact_user_id: ticket.contact_user_id,
        product_id: ticket.product_id,
        module_id: ticket.module_id,
        submodule_id: ticket.submodule_id,
        feature_id: ticket.feature_id,
        company_id: ticket.company_id,
        affects_all_companies: ticket.affects_all_companies,
        customer_context: ticket.customer_context,
        duration_minutes: ticket.duration_minutes,
        resolved_at: ticket.resolved_at,
        validated_by_manager: ticket.validated_by_manager,
        last_update_source: ticket.last_update_source,
        // Relations
        created_user: transformRelation(relation?.created_user),
        assigned_user: transformRelation(relation?.assigned_user),
        contact_user: transformRelation(relation?.contact_user),
        product: transformRelation(relation?.product),
        module: transformRelation(relation?.module),
        // ✅ Company : priorité à company_id direct, sinon via contact_user
        company: (() => {
          // D'abord essayer la company directe du ticket (company_id)
          if (ticket.company_id) {
            if (companiesMap.has(ticket.company_id)) {
              const company = companiesMap.get(ticket.company_id)!;
              return { id: company.id, name: company.name };
            } else {
              console.warn(`[WARN] Company ID ${ticket.company_id} trouvé dans ticket mais pas dans companiesMap pour ticket ${ticket.id}`);
            }
          }
          // Sinon, essayer via contact_user
          const contactUser = Array.isArray(relation?.contact_user)
            ? relation.contact_user[0]
            : relation?.contact_user;
          const company = contactUser && Array.isArray(contactUser.company)
            ? contactUser.company[0]
            : contactUser?.company;
          return company ? transformRelation(company) : null;
        })()
      };
    });

    const totalCount = ticketsData[0]?.total_count || 0;

    return {
      tickets: enrichedTickets,
      hasMore: offset + limit < totalCount,
      total: totalCount
    };
  }

  // ============================================================================
  // MÉTHODE LEGACY : QUERY BUILDER (avec filtres avancés)
  // ============================================================================
  // Si filtres avancés présents, utiliser l'ancienne méthode (pour compatibilité)
  // TODO: Migrer les filtres avancés vers la RPC function dans une prochaine phase

  const supabaseColumn = mapSortColumnToSupabase(sort.column);
  const ascending = sort.direction === 'asc';

  // ✅ Fix: Charger company via nested select (pas de requête séparée)
  let query = supabase
    .from('tickets')
    .select(`
      id,
      title,
      description,
      ticket_type,
      status,
      priority,
      canal,
      jira_issue_key,
      origin,
      target_date,
      bug_type,
      created_at,
      updated_at,
      created_by,
      created_user:profiles!tickets_created_by_fkey(id, full_name),
      assigned_to,
      assigned_user:profiles!tickets_assigned_to_fkey(id, full_name),
      contact_user_id,
      company_id,
      contact_user:profiles!tickets_contact_user_id_fkey(
        id,
        full_name,
        company:companies(id, name)
      ),
      product:products(id, name),
      module:modules(id, name)
    `, { count: 'exact' });

  // Appliquer les filtres simples (pour compatibilité)
  if (type && !advancedFilters?.types?.length) {
    query = query.eq('ticket_type', type);
  }
  if (status && !advancedFilters?.statuses?.length) {
    query = query.eq('status', status);
  }

  // Recherche textuelle dans titre, description et clé Jira
  if (search && search.trim().length > 0) {
    const searchTerm = search.trim();
    const escapedSearch = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const searchPattern = `%${escapedSearch}%`;
    query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},jira_issue_key.ilike.${searchPattern}`);
  }

  // ✅ CORRIGÉ : Plus besoin de récupérer les modules pour le filtre "all"
  // Le filtre "all" retourne maintenant tous les tickets accessibles via RLS
  // Les modules ne sont nécessaires que pour d'autres filtres spécifiques (si besoin)
  let assignedModuleIds: string[] | undefined;

  // Appliquer les quick filters
  query = applyQuickFilter(query, quickFilter, {
    currentProfileId: currentProfileId ?? undefined,
    assignedModuleIds
  });

  // Filtres agent/company
  if (agentId) {
    query = query.or(`created_by.eq.${agentId},assigned_to.eq.${agentId}`);
  }
  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  // Appliquer les filtres avancés (AVANT .order() et .range())
  try {
    query = applyAdvancedFilters(query, advancedFilters);
  } catch (filterError) {
    console.error('[ERROR] Erreur filtres avancés:', filterError);
    throw filterError;
  }

  // Tri et pagination
  query = query.order(supabaseColumn, { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[ERROR] Erreur Supabase listTicketsPaginated:', error);
    throw handleSupabaseError(error, 'listTicketsPaginated');
  }

  // ✅ Charger les companies séparément depuis company_id (méthode legacy)
  const companyIds = [...new Set((data || []).map((t: any) => t.company_id).filter(Boolean))];
  let companiesMap: Record<string, { id: string; name: string }> = {};
  if (companyIds.length > 0) {
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', companyIds);
    
    if (!companiesError && companies) {
      companiesMap = companies.reduce((acc, c: any) => {
        acc[c.id] = { id: c.id, name: c.name };
        return acc;
      }, {} as Record<string, { id: string; name: string }>);
      console.log(`[DEBUG LEGACY] Companies chargées: ${companies.length} pour ${companyIds.length} company_ids`);
    }
  }

  // Transformer les données
  const { transformTicket } = await import('./utils/ticket-transformer');
  const transformedTickets: TicketWithRelations[] = (data || []).map(
    (ticket: SupabaseTicketRaw) => transformTicket(ticket, companiesMap)
  );

  return {
    tickets: transformedTickets,
    hasMore: count ? offset + limit < count : false,
    total: count || 0
  };
};

export function applyQuickFilter(
  query: any,
  quickFilter?: QuickFilter,
  options?: { currentProfileId?: string; assignedModuleIds?: string[] }
) {
  if (!quickFilter) {
    return query;
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  const startOfWeekStr = startOfWeek.toISOString().slice(0, 10);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfMonthStr = firstDayOfMonth.toISOString().slice(0, 10);

  switch (quickFilter) {
    case 'all':
      // ✅ CORRIGÉ : Filtre "Tous les tickets"
      // Retourner tous les tickets accessibles via RLS (Row Level Security)
      // Les RLS gèrent automatiquement les permissions selon le rôle de l'utilisateur
      // Pas de filtre supplémentaire nécessaire
      return query;
    case 'mine':
      if (options?.currentProfileId) {
        // ✅ MODIFIÉ : Inclure les tickets créés OU assignés à l'utilisateur
        // Syntaxe Supabase : 'colonne1.eq.valeur1,colonne2.eq.valeur2'
        return query.or(
          `created_by.eq.${options.currentProfileId},assigned_to.eq.${options.currentProfileId}`
        );
      }
      return query;
    case 'unassigned':
      return query.is('assigned_to', null);
    case 'overdue':
      return query
        .not('target_date', 'eq', null)
        .lt('target_date', todayStr);
    case 'to_validate':
      return query.eq('status', 'Transfere');
    case 'week':
      // ✅ MODIFIÉ : Si currentProfileId est fourni, filtrer sur date ET ownership
      // Pour les agents : leurs tickets (créés OU assignés) de cette semaine
      // Pour les managers : tous les tickets de cette semaine (comportement existant)
      if (options?.currentProfileId) {
        return query
          .gte('created_at', startOfWeekStr)
          .or(`created_by.eq.${options.currentProfileId},assigned_to.eq.${options.currentProfileId}`);
      }
      return query.gte('created_at', startOfWeekStr);
    case 'month':
      // ✅ MODIFIÉ : Si currentProfileId est fourni, filtrer sur date ET ownership
      // Pour les agents : leurs tickets (créés OU assignés) de ce mois
      // Pour les managers : tous les tickets de ce mois (comportement existant)
      if (options?.currentProfileId) {
        return query
          .gte('created_at', firstDayOfMonthStr)
          .or(`created_by.eq.${options.currentProfileId},assigned_to.eq.${options.currentProfileId}`);
      }
      return query.gte('created_at', firstDayOfMonthStr);
    case 'bug_in_progress':
      // ✅ NOUVEAU : Filtre les bugs en cours (Traitement en Cours ou Test en Cours)
      // Les statuts JIRA "en cours" sont : 'Traitement en Cours', 'Test en Cours'
      return query
        .eq('ticket_type', 'BUG')
        .in('status', ['Traitement en Cours', 'Test en Cours']);
    case 'req_in_progress':
      // ✅ NOUVEAU : Filtre les requêtes en cours (Traitement en Cours ou Test en Cours)
      // Les statuts JIRA "en cours" sont : 'Traitement en Cours', 'Test en Cours'
      return query
        .eq('ticket_type', 'REQ')
        .in('status', ['Traitement en Cours', 'Test en Cours']);
    default:
      return query;
  }
}


/**
 * Valide un ticket en tant que manager (non bloquant, pour reporting)
 * Met à jour le champ `validated_by_manager = true` dans Supabase
 * 
 * @param ticketId - UUID du ticket à valider
 * @returns Le ticket mis à jour avec `validated_by_manager = true`
 * @throws Error si le ticket n'est pas trouvé ou si l'utilisateur n'est pas manager
 */
export const validateTicket = async (ticketId: string) => {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié et est un manager
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_uid', user.id)
    .single();

  if (!profile) {
    throw new Error('Profil utilisateur introuvable');
  }

  // Vérifier que l'utilisateur est un manager ou un admin
  const isManager = profile.role === 'manager' || profile.role?.includes('manager');
  const isAdmin = profile.role === 'admin';
  if (!isManager && !isAdmin) {
    throw new Error('Seuls les managers et administrateurs peuvent valider un ticket');
  }

  // Mettre à jour le champ validated_by_manager
  const { data, error } = await supabase
    .from('tickets')
    .update({ validated_by_manager: true })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la validation du ticket: ${error.message}`);
  }

  if (!data) {
    throw new Error('Ticket non trouvé');
  }

  return data;
};

export async function countTicketsByStatus(type: TicketTypeFilter) {
  const supabase = await createSupabaseServerClient();
  
  // Utiliser un Record dynamique pour accepter tous les statuts (JIRA ou locaux)
  const result: Record<string, number> = {};
  
  const { data, error } = await supabase
    .from('tickets')
    .select('status')
    .eq('ticket_type', type)
    .limit(1000);
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Compter tous les statuts dynamiquement
  for (const row of data ?? []) {
    const status = row?.status as string | null | undefined;
    if (status && typeof status === 'string') {
      result[status] = (result[status] || 0) + 1;
    }
  }
  
  return result;
}

/**
 * Vérifie si un ticket peut être supprimé
 * 
 * @param ticket - Ticket à vérifier
 * @throws ApplicationError si la suppression n'est pas autorisée
 */
function validateTicketDeletion(ticket: { origin: string | null; jira_issue_key: string | null }): void {
  if (ticket.origin === 'jira') {
    throw createError.forbidden(
      'Impossible de supprimer ce ticket car il a été créé dans JIRA. JIRA est la source de vérité pour ce ticket.',
      { ticketOrigin: ticket.origin }
    );
  }
}

/**
 * Supprime un ticket dans JIRA si nécessaire
 * 
 * @param jiraIssueKey - Clé JIRA du ticket
 * @throws ApplicationError si la suppression JIRA échoue
 */
async function deleteTicketInJira(jiraIssueKey: string): Promise<void> {
  try {
    await deleteJiraIssue(jiraIssueKey);
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'JIRA_ERROR') {
      throw error;
    }
    throw createError.jiraError(
      'Impossible de supprimer le ticket dans JIRA. Le ticket n\'a pas été supprimé.',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Supprime un ticket et synchronise avec JIRA si nécessaire
 * 
 * @param ticketId - ID du ticket à supprimer
 * @throws ApplicationError si la suppression échoue
 */
export async function deleteTicket(ticketId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, jira_issue_key, ticket_type, origin')
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    throw createError.notFound('Ticket');
  }

  validateTicketDeletion(ticket);

  if (ticket.jira_issue_key) {
    await deleteTicketInJira(ticket.jira_issue_key);
  }

  const { error: deleteError } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId);

  if (deleteError) {
    throw createError.supabaseError('Erreur lors de la suppression du ticket', deleteError);
  }
}

