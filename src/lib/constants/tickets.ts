/**
 * Constantes pour les tickets
 */

export const TICKET_STATUSES = ['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as const;
export const TICKET_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
