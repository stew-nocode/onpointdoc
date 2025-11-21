/**
 * Composant d'affichage des erreurs de l'analyse
 */

import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';

type AnalysisErrorDisplayProps = {
  error: string;
};

/**
 * Affiche les erreurs lors de la génération de l'analyse
 * 
 * @param error - Le message d'erreur à afficher
 */
export function AnalysisErrorDisplay({ error }: AnalysisErrorDisplayProps) {
  const errorParts = error.split('\n\n');
  const mainError = errorParts[0];
  const details = errorParts.length > 1 ? errorParts.slice(1).join('\n\n') : null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erreur</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">{mainError}</p>
          {details && (
            <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-x-auto">
              {details}
            </pre>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

