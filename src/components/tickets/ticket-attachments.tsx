'use client';

import { File, Download } from 'lucide-react';
import { Button } from '@/ui/button';
import type { TicketAttachment } from '@/services/tickets/attachments/crud';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type TicketAttachmentsProps = {
  ticketId: string;
  attachments: TicketAttachment[];
};

/**
 * Composant pour afficher les pièces jointes d'un ticket
 *
 * Similar to CommentAttachments but read-only (no delete for ticket attachments)
 * Only managers can delete ticket attachments via RLS policies
 */
export function TicketAttachments({ ticketId, attachments }: TicketAttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = async (attachment: TicketAttachment) => {
    const supabase = createSupabaseBrowserClient();
    const bucket = supabase.storage.from('ticket-attachments');

    const { data, error } = await bucket.download(attachment.file_path);

    if (error || !data) {
      toast.error('Erreur lors du téléchargement du fichier');
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (sizeKb: number | null) => {
    if (!sizeKb) return '';
    if (sizeKb < 1024) return `${sizeKb} KB`;
    return `${(sizeKb / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Pièces jointes ({attachments.length})
      </label>
      <div className="space-y-1">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <File className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="truncate text-slate-700 dark:text-slate-300">
                {attachment.file_name}
              </span>
              {attachment.size_kb && (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                  ({formatFileSize(attachment.size_kb)})
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleDownload(attachment)}
              aria-label={`Télécharger ${attachment.file_name}`}
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
