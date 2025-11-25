import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';

/**
 * Type pour une pièce jointe de ticket
 */
export type TicketAttachment = {
  id: string;
  ticket_id: string;
  file_path: string;
  mime_type: string | null;
  size_kb: number | null;
  stored_at: string | null;
};

/**
 * Charge les pièces jointes d'un ticket
 * 
 * @param ticketId - UUID du ticket
 * @returns Liste des pièces jointes du ticket
 */
export async function loadTicketAttachments(
  ticketId: string
): Promise<TicketAttachment[]> {
  const supabase = await createSupabaseServerClient();

  const { data: attachments, error } = await supabase
    .from('ticket_attachments')
    .select('id, ticket_id, file_path, mime_type, size_kb, stored_at')
    .eq('ticket_id', ticketId)
    .order('stored_at', { ascending: true });

  if (error) {
    throw createError.supabaseError(
      `Erreur lors du chargement des pièces jointes pour le ticket ${ticketId}`,
      new Error(error.message)
    );
  }

  return (attachments || []).map((att) => ({
    id: att.id,
    ticket_id: att.ticket_id,
    file_path: att.file_path,
    mime_type: att.mime_type,
    size_kb: att.size_kb,
    stored_at: att.stored_at
  }));
}

