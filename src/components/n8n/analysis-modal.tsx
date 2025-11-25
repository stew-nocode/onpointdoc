/**
 * Modal pour afficher l'analyse générée par N8N
 * 
 * Affiche le texte formaté (Markdown) avec possibilité d'édition et de téléchargement
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { downloadAnalysisFile } from '@/lib/utils/file-download';
import { AnalysisLoadingState } from './analysis-loading-state';
import { AnalysisErrorDisplay } from './analysis-error-display';
import { AnalysisToolbar } from './analysis-toolbar';
import { AnalysisChatMessage } from './analysis-chat-message';

type AnalysisModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  error: string | null;
  analysis: string | null;
  title?: string;
  context?: 'ticket' | 'company' | 'contact';
  id?: string;
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
 * @param context - Contexte de l'analyse (pour le nom du fichier)
 * @param id - Identifiant de l'entité (pour le nom du fichier)
 */
export function AnalysisModal({
  open,
  onOpenChange,
  isLoading,
  error,
  analysis,
  title = 'Analyse générée',
  context = 'ticket',
  id = 'unknown'
}: AnalysisModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Synchroniser le contenu édité avec l'analyse quand elle change
  useEffect(() => {
    if (analysis) {
      setEditedContent(analysis);
    }
  }, [analysis]);

  // Réinitialiser le mode édition quand le modal se ferme
  useEffect(() => {
    if (!open) {
      setIsEditing(false);
      if (analysis) {
        setEditedContent(analysis);
      }
    }
  }, [open, analysis]);

  // Empêcher la fermeture du modal pendant le chargement
  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  };

  /**
   * Gère le téléchargement de l'analyse
   */
  const handleDownload = () => {
    const contentToDownload = isEditing ? editedContent : (analysis || '');
    if (contentToDownload) {
      downloadAnalysisFile(contentToDownload, context, id);
    }
  };

  /**
   * Sauvegarde les modifications et passe en mode lecture
   */
  const handleSave = () => {
    setIsEditing(false);
    // Le contenu édité est déjà dans editedContent
    // Ici, on pourrait ajouter une logique pour sauvegarder côté serveur si nécessaire
  };

  /**
   * Annule les modifications et revient au contenu original
   */
  const handleCancel = () => {
    setEditedContent(analysis || '');
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <DialogTitle className="text-slate-900 dark:text-slate-50">{title}</DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Analyse générée par l&apos;IA via N8N
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* État de chargement */}
          {isLoading && <AnalysisLoadingState />}

          {/* État d'erreur */}
          {error && !isLoading && <AnalysisErrorDisplay error={error} />}

          {/* Analyse générée - Style chat IA */}
          {analysis && !isLoading && !error && (
            <div className="space-y-4">
              {!isEditing ? (
                <>
                  <AnalysisChatMessage
                    text={analysis}
                    speed={30}
                    onRevealComplete={() => {
                      // La révélation est terminée, on peut activer les boutons
                    }}
                  />
                  <div className="pt-2">
                    <AnalysisToolbar
                      isEditing={isEditing}
                      onEdit={() => setIsEditing(true)}
                      onSave={handleSave}
                      onCancel={handleCancel}
                      onDownload={handleDownload}
                      hasContent={!!analysis}
                    />
                  </div>
                </>
              ) : (
                <>
                  <AnalysisToolbar
                    isEditing={isEditing}
                    onEdit={() => setIsEditing(true)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDownload={handleDownload}
                    hasContent={!!(analysis || editedContent)}
                  />
                  <Textarea
                    value={editedContent || analysis}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Modifiez l'analyse..."
                  />
                </>
              )}
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
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


