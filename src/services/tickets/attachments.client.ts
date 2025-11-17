'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export async function uploadTicketAttachments(ticketId: string, files: File[]) {
  if (!files.length) return;
  const supabase = createSupabaseBrowserClient();
  const bucket = supabase.storage.from('ticket-attachments');

  for (const file of files) {
    const path = `${ticketId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await bucket.upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (upErr) {
      throw new Error(`Erreur lors de l'upload de ${file.name}: ${upErr.message}`);
    }

    // store metadata
    const { error: metaErr } = await supabase.from('ticket_attachments').insert({
      ticket_id: ticketId,
      file_path: path,
      mime_type: file.type,
      size_kb: Math.ceil(file.size / 1024)
    });
    if (metaErr) {
      throw new Error(`Erreur lors de l'enregistrement des métadonnées pour ${file.name}: ${metaErr.message}`);
    }
  }
}


