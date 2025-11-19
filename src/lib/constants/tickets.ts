/**
 * Constantes pour les tickets
 */

export const TICKET_STATUSES = ['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as const;
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

export type TicketStatus = (typeof TICKET_STATUSES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type BugType = (typeof BUG_TYPES)[number];
