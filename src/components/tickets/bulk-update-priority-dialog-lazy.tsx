/**
 * Wrapper lazy-loadé pour BulkUpdatePriorityDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * BulkUpdatePriorityDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const BulkUpdatePriorityDialogLazy = createLazyDialog(
  () => import('./bulk-update-priority-dialog').then(mod => ({ default: mod.BulkUpdatePriorityDialog }))
);

