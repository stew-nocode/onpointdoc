/**
 * Section Compte-rendu du formulaire d'activité
 *
 * Composant atomique pour respecter les principes Clean Code
 * Utilise un Switch pour activer/désactiver la rédaction
 * Affiche un Dialog pour rédiger le compte rendu avec RichTextEditor
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import type { CreateActivityInput } from '@/lib/validators/activity';
import type { UseFormReturn } from 'react-hook-form';
import { Switch } from '@/ui/switch';
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

type ActivityReportSectionProps = {
  form: UseFormReturn<CreateActivityInput>;
};

/**
 * Section pour rédiger le compte-rendu de l'activité avec Rich Text Editor
 *
 * @param form - Instance du formulaire React Hook Form
 */
export function ActivityReportSection({ form }: ActivityReportSectionProps) {
  // État local pour le Switch (initialisé depuis les valeurs du formulaire)
  const [hasReport, setHasReport] = useState(() => {
    const content = form.getValues('reportContent');
    return !!(content && content.trim().length > 0);
  });

  // État pour contrôler l'ouverture du Dialog
  const [dialogOpen, setDialogOpen] = useState(false);

  // État temporaire pour le contenu en cours de rédaction dans le Dialog
  const [tempReportContent, setTempReportContent] = useState<string>('');

  // Utiliser useWatch pour optimiser les re-renders (isole les re-renders au niveau du hook)
  const reportContent = useWatch({
    control: form.control,
    name: 'reportContent'
  });

  useEffect(() => {
    const hasContent = !!(reportContent && reportContent.trim().length > 0);
    setHasReport(hasContent);
  }, [reportContent]);

  // Initialiser le contenu temporaire quand le Dialog s'ouvre
  useEffect(() => {
    if (dialogOpen) {
      const existingContent = form.getValues('reportContent') || '';
      setTempReportContent(existingContent);
    }
  }, [dialogOpen, form]);

  /**
   * Gère le changement du Switch
   */
  const handleToggle = useCallback((checked: boolean) => {
    setHasReport(checked);

    if (!checked) {
      // Désactiver : nettoyer le compte rendu
      form.setValue('reportContent', '', {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: false
      });
      setDialogOpen(false);
    } else {
      // Activer : ouvrir le Dialog pour rédiger
      setDialogOpen(true);
    }
  }, [form]);

  /**
   * Valide et enregistre le compte rendu depuis le Dialog
   */
  const handleValidateReport = useCallback(() => {
    // Enregistrer avec validation
    form.setValue('reportContent', tempReportContent, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });

    setDialogOpen(false);
  }, [tempReportContent, form]);

  /**
   * Annule la rédaction dans le Dialog
   * Si aucun compte rendu n'est défini, désactive le toggle
   */
  const handleCancelDialog = useCallback(() => {
    setDialogOpen(false);

    // Vérifier si un compte rendu est déjà défini dans le formulaire
    const existingContent = form.getValues('reportContent');

    // Si aucun compte rendu n'est défini, désactiver le toggle
    if (!existingContent || existingContent.trim().length === 0) {
      setHasReport(false);
      return;
    }

    // Sinon, réinitialiser le contenu temporaire depuis le formulaire
    setTempReportContent(existingContent);
  }, [form]);

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
    <div className="grid gap-3">
      {/* Switch pour activer/désactiver la rédaction */}
      <div className="flex items-center gap-3">
        <Switch
          checked={hasReport}
          onCheckedChange={handleToggle}
          id="write-report"
        />
        <label
          htmlFor="write-report"
          className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          Rédiger un compte rendu
        </label>
      </div>

      {/* Affichage du compte rendu (si présent) */}
      {hasReport && reportContent && reportContent.trim().length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-slate-700 dark:text-slate-300">
              Compte rendu rédigé
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              Modifier
            </Button>
          </div>
          {/* Aperçu du contenu avec styles prose */}
          <div
            className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-p:text-sm prose-ul:text-sm prose-ol:text-sm"
            dangerouslySetInnerHTML={{ __html: reportContent }}
          />
        </div>
      )}

      {/* Dialog pour rédiger le compte rendu */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancelDialog();
        } else {
          setDialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rédiger le compte rendu</DialogTitle>
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
              onClick={handleCancelDialog}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleValidateReport}
              disabled={!tempReportContent || tempReportContent.trim().length === 0}
              className="w-full sm:w-auto"
            >
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
