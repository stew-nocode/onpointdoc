/**
 * Wrapper pour l'éditeur de texte riche avec dynamic import
 * 
 * Utilise un dynamic import pour éviter les erreurs de chunk loading avec Next.js
 * Composant < 30 lignes selon principes Clean Code
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { RichTextEditorOptions } from '@/types/rich-text';

type RichTextEditorProps = RichTextEditorOptions & {
  value: string | null | undefined;
  onChange: (value: string) => void;
  minHeight?: number;
};

/**
 * Import dynamique de l'éditeur client uniquement
 * ssr: false pour éviter tout rendu côté serveur
 * 
 * Optimisé : gestion d'erreur améliorée pour les timeouts de chargement de chunk
 */
const RichTextEditorClient = dynamic(
  () =>
    import('./rich-text-editor-client')
      .then((mod) => ({ default: mod.RichTextEditorClient }))
      .catch(() => {
        // Retourner un composant de fallback en cas d'erreur (sans logging pour éviter console.log en production)
        return {
          default: () => (
            <div className="border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-950 p-4">
              <p className="text-sm text-status-danger">
                Erreur de chargement de l'éditeur. Veuillez recharger la page.
              </p>
            </div>
          )
        };
      }),
  {
    ssr: false,
    loading: () => (
      <div className="border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-950">
        <div className="flex flex-col items-center justify-center p-4 min-h-[150px] gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Chargement de l'éditeur...</p>
        </div>
      </div>
    )
  }
);

/**
 * Éditeur de texte riche réutilisable (avec dynamic import)
 * 
 * @param value - Valeur actuelle (HTML, ADF ou texte brut selon format)
 * @param onChange - Callback appelé lors des modifications
 * @param placeholder - Placeholder de l'éditeur
 * @param disabled - Désactiver l'éditeur
 * @param format - Format de stockage (html, adf, plain)
 * @param minHeight - Hauteur minimale en pixels
 * 
 * @example
 * <RichTextEditor
 *   value={form.watch('description')}
 *   onChange={(html) => form.setValue('description', html)}
 *   placeholder="Description du ticket..."
 *   format="html"
 * />
 */
export function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense
      fallback={
        <div className="border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-950">
          <div className="flex items-center justify-center p-4 min-h-[150px]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        </div>
      }
    >
      <RichTextEditorClient {...props} />
    </Suspense>
  );
}

