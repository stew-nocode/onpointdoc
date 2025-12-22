/**
 * Types pour les commentaires de tâches
 */

/**
 * Commentaire de tâche avec données utilisateur
 */
export type TaskComment = {
  id: string;
  task_id: string;
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

