/**
 * Service de notifications email pour les tickets
 * 
 * Envoie des emails transactionnels via Brevo lors des événements ticket.
 * Pattern async/non-bloquant pour ne pas impacter les performances.
 * 
 * @module services/support/ticket-notifications
 */

import { getBrevoClient } from '@/services/brevo/client';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Ticket } from '@/types/ticket';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Événements ticket déclenchant des notifications
 */
export type TicketNotificationEvent = 
  | 'ticket_created'      // Ticket créé
  | 'ticket_assigned'     // Ticket assigné à un agent
  | 'ticket_resolved'     // Ticket résolu
  | 'ticket_feedback'     // Demande d'enquête satisfaction
  | 'ticket_reminder';    // Rappel (ticket sans réponse)

/**
 * Configuration d'une notification
 */
interface NotificationConfig {
  /** ID du template Brevo (à configurer dans Brevo) */
  templateId: number;
  /** Sujet de l'email (fallback si pas de template) */
  subject: string;
  /** Délai avant envoi (en heures, 0 = immédiat) */
  delayHours: number;
}

/**
 * Paramètres pour l'envoi de notification
 */
interface SendNotificationParams {
  ticket: Ticket;
  event: TicketNotificationEvent;
  recipientEmail: string;
  recipientName?: string;
  additionalParams?: Record<string, string>;
}

/**
 * Résultat de l'envoi de notification
 */
interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// CONFIGURATION DES TEMPLATES
// ============================================================================

/**
 * Configuration des templates Brevo par événement
 * 
 * Note: Les IDs de templates doivent être configurés dans Brevo.
 * Pour l'instant, on utilise des IDs placeholder.
 * 
 * À configurer dans Brevo :
 * 1. Créer les templates avec les variables {{params.xxx}}
 * 2. Récupérer les IDs et les mettre ici
 * 3. Ou utiliser les variables d'environnement
 */
const NOTIFICATION_CONFIGS: Record<TicketNotificationEvent, NotificationConfig> = {
  ticket_created: {
    templateId: parseInt(process.env.BREVO_TEMPLATE_TICKET_CREATED || '0', 10),
    subject: 'Votre demande a été reçue - Ticket #{{ticket_id}}',
    delayHours: 0
  },
  ticket_assigned: {
    templateId: parseInt(process.env.BREVO_TEMPLATE_TICKET_ASSIGNED || '0', 10),
    subject: 'Un agent travaille sur votre demande - Ticket #{{ticket_id}}',
    delayHours: 0
  },
  ticket_resolved: {
    templateId: parseInt(process.env.BREVO_TEMPLATE_TICKET_RESOLVED || '0', 10),
    subject: 'Votre demande a été résolue - Ticket #{{ticket_id}}',
    delayHours: 0
  },
  ticket_feedback: {
    templateId: parseInt(process.env.BREVO_TEMPLATE_TICKET_FEEDBACK || '0', 10),
    subject: 'Votre avis nous intéresse - Ticket #{{ticket_id}}',
    delayHours: 24 // Envoi 24h après résolution
  },
  ticket_reminder: {
    templateId: parseInt(process.env.BREVO_TEMPLATE_TICKET_REMINDER || '0', 10),
    subject: 'Avez-vous besoin d\'aide supplémentaire ? - Ticket #{{ticket_id}}',
    delayHours: 48 // Envoi 48h après dernier message
  }
};

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Envoie une notification email pour un événement ticket
 * 
 * Cette fonction est conçue pour être non-bloquante :
 * - Elle n'attend pas la confirmation d'envoi
 * - Les erreurs sont loggées mais ne bloquent pas l'appelant
 * - Le log est stocké en base pour audit
 * 
 * @param params - Paramètres de la notification
 * @returns Résultat de l'envoi (ou erreur)
 */
