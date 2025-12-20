/**
 * Wrapper pour l'éditeur de texte riche Quill avec dynamic import
 * 
 * Plus léger et plus stable que Tiptap (~45KB vs ~200-300KB)
 * Séparé en deux composants pour éviter les problèmes de chunks
 */

'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import dynamique du composant client Quill
const QuillEditorClient = dynamic(() => import('./quill-editor-client').then((mod) => ({ default: mod.QuillEditorClient })), {
  ssr: false,
  loading: () => (
    <div className="border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-950">
      <div className="flex flex-col items-center justify-center p-4 min-h-[150px] gap-2">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Chargement de l&apos;éditeur...</p>
      </div>
    </div>
  )
});

type QuillEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
};

/**
 * Éditeur de texte riche basé sur Quill
 * 
 * Plus léger, plus stable et chargement plus rapide que Tiptap
 * 
 * @param value - Valeur HTML actuelle
 * @param onChange - Callback appelé lors des modifications
 * @param placeholder - Placeholder de l'éditeur
 * @param disabled - Désactiver l'éditeur
 * @param minHeight - Hauteur minimale en pixels
 * 
 * @example
 * <QuillEditor
 *   value={form.watch('description') || ''}
 *   onChange={(html) => form.setValue('description', html)}
 *   placeholder="Description du ticket..."
 *   minHeight={150}
 * />
 */
export function QuillEditor(props: QuillEditorProps) {
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
      <QuillEditorClient {...props} />
    </Suspense>
  );
}

