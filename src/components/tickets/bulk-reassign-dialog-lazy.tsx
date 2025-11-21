/**
 * Wrapper lazy-loadé pour BulkReassignDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * BulkReassignDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const BulkReassignDialogLazy = createLazyDialog(
  () => import('./bulk-reassign-dialog').then(mod => ({ default: mod.BulkReassignDialog }))
);

