/**
 * Modal pour afficher l'analyse générée par N8N
 * 
 * Affiche le texte formaté (Markdown) avec possibilité d'édition et de téléchargement
 */

'use client';

import { useState, useCallback } from 'react';
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

  // Empêcher la fermeture du modal pendant le chargement
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (isLoading) return;
    if (!newOpen) {
      setIsEditing(false);
      setEditedContent('');
    }
    onOpenChange(newOpen);
  }, [isLoading, onOpenChange]);

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

  const handleStartEdit = () => {
    setEditedContent(analysis || '');
    setIsEditing(true);
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
                    onEdit={handleStartEdit}
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
                    onEdit={handleStartEdit}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDownload={handleDownload}
                    hasContent={!!(analysis || editedContent)}
                  />
                  <Textarea
                    value={editedContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedContent(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


