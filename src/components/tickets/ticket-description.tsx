'use client';

import { useMemo } from 'react';
import { parseADFToHTML } from '@/lib/utils/adf-parser';

type TicketDescriptionProps = {
  description: string | null;
};

/**
 * Composant client pour afficher la description d'un ticket
 * Parse le format ADF de Jira et l'affiche en HTML formaté
 */
export function TicketDescription({ description }: TicketDescriptionProps) {
  const htmlContent = useMemo(() => {
    if (!description) return 'Aucune description';
    
    const html = parseADFToHTML(description);
    
    // Si le parsing n'a rien retourné, afficher le texte brut avec préservation des sauts de ligne
    if (!html || html.trim() === '') {
      return null;
    }
    
    return html;
  }, [description]);

  if (!htmlContent) {
    return (
      <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
        {description || 'Aucune description'}
      </div>
    );
  }

  return (
    <div
      className="mt-1 text-sm text-slate-600 dark:text-slate-400 [&_p]:my-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:my-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-2 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-2 [&_li]:my-1 [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-slate-100 [&_pre]:dark:bg-slate-800 [&_pre]:p-3 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-2 [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:hover:underline"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

