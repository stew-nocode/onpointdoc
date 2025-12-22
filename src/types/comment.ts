/**
 * Types génériques pour les commentaires (tâches, activités)
 * 
 * Pattern identique à ticket_comments pour la cohérence
 */

/**
 * Données brutes d'un commentaire (venant de Supabase)
 */
export type CommentRaw = {
  id: string;
  user_id: string | null;
  content: string;
  comment_type: 'comment' | 'followup' | null;
  origin: 'app' | 'jira_comment' | null;
  jira_comment_id: string | null;
  created_at: string;
};

/**
 * Commentaire avec les données utilisateur enrichies
 */
export type Comment = CommentRaw & {
  user: {
    id: string | null;
    full_name: string | null;
    email: string | null;
  } | null;
};

/**
 * Type de l'objet parent du commentaire
 */
export type CommentObjectType = 'task' | 'activity';

/**
 * Input pour créer un commentaire
 */
export type CreateCommentInput = {
  content: string;
  comment_type?: 'comment' | 'followup';
};

