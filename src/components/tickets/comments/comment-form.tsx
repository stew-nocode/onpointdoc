'use client';

import { useState, FormEvent } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { Switch } from '@/ui/switch';
import { Label } from '@/ui/label';
import { toast } from 'sonner';
import { useFileUpload, type FileWithPreview } from '@/hooks';

type CommentFormProps = {
  onSubmit: (content: string, files?: File[], commentType?: 'comment' | 'followup') => Promise<void>;
  isLoading?: boolean;
};

/**
 * Formulaire pour ajouter un commentaire
 * 
 * Validation :
 * - Le commentaire ne peut pas être vide
 * - Le commentaire ne peut pas dépasser 5000 caractères
 */
export function CommentForm({ onSubmit, isLoading = false }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isFollowup, setIsFollowup] = useState(false);
  const {
    files,
    fileInputRef,
    addFiles,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFileDialog
  } = useFileUpload({
    acceptTypes: ['*/*'],
    maxSizeBytes: 20 * 1024 * 1024 // 20MB
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedContent = content.trim();

    if (!trimmedContent && files.length === 0) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    if (trimmedContent.length > 5000) {
      toast.error('Le commentaire est trop long (maximum 5000 caractères)');
      return;
    }

    try {
      const commentType = isFollowup ? 'followup' : 'comment';
      await onSubmit(trimmedContent, files.length > 0 ? files : undefined, commentType);
      setContent('');
      setIsFollowup(false);
      clearFiles();
      toast.success(isFollowup ? 'Relance ajoutée avec succès' : 'Commentaire ajouté avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  };

  const isDisabled = isLoading || (!content.trim() && files.length === 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ajouter un commentaire..."
        rows={3}
        className="resize-none"
        disabled={isLoading}
        maxLength={5000}
      />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={file.id || index}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="truncate max-w-[150px]">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => removeFile(file.id || index)}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="followup-switch"
              checked={isFollowup}
              onCheckedChange={setIsFollowup}
              disabled={isLoading}
            />
            <Label
              htmlFor="followup-switch"
              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Relance
            </Label>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={openFileDialog}
            disabled={isLoading}
            aria-label="Ajouter des pièces jointes"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          {files.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {files.length} fichier{files.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {content.trim() && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {content.length}/5000
            </span>
          )}
          <Button type="submit" disabled={isDisabled} size="sm">
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? 'Envoi...' : isFollowup ? 'Relancer' : 'Ajouter'}
          </Button>
        </div>
      </div>
    </form>
  );
}

