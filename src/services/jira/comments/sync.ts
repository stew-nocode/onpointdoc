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
 * Vérifie si un commentaire JIRA existe déjà dans Supabase
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket Supabase
 * @param jiraCommentId - ID du commentaire JIRA
 * @returns true si le commentaire existe déjà
 */
async function commentAlreadyExists(
  supabase: SupabaseClient,
  ticketId: string,
  jiraCommentId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('ticket_comments')
    .select('id')
    .eq('ticket_id', ticketId)
    .eq('jira_comment_id', jiraCommentId)
    .maybeSingle();

  return data !== null;
}

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
      comment_type: 'comment',
      jira_comment_id: jiraComment.id // ✅ Stocker l'ID JIRA pour éviter les doublons
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
 * Résultat de la synchronisation d'un commentaire
 */
export type SyncCommentResult = {
  action: 'created' | 'skipped';
  commentId?: string;
  reason?: string;
};

/**
 * Synchronise un commentaire JIRA vers Supabase avec ses pièces jointes
 * 
 * Vérifie d'abord si le commentaire existe déjà (via jira_comment_id)
 * pour éviter les doublons lors de webhooks multiples.
 * 
 * @param ticketId - UUID du ticket Supabase
 * @param jiraComment - Données du commentaire JIRA
 * @param jiraIssueKey - Clé du ticket JIRA (pour logging)
 * @param supabaseClient - Client Supabase (Service Role pour webhooks)
 * @returns Résultat de la synchronisation (created ou skipped)
 */
export async function syncJiraCommentToSupabase(
  ticketId: string,
  jiraComment: JiraComment,
  jiraIssueKey: string,
  supabaseClient?: SupabaseClient
): Promise<SyncCommentResult> {
  const supabase = supabaseClient || createSupabaseServiceRoleClient();

  // ✅ Vérifier si le commentaire existe déjà pour éviter les doublons
  const exists = await commentAlreadyExists(supabase, ticketId, jiraComment.id);
  if (exists) {
    return { 
      action: 'skipped', 
      reason: `Commentaire JIRA ${jiraComment.id} déjà synchronisé pour ticket ${ticketId}` 
    };
  }

  // Créer le commentaire avec jira_comment_id
  const commentId = await createCommentFromJira(supabase, ticketId, jiraComment);

  // Télécharger les pièces jointes si présentes
  if (jiraComment.attachments && jiraComment.attachments.length > 0) {
    try {
      await downloadJiraCommentAttachmentsToSupabase(
        jiraComment.id,
        commentId,
        jiraComment.attachments,
        supabase
      );
    } catch {
      // Ne pas faire échouer la synchronisation si le téléchargement échoue
      // Le commentaire a été créé avec succès
    }
  }

  return { action: 'created', commentId };
}

