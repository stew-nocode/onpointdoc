/**
 * Constantes et types pour les tickets
 * Ce fichier peut être importé côté client et serveur
 */

export type TicketTypeFilter = 'BUG' | 'REQ' | 'ASSISTANCE';
export type TicketStatusFilter = 'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue';

export const TICKET_STATUSES = ['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as const;
export const TICKET_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const TICKET_TYPES = ['BUG', 'REQ', 'ASSISTANCE'] as const;

