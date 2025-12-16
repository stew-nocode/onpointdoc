import { createSupabaseServerClient } from '@/lib/supabase/server';
import type {
  BulkUpdateStatusInput,
  BulkReassignInput,
  BulkUpdatePriorityInput
} from '@/lib/validators/bulk-actions';

/**
 * Vérifie si un utilisateur peut modifier un ticket
 * 
 * Les agents peuvent modifier uniquement :
 * - Les tickets qu'ils ont créés (created_by)
 * - Les tickets qui leur sont assignés (assigned_to)
 * 
 * Les managers/admin peuvent modifier tous les tickets
 * 
 * @param supabase - Client Supabase
 * @param ticketId - ID du ticket
 * @param userId - ID de l'utilisateur authentifié (auth.uid())
 * @returns true si l'utilisateur peut modifier le ticket
 */
async function canUserModifyTicket(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  ticketId: string,
  userId: string
): Promise<boolean> {
  // Récupérer le profil de l'utilisateur pour vérifier le rôle
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_uid', userId)
    .single();

  if (!profile) {
    return false;
  }

  // Managers et admin peuvent modifier tous les tickets
  const role = profile.role as string;
  if (role === 'admin' || role?.includes('manager')) {
    return true;
  }

  // Pour les agents, vérifier ownership
  const { data: ticket } = await supabase
    .from('tickets')
    .select('created_by, assigned_to')
    .eq('id', ticketId)
    .single();

  if (!ticket) {
    return false;
  }

  // Agent peut modifier si créateur OU assigné
  return ticket.created_by === profile.id || ticket.assigned_to === profile.id;
}

/**
 * Résultat d'une action en masse
 */
export type BulkActionResult = {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors?: string[];
};

/**
 * Met à jour le statut de plusieurs tickets en masse
 * Vérifie que tous les tickets sont de type ASSISTANCE et non transférés
 * 
 * @param payload - IDs des tickets et nouveau statut
 * @returns Résultat de l'opération
 */
export const bulkUpdateStatus = async (
  payload: BulkUpdateStatusInput
): Promise<BulkActionResult> => {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Récupérer le profil de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_uid', user.id)
    .single();

  if (!profile) {
    throw new Error('Profil utilisateur introuvable');
  }

  // Vérifier que tous les tickets sont de type ASSISTANCE et non transférés
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('id, ticket_type, status, created_by, assigned_to')
    .in('id', payload.ticketIds);

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération des tickets: ${fetchError.message}`);
  }

  if (!tickets || tickets.length === 0) {
    throw new Error('Aucun ticket trouvé');
  }

  // Vérifier les permissions pour chaque ticket
  const role = profile.role as string;
  const isManagerOrAdmin = role === 'admin' || role?.includes('manager');
  
  // Filtrer les tickets valides :
  // 1. ASSISTANCE non transférés
  // 2. Permissions (agents : créés OU assignés, managers/admin : tous)
  const validTickets = tickets.filter((ticket) => {
    // Vérifier type et statut
    if (ticket.ticket_type !== 'ASSISTANCE' || ticket.status === 'Transfere') {
      return false;
    }
    
    // Vérifier permissions
    if (isManagerOrAdmin) {
      return true; // Managers/admin peuvent modifier tous les tickets
    }
    
    // Agents : créés OU assignés
    return ticket.created_by === profile.id || ticket.assigned_to === profile.id;
  });

  if (validTickets.length === 0) {
    const permissionErrors = tickets.filter(
      (t) => t.ticket_type === 'ASSISTANCE' && t.status !== 'Transfere'
    );
    
    if (permissionErrors.length > 0) {
      throw new Error(
        `Vous n'avez pas les permissions pour modifier ${permissionErrors.length} ticket(s) parmi la sélection. Vous ne pouvez modifier que les tickets que vous avez créés ou qui vous sont assignés.`
      );
    }
    throw new Error('Aucun ticket ASSISTANCE non transféré trouvé parmi la sélection');
  }

  const validTicketIds = validTickets.map((t) => t.id);

  // Mettre à jour le statut
  const { data: updatedTickets, error: updateError } = await supabase
    .from('tickets')
    .update({
      status: payload.status,
      last_update_source: 'supabase'
    })
    .in('id', validTicketIds)
    .select('id, status');

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
  }

  // Enregistrer l'historique des changements de statut
  if (updatedTickets && updatedTickets.length > 0) {
    const historyEntries = validTickets
      .map((ticket) => ({
        ticket_id: ticket.id,
        status_from: ticket.status,
        status_to: payload.status,
        source: 'supabase'
      }))
      .filter((entry) => entry.status_from !== entry.status_to);

    if (historyEntries.length > 0) {
      await supabase.from('ticket_status_history').insert(historyEntries);
    }
  }

  const updatedCount = updatedTickets?.length || 0;
  const failedCount = payload.ticketIds.length - updatedCount;

  return {
    success: true,
    updatedCount,
    failedCount,
    errors: failedCount > 0 ? [`${failedCount} ticket(s) n'ont pas pu être mis à jour`] : undefined
  };
};

/**
 * Réassigne plusieurs tickets en masse
 * 
 * @param payload - IDs des tickets et nouvel assigné (peut être null)
 * @returns Résultat de l'opération
 */
