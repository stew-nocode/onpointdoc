/**
 * Utilitaires pour gérer les statuts de tickets
 * 
 * Gère la logique de détermination du type de statut (JIRA vs local)
 * selon le type de ticket et son état de transfert
 */

import type { TicketType } from '@/types/ticket';
import { JIRA_STATUSES, ASSISTANCE_LOCAL_STATUSES, ASSISTANCE_TRANSFER_STATUS } from '@/lib/constants/tickets';

/**
 * Détermine si un statut est un statut JIRA
 */
export function isJiraStatus(status: string): boolean {
  return JIRA_STATUSES.includes(status as any);
}

/**
 * Détermine si un statut est un statut local ASSISTANCE
 */
export function isAssistanceLocalStatus(status: string): boolean {
  return ASSISTANCE_LOCAL_STATUSES.includes(status as any) || status === ASSISTANCE_TRANSFER_STATUS;
}

/**
 * Détermine si un ticket doit utiliser les statuts JIRA
 * 
 * @param ticketType - Type de ticket (BUG, REQ, ASSISTANCE)
 * @param status - Statut actuel du ticket
 * @returns true si le ticket doit utiliser les statuts JIRA
 */
export function shouldUseJiraStatus(ticketType: TicketType, status: string): boolean {
  // BUG et REQ utilisent toujours les statuts JIRA
  if (ticketType === 'BUG' || ticketType === 'REQ') {
    return true;
  }
  
  // ASSISTANCE utilise les statuts JIRA seulement après transfert
  if (ticketType === 'ASSISTANCE') {
    return status === ASSISTANCE_TRANSFER_STATUS || isJiraStatus(status);
  }
  
  return false;
}

/**
 * Retourne le statut initial approprié selon le type de ticket
 * 
 * @param ticketType - Type de ticket
 * @returns Statut initial
 */
export function getInitialStatus(ticketType: TicketType): string {
  if (ticketType === 'BUG' || ticketType === 'REQ') {
    return 'Sprint Backlog'; // Statut JIRA initial
  }
  
  // ASSISTANCE commence avec un statut local
  return 'Nouveau';
}

/**
 * Formate un statut pour l'affichage dans l'UI
 * 
 * @param status - Statut brut
 * @returns Statut formaté pour l'affichage
 */
export function formatStatusForDisplay(status: string): string {
  // Remplacer les underscores par des espaces
  return status.replace(/_/g, ' ');
}

/**
 * Vérifie si un statut est valide pour un type de ticket donné
 * 
 * @param status - Statut à vérifier
 * @param ticketType - Type de ticket
 * @param isTransferred - Si le ticket ASSISTANCE est transféré
 * @returns true si le statut est valide
 */
export function isValidStatusForTicketType(
  status: string,
  ticketType: TicketType,
  isTransferred: boolean = false
): boolean {
  if (ticketType === 'BUG' || ticketType === 'REQ') {
    return isJiraStatus(status);
  }
  
  // ASSISTANCE
  if (isTransferred || isJiraStatus(status)) {
    return isJiraStatus(status);
  }
  
  return isAssistanceLocalStatus(status);
}

/**
 * Détermine la variante de badge à utiliser pour un statut donné
 * 
 * @param status - Statut du ticket
 * @returns Variante de badge ('success', 'danger', 'warning', 'info')
 */
export function getStatusBadgeVariant(status: string): 'success' | 'danger' | 'warning' | 'info' {
  // Statuts résolus (locaux et JIRA)
  if (status === 'Resolue' || status === 'Terminé(e)' || status === 'Terminé') {
    return 'success';
  }
  
  // Statut transféré
  if (status === 'Transfere') {
    return 'danger';
  }
  
  // Statuts en cours (locaux et JIRA)
  if (
    status === 'En_cours' ||
    status === 'Traitement en Cours' ||
    status === 'Test en Cours'
  ) {
    return 'warning';
  }
  
  // Statuts initiaux (par défaut info)
  return 'info';
}

