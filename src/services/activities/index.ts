import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateActivityInput, UpdateActivityInput } from '@/lib/validators/activity';
import { createError } from '@/lib/errors/types';
import { handleSupabaseError } from '@/lib/errors/handlers';
import type { ActivitiesPaginatedResult, SupabaseActivityRaw } from '@/types/activity-with-relations';
import type { ActivityQuickFilter } from '@/types/activity-filters';
import { transformActivity } from './utils/activity-transformer';

/**
 * Crée une nouvelle activité avec ses participants et tickets liés
 * 
 * @param payload - Données de l'activité à créer
 * @returns L'ID de l'activité créée
 * @throws ApplicationError si une erreur survient
 */
export const createActivity = async (payload: CreateActivityInput): Promise<string> => {
  const supabase = await createSupabaseServerClient();
  
  // Récupérer le profil de l'utilisateur connecté pour created_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError('UNAUTHORIZED', 'Non authentifié');
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_uid', user.id)
    .single();
    
  if (!profile) {
    throw createError('NOT_FOUND', 'Profil utilisateur introuvable');
  }

  // Créer l'activité
  // Les dates sont optionnelles : null si non planifiée
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .insert({
      title: payload.title,
      activity_type: payload.activityType,
      planned_start: payload.plannedStart || null,
      planned_end: payload.plannedEnd || null,
      status: 'Brouillon',
      created_by: profile.id,
      location_mode: payload.locationMode || null,
      report_content: payload.reportContent || null
    })
    .select('id')
    .single();

  if (activityError) {
    throw handleSupabaseError(activityError, 'Erreur lors de la création de l\'activité');
  }

  // Créer les participants si présents
  if (payload.participantIds && payload.participantIds.length > 0) {
    // Pour l'instant, on considère tous les participants comme internes
    // TODO: Ajouter la logique pour distinguer internes/externes si nécessaire
    const participants = payload.participantIds.map((userId) => ({
      activity_id: activity.id,
      user_id: userId,
      role: 'internal',
      is_invited_external: false
    }));

    const { error: participantsError } = await supabase
      .from('activity_participants')
      .insert(participants);

    if (participantsError) {
      // Logger l'erreur mais ne pas faire échouer la création de l'activité
      console.error('Erreur lors de l\'ajout des participants:', participantsError);
    }
  }

  // Créer les liens avec les tickets si présents
  if (payload.linkedTicketIds && payload.linkedTicketIds.length > 0) {
    const ticketLinks = payload.linkedTicketIds.map((ticketId) => ({
      ticket_id: ticketId,
      activity_id: activity.id
    }));

    const { error: ticketsError } = await supabase
      .from('ticket_activity_link')
      .insert(ticketLinks);

    if (ticketsError) {
      // Si la liaison échoue, on doit faire échouer la création de l'activité
      // car l'utilisateur s'attend à ce que le ticket soit lié
      // On supprime l'activité créée pour éviter une incohérence
      await supabase.from('activities').delete().eq('id', activity.id);
      throw handleSupabaseError(ticketsError, 'Erreur lors de la liaison du ticket à l\'activité');
    }
  }

  return activity.id;
};

/**
 * Applique un filtre rapide à une requête Supabase pour les activités
 * 
 * Pattern similaire à applyQuickFilter pour tickets
 * 
 * @param query - Requête Supabase à modifier
 * @param quickFilter - Type de filtre rapide à appliquer
 * @param options - Options additionnelles (currentProfileId)
 * @returns Requête modifiée avec le filtre appliqué
 */