export const bulkReassign = async (payload: BulkReassignInput): Promise<BulkActionResult> => {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Récupérer le profil de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_uid', user.id)
    .single();

  if (!profile) {
    throw new Error('Profil utilisateur introuvable');
  }

  // Vérifier que l'utilisateur assigné existe (si fourni)
  if (payload.assignedTo !== null) {
    const { data: assignedProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', payload.assignedTo)
      .single();

    if (profileError || !assignedProfile) {
      throw new Error(`Utilisateur introuvable: ${profileError?.message ?? 'Utilisateur introuvable'}`);
    }
  }

  // Récupérer les tickets pour vérifier les permissions
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('id, created_by, assigned_to')
    .in('id', payload.ticketIds);

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération des tickets: ${fetchError.message}`);
  }

  if (!tickets || tickets.length === 0) {
    throw new Error('Aucun ticket trouvé');
  }

  // Vérifier les permissions pour chaque ticket
  const role = profile.role as string;
  const isManagerOrAdmin = role === 'admin' || role?.includes('manager');
  
  // Filtrer les tickets autorisés
  const authorizedTickets = tickets.filter((ticket) => {
    if (isManagerOrAdmin) {
      return true; // Managers/admin peuvent réassigner tous les tickets
    }
    // Agents : créés OU assignés
    return ticket.created_by === profile.id || ticket.assigned_to === profile.id;
  });

  if (authorizedTickets.length === 0) {
    throw new Error(
      'Vous n\'avez pas les permissions pour réassigner ces tickets. Vous ne pouvez réassigner que les tickets que vous avez créés ou qui vous sont assignés.'
    );
  }

  const authorizedTicketIds = authorizedTickets.map((t) => t.id);

  // Mettre à jour l'assignation uniquement pour les tickets autorisés
  const { data: updatedTickets, error: updateError } = await supabase
    .from('tickets')
    .update({
      assigned_to: payload.assignedTo,
      last_update_source: 'supabase'
    })
    .in('id', authorizedTicketIds)
    .select('id');

  if (updateError) {
    throw new Error(`Erreur lors de la réassignation: ${updateError.message}`);
  }

  const updatedCount = updatedTickets?.length || 0;
  const failedCount = payload.ticketIds.length - updatedCount;
  const unauthorizedCount = payload.ticketIds.length - authorizedTickets.length;

  const errors: string[] = [];
  if (unauthorizedCount > 0) {
    errors.push(`${unauthorizedCount} ticket(s) non autorisé(s) pour la réassignation`);
  }
  if (failedCount > unauthorizedCount) {
    errors.push(`${failedCount - unauthorizedCount} ticket(s) n'ont pas pu être réassignés`);
  }

  return {
    success: true,
    updatedCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Met à jour la priorité de plusieurs tickets en masse
 * 
 * @param payload - IDs des tickets et nouvelle priorité
 * @returns Résultat de l'opération
 */
export const bulkUpdatePriority = async (
  payload: BulkUpdatePriorityInput
): Promise<BulkActionResult> => {
  const supabase = await createSupabaseServerClient();

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Récupérer le profil de l'utilisateur
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_uid', user.id)
    .single();

  if (!profile) {
    throw new Error('Profil utilisateur introuvable');
  }

  // Récupérer les tickets pour vérifier les permissions
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('id, created_by, assigned_to')
    .in('id', payload.ticketIds);

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération des tickets: ${fetchError.message}`);
  }

  if (!tickets || tickets.length === 0) {
    throw new Error('Aucun ticket trouvé');
  }

  // Vérifier les permissions pour chaque ticket
  const role = profile.role as string;
  const isManagerOrAdmin = role === 'admin' || role?.includes('manager');
  
  // Filtrer les tickets autorisés
  const authorizedTickets = tickets.filter((ticket) => {
    if (isManagerOrAdmin) {
      return true; // Managers/admin peuvent modifier tous les tickets
    }
    // Agents : créés OU assignés
    return ticket.created_by === profile.id || ticket.assigned_to === profile.id;
  });

  if (authorizedTickets.length === 0) {
    throw new Error(
      'Vous n\'avez pas les permissions pour modifier la priorité de ces tickets. Vous ne pouvez modifier que les tickets que vous avez créés ou qui vous sont assignés.'
    );
  }

  const authorizedTicketIds = authorizedTickets.map((t) => t.id);

  // Mettre à jour la priorité uniquement pour les tickets autorisés
  const { data: updatedTickets, error: updateError } = await supabase
    .from('tickets')
    .update({
      priority: payload.priority,
      last_update_source: 'supabase'
    })
    .in('id', authorizedTicketIds)
    .select('id');

  if (updateError) {
    throw new Error(`Erreur lors de la mise à jour de la priorité: ${updateError.message}`);
  }

  const updatedCount = updatedTickets?.length || 0;
  const failedCount = payload.ticketIds.length - updatedCount;
  const unauthorizedCount = payload.ticketIds.length - authorizedTickets.length;

  const errors: string[] = [];
  if (unauthorizedCount > 0) {
    errors.push(`${unauthorizedCount} ticket(s) non autorisé(s) pour la modification`);
  }
  if (failedCount > unauthorizedCount) {
    errors.push(`${failedCount - unauthorizedCount} ticket(s) n'ont pas pu être mis à jour`);
  }

  return {
    success: true,
    updatedCount,
    failedCount,
    errors: errors.length > 0 ? errors : undefined
  };
};

