/**
 * Éditeur de texte simple avec textarea
 * 
 * Alternative légère et stable aux éditeurs WYSIWYG complexes
 * Pas de dépendances lourdes, chargement instantané
 * Support Markdown basique via preview optionnel
 */

'use client';

import { TEXTAREA_CLASS } from '@/lib/constants/form-styles';

type SimpleTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
};

/**
 * Éditeur de texte simple basé sur textarea
 * 
 * Léger, rapide, stable - aucune dépendance externe
 * 
 * @param value - Valeur texte actuelle
 * @param onChange - Callback appelé lors des modifications
 * @param placeholder - Placeholder de l'éditeur
 * @param disabled - Désactiver l'éditeur
 * @param minHeight - Hauteur minimale en pixels
 */
export function SimpleTextEditor({
  value,
  onChange,
  placeholder = 'Saisissez votre texte...',
  disabled = false,
  minHeight = 150
}: SimpleTextEditorProps) {
  const inputClass = `w-full ${TEXTAREA_CLASS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2`;

  return (
    <div className="w-full">
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
        style={{ minHeight: `${minHeight}px` }}
        rows={Math.ceil(minHeight / 24)}
      />
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Vous pouvez utiliser le formatage Markdown basique : **gras**, *italique*, listes à puces, etc.
      </p>
    </div>
  );
}

