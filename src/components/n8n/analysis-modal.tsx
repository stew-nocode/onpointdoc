/**
 * Modal pour afficher l'analyse générée par N8N
 * 
 * Affiche le texte formaté (Markdown) avec un spinner pendant le chargement
 */

'use client';

import { useEffect } from 'react';
import { Loader2, X, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';

type AnalysisModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  error: string | null;
  analysis: string | null;
  title?: string;
};

/**
 * Modal d'affichage de l'analyse générée par N8N
 * 
 * @param open - État d'ouverture du modal
 * @param onOpenChange - Handler pour changer l'état d'ouverture
 * @param isLoading - État de chargement
 * @param error - Message d'erreur (si présent)
 * @param analysis - Texte de l'analyse générée
 * @param title - Titre du modal (optionnel)
 */
export function AnalysisModal({
  open,
  onOpenChange,
  isLoading,
  error,
  analysis,
  title = 'Analyse générée'
}: AnalysisModalProps) {
  // Empêcher la fermeture du modal pendant le chargement
  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Analyse générée par l&apos;IA via N8N
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* État de chargement */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-brand" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Génération de l&apos;analyse en cours...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Cela peut prendre quelques secondes
              </p>
            </div>
          )}

          {/* État d'erreur */}
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{error.split('\n\n')[0]}</p>
                  {error.includes('\n\n') && (
                    <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-x-auto">
                      {error.split('\n\n').slice(1).join('\n\n')}
                    </pre>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Analyse générée */}
          {analysis && !isLoading && !error && (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div
                className="whitespace-pre-wrap text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
              />
            </div>
          )}

          {/* Message si aucune analyse et pas d'erreur */}
          {!analysis && !isLoading && !error && (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Aucune analyse disponible
              </p>
            </div>
          )}
        </div>

        {/* Bouton de fermeture (uniquement si pas en chargement) */}
        {!isLoading && (
          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Formate l'analyse pour l'affichage HTML
 * 
 * Pour l'instant, on fait un simple formatage basique.
 * Si N8N retourne du Markdown, on pourrait utiliser `react-markdown` ici.
 * 
 * @param text - Le texte de l'analyse
 * @returns Le texte formaté en HTML
 */
function formatAnalysis(text: string): string {
  // Échapper les caractères HTML pour la sécurité
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Formatage basique : convertir les sauts de ligne en <br>
  const withBreaks = escaped.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');

  return `<p>${withBreaks}</p>`;
}

