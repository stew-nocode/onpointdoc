/**
 * Bouton contextuel pour générer une analyse via N8N
 * 
 * Utilise le hook useAnalysisGenerator et affiche le modal AnalysisModal
 */

'use client';

import { Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui/tooltip';
import { useAnalysisGenerator } from '@/hooks/n8n/use-analysis-generator';
import { AnalysisModal } from './analysis-modal';
import type { AnalysisContext } from '@/types/n8n';

type AnalysisButtonProps = {
  context: AnalysisContext;
  id: string;
  className?: string;
  tooltip?: string;
};

/**
 * Bouton contextuel pour générer une analyse
 * 
 * @param context - Le contexte de l'analyse (ticket, company, contact)
 * @param id - L'identifiant de l'entité
 * @param className - Classes CSS additionnelles
 * @param tooltip - Texte du tooltip (optionnel)
 */
export function AnalysisButton({
  context,
  id,
  className = '',
  tooltip = 'Générer une analyse'
}: AnalysisButtonProps) {
  const { open, isLoading, error, analysis, openModal, closeModal } = useAnalysisGenerator({
    context,
    id
  });

  const getContextTitle = () => {
    switch (context) {
      case 'ticket':
        return 'Analyse du ticket';
      case 'company':
        return 'Analyse de l\'entreprise';
      case 'contact':
        return 'Analyse du contact';
      default:
        return 'Analyse générée';
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={openModal}
              disabled={isLoading}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
              aria-label={tooltip}
              type="button"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AnalysisModal
        open={open}
        onOpenChange={closeModal}
        isLoading={isLoading}
        error={error}
        analysis={analysis}
        title={getContextTitle()}
      />
    </>
  );
}

