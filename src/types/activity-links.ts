/**
 * Types pour les entités liables aux activités
 * 
 * Définit les types d'entités pouvant être liées à une activité
 * et leurs structures de données pour la recherche
 */

/**
 * Types d'entités pouvant être liées à une activité
 */
export type LinkableEntityType = 'task' | 'bug' | 'assistance' | 'request' | 'followup' | 'activity';

/**
 * Entité liable avec informations pour l'affichage
 */
export type LinkableEntity = {
  id: string;
  entityType: LinkableEntityType;
  displayKey: string; // Clé d'affichage : "BUG-123", "TASK-456", etc.
  title: string;
  metadata?: {
    status?: string;
    priority?: string;
    ticketType?: string;
    createdAt?: string;
  };
};

/**
 * Résultat de recherche d'entités liables
 */
export type LinkableEntitySearchResult = {
  entities: LinkableEntity[];
  total?: number;
};
