/**
 * Wrapper lazy-loadé pour EditCompanyDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * EditCompanyDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const EditCompanyDialogLazy = createLazyDialog(
  () => import('./edit-company-dialog').then(mod => ({ default: mod.EditCompanyDialog }))
);

