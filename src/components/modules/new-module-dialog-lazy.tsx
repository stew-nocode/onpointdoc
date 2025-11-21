/**
 * Wrapper lazy-loadé pour NewModuleDialog
 * Charge le dialog uniquement quand nécessaire
 */

'use client';

import { createLazyDialog } from '@/lib/utils/lazy-load';

/**
 * NewModuleDialog lazy-loadé
 * Charge uniquement quand le dialog est ouvert
 */
export const NewModuleDialogLazy = createLazyDialog(
  () => import('./new-module-dialog').then(mod => ({ default: mod.NewModuleDialog }))
);

