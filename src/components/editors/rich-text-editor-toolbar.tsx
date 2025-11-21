/**
 * Barre d'outils pour l'éditeur de texte riche
 * 
 * Composant de présentation uniquement - logique dans le hook
 * < 100 lignes selon principes Clean Code
 */

'use client';

import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading1, Heading2, Heading3 } from 'lucide-react';
import { Button } from '@/ui/button';
import type { Editor } from '@tiptap/react';

type RichTextEditorToolbarProps = {
  editor: Editor | null;
};

/**
 * Barre d'outils de l'éditeur de texte riche
 * 
 * @param editor - Instance de l'éditeur Tiptap
 */
export function RichTextEditorToolbar({ editor }: RichTextEditorToolbarProps) {
  if (!editor) {
    return null;
  }

  /**
   * Active/désactive le gras
   */
  const toggleBold = () => {
    editor.chain().focus().toggleBold().run();
  };

  /**
   * Active/désactive l'italique
   */
  const toggleItalic = () => {
    editor.chain().focus().toggleItalic().run();
  };

  /**
   * Active/désactive la liste à puces
   */
  const toggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  /**
   * Active/désactive la liste numérotée
   */
  const toggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  /**
   * Ajoute ou modifie un lien
   */
  const setLink = () => {
    const url = window.prompt('URL du lien:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  };

  /**
   * Définit un titre de niveau 1, 2 ou 3
   */
  const setHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().toggleHeading({ level }).run();
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-lg">
      {/* Titres */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setHeading(1)}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Titre 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setHeading(2)}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Titre 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setHeading(3)}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Titre 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Formatage de texte */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleBold}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Gras"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleItalic}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Italique"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Listes */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleBulletList}
        className={editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Liste à puces"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={toggleOrderedList}
        className={editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Liste numérotée"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Lien */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={setLink}
        className={editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-700' : ''}
        aria-label="Ajouter un lien"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

