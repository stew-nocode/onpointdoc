/**
 * Wrapper lazy-loadé pour BulkUpdateStatusDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * BulkUpdateStatusDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const BulkUpdateStatusDialogLazy = createLazyDialog(
  () => import('./bulk-update-status-dialog').then(mod => ({ default: mod.BulkUpdateStatusDialog }))
);