export function applyQuickFilter(
  query: any,
  quickFilter?: ActivityQuickFilter,
  options?: { currentProfileId?: string }
) {
  if (!quickFilter) {
    return query;
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Calculer le début de la semaine (lundi)
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Lundi = 1, Dimanche = 0
  startOfWeek.setDate(startOfWeek.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekStr = startOfWeek.toISOString();

  // Calculer le premier jour du mois
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  const firstDayOfMonthStr = firstDayOfMonth.toISOString();

  switch (quickFilter) {
    case 'all':
      // Toutes les activités (pas de filtre supplémentaire, RLS gère les permissions)
      return query;
    
    case 'mine':
      // Mes activités : créées par moi OU où je participe
      if (options?.currentProfileId) {
        // Pour le filtre "mine", on doit vérifier :
        // 1. created_by = currentProfileId
        // 2. OU activité présente dans activity_participants avec user_id = currentProfileId
        // 
        // Supabase ne permet pas facilement de faire un OR avec une relation N:M dans un filtre simple.
        // On utilise donc un filtre sur created_by d'abord, et on filtre ensuite côté application si nécessaire.
        // Pour l'instant, on se limite aux activités créées par l'utilisateur.
        // TODO: Si besoin de filtrer aussi par participation, il faudra une sous-requête ou un filtrage post-query
        return query.eq('created_by', options.currentProfileId);
      }
      return query;
    
    case 'planned':
      // Activités planifiées : avec planned_start ET planned_end
      return query
        .not('planned_start', 'is', null)
        .not('planned_end', 'is', null);
    
    case 'unplanned':
      // Activités non planifiées : sans planned_start OU sans planned_end
      // En SQL: (planned_start IS NULL OR planned_end IS NULL)
      // En Supabase, on utilise .or() avec des conditions null
      return query.or('planned_start.is.null,planned_end.is.null');
    
    case 'week':
      // Activités créées cette semaine (depuis le lundi)
      return query.gte('created_at', startOfWeekStr);
    
    case 'month':
      // Activités créées ce mois-ci (depuis le 1er du mois)
      return query.gte('created_at', firstDayOfMonthStr);
    
    default:
      return query;
  }
}

/**
 * Liste les activités avec pagination, recherche et filtres rapides
 * 
 * Pattern similaire à listTicketsPaginated pour cohérence
 * 
 * @param offset - Décalage pour la pagination (défaut: 0)
 * @param limit - Nombre d'éléments par page (défaut: 25)
 * @param search - Terme de recherche (par titre)
 * @param quickFilter - Filtre rapide à appliquer
 * @param currentProfileId - ID du profil utilisateur actuel (pour filtres conditionnels)
 * @returns Résultat paginé avec activités transformées
 * @throws ApplicationError si une erreur survient
 */
export const listActivitiesPaginated = async (
  offset: number = 0,
  limit: number = 25,
  search?: string,
  quickFilter?: ActivityQuickFilter,
  currentProfileId?: string | null
): Promise<ActivitiesPaginatedResult> => {
  const supabase = await createSupabaseServerClient();
  
  // Construire la requête avec les relations nécessaires
  // Pattern similaire à listTicketsPaginated
  //
  // OPTIMISATION (2025-12-15):
  // - Retrait de `report_content` et `location_mode` (chargés à la demande)
  // - Utilisation de `count: 'estimated'` au lieu de 'exact' (beaucoup plus rapide)
  // - Relations chargées en détail pour l'affichage
  let query = supabase
    .from('activities')
    .select(`
      id,
      title,
      activity_type,
      planned_start,
      planned_end,
      created_by,
      status,
      validated_by_manager,
      team_id,
      created_at,
      updated_at,
      created_user:profiles!activities_created_by_fkey(id, full_name),
      activity_participants(
        user_id,
        role,
        is_invited_external,
        user:profiles!activity_participants_user_id_fkey(id, full_name)
      ),
      ticket_activity_link(
        ticket:tickets!ticket_activity_link_ticket_id_fkey(
          id,
          title,
          ticket_type,
          status,
          jira_issue_key
        )
      )
    `, { count: 'estimated' });

  // Recherche textuelle par titre
  if (search && search.trim().length > 0) {
    const searchTerm = search.trim();
    // Échapper les caractères spéciaux pour ilike (%, _)
    const escapedSearch = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const searchPattern = `%${escapedSearch}%`;
    
    query = query.ilike('title', searchPattern);
  }

  // Appliquer les quick filters
  query = applyQuickFilter(query, quickFilter, { 
    currentProfileId: currentProfileId ?? undefined
  });

  // Appliquer le tri par défaut (created_at DESC) et la pagination
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    // Logger l'erreur complète pour le débogage
    console.error('[ERROR] Erreur Supabase dans listActivitiesPaginated:');
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
    
    throw handleSupabaseError(supabaseError, 'listActivitiesPaginated');
  }

  // Transformer les données brutes en ActivityWithRelations
  const transformedActivities = (data || []).map(
    (activity: SupabaseActivityRaw) => transformActivity(activity)
  );

  return {
    activities: transformedActivities,
    hasMore: count ? offset + limit < count : false,
    total: count || 0
  };
};

/**
 * Met à jour une activité existante
 * 
 * @param payload - Données de l'activité à mettre à jour (doit contenir l'ID)
 * @returns L'ID de l'activité mise à jour
 * @throws ApplicationError si une erreur survient
 */
export const updateActivity = async (payload: UpdateActivityInput): Promise<string> => {
  const supabase = await createSupabaseServerClient();
  
  // Vérifier que l'ID est présent
  if (!payload.id) {
    throw createError('VALIDATION_ERROR', 'L\'ID de l\'activité est requis');
  }

  // Construire l'objet de mise à jour avec seulement les champs présents
  const updateData: Record<string, unknown> = {};
  
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.activityType !== undefined) updateData.activity_type = payload.activityType;
  if (payload.plannedStart !== undefined) updateData.planned_start = payload.plannedStart || null;
  if (payload.plannedEnd !== undefined) updateData.planned_end = payload.plannedEnd || null;
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.locationMode !== undefined) updateData.location_mode = payload.locationMode || null;
  if (payload.reportContent !== undefined) updateData.report_content = payload.reportContent || null;

  // Mettre à jour l'activité
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .update(updateData)
    .eq('id', payload.id)
    .select('id')
    .single();

  if (activityError) {
    throw handleSupabaseError(activityError, 'Erreur lors de la mise à jour de l\'activité');
  }

  // TODO: Gérer la mise à jour des participants et tickets liés si nécessaire
  // Pour l'instant, on se concentre sur la mise à jour du compte rendu

  return activity.id;
};