export async function sendTicketNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  const { ticket, event, recipientEmail, recipientName, additionalParams } = params;
  
  // Vérifier si les notifications sont activées
  if (process.env.TICKET_NOTIFICATIONS_ENABLED !== 'true') {
    console.log(`[NOTIFICATION] Notifications désactivées, skip ${event} pour ticket ${ticket.id}`);
    return { success: true, messageId: 'notifications_disabled' };
  }

  const config = NOTIFICATION_CONFIGS[event];
  
  // Si pas de template configuré, utiliser l'envoi HTML de base
  if (!config.templateId || config.templateId === 0) {
    console.log(`[NOTIFICATION] Template non configuré pour ${event}, skip`);
    return { success: false, error: 'Template non configuré' };
  }

  try {
    const brevoClient = getBrevoClient();
    
    // Préparer les paramètres du template
    const templateParams = buildTemplateParams(ticket, event, additionalParams);
    
    // Envoyer l'email
    const result = await brevoClient.sendTransactionalEmail({
      to: [{ email: recipientEmail, name: recipientName }],
      templateId: config.templateId,
      params: templateParams,
      sender: {
        name: process.env.BREVO_DEFAULT_SENDER_NAME || 'Support OnpointDoc',
        email: process.env.BREVO_DEFAULT_SENDER_EMAIL || 'support@onpointafrica.com'
      },
      subject: config.subject.replace('{{ticket_id}}', getTicketDisplayId(ticket))
    });

    // Logger le succès
    await logNotification(ticket.id, event, recipientEmail, true, result.messageId);
    
    console.log(`[NOTIFICATION] Email ${event} envoyé pour ticket ${ticket.id} → ${recipientEmail}`);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    // Logger l'erreur (non-bloquant)
    await logNotification(ticket.id, event, recipientEmail, false, undefined, errorMessage);
    
    console.error(`[NOTIFICATION ERROR] Échec envoi ${event} pour ticket ${ticket.id}:`, errorMessage);
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Envoie une notification de manière asynchrone (fire-and-forget)
 * 
 * Utiliser cette fonction quand on ne veut pas bloquer l'appelant.
 * L'envoi se fait en arrière-plan.
 * 
 * @param params - Paramètres de la notification
 */
export function sendTicketNotificationAsync(params: SendNotificationParams): void {
  // Fire-and-forget : on n'attend pas le résultat
  sendTicketNotification(params).catch(error => {
    console.error('[NOTIFICATION ERROR] Erreur async:', error);
  });
}

// ============================================================================
// FONCTIONS HELPER PAR ÉVÉNEMENT
// ============================================================================

/**
 * Notification : Ticket créé
 */
export async function notifyTicketCreated(
  ticket: Ticket,
  clientEmail: string,
  clientName?: string
): Promise<NotificationResult> {
  return sendTicketNotification({
    ticket,
    event: 'ticket_created',
    recipientEmail: clientEmail,
    recipientName: clientName
  });
}

/**
 * Notification : Ticket assigné
 */
export async function notifyTicketAssigned(
  ticket: Ticket,
  clientEmail: string,
  clientName?: string,
  agentName?: string
): Promise<NotificationResult> {
  return sendTicketNotification({
    ticket,
    event: 'ticket_assigned',
    recipientEmail: clientEmail,
    recipientName: clientName,
    additionalParams: agentName ? { agent_name: agentName } : undefined
  });
}

/**
 * Notification : Ticket résolu
 */
export async function notifyTicketResolved(
  ticket: Ticket,
  clientEmail: string,
  clientName?: string,
  resolution?: string
): Promise<NotificationResult> {
  return sendTicketNotification({
    ticket,
    event: 'ticket_resolved',
    recipientEmail: clientEmail,
    recipientName: clientName,
    additionalParams: resolution ? { resolution_summary: resolution } : undefined
  });
}

/**
 * Notification : Demande de feedback (enquête satisfaction)
 */
export async function notifyTicketFeedback(
  ticket: Ticket,
  clientEmail: string,
  clientName?: string,
  feedbackUrl?: string
): Promise<NotificationResult> {
  return sendTicketNotification({
    ticket,
    event: 'ticket_feedback',
    recipientEmail: clientEmail,
    recipientName: clientName,
    additionalParams: feedbackUrl ? { feedback_url: feedbackUrl } : undefined
  });
}

/**
 * Notification : Rappel (ticket sans réponse)
 */
export async function notifyTicketReminder(
  ticket: Ticket,
  clientEmail: string,
  clientName?: string
): Promise<NotificationResult> {
  return sendTicketNotification({
    ticket,
    event: 'ticket_reminder',
    recipientEmail: clientEmail,
    recipientName: clientName
  });
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Construit les paramètres pour le template Brevo
 */
function buildTemplateParams(
  ticket: Ticket,
  event: TicketNotificationEvent,
  additionalParams?: Record<string, string>
): Record<string, string> {
  const baseParams: Record<string, string> = {
    ticket_id: getTicketDisplayId(ticket),
    ticket_title: ticket.title,
    ticket_type: ticket.ticket_type,
    ticket_status: ticket.status,
    ticket_priority: ticket.priority,
    ticket_created_at: formatDate(ticket.created_at),
    portal_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.onpointdoc.com'}/tickets/${ticket.id}`,
    support_email: process.env.SUPPORT_EMAIL || 'support@onpointafrica.com',
    company_name: 'Onpoint Digital'
  };

  // Ajouter la description si présente
  if (ticket.description) {
    baseParams.ticket_description = truncate(ticket.description, 200);
  }

  // Ajouter la résolution si le ticket est résolu
  if (ticket.resolution) {
    baseParams.resolution_summary = ticket.resolution;
  }

  // Ajouter les paramètres additionnels
  if (additionalParams) {
    Object.assign(baseParams, additionalParams);
  }

  return baseParams;
}

/**
 * Récupère l'ID d'affichage du ticket (JIRA key ou ID interne)
 */
function getTicketDisplayId(ticket: Ticket): string {
  return ticket.jira_issue_key || ticket.id.substring(0, 8).toUpperCase();
}

/**
 * Formate une date pour l'affichage
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Tronque une chaîne à une longueur maximale
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Log une notification dans la base de données (pour audit et débogage)
 */
async function logNotification(
  ticketId: string,
  event: TicketNotificationEvent,
  recipientEmail: string,
  success: boolean,
  messageId?: string,
  error?: string
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    
    await supabase.from('ticket_email_logs').insert({
      ticket_id: ticketId,
      event_type: event,
      recipient_email: recipientEmail,
      success,
      brevo_message_id: messageId,
      error_message: error,
      sent_at: new Date().toISOString()
    });
  } catch (logError) {
    // Ne pas bloquer si le log échoue
    console.error('[NOTIFICATION LOG ERROR]', logError);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  NOTIFICATION_CONFIGS,
  type SendNotificationParams,
  type NotificationResult
};








