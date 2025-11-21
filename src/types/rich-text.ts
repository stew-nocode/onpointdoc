/**
 * Types pour l'éditeur de texte riche
 */

/**
 * Format de stockage pour le contenu riche
 */
export type RichTextFormat = 'html' | 'adf' | 'plain';

/**
 * Options de configuration de l'éditeur
 */
export type RichTextEditorOptions = {
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  format?: RichTextFormat;
};

/**
 * État de l'éditeur
 */
export type RichTextEditorState = {
  content: string;
  isReady: boolean;
};

