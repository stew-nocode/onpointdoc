import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { downloadJiraCommentAttachmentsToSupabase } from './attachments';

/**
 * Type pour un commentaire JIRA
 */
type JiraComment = {
  id: string;
  body: string;
  author?: {
    accountId: string;
    displayName?: string;
  };
  created: string;
  updated?: string;
  attachments?: Array<{
    id: string;
    filename: string;
    content: string;
    mimeType?: string;
    size: number;
  }>;
};

/**
 * Crée un commentaire dans Supabase depuis un commentaire JIRA
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket Supabase
 * @param jiraComment - Données du commentaire JIRA
 * @returns UUID du commentaire créé dans Supabase
 * @throws ApplicationError si la création échoue
 */
async function createCommentFromJira(
  supabase: SupabaseClient,
  ticketId: string,
  jiraComment: JiraComment
): Promise<string> {
  const { data: comment, error } = await supabase
    .from('ticket_comments')
    .insert({
      ticket_id: ticketId,
      content: jiraComment.body,
      origin: 'jira',
      user_id: null,
      comment_type: 'comment' // ✅ Les commentaires JIRA sont toujours des commentaires
    })
    .select('id')
    .single();

  if (error || !comment) {
    throw createError.supabaseError(
      'Erreur lors de la création du commentaire depuis JIRA',
      error ? new Error(error.message) : undefined
    );
  }

  return comment.id;
}

/**
 * Synchronise un commentaire JIRA vers Supabase avec ses pièces jointes
 * 
 * @param ticketId - UUID du ticket Supabase
 * @param jiraComment - Données du commentaire JIRA
 * @param jiraIssueKey - Clé du ticket JIRA
 * @param supabaseClient - Client Supabase (Service Role pour webhooks)
 * @throws ApplicationError si la synchronisation échoue
 */
export async function syncJiraCommentToSupabase(
  ticketId: string,
  jiraComment: JiraComment,
  jiraIssueKey: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || createSupabaseServiceRoleClient();
  const commentId = await createCommentFromJira(supabase, ticketId, jiraComment);

  if (jiraComment.attachments && jiraComment.attachments.length > 0) {
    try {
      await downloadJiraCommentAttachmentsToSupabase(
        jiraComment.id,
        commentId,
        jiraComment.attachments,
        supabase
      );
    } catch (attachmentError) {
      // Ne pas faire échouer la synchronisation si le téléchargement des pièces jointes échoue
      // Le commentaire a été créé avec succès
    }
  }
}

