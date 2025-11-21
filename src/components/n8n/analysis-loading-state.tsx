/**
 * Composant d'affichage de l'état de chargement de l'analyse
 */

import { Loader2 } from 'lucide-react';

/**
 * Affiche l'état de chargement pendant la génération de l'analyse
 */
export function AnalysisLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Génération de l&apos;analyse en cours...
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500">
        Cela peut prendre quelques secondes
      </p>
    </div>
  );
}

