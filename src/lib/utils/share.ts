/**
 * Utility for sharing content (copy to clipboard)
 */

import { toast } from 'sonner';

/**
 * Copy ticket URL to clipboard and show confirmation
 *
 * @param ticketId - Ticket ID
 * @returns Promise that resolves when copied
 */
export async function shareTicket(ticketId: string): Promise<void> {
  const url = `${window.location.origin}/gestion/tickets/${ticketId}`;

  try {
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié dans le presse-papiers');
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      toast.success('Lien copié dans le presse-papiers');
    } catch (fallbackError) {
      toast.error('Impossible de copier le lien');
    } finally {
      document.body.removeChild(textArea);
    }
  }
}
