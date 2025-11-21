/**
 * Hook personnalisé pour gérer l'éditeur de texte riche Tiptap
 * 
 * Séparant la logique métier de la présentation selon les principes Clean Code
 */

'use client';

import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect } from 'react';
import { convertToEditorHTML, convertFromEditorHTML } from '@/lib/utils/rich-text-converter';
import type { RichTextFormat, RichTextEditorOptions } from '@/types/rich-text';

type UseRichTextEditorOptions = RichTextEditorOptions & {
  value: string | null | undefined;
  onChange: (value: string) => void;
};

type UseRichTextEditorResult = {
  editor: Editor | null;
  isReady: boolean;
};

/**
 * Hook pour gérer l'éditeur de texte riche
 * 
 * @param options - Options de configuration
 * @returns État et instance de l'éditeur
 * 
 * @example
 * const { editor, isReady } = useRichTextEditor({
 *   value: ticket.description,
 *   onChange: (html) => form.setValue('description', html),
 *   placeholder: 'Description...',
 *   format: 'html'
 * });
 */
export function useRichTextEditor(
  options: UseRichTextEditorOptions
): UseRichTextEditorResult {
  const {
    value,
    onChange,
    placeholder = 'Saisissez votre texte...',
    disabled = false,
    format = 'html'
  } = options;

  /**
   * Convertit la valeur initiale en HTML pour l'éditeur
   */
  const getInitialContent = useCallback((): string => {
    return convertToEditorHTML(value, format);
  }, [value, format]);

  /**
   * Initialise l'éditeur Tiptap
   * 
   * immediatelyRender: false pour éviter les problèmes d'hydratation SSR avec Next.js
   */
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: getInitialContent(),
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const converted = convertFromEditorHTML(html, format);
      onChange(converted);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none p-4 min-h-[150px] focus:outline-none'
      }
    }
  });

  /**
   * Mettre à jour le contenu quand la valeur change
   */
  useEffect(() => {
    if (!editor) return;

    const currentHTML = editor.getHTML();
    const newHTML = getInitialContent();

    // Éviter les boucles infinies : ne mettre à jour que si le contenu a vraiment changé
    if (currentHTML !== newHTML) {
      editor.commands.setContent(newHTML, { emitUpdate: false });
    }
  }, [editor, getInitialContent]);

  /**
   * Mettre à jour l'état éditable
   */
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return {
    editor,
    isReady: editor !== null
  };
}

