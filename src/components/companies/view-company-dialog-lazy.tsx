/**
 * Wrapper lazy-loadé pour ViewCompanyDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * ViewCompanyDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const ViewCompanyDialogLazy = createLazyDialog(
  () => import('./view-company-dialog').then(mod => ({ default: mod.ViewCompanyDialog }))
);

