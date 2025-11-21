/**
 * Wrapper lazy-loadé pour NewDepartmentDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * NewDepartmentDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const NewDepartmentDialogLazy = createLazyDialog(
  () => import('./new-department-dialog').then(mod => ({ default: mod.NewDepartmentDialog }))
);

