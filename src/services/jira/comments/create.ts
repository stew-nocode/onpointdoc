/**
 * Service pour créer des commentaires dans JIRA depuis Supabase
 * 
 * Ce service permet de créer des commentaires dans JIRA lorsque
 * un commentaire est créé dans Supabase pour un ticket lié à JIRA.
 */

import { createError } from '@/lib/errors/types';
import { textToADF } from '@/lib/utils/adf-parser';
import { uploadCommentAttachmentsToJira } from './attachments';

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
 * Type pour la réponse de création d'un commentaire JIRA
 */
export interface CreateJiraCommentResponse {
  success: boolean;
  jiraCommentId?: string;
  error?: string;
}

/**
 * Crée un commentaire dans JIRA depuis Supabase
 * 
 * Note sur la gestion des boucles :
 * - Quand un commentaire est créé dans JIRA, le webhook JIRA peut créer
 *   un nouveau commentaire Supabase avec origin='jira'
 * - Le commentaire original Supabase a origin='app', donc ils sont distincts
 * - Pour éviter les doublons à l'avenir, on pourrait stocker jira_comment_id
 *   dans ticket_comments et vérifier dans le webhook si le commentaire existe déjà
 * 
 * @param jiraIssueKey - Clé du ticket JIRA (ex: OD-1234)
 * @param content - Contenu du commentaire (texte brut)
 * @param commentId - UUID du commentaire Supabase (pour uploader les pièces jointes)
 * @returns Réponse avec l'ID du commentaire JIRA créé
 * @throws ApplicationError si la création échoue
 */
export async function createJiraComment(
  jiraIssueKey: string,
  content: string,
  commentId?: string
): Promise<CreateJiraCommentResponse> {
  try {
    const config = getJiraConfig();

    // Convertir le contenu texte en format ADF (requis par JIRA API v3)
    const contentADF = textToADF(content);

    // Préparer le payload JIRA
    // JIRA API v3 requiert ADF pour le body du commentaire
    const jiraPayload = {
      body: contentADF
    };

    // Appel à l'API JIRA pour créer le commentaire avec retry
    const { withRetry, JIRA_RETRY_CONFIG } = await import('@/lib/utils/retry');

    const jiraData = await withRetry(
      async () => {
        const response = await fetch(
          `${config.url}/rest/api/3/issue/${jiraIssueKey}/comment`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${config.auth}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(jiraPayload)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw createError.jiraError(
            `Erreur lors de la création du commentaire JIRA`,
            new Error(`JIRA ${response.status}: ${errorText}`)
          );
        }

        return await response.json();
      },
      {
        ...JIRA_RETRY_CONFIG,
        maxRetries: 2, // Moins de retries pour les commentaires
        onRetry: (err, attempt, delay) => {
          console.warn(
            `[JIRA] Retry ${attempt} pour commentaire sur ${jiraIssueKey}: ${err.message}. Délai: ${delay}ms`
          );
        }
      }
    );

    // Si le commentaire Supabase a des pièces jointes, les uploader vers JIRA
    if (commentId && jiraData.id) {
      try {
        await uploadCommentAttachmentsToJira(jiraIssueKey, jiraData.id, commentId);
      } catch (attachmentError) {
        // Ne pas faire échouer la création du commentaire si l'upload des pièces jointes échoue
        // Le commentaire a été créé avec succès
        // Logger l'erreur pour diagnostic
        console.error(
          'Erreur lors de l\'upload des pièces jointes du commentaire vers JIRA:',
          attachmentError
        );
      }
    }

    return {
      success: true,
      jiraCommentId: jiraData.id
    };
  } catch (error) {
    // Si c'est déjà une ApplicationError, la relancer
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    // Sinon, créer une erreur générique
    throw createError.jiraError(
      'Erreur lors de la création du commentaire JIRA',
      error instanceof Error ? error : new Error('Erreur inconnue')
    );
  }
}








