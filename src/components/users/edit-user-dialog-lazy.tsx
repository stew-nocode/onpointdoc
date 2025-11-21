/**
 * Wrapper lazy-loadé pour EditUserDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * EditUserDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const EditUserDialogLazy = createLazyDialog(
  () => import('./edit-user-dialog').then(mod => ({ default: mod.EditUserDialog }))
);

