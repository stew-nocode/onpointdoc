/**
 * Wrapper lazy-loadé pour CreateTicketDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * CreateTicketDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const CreateTicketDialogLazy = createLazyDialog(
  () => import('./create-ticket-dialog').then(mod => ({ default: mod.CreateTicketDialog }))
);

