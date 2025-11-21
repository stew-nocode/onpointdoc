/**
 * Wrapper lazy-loadé pour NewContactDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * NewContactDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const NewContactDialogLazy = createLazyDialog(
  () => import('./new-contact-dialog').then(mod => ({ default: mod.NewContactDialog }))
);

