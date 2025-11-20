/**
 * Constantes pour les tickets
 */

/**
 * Statuts locaux utilisés pour ASSISTANCE (avant transfert)
 */
export const ASSISTANCE_LOCAL_STATUSES = ['Nouveau', 'En_cours', 'Resolue'] as const;

/**
 * Statut de transition pour ASSISTANCE
 */
export const ASSISTANCE_TRANSFER_STATUS = 'Transfere' as const;

/**
 * Statuts JIRA utilisés par les développeurs pour BUG et REQ
 */
export const JIRA_STATUSES = [
  'Sprint Backlog',
  'Traitement en Cours',
  'Test en Cours',
  'Terminé(e)',
  'Terminé'
] as const;

/**
 * Tous les statuts possibles (pour compatibilité et filtres)
 * @deprecated Utiliser getTicketStatuses() pour obtenir les statuts selon le type de ticket
 */
export const TICKET_STATUSES = [
  ...ASSISTANCE_LOCAL_STATUSES,
  ASSISTANCE_TRANSFER_STATUS,
  ...JIRA_STATUSES
] as const;

export const TICKET_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const BUG_TYPES = [
  'Autres',
  'Mauvais déversement des données',
  'Dysfonctionnement sur le Calcul des salaires',
  'Duplication anormale',
  'Enregistrement impossible',
  "Page d'erreur",
  'Historique vide/non exhaustif',
  'Non affichage de pages/données',
  'Lenteur Système',
  'Import de fichiers impossible',
  'Suppression impossible',
  'Récupération de données impossible',
  'Edition impossible',
  'Dysfonctionnement des filtres',
  'Error 503',
  'Impression impossible',
  'Erreur de calcul/Erreur sur Dashboard',
  'Dysfonctionnement Workflow',
  'Erreur serveur',
  "Dysfonctionnement des liens d'accès",
  'Formulaire indisponible',
  'Erreur Ajax',
  'Export de données impossible',
  'Connexion impossible'
] as const;

/**
 * Type pour les statuts de tickets
 * Note: string pour accepter les statuts JIRA dynamiques
 */
export type TicketStatus = string;

/**
 * Type pour les statuts locaux ASSISTANCE
 */
export type AssistanceLocalStatus = (typeof ASSISTANCE_LOCAL_STATUSES)[number];

/**
 * Type pour les statuts JIRA
 */
export type JiraStatus = (typeof JIRA_STATUSES)[number];

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type BugType = (typeof BUG_TYPES)[number];

/**
 * Retourne les statuts disponibles selon le type de ticket
 * 
 * Note: Les fonctions isJiraStatus() et isAssistanceLocalStatus() sont dans @/lib/utils/ticket-status
 */
export function getTicketStatuses(ticketType: 'BUG' | 'REQ' | 'ASSISTANCE', isTransferred: boolean = false): readonly string[] {
  if (ticketType === 'ASSISTANCE' && !isTransferred) {
    return [...ASSISTANCE_LOCAL_STATUSES, ASSISTANCE_TRANSFER_STATUS];
  }
  // BUG, REQ, ou ASSISTANCE transféré → statuts JIRA
  return JIRA_STATUSES;
}
