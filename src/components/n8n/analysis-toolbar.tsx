/**
 * Barre d'outils pour l'édition et le téléchargement de l'analyse
 */

import { Download, Edit2, Save, X as XIcon } from 'lucide-react';
import { Button } from '@/ui/button';

type AnalysisToolbarProps = {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDownload: () => void;
  hasContent: boolean;
};

/**
 * Barre d'outils pour gérer l'édition et le téléchargement de l'analyse
 * 
 * @param isEditing - État d'édition actuel
 * @param onEdit - Handler pour activer l'édition
 * @param onSave - Handler pour sauvegarder les modifications
 * @param onCancel - Handler pour annuler les modifications
 * @param onDownload - Handler pour télécharger l'analyse
 * @param hasContent - Indique si du contenu est disponible
 */
export function AnalysisToolbar({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDownload,
  hasContent
}: AnalysisToolbarProps) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 bg-transparent">
      <div className="flex items-center gap-2">
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Éditer
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onSave}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="gap-2"
            >
              <XIcon className="h-4 w-4" />
              Annuler
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onDownload}
        className="gap-2"
        disabled={!hasContent}
      >
        <Download className="h-4 w-4" />
        Télécharger
      </Button>
    </div>
  );
}

