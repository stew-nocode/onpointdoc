import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { CreateTaskInput, UpdateTaskInput } from '@/lib/validators/task';
import { createError } from '@/lib/errors/types';
import { handleSupabaseError } from '@/lib/errors/handlers';
import type { TasksPaginatedResult, SupabaseTaskRaw } from '@/types/task-with-relations';
import type { TaskQuickFilter } from '@/types/task-filters';
import type { TaskSortColumn, SortDirection } from '@/types/task-sort';
import { transformTask } from './utils/task-transformer';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Récupère le profil utilisateur actuel depuis Supabase
 * 
 * @param supabase - Client Supabase
 * @returns L'ID du profil utilisateur
 * @throws ApplicationError si non authentifié ou profil introuvable
 */
async function getCurrentUserProfileId(supabase: SupabaseClient): Promise<string> {
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

  return profile.id;
}

/**
 * Crée les liens entre une tâche et des tickets
 * 
 * @param supabase - Client Supabase
 * @param taskId - ID de la tâche
 * @param ticketIds - IDs des tickets à lier
 * @throws ApplicationError si la création échoue
 */
async function createTicketLinks(
  supabase: SupabaseClient,
  taskId: string,
  ticketIds: string[]
): Promise<void> {
  const ticketLinks = ticketIds.map((ticketId) => ({
    ticket_id: ticketId,
    task_id: taskId
  }));

  const { error } = await supabase
    .from('ticket_task_link')
    .insert(ticketLinks);

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la liaison des tickets à la tâche');
  }
}

/**
 * Crée les liens entre une tâche et des activités
 * 
 * @param supabase - Client Supabase
 * @param taskId - ID de la tâche
 * @param activityIds - IDs des activités à lier
 * @throws ApplicationError si la création échoue
 */
async function createActivityLinks(
  supabase: SupabaseClient,
  taskId: string,
  activityIds: string[]
): Promise<void> {
  const activityLinks = activityIds.map((activityId) => ({
    activity_id: activityId,
    task_id: taskId
  }));

  const { error } = await supabase
    .from('activity_task_link')
    .insert(activityLinks);

  if (error) {
    throw handleSupabaseError(error, 'Erreur lors de la liaison des activités à la tâche');
  }
}

/**
 * Crée une nouvelle tâche avec ses tickets et activités liés
 * 
 * @param payload - Données de la tâche à créer
 * @returns L'ID de la tâche créée
 * @throws ApplicationError si une erreur survient
 */
export const createTask = async (payload: CreateTaskInput): Promise<string> => {
  const supabase = await createSupabaseServerClient();
  
  // Récupérer le profil de l'utilisateur connecté
  const profileId = await getCurrentUserProfileId(supabase);

  // Créer la tâche
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .insert({
      title: payload.title,
      description: payload.description || null,
      due_date: payload.dueDate || null,
      assigned_to: payload.assignedTo || null,
      status: 'A_faire',
      is_planned: payload.isPlanned ?? false,
      created_by: profileId,
      report_content: payload.reportContent || null
    })
    .select('id')
    .single();

  if (taskError) {
    throw handleSupabaseError(taskError, 'Erreur lors de la création de la tâche');
  }

  // Créer les liens avec les tickets si présents
  if (payload.linkedTicketIds && payload.linkedTicketIds.length > 0) {
    await createTicketLinks(supabase, task.id, payload.linkedTicketIds);
  }

  // Créer les liens avec les activités si présents
  if (payload.linkedActivityIds && payload.linkedActivityIds.length > 0) {
    await createActivityLinks(supabase, task.id, payload.linkedActivityIds);
  }

  return task.id;
};

/**
 * Applique un filtre rapide à une requête Supabase pour les tâches
 * 
 * @param query - Requête Supabase à modifier
 * @param quickFilter - Type de filtre rapide à appliquer
 * @param options - Options additionnelles (currentProfileId)
 * @returns Requête modifiée avec le filtre appliqué
 */
