import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import type { CommentAttachment } from '@/services/tickets/comments';

/**
 * Charge les pièces jointes d'un commentaire
 * 
 * @param commentId - UUID du commentaire
 * @returns Liste des pièces jointes
 */
export async function loadCommentAttachments(
  commentId: string
): Promise<CommentAttachment[]> {
  const supabase = await createSupabaseServerClient();

  const { data: attachments, error: attachmentsError } = await supabase
    .from('comment_attachments')
    .select('id, comment_id, file_path, file_name, mime_type, size_kb, stored_at')
    .eq('comment_id', commentId)
    .order('stored_at', { ascending: true });

  if (attachmentsError) {
    return [];
  }

  return (attachments || []).map((att) => ({
    id: att.id,
    comment_id: att.comment_id,
    file_path: att.file_path,
    file_name: att.file_name,
    mime_type: att.mime_type,
    size_kb: att.size_kb,
    stored_at: att.stored_at
  }));
}

/**
 * Charge les pièces jointes pour plusieurs commentaires
 * 
 * @param commentIds - Liste des UUID des commentaires
 * @returns Map des commentaires avec leurs pièces jointes
 */
export async function loadCommentAttachmentsBatch(
  commentIds: string[]
): Promise<Map<string, CommentAttachment[]>> {
  if (commentIds.length === 0) {
    return new Map();
  }

  const supabase = await createSupabaseServerClient();

  const { data: attachments, error: attachmentsError } = await supabase
    .from('comment_attachments')
    .select('id, comment_id, file_path, file_name, mime_type, size_kb, stored_at')
    .in('comment_id', commentIds)
    .order('stored_at', { ascending: true });

  if (attachmentsError) {
    return new Map();
  }

  const attachmentsMap = new Map<string, CommentAttachment[]>();

  (attachments || []).forEach((att) => {
    const existing = attachmentsMap.get(att.comment_id) || [];
    attachmentsMap.set(att.comment_id, [
      ...existing,
      {
        id: att.id,
        comment_id: att.comment_id,
        file_path: att.file_path,
        file_name: att.file_name,
        mime_type: att.mime_type,
        size_kb: att.size_kb,
        stored_at: att.stored_at
      }
    ]);
  });

  return attachmentsMap;
}

