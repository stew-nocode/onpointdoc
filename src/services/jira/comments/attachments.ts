import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import type { CommentAttachment } from '@/services/tickets/comments';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Configuration JIRA depuis les variables d'environnement
 */
function getJiraConfig() {
  const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
  const jiraUsername =
    process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
  const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

  if (!jiraUrl || !jiraUsername || !jiraToken) {
    throw createError.configurationError('Configuration JIRA manquante');
  }

  const cleanUrl = jiraUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();
  const cleanUsername = jiraUsername.replace(/^["']|["']$/g, '').trim();
  const cleanToken = jiraToken.replace(/^["']|["']$/g, '').replace(/\s+/g, '').trim();

  return {
    url: cleanUrl,
    username: cleanUsername,
    token: cleanToken,
    auth: Buffer.from(`${cleanUsername}:${cleanToken}`).toString('base64')
  };
}

/**
 * Convertit un Buffer en ArrayBuffer pour la compatibilité Blob
 * 
 * @param buffer - Buffer à convertir
 * @returns ArrayBuffer
 */
function bufferToArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const uint8Array = new Uint8Array(arrayBuffer);
  uint8Array.set(buffer);
  return arrayBuffer;
}

/**
 * Télécharge un fichier depuis Supabase Storage
 * 
 * @param supabase - Client Supabase
 * @param filePath - Chemin du fichier dans le storage
 * @returns Buffer du fichier téléchargé
 * @throws ApplicationError si le téléchargement échoue
 */
async function downloadFileFromStorage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  filePath: string
): Promise<Buffer> {
  const bucket = supabase.storage.from('comment-attachments');
  const { data, error } = await bucket.download(filePath);

  if (error || !data) {
    throw createError.supabaseError(
      `Erreur lors du téléchargement du fichier ${filePath}`,
      error ? new Error(error.message) : undefined
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload un fichier vers JIRA en tant que pièce jointe de commentaire
 * 
 * @param config - Configuration JIRA
 * @param jiraIssueKey - Clé du ticket JIRA
 * @param jiraCommentId - ID du commentaire JIRA
 * @param fileBuffer - Buffer du fichier à uploader
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @throws ApplicationError si l'upload échoue
 */
async function uploadFileToJiraComment(
  config: ReturnType<typeof getJiraConfig>,
  jiraIssueKey: string,
  jiraCommentId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string | null
): Promise<void> {
  const formData = new FormData();
  const arrayBuffer = bufferToArrayBuffer(fileBuffer);
  const blob = new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
  formData.append('file', blob, fileName);

  const url = `${config.url}/rest/api/3/issue/${jiraIssueKey}/comment/${jiraCommentId}/attachments`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${config.auth}`,
      'X-Atlassian-Token': 'no-check'
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw createError.jiraError(
      `Erreur lors de l'upload de ${fileName} vers JIRA`,
      new Error(`JIRA ${response.status}: ${errorText}`)
    );
  }
}

/**
 * Upload les pièces jointes d'un commentaire vers JIRA
 * 
 * @param jiraIssueKey - Clé du ticket JIRA
 * @param jiraCommentId - ID du commentaire JIRA
 * @param commentId - UUID du commentaire Supabase
 * @throws ApplicationError si l'upload échoue
 */
export async function uploadCommentAttachmentsToJira(
  jiraIssueKey: string,
  jiraCommentId: string,
  commentId: string
): Promise<void> {
  const { loadCommentAttachments } = await import('@/services/tickets/comments/attachments/crud');
  const attachments = await loadCommentAttachments(commentId);

  if (attachments.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const config = getJiraConfig();

  for (const attachment of attachments) {
    const fileBuffer = await downloadFileFromStorage(supabase, attachment.file_path);
    await uploadFileToJiraComment(
      config,
      jiraIssueKey,
      jiraCommentId,
      fileBuffer,
      attachment.file_name,
      attachment.mime_type
    );
  }
}

/**
 * Télécharge un fichier depuis JIRA
 * 
 * @param attachmentUrl - URL du fichier dans JIRA
 * @returns Buffer du fichier téléchargé
 * @throws ApplicationError si le téléchargement échoue
 */
async function downloadFileFromJira(attachmentUrl: string): Promise<Buffer> {
  const config = getJiraConfig();

  const response = await fetch(attachmentUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${config.auth}`,
      'Accept': '*/*'
    }
  });

  if (!response.ok) {
    throw createError.jiraError(
      'Erreur lors du téléchargement du fichier depuis JIRA',
      new Error(`JIRA ${response.status}`)
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Génère le chemin de stockage pour un fichier de commentaire
 * 
 * @param commentId - UUID du commentaire
 * @param fileName - Nom du fichier
 * @returns Chemin de stockage
 */
function generateCommentStoragePath(commentId: string, fileName: string): string {
  return `${commentId}/${Date.now()}-${fileName}`;
}

/**
 * Crée un Blob à partir d'un Buffer
 * 
 * @param fileBuffer - Buffer du fichier
 * @param mimeType - Type MIME du fichier
 * @returns Blob prêt pour l'upload
 */
function createCommentBlobFromBuffer(fileBuffer: Buffer, mimeType: string | undefined): Blob {
  const arrayBuffer = bufferToArrayBuffer(fileBuffer);
  return new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
}

/**
 * Upload un fichier vers Supabase Storage (comment-attachments)
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire
 * @param fileBuffer - Buffer du fichier à uploader
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @throws ApplicationError si l'upload échoue
 */
async function uploadFileToSupabaseStorage(
  supabase: SupabaseClient,
  commentId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string | undefined
): Promise<string> {
  const bucket = supabase.storage.from('comment-attachments');
  const filePath = generateCommentStoragePath(commentId, fileName);
  const blob = createCommentBlobFromBuffer(fileBuffer, mimeType);

  const { error: uploadError } = await bucket.upload(filePath, blob, {
    cacheControl: '3600',
    upsert: false
  });

  if (uploadError) {
    throw createError.supabaseError(
      `Erreur lors de l'upload de ${fileName} vers Supabase Storage`,
      new Error(uploadError.message)
    );
  }

  return filePath;
}

/**
 * Construit les métadonnées d'une pièce jointe de commentaire pour Supabase
 * 
 * @param commentId - UUID du commentaire
 * @param filePath - Chemin du fichier dans le storage
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @param sizeBytes - Taille du fichier en octets
 * @returns Métadonnées formatées
 */
function buildCommentAttachmentMetadata(
  commentId: string,
  filePath: string,
  fileName: string,
  mimeType: string | undefined,
  sizeBytes: number
): {
  comment_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_kb: number;
} {
  return {
    comment_id: commentId,
    file_path: filePath,
    file_name: fileName,
    mime_type: mimeType || null,
    size_kb: Math.ceil(sizeBytes / 1024)
  };
}

/**
 * Enregistre les métadonnées d'une pièce jointe de commentaire dans Supabase
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire
 * @param filePath - Chemin du fichier dans le storage
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @param sizeBytes - Taille du fichier en octets
 * @throws ApplicationError si l'enregistrement échoue
 */
async function saveCommentAttachmentMetadata(
  supabase: SupabaseClient,
  commentId: string,
  filePath: string,
  fileName: string,
  mimeType: string | undefined,
  sizeBytes: number
): Promise<void> {
  const metadata = buildCommentAttachmentMetadata(commentId, filePath, fileName, mimeType, sizeBytes);
  const { error } = await supabase.from('comment_attachments').insert(metadata);

  if (error) {
    throw createError.supabaseError(
      `Erreur lors de l'enregistrement des métadonnées pour ${fileName}`,
      new Error(error.message)
    );
  }
}

/**
 * Vérifie si une pièce jointe JIRA existe déjà dans Supabase
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire
 * @param fileName - Nom du fichier JIRA
 * @returns true si la pièce jointe existe déjà
 */
async function commentAttachmentExists(
  supabase: SupabaseClient,
  commentId: string,
  fileName: string
): Promise<boolean> {
  const { data } = await supabase
    .from('comment_attachments')
    .select('id')
    .eq('comment_id', commentId)
    .ilike('file_name', fileName)
    .limit(1)
    .maybeSingle();

  return data !== null;
}

/**
 * Traite une pièce jointe JIRA de commentaire individuelle
 * 
 * @param supabase - Client Supabase
 * @param commentId - UUID du commentaire
 * @param jiraAttachment - Pièce jointe JIRA à traiter
 * @throws ApplicationError si le traitement échoue
 */
async function processSingleCommentAttachment(
  supabase: SupabaseClient,
  commentId: string,
  jiraAttachment: { id: string; filename: string; content: string; mimeType?: string; size: number }
): Promise<void> {
  const exists = await commentAttachmentExists(supabase, commentId, jiraAttachment.filename);

  if (exists) {
    return;
  }

  const fileBuffer = await downloadFileFromJira(jiraAttachment.content);
  const filePath = await uploadFileToSupabaseStorage(
    supabase,
    commentId,
    fileBuffer,
    jiraAttachment.filename,
    jiraAttachment.mimeType
  );

  await saveCommentAttachmentMetadata(
    supabase,
    commentId,
    filePath,
    jiraAttachment.filename,
    jiraAttachment.mimeType,
    jiraAttachment.size
  );
}

/**
 * Télécharge les pièces jointes d'un commentaire JIRA vers Supabase Storage
 * 
 * @param jiraCommentId - ID du commentaire JIRA
 * @param commentId - UUID du commentaire Supabase
 * @param jiraAttachments - Liste des pièces jointes JIRA
 * @param supabaseClient - Client Supabase (Service Role pour webhooks)
 * @throws ApplicationError si le téléchargement échoue
 */
export async function downloadJiraCommentAttachmentsToSupabase(
  jiraCommentId: string,
  commentId: string,
  jiraAttachments: Array<{ id: string; filename: string; content: string; mimeType?: string; size: number }>,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || createSupabaseServiceRoleClient();

  if (jiraAttachments.length === 0) {
    return;
  }

  for (const jiraAttachment of jiraAttachments) {
    await processSingleCommentAttachment(supabase, commentId, jiraAttachment);
  }
}

