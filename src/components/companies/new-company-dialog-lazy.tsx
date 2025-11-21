/**
 * Wrapper lazy-loadé pour NewCompanyDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * NewCompanyDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const NewCompanyDialogLazy = createLazyDialog(
  () => import('./new-company-dialog').then(mod => ({ default: mod.NewCompanyDialog }))
);