export function applyTaskQuickFilter(
  query: any,
  quickFilter?: TaskQuickFilter,
  options?: { currentProfileId?: string }
) {
  if (!quickFilter) {
    return query;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();

  switch (quickFilter) {
    case 'all':
      // Toutes les tâches (pas de filtre supplémentaire, RLS gère les permissions)
      return query;
    
    case 'mine':
      // Mes tâches : assignées à moi
      if (options?.currentProfileId) {
        return query.eq('assigned_to', options.currentProfileId);
      }
      return query;
    
    case 'todo':
      // À faire (statut = 'A_faire')
      return query.eq('status', 'A_faire');
    
    case 'in_progress':
      // En cours (statut = 'En_cours')
      return query.eq('status', 'En_cours');
    
    case 'blocked':
      // Bloquées (statut = 'Bloque')
      return query.eq('status', 'Bloque');
    
    case 'completed':
      // Terminées (statut = 'Termine')
      return query.eq('status', 'Termine');
    
    case 'overdue':
      // En retard : due_date < today ET status != 'Termine' ET status != 'Annule'
      return query
        .lt('due_date', todayStr)
        .neq('status', 'Termine')
        .neq('status', 'Annule');
    
    default:
      return query;
  }
}

/**
 * Construit une requête Supabase pour les tâches avec relations et filtres
 * 
 * @param supabase - Client Supabase
 * @param search - Terme de recherche (par titre et description)
 * @param quickFilter - Filtre rapide à appliquer
 * @param currentProfileId - ID du profil utilisateur actuel
 * @returns Requête Supabase configurée
 */
function buildTasksQuery(
  supabase: SupabaseClient,
  search?: string,
  quickFilter?: TaskQuickFilter,
  currentProfileId?: string | null
) {
  // OPTIMISATION (2025-12-15):
  // - Retrait de `report_content` (chargé à la demande)
  // - Utilisation de `count: 'estimated'` au lieu de 'exact' (beaucoup plus rapide)
  // - Relations chargées en détail pour l'affichage
  let query = supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      due_date,
      is_planned,
      status,
      created_by,
      assigned_to,
      validated_by_manager,
      team_id,
      created_at,
      updated_at,
      created_user:profiles!tasks_created_by_fkey(id, full_name),
      assigned_user:profiles!tasks_assigned_to_fkey(id, full_name),
      ticket_task_link(
        ticket:tickets!ticket_task_link_ticket_id_fkey(
          id,
          title,
          ticket_type,
          status,
          jira_issue_key
        )
      ),
      activity_task_link(
        activity:activities!activity_task_link_activity_id_fkey(
          id,
          title,
          activity_type,
          status
        )
      )
    `, { count: 'estimated' });

  // Recherche textuelle par titre et description
  if (search && search.trim().length > 0) {
    const searchTerm = search.trim();
    const escapedSearch = searchTerm.replace(/%/g, '\\%').replace(/_/g, '\\_');
    const searchPattern = `%${escapedSearch}%`;
    query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`);
  }

  // Appliquer les quick filters
  query = applyTaskQuickFilter(query, quickFilter, { 
    currentProfileId: currentProfileId ?? undefined
  });

  return query;
}

/**
 * Applique le tri à une requête Supabase selon la colonne et la direction
 * 
 * @param query - Requête Supabase
 * @param column - Colonne de tri
 * @param direction - Direction du tri
 * @returns Requête avec tri appliqué
 */
function applyTaskSort(
  query: ReturnType<typeof buildTasksQuery>,
  column: TaskSortColumn,
  direction: SortDirection
) {
  const ascending = direction === 'asc';
  
  // Mapping des colonnes de tri vers les colonnes de la base de données
  switch (column) {
    case 'title':
      return query.order('title', { ascending });
    case 'status':
      return query.order('status', { ascending });
    case 'priority':
      // Note: priority n'existe pas encore dans le schéma, utiliser created_at en fallback
      // TODO: Ajouter priority au schéma tasks si nécessaire
      return query.order('created_at', { ascending });
    case 'due_date':
      return query.order('due_date', { ascending, nullsFirst: false });
    case 'created_at':
      return query.order('created_at', { ascending });
    case 'updated_at':
      return query.order('updated_at', { ascending });
    default:
      return query.order('created_at', { ascending: false });
  }
}

/**
 * Liste les tâches avec pagination, recherche et filtres rapides
 * 
 * @param offset - Décalage pour la pagination (défaut: 0)
 * @param limit - Nombre d'éléments par page (défaut: 25)
 * @param search - Terme de recherche (par titre et description)
 * @param quickFilter - Filtre rapide à appliquer
 * @param currentProfileId - ID du profil utilisateur actuel (pour filtres conditionnels)
 * @param sortColumn - Colonne de tri (défaut: 'created_at')
 * @param sortDirection - Direction du tri (défaut: 'desc')
 * @returns Résultat paginé avec tâches transformées
 * @throws ApplicationError si une erreur survient
 */
export const listTasksPaginated = async (
  offset: number = 0,
  limit: number = 25,
  search?: string,
  quickFilter?: TaskQuickFilter,
  currentProfileId?: string | null,
  sortColumn: TaskSortColumn = 'created_at',
  sortDirection: SortDirection = 'desc'
): Promise<TasksPaginatedResult> => {
  const supabase = await createSupabaseServerClient();
  
  // Construire et exécuter la requête
  let query = buildTasksQuery(supabase, search, quickFilter, currentProfileId);
  query = applyTaskSort(query, sortColumn, sortDirection);
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw handleSupabaseError(error, 'listTasksPaginated');
  }

  // Transformer les données brutes en TaskWithRelations
  const transformedTasks = (data || []).map(
    (task: SupabaseTaskRaw) => transformTask(task)
  );

  return {
    tasks: transformedTasks,
    hasMore: count ? offset + limit < count : false,
    total: count || 0
  };
};

