'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { createError } from '@/lib/errors/types';

type UploadResult = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_kb: number | null;
};

/**
 * Upload un fichier dans le bucket comment-attachments
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire
 * @param file - Fichier à uploader
 * @returns Chemin du fichier uploadé
 * @throws Error si l'upload échoue
 */
async function uploadFileToStorage(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  commentId: string,
  file: File
): Promise<string> {
  const bucket = supabase.storage.from('comment-attachments');
  const path = `${commentId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await bucket.upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) {
    throw createError.supabaseError(
      `Erreur lors de l'upload de ${file.name}`,
      new Error(uploadError.message)
    );
  }

  return path;
}

/**
 * Enregistre les métadonnées d'un fichier dans la base de données
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire
 * @param file - Fichier uploadé
 * @param filePath - Chemin du fichier dans le storage
 * @returns Métadonnées enregistrées
 * @throws Error si l'enregistrement échoue
 */
async function saveFileMetadata(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  commentId: string,
  file: File,
  filePath: string
): Promise<UploadResult> {
  const { data: attachment, error: metaError } = await supabase
    .from('comment_attachments')
    .insert({
      comment_id: commentId,
      file_path: filePath,
      file_name: file.name,
      mime_type: file.type,
      size_kb: Math.ceil(file.size / 1024)
    })
    .select('id, file_path, file_name, mime_type, size_kb')
    .single();

  if (metaError || !attachment) {
    throw createError.supabaseError(
      `Erreur lors de l'enregistrement des métadonnées pour ${file.name}`,
      metaError ? new Error(metaError.message) : undefined
    );
  }

  return {
    id: attachment.id,
    file_path: attachment.file_path,
    file_name: attachment.file_name,
    mime_type: attachment.mime_type,
    size_kb: attachment.size_kb
  };
}

/**
 * Upload un seul fichier pour un commentaire
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire
 * @param file - Fichier à uploader
 * @returns Métadonnées du fichier uploadé
 */
async function uploadSingleFile(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  commentId: string,
  file: File
): Promise<UploadResult> {
  const filePath = await uploadFileToStorage(supabase, commentId, file);
  return saveFileMetadata(supabase, commentId, file, filePath);
}

/**
 * Upload les pièces jointes d'un commentaire
 * 
 * @param commentId - UUID du commentaire
 * @param files - Liste des fichiers à uploader
 * @returns Liste des pièces jointes uploadées
 * @throws Error si l'upload échoue
 */
export async function uploadCommentAttachments(
  commentId: string,
  files: File[]
): Promise<UploadResult[]> {
  if (!files.length) return [];

  const supabase = createSupabaseBrowserClient();
  const results: UploadResult[] = [];

  for (const file of files) {
    const metadata = await uploadSingleFile(supabase, commentId, file);
    results.push(metadata);
  }

  return results;
}

/**
 * Supprime un fichier du storage
 * 
 * @param supabase - Client Supabase
 * @param filePath - Chemin du fichier dans le storage
 * @throws Error si la suppression échoue
 */
async function deleteFileFromStorage(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  filePath: string
): Promise<void> {
  const bucket = supabase.storage.from('comment-attachments');
  const { error: deleteStorageError } = await bucket.remove([filePath]);

  if (deleteStorageError) {
    throw createError.supabaseError(
      'Erreur lors de la suppression du fichier',
      new Error(deleteStorageError.message)
    );
  }
}

/**
 * Supprime les métadonnées d'une pièce jointe
 * 
 * @param supabase - Client Supabase
 * @param attachmentId - UUID de la pièce jointe
 * @throws Error si la suppression échoue
 */
async function deleteAttachmentMetadata(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  attachmentId: string
): Promise<void> {
  const { error: deleteMetaError } = await supabase
    .from('comment_attachments')
    .delete()
    .eq('id', attachmentId);

  if (deleteMetaError) {
    throw createError.supabaseError(
      'Erreur lors de la suppression des métadonnées',
      new Error(deleteMetaError.message)
    );
  }
}

/**
 * Supprime une pièce jointe d'un commentaire
 * 
 * @param attachmentId - UUID de la pièce jointe
 * @param filePath - Chemin du fichier dans le storage
 * @throws Error si la suppression échoue
 */
export async function deleteCommentAttachment(
  attachmentId: string,
  filePath: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();

  await deleteFileFromStorage(supabase, filePath);
  await deleteAttachmentMetadata(supabase, attachmentId);
}

