import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validators/ticket';
import type { QuickFilter } from '@/types/ticket-filters';
import type { TicketsPaginatedResult, TicketWithRelations, SupabaseTicketRaw } from '@/types/ticket-with-relations';
import { transformRelation } from '@/types/ticket-with-relations';
import { getInitialStatus } from '@/lib/utils/ticket-status';
import { createJiraIssue } from '@/services/jira/client';
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
        bugType: payload.bug_type ?? undefined
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
  agentId?: string, // ✅ Nouveau paramètre : ID de l'agent pour filtrer par agent support
  companyId?: string // ✅ Nouveau paramètre : ID de l'entreprise pour filtrer par entreprise
): Promise<TicketsPaginatedResult> => {
  const supabase = await createSupabaseServerClient();
  
  // Utiliser le tri fourni ou le tri par défaut
  const sort = sortColumn && sortDirection
    ? { column: sortColumn, direction: sortDirection }
    : DEFAULT_TICKET_SORT;
  
  const supabaseColumn = mapSortColumnToSupabase(sort.column);
  const ascending = sort.direction === 'asc';
  
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
      contact_user:profiles!tickets_contact_user_id_fkey(id, full_name, company_id),
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
    // Échapper les caractères spéciaux pour ilike (%, _)
    const escapedSearch = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const searchPattern = `%${escapedSearch}%`;
    
    // Utiliser des filtres séparés au lieu de .or() pour éviter les problèmes avec les caractères spéciaux
    // Cette approche est plus fiable avec ilike et les wildcards
    query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern},jira_issue_key.ilike.${searchPattern}`);
  }

  // ✅ Récupérer les modules affectés à l'utilisateur si nécessaire (pour le filtre "all")
  let assignedModuleIds: string[] | undefined;
  if (currentProfileId && quickFilter === 'all') {
    const { data: moduleAssignments } = await supabase
      .from('user_module_assignments')
      .select('module_id')
      .eq('user_id', currentProfileId);
    
    if (moduleAssignments && moduleAssignments.length > 0) {
      assignedModuleIds = moduleAssignments.map(ma => ma.module_id);
    }
  }

  // Appliquer les quick filters
  query = applyQuickFilter(query, quickFilter, { 
    currentProfileId: currentProfileId ?? undefined,
    assignedModuleIds 
  });

  // ✅ Appliquer le filtre par agent support si fourni (pour les managers)
  // Filtrer sur created_by OU assigned_to de l'agent sélectionné
  if (agentId) {
    query = query.or(`created_by.eq.${agentId},assigned_to.eq.${agentId}`);
  }

  // ✅ Appliquer le filtre par entreprise si fourni
  // Filtrer sur company_id (entreprise principale du ticket)
  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  // Appliquer les filtres avancés si fournis (AVANT .order() et .range())
  if (advancedFilters) {
    try {
      query = applyAdvancedFilters(query, advancedFilters);
    } catch (filterError) {
      console.error('[ERROR] Erreur lors de l\'application des filtres avancés:', filterError);
      if (filterError instanceof Error) {
        console.error('[ERROR] Message:', filterError.message);
        console.error('[ERROR] Stack:', filterError.stack);
      }
      throw filterError;
    }
  }

  // Appliquer le tri et la pagination APRÈS tous les filtres
  query = query.order(supabaseColumn, { ascending }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    // Logger l'erreur complète pour le débogage
    console.error('[ERROR] Erreur Supabase dans listTicketsPaginated:');
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
    
    throw handleSupabaseError(supabaseError, 'listTicketsPaginated');
  }

  // Récupérer tous les company_id uniques depuis contact_user
  const companyIds = new Set<string>();
  (data || []).forEach((ticket: SupabaseTicketRaw) => {
    const contactUser = transformRelation(ticket.contact_user);
    if (contactUser && typeof contactUser === 'object' && 'company_id' in contactUser && contactUser.company_id) {
      // S'assurer que company_id est une string
      const companyId = String(contactUser.company_id);
      if (companyId) {
        companyIds.add(companyId);
      }
    }
  });

  // Charger toutes les companies nécessaires
  const companiesMap: Record<string, { id: string; name: string }> = {};
  if (companyIds.size > 0) {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name')
      .in('id', Array.from(companyIds));
    
    if (companies) {
      companies.forEach((company) => {
        // S'assurer que les valeurs sont des strings sérialisables
        if (company && company.id && company.name) {
          companiesMap[String(company.id)] = {
            id: String(company.id),
            name: String(company.name)
          };
        }
      });
    }
  }

  // Transformer les données avec l'utilitaire optimisé (sans JSON.parse/stringify)
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
      // ✅ MODIFIÉ : Filtre "Tous les tickets"
      // Pour les agents support : inclure leurs tickets (créés/assignés) + tickets de leurs modules affectés
      // Pour les autres rôles : tous les tickets accessibles via RLS
      if (options?.currentProfileId) {
        const conditions: string[] = [
          `created_by.eq.${options.currentProfileId}`,
          `assigned_to.eq.${options.currentProfileId}`
        ];
        
        // Ajouter les tickets des modules affectés si disponibles
        // Pour chaque module, créer une condition module_id.eq.${moduleId}
        if (options.assignedModuleIds && options.assignedModuleIds.length > 0) {
          const moduleConditions = options.assignedModuleIds
            .map(moduleId => `module_id.eq.${moduleId}`);
          conditions.push(...moduleConditions);
        }
        
        // Combiner toutes les conditions avec OR
        // Syntaxe Supabase : .or('condition1,condition2,condition3')
        return query.or(conditions.join(','));
      }
      // Pour les autres rôles (managers, admin, etc.), retourner la query sans modification
      // Les règles RLS s'appliqueront automatiquement
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

