/**
 * Services Support
 * 
 * Regroupe les services liés au support client :
 * - Notifications email sur tickets
 * - Gestionnaire d'événements tickets
 * 
 * @module services/support
 */

// Notifications email
export {
  sendTicketNotification,
  sendTicketNotificationAsync,
  notifyTicketCreated,
  notifyTicketAssigned,
  notifyTicketResolved,
  notifyTicketFeedback,
  notifyTicketReminder,
  NOTIFICATION_CONFIGS,
  type TicketNotificationEvent,
  type SendNotificationParams,
  type NotificationResult
} from './ticket-notifications';

// Événements tickets
export {
  onTicketCreated,
  onTicketAssigned,
  onTicketResolved,
  onTicketStatusChanged,
  type TicketEventContext,
  type ClientInfo
} from './ticket-events';








