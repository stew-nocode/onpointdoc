import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
import type { TicketAttachment } from '@/services/tickets/attachments/crud';

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
 * Extrait le nom du fichier depuis le chemin complet
 * 
 * @param filePath - Chemin complet du fichier
 * @returns Nom du fichier
 */
function extractFileNameFromPath(filePath: string): string {
  const parts = filePath.split('/');
  return parts[parts.length - 1] || 'file';
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
  const bucket = supabase.storage.from('ticket-attachments');
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
 * Crée un FormData pour l'upload vers JIRA
 * 
 * @param fileBuffer - Buffer du fichier à uploader
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @returns FormData prêt pour l'upload
 */
function createJiraFormData(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string | null
): FormData {
  const formData = new FormData();
  const arrayBuffer = bufferToArrayBuffer(fileBuffer);
  const blob = new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
  formData.append('file', blob, fileName);
  return formData;
}

/**
 * Upload un fichier vers JIRA
 * 
 * @param config - Configuration JIRA
 * @param jiraIssueKey - Clé du ticket JIRA
 * @param fileBuffer - Buffer du fichier à uploader
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @throws ApplicationError si l'upload échoue
 */
async function uploadFileToJira(
  config: ReturnType<typeof getJiraConfig>,
  jiraIssueKey: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string | null
): Promise<void> {
  const formData = createJiraFormData(fileBuffer, fileName, mimeType);
  const url = `${config.url}/rest/api/3/issue/${jiraIssueKey}/attachments`;

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
 * Upload les pièces jointes d'un ticket vers JIRA
 * 
 * @param jiraIssueKey - Clé du ticket JIRA
 * @param ticketId - UUID du ticket Supabase
 * @throws ApplicationError si l'upload échoue
 */
export async function uploadTicketAttachmentsToJira(
  jiraIssueKey: string,
  ticketId: string
): Promise<void> {
  const { loadTicketAttachments } = await import('@/services/tickets/attachments/crud');
  const attachments = await loadTicketAttachments(ticketId);

  if (attachments.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const config = getJiraConfig();

  for (const attachment of attachments) {
    const fileBuffer = await downloadFileFromStorage(supabase, attachment.file_path);
    const fileName = extractFileNameFromPath(attachment.file_path);
    await uploadFileToJira(config, jiraIssueKey, fileBuffer, fileName, attachment.mime_type);
  }
}

