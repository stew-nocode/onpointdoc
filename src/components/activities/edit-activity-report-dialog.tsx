/**
 * Dialog pour éditer le compte rendu d'une activité
 * 
 * Réutilise la logique de ActivityReportSection pour la cohérence
 * Composant atomique pour respecter les principes Clean Code
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { RichTextEditor } from '@/components/editors/rich-text-editor';

type EditActivityReportDialogProps = {
  /**
   * ID de l'activité à modifier
   */
  activityId: string;

  /**
   * Contenu actuel du compte rendu (peut être null ou undefined)
   */
  currentReportContent?: string | null;

  /**
   * Fonction appelée lors de la soumission
   */
  onSubmit: (reportContent: string | null) => Promise<void>;

  /**
   * Contrôle l'ouverture du dialog
   */
  open: boolean;

  /**
   * Callback appelé quand l'état d'ouverture change
   */
  onOpenChange: (open: boolean) => void;
};

/**
 * Dialog pour éditer le compte rendu d'une activité
 * 
 * Réutilise la logique de ActivityReportSection pour la cohérence
 * 
 * @param props - Propriétés du composant
 */
export function EditActivityReportDialog({
  activityId,
  currentReportContent,
  onSubmit,
  open,
  onOpenChange
}: EditActivityReportDialogProps) {
  // État temporaire pour le contenu en cours de rédaction
  const [tempReportContent, setTempReportContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser le contenu temporaire quand le Dialog s'ouvre
  useEffect(() => {
    if (open) {
      setTempReportContent(currentReportContent || '');
    }
  }, [open, currentReportContent]);

  /**
   * Valide et enregistre le compte rendu
   */
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Convertir chaîne vide en null pour la base de données
      const reportContent = tempReportContent.trim().length > 0 ? tempReportContent : null;
      await onSubmit(reportContent);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compte rendu:', error);
      // L'erreur sera gérée par le composant parent
    } finally {
      setIsSubmitting(false);
    }
  }, [tempReportContent, onSubmit, onOpenChange]);

  /**
   * Annule la rédaction dans le Dialog
   */
  const handleCancel = useCallback(() => {
    onOpenChange(false);
    // Réinitialiser le contenu temporaire au contenu actuel
    setTempReportContent(currentReportContent || '');
  }, [onOpenChange, currentReportContent]);

  /**
   * Extrait le texte brut du HTML pour comptage de caractères
   */
  const getPlainTextLength = (html: string): number => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent?.length || 0;
  };

  const contentLength = tempReportContent ? getPlainTextLength(tempReportContent) : 0;
  const showWarning = contentLength > 3000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {currentReportContent ? 'Modifier le compte rendu' : 'Ajouter un compte rendu'}
          </DialogTitle>
          <DialogDescription>
            Utilisez l'éditeur pour rédiger un compte rendu détaillé de l'activité
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RichTextEditor
            value={tempReportContent}
            onChange={setTempReportContent}
            placeholder="Rédigez votre compte rendu ici..."
            minHeight={400}
          />
        </div>

        {/* Avertissement si contenu très long */}
        {showWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            ⚠️ Votre compte rendu est assez long ({contentLength} caractères). Assurez-vous qu'il reste concis et pertinent.
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


