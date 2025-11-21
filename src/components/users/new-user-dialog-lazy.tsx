/**
 * Wrapper lazy-loadé pour NewUserDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * NewUserDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const NewUserDialogLazy = createLazyDialog(
  () => import('./new-user-dialog').then(mod => ({ default: mod.NewUserDialog }))
);

