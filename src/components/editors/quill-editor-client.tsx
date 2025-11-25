/**
 * Composant client Quill (chargé dynamiquement)
 * Séparé du wrapper pour éviter les problèmes de chunks
 */

'use client';

import { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique de react-quill
const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false
});

type QuillEditorClientProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
};

/**
 * Composant client Quill
 */
export function QuillEditorClient({
  value,
  onChange,
  placeholder = 'Saisissez votre texte...',
  disabled = false,
  minHeight = 150
}: QuillEditorClientProps) {
  // Charger le CSS de Quill côté client uniquement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Import dynamique du CSS uniquement côté client
      import('react-quill/dist/quill.snow.css').catch(() => {
        // Ignorer les erreurs de chargement CSS silencieusement
      });
    }
  }, []);

  // Configuration de la barre d'outils (légère et fonctionnelle)
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean']
      ]
    }),
    []
  );

  const formats = ['header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'];

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{ minHeight: `${minHeight}px` }}
        className="quill-editor"
      />
    </div>
  );
}

