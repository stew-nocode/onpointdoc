import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';

/**
 * Type pour une pièce jointe de ticket
 */
export type TicketAttachment = {
  id: string;
  ticket_id: string;
  file_path: string;
  file_name: string; // Extrait de file_path si non disponible en DB
  mime_type: string | null;
  size_kb: number | null;
  stored_at: string | null; // Alias pour created_at (compatibilité)
};

/**
 * Extrait le nom de fichier depuis le file_path
 * Format: {ticketId}/{timestamp}-{filename}
 * Example: "abc-123/1234567890-document.pdf" -> "document.pdf"
 */
function extractFileNameFromPath(filePath: string): string {
  const match = filePath.match(/(?:[^/]+\/)?[0-9]+-(.+)$/);
  return match?.[1] || filePath.split('/').pop() || 'fichier';
}

/**
 * Charge les pièces jointes d'un ticket
 *
 * NOTE: Supporte file_name en colonne (après migration) ou extraction depuis file_path (avant migration)
 *
 * @param ticketId - UUID du ticket
 * @returns Liste des pièces jointes du ticket
 */
export async function loadTicketAttachments(
  ticketId: string
): Promise<TicketAttachment[]> {
  try {
    const supabase = await createSupabaseServerClient();

    // Sélectionner file_name uniquement s'il existe (compatibilité avant/après migration)
    // NOTE: La table utilise 'created_at' et non 'stored_at' en base de données
    const { data: attachments, error } = await supabase
      .from('ticket_attachments')
      .select('id, ticket_id, file_path, mime_type, size_kb, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[loadTicketAttachments] Supabase error:', {
        ticketId,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Si c'est une erreur de permission ou de colonne manquante, retourner un tableau vide
      // plutôt que de faire crasher toute la page
      if (error.code === 'PGRST116' || error.code === '42703') {
        console.warn('[loadTicketAttachments] Returning empty array due to RLS or column issue');
        return [];
      }

      throw createError.supabaseError(
        `Erreur lors du chargement des pièces jointes pour le ticket ${ticketId}`,
        new Error(error.message)
      );
    }

    return (attachments || []).map((att) => ({
      id: att.id,
      ticket_id: att.ticket_id,
      file_path: att.file_path,
      file_name: extractFileNameFromPath(att.file_path),
      mime_type: att.mime_type,
      size_kb: att.size_kb,
      stored_at: (att as any).created_at || (att as any).stored_at || null // Utilise created_at de la DB
    }));
  } catch (error) {
    console.error('[loadTicketAttachments] Unexpected error:', error);
    // En cas d'erreur inattendue, retourner tableau vide pour ne pas bloquer l'affichage du ticket
    return [];
  }
}

