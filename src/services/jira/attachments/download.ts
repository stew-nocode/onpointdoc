import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { createError } from '@/lib/errors/types';
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
 * Type pour une pièce jointe JIRA
 */
type JiraAttachment = {
  id: string;
  filename: string;
  content: string;
  mimeType?: string;
  size: number;
};

/**
 * Fait la requête HTTP pour récupérer les pièces jointes JIRA
 * 
 * @param config - Configuration JIRA
 * @param jiraIssueKey - Clé du ticket JIRA
 * @returns Réponse HTTP
 * @throws ApplicationError si la requête échoue
 */
async function fetchJiraIssueWithAttachments(
  config: ReturnType<typeof getJiraConfig>,
  jiraIssueKey: string
): Promise<Response> {
  const url = `${config.url}/rest/api/3/issue/${jiraIssueKey}?fields=attachment`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${config.auth}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw createError.jiraError(
      `Erreur lors de la récupération des pièces jointes JIRA pour ${jiraIssueKey}`,
      new Error(`JIRA ${response.status}: ${errorText}`)
    );
  }

  return response;
}

/**
 * Transforme les pièces jointes brutes JIRA en format typé
 * 
 * @param attachments - Liste des pièces jointes brutes JIRA
 * @returns Liste des pièces jointes typées
 */
function mapJiraAttachments(attachments: any[]): JiraAttachment[] {
  return attachments.map((att: any) => ({
    id: att.id,
    filename: att.filename,
    content: att.content,
    mimeType: att.mimeType,
    size: att.size
  }));
}

/**
 * Récupère les pièces jointes d'un ticket JIRA
 * 
 * @param jiraIssueKey - Clé du ticket JIRA
 * @returns Liste des pièces jointes JIRA
 * @throws ApplicationError si la récupération échoue
 */
async function fetchJiraAttachments(jiraIssueKey: string): Promise<JiraAttachment[]> {
  const config = getJiraConfig();
  const response = await fetchJiraIssueWithAttachments(config, jiraIssueKey);
  const issueData = await response.json();
  const attachments = issueData.fields?.attachment || [];
  return mapJiraAttachments(attachments);
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
      `Erreur lors du téléchargement du fichier depuis JIRA`,
      new Error(`JIRA ${response.status}`)
    );
  }

  const arrayBuffer = await response.arrayBuffer();
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
 * Génère le chemin de stockage pour un fichier
 * 
 * @param ticketId - UUID du ticket
 * @param fileName - Nom du fichier
 * @returns Chemin de stockage
 */
function generateStoragePath(ticketId: string, fileName: string): string {
  return `${ticketId}/${Date.now()}-${fileName}`;
}

/**
 * Crée un Blob à partir d'un Buffer
 * 
 * @param fileBuffer - Buffer du fichier
 * @param mimeType - Type MIME du fichier
 * @returns Blob prêt pour l'upload
 */
function createBlobFromBuffer(fileBuffer: Buffer, mimeType: string | undefined): Blob {
  const arrayBuffer = bufferToArrayBuffer(fileBuffer);
  return new Blob([arrayBuffer], { type: mimeType || 'application/octet-stream' });
}

/**
 * Upload un fichier vers Supabase Storage
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @param fileBuffer - Buffer du fichier à uploader
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @throws ApplicationError si l'upload échoue
 */
async function uploadFileToSupabaseStorage(
  supabase: SupabaseClient,
  ticketId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string | undefined
): Promise<string> {
  const bucket = supabase.storage.from('ticket-attachments');
  const filePath = generateStoragePath(ticketId, fileName);
  const blob = createBlobFromBuffer(fileBuffer, mimeType);

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
 * Construit les métadonnées d'une pièce jointe pour Supabase
 * 
 * @param ticketId - UUID du ticket
 * @param filePath - Chemin du fichier dans le storage
 * @param mimeType - Type MIME du fichier
 * @param sizeBytes - Taille du fichier en octets
 * @returns Métadonnées formatées
 */
function buildAttachmentMetadata(
  ticketId: string,
  filePath: string,
  mimeType: string | undefined,
  sizeBytes: number
): { ticket_id: string; file_path: string; mime_type: string | null; size_kb: number } {
  return {
    ticket_id: ticketId,
    file_path: filePath,
    mime_type: mimeType || null,
    size_kb: Math.ceil(sizeBytes / 1024)
  };
}

/**
 * Enregistre les métadonnées d'une pièce jointe dans Supabase
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @param filePath - Chemin du fichier dans le storage
 * @param fileName - Nom du fichier
 * @param mimeType - Type MIME du fichier
 * @param sizeBytes - Taille du fichier en octets
 * @throws ApplicationError si l'enregistrement échoue
 */
async function saveAttachmentMetadata(
  supabase: SupabaseClient,
  ticketId: string,
  filePath: string,
  fileName: string,
  mimeType: string | undefined,
  sizeBytes: number
): Promise<void> {
  const metadata = buildAttachmentMetadata(ticketId, filePath, mimeType, sizeBytes);
  const { error } = await supabase.from('ticket_attachments').insert(metadata);

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
 * @param ticketId - UUID du ticket
 * @param fileName - Nom du fichier JIRA
 * @returns true si la pièce jointe existe déjà
 */
async function attachmentExists(
  supabase: SupabaseClient,
  ticketId: string,
  fileName: string
): Promise<boolean> {
  const { data } = await supabase
    .from('ticket_attachments')
    .select('id')
    .eq('ticket_id', ticketId)
    .ilike('file_path', `%${fileName}`)
    .limit(1)
    .maybeSingle();

  return data !== null;
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
 * Traite une pièce jointe JIRA individuelle
 * 
 * @param supabase - Client Supabase
 * @param ticketId - UUID du ticket
 * @param jiraAttachment - Pièce jointe JIRA à traiter
 * @throws ApplicationError si le traitement échoue
 */
async function processSingleAttachment(
  supabase: SupabaseClient,
  ticketId: string,
  jiraAttachment: JiraAttachment
): Promise<void> {
  const exists = await attachmentExists(supabase, ticketId, jiraAttachment.filename);

  if (exists) {
    return;
  }

  const fileBuffer = await downloadFileFromJira(jiraAttachment.content);
  const filePath = await uploadFileToSupabaseStorage(
    supabase,
    ticketId,
    fileBuffer,
    jiraAttachment.filename,
    jiraAttachment.mimeType
  );

  await saveAttachmentMetadata(
    supabase,
    ticketId,
    filePath,
    jiraAttachment.filename,
    jiraAttachment.mimeType,
    jiraAttachment.size
  );
}

/**
 * Télécharge les pièces jointes d'un ticket JIRA vers Supabase Storage
 * 
 * @param jiraIssueKey - Clé du ticket JIRA
 * @param ticketId - UUID du ticket Supabase
 * @param supabaseClient - Client Supabase (Service Role pour webhooks)
 * @throws ApplicationError si le téléchargement échoue
 */
export async function downloadJiraAttachmentsToSupabase(
  jiraIssueKey: string,
  ticketId: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || createSupabaseServiceRoleClient();
  const jiraAttachments = await fetchJiraAttachments(jiraIssueKey);

  if (jiraAttachments.length === 0) {
    return;
  }

  for (const jiraAttachment of jiraAttachments) {
    await processSingleAttachment(supabase, ticketId, jiraAttachment);
  }
}

