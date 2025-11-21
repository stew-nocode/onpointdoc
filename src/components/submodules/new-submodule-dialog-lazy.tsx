/**
 * Wrapper lazy-loadé pour NewSubmoduleDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * NewSubmoduleDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const NewSubmoduleDialogLazy = createLazyDialog(
  () => import('./new-submodule-dialog').then(mod => ({ default: mod.NewSubmoduleDialog }))
);

