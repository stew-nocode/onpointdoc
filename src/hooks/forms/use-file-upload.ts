/**
 * Hook personnalisé pour gérer l'upload de fichiers
 * 
 * Extrait la logique de gestion de fichiers des composants pour une meilleure réutilisabilité
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type FileWithPreview = File & { preview?: string; id?: string };

type FileUploadOptions = {
  /** Types MIME acceptés (ex: ['image/*', 'application/pdf']) */
  acceptTypes?: string[];
  /** Taille maximale par fichier en bytes (défaut: 20MB) */
  maxSizeBytes?: number;
  /** Validation personnalisée */
  validate?: (file: File) => boolean | string;
};

type UseFileUploadResult = {
  files: FileWithPreview[];
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  addFiles: (filesList: FileList | File[]) => void;
  removeFile: (indexOrKey: number | string) => void;
  clearFiles: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  openFileDialog: () => void;
};

/**
 * Hook pour gérer l'upload de fichiers avec validation et drag & drop
 * 
 * @param options - Options de configuration
 * @returns État et méthodes pour gérer les fichiers
 * 
 * @example
 * const {
 *   files,
 *   isDragging,
 *   fileInputRef,
 *   addFiles,
 *   removeFile,
 *   handleDrop,
 *   handleDragOver,
 *   handleDragLeave,
 *   openFileDialog
 * } = useFileUpload({
 *   acceptTypes: ['image/*', 'application/pdf'],
 *   maxSizeBytes: 20 * 1024 * 1024 // 20MB
 * });
 */
export function useFileUpload(options: FileUploadOptions = {}): UseFileUploadResult {
  const {
    acceptTypes = ['image/*', 'application/pdf'],
    maxSizeBytes = 20 * 1024 * 1024, // 20MB par défaut
    validate
  } = options;

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean | string => {
    // Validation par type MIME
    const isAcceptedType = acceptTypes.some((accept) => {
      if (accept.endsWith('/*')) {
        return file.type.startsWith(accept.slice(0, -2));
      }
      return file.type === accept;
    });

    if (!isAcceptedType) {
      return `Type de fichier non accepté: ${file.type}`;
    }

    // Validation par taille
    if (file.size > maxSizeBytes) {
      return `Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB)`;
    }

    // Validation personnalisée
    if (validate) {
      const customValidation = validate(file);
      if (customValidation !== true) {
        return typeof customValidation === 'string' ? customValidation : 'Fichier invalide';
      }
    }

    return true;
  }, [acceptTypes, maxSizeBytes, validate]);

  const addFiles = useCallback((filesList: FileList | File[]) => {
    const incoming = Array.from(filesList);
    const validated: File[] = [];
    const errors: string[] = [];

    for (const file of incoming) {
      const validation = validateFile(file);
      if (validation === true) {
        validated.push(file);
      } else {
        errors.push(`${file.name}: ${validation}`);
      }
    }

    // Afficher les erreurs si nécessaire (on pourrait utiliser toast ici)
    if (errors.length > 0 && typeof window !== 'undefined' && window.console) {
      console.warn('Fichiers rejetés:', errors);
    }

    // Éviter les doublons (par nom et taille) et créer les previews
    setFiles((prev) => {
      const currentKeys = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const newFilesWithPreview: FileWithPreview[] = validated
        .filter((f) => {
          const key = `${f.name}:${f.size}`;
          return !currentKeys.has(key);
        })
        .map((f) => {
          const fileWithPreview = f as FileWithPreview;
          if (f.type.startsWith('image/')) {
            fileWithPreview.preview = URL.createObjectURL(f);
          }
          fileWithPreview.id = `${f.name}:${f.size}`;
          return fileWithPreview;
        });
      return [...prev, ...newFilesWithPreview];
    });
  }, [validateFile]);

  const removeFile = useCallback((indexOrKey: number | string) => {
    setFiles((prev) => {
      let fileToRemove: FileWithPreview | undefined;
      if (typeof indexOrKey === 'number') {
        fileToRemove = prev[indexOrKey];
        return prev.filter((_, i) => i !== indexOrKey);
      }
      // Si c'est une clé (name:size ou id), filtrer par clé
      const filtered = prev.filter((f) => {
        const matches = f.id === indexOrKey || `${f.name}:${f.size}` === indexOrKey;
        if (matches) fileToRemove = f;
        return !matches;
      });
      // Nettoyer la preview du fichier supprimé
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return filtered;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    files,
    isDragging,
    fileInputRef,
    addFiles,
    removeFile,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFileDialog
  };
}

