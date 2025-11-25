/**
 * Composant de message style chat IA pour afficher l'analyse
 * 
 * Affiche le texte de manière progressive (style chat) avec curseur clignotant
 */

'use client';

import { useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { useTextReveal } from '@/hooks/n8n/use-text-reveal';
import { formatAnalysis } from '@/lib/utils/analysis-formatter';

type AnalysisChatMessageProps = {
  /** Texte complet de l'analyse */
  text: string | null;
  /** Vitesse de révélation (ms par unité) */
  speed?: number;
  /** Callback quand la révélation est terminée */
  onRevealComplete?: () => void;
};

/**
 * Composant de message style chat IA pour l'analyse
 * 
 * @param text - Texte complet à afficher
 * @param speed - Vitesse de révélation en millisecondes
 * @param onRevealComplete - Callback appelé quand la révélation est terminée
 */
export function AnalysisChatMessage({
  text,
  speed = 50,
  onRevealComplete
}: AnalysisChatMessageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { revealedText, isRevealing, showAll } = useTextReveal({
    text,
    speed,
    unit: 'word',
    autoStart: true,
    onComplete: onRevealComplete
  });

  // Scroll automatique vers le bas pendant la révélation
  useEffect(() => {
    if (isRevealing && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [revealedText, isRevealing]);

  if (!text) {
    return null;
  }

  // Utiliser le texte révélé ou le texte complet si la révélation est terminée
  const displayText = revealedText || text || '';
  const shouldShowCursor = isRevealing && displayText.length > 0;
  
  // Si pas de texte à afficher, ne rien rendre
  if (!displayText) {
    return null;
  }

  return (
    <div className="flex gap-3 p-4">
      {/* Avatar IA */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 dark:bg-brand/20 text-brand dark:text-brand-300 border border-brand/20 dark:border-brand/30">
          <Bot className="h-4 w-4" />
        </div>
      </div>

      {/* Bulle de message */}
      <div className="flex-1 space-y-2">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Assistant IA
        </div>
        
        <div className="rounded-lg bg-slate-100 dark:bg-transparent border border-slate-200 dark:border-transparent p-4 shadow-sm dark:shadow-none">
          <div
            ref={containerRef}
            className="max-w-none text-sm max-h-[60vh] overflow-y-auto custom-scrollbar"
          >
            <div className="relative">
              <div
                className="analysis-content"
                dangerouslySetInnerHTML={{ __html: formatAnalysis(displayText) }}
              />
              {shouldShowCursor && (
                <span className="inline-block w-0.5 h-4 bg-slate-600 dark:bg-slate-300 animate-pulse ml-1 align-middle" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>

        {/* Bouton pour afficher tout si en cours de révélation */}
        {isRevealing && (
          <button
            onClick={showAll}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Afficher tout →
          </button>
        )}
      </div>
    </div>
  );
}

