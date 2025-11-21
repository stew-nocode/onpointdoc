/**
 * Composant d'affichage du contenu de l'analyse (mode édition ou lecture)
 */

import { Textarea } from '@/ui/textarea';
import { formatAnalysis } from '@/lib/utils/analysis-formatter';

type AnalysisContentProps = {
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
};

/**
 * Affiche le contenu de l'analyse en mode édition ou lecture
 * 
 * @param isEditing - Mode édition activé ou non
 * @param content - Le contenu à afficher
 * @param onContentChange - Handler pour les modifications du contenu
 */
export function AnalysisContent({
  isEditing,
  content,
  onContentChange
}: AnalysisContentProps) {
  if (isEditing) {
    return (
      <Textarea
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onContentChange(e.target.value)}
        className="min-h-[400px] font-mono text-sm"
        placeholder="Modifiez l'analyse..."
      />
    );
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div
        className="whitespace-pre-wrap text-slate-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: formatAnalysis(content) }}
      />
    </div>
  );
}

