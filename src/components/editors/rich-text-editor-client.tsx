/**
 * Éditeur de texte riche (WYSIWYG) basé sur Tiptap
 * 
 * Version client-only avec dynamic import pour éviter les erreurs de chunk loading
 * Composant principal orchestrant la barre d'outils et l'éditeur
 * < 100 lignes selon principes Clean Code
 */

'use client';

import { EditorContent } from '@tiptap/react';
import { useRichTextEditor } from '@/hooks/editors/use-rich-text-editor';
import { RichTextEditorToolbar } from './rich-text-editor-toolbar';
import type { RichTextEditorOptions } from '@/types/rich-text';

type RichTextEditorClientProps = RichTextEditorOptions & {
  value: string | null | undefined;
  onChange: (value: string) => void;
  minHeight?: number;
};

/**
 * Éditeur de texte riche réutilisable (version client uniquement)
 * 
 * @param value - Valeur actuelle (HTML, ADF ou texte brut selon format)
 * @param onChange - Callback appelé lors des modifications
 * @param placeholder - Placeholder de l'éditeur
 * @param disabled - Désactiver l'éditeur
 * @param format - Format de stockage (html, adf, plain)
 * @param minHeight - Hauteur minimale en pixels
 * 
 * @example
 * <RichTextEditorClient
 *   value={form.watch('description')}
 *   onChange={(html) => form.setValue('description', html)}
 *   placeholder="Description du ticket..."
 *   format="html"
 * />
 */
export function RichTextEditorClient({
  value,
  onChange,
  placeholder = 'Saisissez votre texte...',
  disabled = false,
  format = 'html',
  minHeight = 150
}: RichTextEditorClientProps) {
  const { editor, isReady } = useRichTextEditor({
    value,
    onChange,
    placeholder,
    disabled,
    format
  });

  if (!isReady) {
    return (
      <div 
        className="border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-950"
        style={{ minHeight: `${minHeight}px` }}
      >
        <div className="flex items-center justify-center p-4" style={{ minHeight: `${minHeight}px` }}>
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden">
      <RichTextEditorToolbar editor={editor} />
      <div className="prose prose-slate dark:prose-invert max-w-none min-h-[150px] focus-within:outline-none px-4 py-3">
        <EditorContent 
          editor={editor} 
          style={{ minHeight: `${minHeight}px` }}
          className="tiptap-editor"
        />
      </div>
    </div>
  );
}

