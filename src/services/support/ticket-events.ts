/**
 * Gestionnaire d'événements tickets
 * 
 * Ce module écoute les changements de tickets et déclenche
 * les notifications appropriées de manière non-bloquante.
 * 
 * Pattern: Event-driven / Observer
 * Performance: Async fire-and-forget pour ne pas bloquer l'UI
 * 
 * @module services/support/ticket-events
 */

import type { Ticket } from '@/types/ticket';
import {
  sendTicketNotificationAsync,
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyTicketResolved,
  notifyTicketFeedback
} from './ticket-notifications';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Contexte d'un événement ticket
 */
interface TicketEventContext {
  /** Le ticket concerné */
  ticket: Ticket;
  /** L'utilisateur qui a déclenché l'action (optionnel) */
  triggeredByUserId?: string;
  /** Données additionnelles selon l'événement */
  metadata?: Record<string, unknown>;
}

/**
 * Informations client pour les notifications
 */
interface ClientInfo {
  email: string;
  name?: string;
}

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Déclenché quand un ticket est créé
 * 
 * Actions :
 * 1. Envoie un email de confirmation au client (si email disponible)
 * 
 * @param context - Contexte de l'événement
 */
export async function onTicketCreated(context: TicketEventContext): Promise<void> {
  const { ticket } = context;
  
  console.log(`[TICKET EVENT] Ticket créé: ${ticket.id}`);
  
  // Récupérer l'email du client (contact_user_id ou created_by)
  const clientInfo = await getClientInfo(ticket);
  
  if (!clientInfo) {
    console.log(`[TICKET EVENT] Pas d'email client pour ticket ${ticket.id}, skip notification`);
    return;
  }
  
  // Envoyer la notification de manière asynchrone (non-bloquante)
  sendTicketNotificationAsync({
    ticket,
    event: 'ticket_created',
    recipientEmail: clientInfo.email,
    recipientName: clientInfo.name
  });
}

/**
 * Déclenché quand un ticket est assigné à un agent
 * 
 * Actions :
 * 1. Envoie un email au client pour l'informer qu'un agent travaille dessus
 * 
 * @param context - Contexte de l'événement
 */
export async function onTicketAssigned(context: TicketEventContext): Promise<void> {
  const { ticket, metadata } = context;
  
  console.log(`[TICKET EVENT] Ticket assigné: ${ticket.id} → ${ticket.assigned_to}`);
  
  // Récupérer l'email du client
  const clientInfo = await getClientInfo(ticket);
  
  if (!clientInfo) {
    console.log(`[TICKET EVENT] Pas d'email client pour ticket ${ticket.id}, skip notification`);
    return;
  }
  
  // Récupérer le nom de l'agent assigné
  const agentName = metadata?.agentName as string | undefined;
  
  // Envoyer la notification
  sendTicketNotificationAsync({
    ticket,
    event: 'ticket_assigned',
    recipientEmail: clientInfo.email,
    recipientName: clientInfo.name,
    additionalParams: agentName ? { agent_name: agentName } : undefined
  });
}

/**
 * Déclenché quand un ticket est résolu
 * 
 * Actions :
 * 1. Envoie un email de confirmation de résolution au client
 * 2. Programme une enquête de satisfaction (24h plus tard)
 * 
 * @param context - Contexte de l'événement
 */
export async function onTicketResolved(context: TicketEventContext): Promise<void> {
  const { ticket } = context;
  
  console.log(`[TICKET EVENT] Ticket résolu: ${ticket.id}`);
  
  // Récupérer l'email du client
  const clientInfo = await getClientInfo(ticket);
  
  if (!clientInfo) {
    console.log(`[TICKET EVENT] Pas d'email client pour ticket ${ticket.id}, skip notification`);
    return;
  }
  
  // 1. Notification de résolution (immédiate)
  sendTicketNotificationAsync({
    ticket,
    event: 'ticket_resolved',
    recipientEmail: clientInfo.email,
    recipientName: clientInfo.name,
    additionalParams: ticket.resolution ? { resolution_summary: ticket.resolution } : undefined
  });
  
  // 2. Enquête de satisfaction (programmée 24h plus tard)
  // Note: Pour l'instant on envoie immédiatement, 
  // mais avec Brevo on peut programmer l'envoi
  setTimeout(() => {
    sendTicketNotificationAsync({
      ticket,
      event: 'ticket_feedback',
      recipientEmail: clientInfo.email,
      recipientName: clientInfo.name,
      additionalParams: {
        feedback_url: `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${ticket.id}`
      }
    });
  }, 24 * 60 * 60 * 1000); // 24 heures (en production, utiliser un job scheduler)
}

/**
 * Déclenché quand le statut d'un ticket change
 * 
 * Analyse le changement et déclenche les notifications appropriées
 * 
 * @param ticket - Le ticket mis à jour
 * @param previousStatus - L'ancien statut
 * @param newStatus - Le nouveau statut
 * @param triggeredByUserId - L'utilisateur qui a fait le changement
 */
export async function onTicketStatusChanged(
  ticket: Ticket,
  previousStatus: string,
  newStatus: string,
  triggeredByUserId?: string
): Promise<void> {
  console.log(`[TICKET EVENT] Statut changé: ${ticket.id} | ${previousStatus} → ${newStatus}`);
  
  const context: TicketEventContext = {
    ticket,
    triggeredByUserId,
    metadata: { previousStatus, newStatus }
  };
  
  // Détecter les transitions importantes
  if (isAssignmentTransition(previousStatus, newStatus)) {
    await onTicketAssigned(context);
  }
  
  if (isResolutionTransition(previousStatus, newStatus)) {
    await onTicketResolved(context);
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère les informations du client associé au ticket
 */
async function getClientInfo(ticket: Ticket): Promise<ClientInfo | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Priorité : contact_user_id > created_by
    const userId = ticket.contact_user_id || ticket.created_by;
    
    if (!userId) {
      return null;
    }
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    if (error || !profile?.email) {
      console.log(`[TICKET EVENT] Profil non trouvé pour user ${userId}`);
      return null;
    }
    
    return {
      email: profile.email,
      name: profile.full_name || undefined
    };
  } catch (error) {
    console.error('[TICKET EVENT] Erreur récupération client:', error);
    return null;
  }
}

/**
 * Détecte si la transition représente une assignation
 */
function isAssignmentTransition(previousStatus: string, newStatus: string): boolean {
  // Transition vers "En cours" ou "En_cours" = assignation
  const assignmentStatuses = ['En_cours', 'En cours', 'In_Progress', 'Traitement en Cours'];
  const initialStatuses = ['Nouveau', 'To_Do', 'Sprint Backlog'];
  
  return initialStatuses.includes(previousStatus) && assignmentStatuses.includes(newStatus);
}

/**
 * Détecte si la transition représente une résolution
 */
function isResolutionTransition(previousStatus: string, newStatus: string): boolean {
  // Transition vers "Résolu" ou "Terminé" = résolution
  const resolutionStatuses = ['Resolue', 'Résolu', 'Terminé', 'Terminé(e)', 'Done', 'Closed'];
  
  return !resolutionStatuses.includes(previousStatus) && resolutionStatuses.includes(newStatus);
}

/**
 * Récupère le nom de l'agent assigné
 */
async function getAgentName(assignedToId: string): Promise<string | undefined> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', assignedToId)
      .single();
    
    return profile?.full_name || undefined;
  } catch {
    return undefined;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type TicketEventContext,
  type ClientInfo
};


