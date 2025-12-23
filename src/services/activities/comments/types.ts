/**
 * Types pour les commentaires d'activités
 */

/**
 * Commentaire d'activité avec données utilisateur
 */
export type ActivityComment = {
  id: string;
  activity_id: string;
  user_id: string | null;
  content: string;
  comment_type: 'comment' | 'followup' | null;
  origin: 'app' | 'jira_comment' | null;
  jira_comment_id: string | null;
  created_at: string;
  user: {
    id: string | null;
    full_name: string | null;
    email: string | null;
  } | null;
};

