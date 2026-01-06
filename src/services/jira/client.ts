/**
 * Client JIRA pour appels directs à l'API JIRA (sans N8N)
 * 
 * Ce service permet de créer et mettre à jour des tickets JIRA directement
 * depuis l'application Next.js, sans passer par N8N.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TicketType } from '@/types/ticket';
import { textToADF } from '@/lib/utils/adf-parser';
import { createError } from '@/lib/errors/types';

/**
 * Configuration JIRA depuis les variables d'environnement
 */
function getJiraConfig() {
  const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
  const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
  const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

  if (!jiraUrl || !jiraUsername || !jiraToken) {
    throw createError.configurationError(
      'Configuration JIRA manquante. Vérifiez JIRA_URL, JIRA_USERNAME et JIRA_TOKEN.',
      { missing: !jiraUrl ? 'JIRA_URL' : !jiraUsername ? 'JIRA_USERNAME' : 'JIRA_TOKEN' }
    );
  }

  // Nettoyer les valeurs
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
 * Type pour les données d'un ticket à créer dans JIRA
 */
export interface CreateJiraIssueInput {
  ticketId: string;
  title: string;
  description: string;
  ticketType: TicketType;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  canal?: string | null;
  productId?: string | null;
  moduleId?: string | null;
  customerContext?: string | null;
  bugType?: string | null;
  companyId?: string | null;
}

/**
 * Réponse de création d'issue JIRA
 */
export interface CreateJiraIssueResponse {
  success: boolean;
  jiraIssueKey?: string;
  jiraIssueId?: string;
  error?: string;
}

/**
 * Crée un ticket JIRA depuis un ticket Supabase
 * 
 * @param input - Données du ticket à créer dans JIRA
 * @returns Réponse avec la clé JIRA créée
 */
export async function createJiraIssue(input: CreateJiraIssueInput): Promise<CreateJiraIssueResponse> {
  try {
    const config = getJiraConfig();
    const supabase = await createSupabaseServerClient();

    // Récupérer les informations du produit et module
    let productName: string | null = null;
    let moduleName: string | null = null;

    if (input.productId) {
      const { data: product } = await supabase
        .from('products')
        .select('name')
        .eq('id', input.productId)
        .single();
      productName = product?.name || null;
    }

    if (input.moduleId) {
      const { data: module } = await supabase
        .from('modules')
        .select('name')
        .eq('id', input.moduleId)
        .single();
      moduleName = module?.name || null;
    }

    // Récupérer les informations de l'entreprise
    let companyName: string | null = null;
    let jiraCompanyId: number | null = null;
    if (input.companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select('name, jira_company_id')
        .eq('id', input.companyId)
        .single();
      companyName = company?.name || null;
      jiraCompanyId = company?.jira_company_id || null;
    }

    // Déterminer le type d'issue JIRA
    const jiraIssueType = input.ticketType === 'BUG' ? 'Bug' : 'Requêtes';

    // Mapper la priorité Supabase vers les IDs JIRA
    // JIRA utilise des IDs numériques : 1=Priorité 1 (Highest), 2=Priorité 2 (High), 3=Priorité 3 (Medium), 4=Priorité 4 (Lowest)
    const jiraPriorityIdMap: Record<string, string> = {
      'Low': '4',      // Priorité 4 (Lowest)
      'Medium': '3',   // Priorité 3 (Medium)
      'High': '2',     // Priorité 2 (High)
      'Critical': '1'  // Priorité 1 (Highest)
    };
    const jiraPriorityId = jiraPriorityIdMap[input.priority] || '3'; // Par défaut: Medium (Priorité 3)

    // Construire la description enrichie
    let descriptionText = input.description || '';
    
    if (input.customerContext || input.canal || productName || moduleName) {
      descriptionText += '\n\n---\n';
      descriptionText += '**Contexte Client** : ' + (input.customerContext || 'N/A') + '\n';
      descriptionText += '**Canal** : ' + (input.canal || 'N/A') + '\n';
      descriptionText += '**Produit** : ' + (productName || 'N/A') + '\n';
      if (moduleName) {
        descriptionText += '**Module** : ' + moduleName + '\n';
      }
      if (input.bugType) {
        descriptionText += '**Type de bug** : ' + input.bugType + '\n';
      }
    }

    // Convertir la description en format ADF (requis par JIRA API v3)
    const descriptionADF = textToADF(descriptionText);

    /**
     * Normalise un label JIRA en remplaçant les espaces par des underscores
     * JIRA n'accepte pas les espaces dans les labels
     */
    const normalizeJiraLabel = (value: string): string => {
      return value.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_:_-]/g, '');
    };

    // Préparer les labels (normalisés pour JIRA - pas d'espaces)
    const labels: string[] = [];
    if (input.canal) {
      labels.push(`canal:${normalizeJiraLabel(input.canal)}`);
    }
    if (productName) {
      labels.push(`product:${normalizeJiraLabel(productName)}`);
    }
    if (moduleName) {
      labels.push(`module:${normalizeJiraLabel(moduleName)}`);
    }

    // Préparer le payload JIRA
    // JIRA API v3 requiert ADF pour la description et un ID pour la priorité
    const jiraPayload: any = {
      fields: {
        project: {
          key: 'OD' // Projet OBC
        },
        summary: input.title,
        description: descriptionADF, // Format ADF (requis par JIRA API v3)
        issuetype: {
          name: jiraIssueType
        },
        priority: {
          id: jiraPriorityId // Utiliser l'ID numérique (requis par JIRA API v3)
        },
        labels: labels.length > 0 ? labels : undefined
      }
    };

    // Ajouter le custom field pour stocker l'ID Supabase (si configuré)
    // Note: Ne pas définir par défaut si la variable d'environnement n'est pas définie
    // car le custom field peut ne pas exister dans JIRA
    const supabaseTicketIdCustomField = process.env.JIRA_SUPABASE_TICKET_ID_FIELD;
    if (supabaseTicketIdCustomField && supabaseTicketIdCustomField.trim() !== '') {
      jiraPayload.fields[supabaseTicketIdCustomField.trim()] = input.ticketId;
    }

    // Ajouter l'entreprise (customfield_10045) si disponible
    // Format JIRA : tableau d'objets [{ id: number, value: string }]
    // JIRA attend un tableau même pour une seule valeur
    if (companyName && jiraCompanyId) {
      jiraPayload.fields.customfield_10045 = [{
        id: jiraCompanyId.toString(),
        value: companyName
      }];
    } else if (companyName) {
      // Si pas de jira_company_id, essayer avec juste le nom (JIRA peut le mapper)
      // Note: Cela peut échouer si l'entreprise n'existe pas dans JIRA
      jiraPayload.fields.customfield_10045 = [{
        value: companyName
      }];
    }

    // Appel à l'API JIRA avec retry
    const { withRetrySafe, JIRA_RETRY_CONFIG } = await import('@/lib/utils/retry');

    const result = await withRetrySafe(
      async () => {
        const response = await fetch(`${config.url}/rest/api/3/issue`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${config.auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jiraPayload)
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Erreurs 4xx ne sont pas retryables (sauf 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`JIRA_NON_RETRYABLE: ${response.status}: ${errorText}`);
          }
          throw new Error(`JIRA ${response.status}: ${errorText}`);
        }

        return await response.json();
      },
      {
        ...JIRA_RETRY_CONFIG,
        onRetry: (err, attempt, delay) => {
          console.warn(
            `[JIRA] Retry ${attempt} pour création ticket après erreur: ${err.message}. Délai: ${delay}ms`
          );
        }
      }
    );

    if (!result.success) {
      const errorMessage = result.error?.message ?? 'Erreur inconnue';
      
      // Extraire le code HTTP et le message JIRA si disponible
      // Supporte les formats: "JIRA 400:", "JIRA_NON_RETRYABLE: 400:", etc.
      const httpMatch = errorMessage.match(/(?:JIRA|JIRA_NON_RETRYABLE)[\s:]+(\d+)[\s:]+/);
      const httpCode = httpMatch ? httpMatch[1] : 'unknown';
      
      // Extraire le message d'erreur JIRA (après le code HTTP)
      // Supporte les formats: "JIRA 400: {...}", "JIRA_NON_RETRYABLE: 400: {...}"
      const jiraErrorMatch = errorMessage.match(/(?:JIRA|JIRA_NON_RETRYABLE)[\s:]+(?:\d+)[\s:]+(.+)/);
      const jiraErrorText = jiraErrorMatch ? jiraErrorMatch[1] : errorMessage;
      
      console.error('[JIRA] Échec création ticket après retries:', {
        httpCode,
        error: jiraErrorText,
        ticketId: input.ticketId,
        ticketType: input.ticketType,
        attempts: result.attempts,
        fullError: errorMessage
      });
      
      return {
        success: false,
        error: `JIRA ${httpCode}: ${jiraErrorText.substring(0, 200)}` // Limiter à 200 caractères
      };
    }

    return {
      success: true,
      jiraIssueKey: result.data.key,
      jiraIssueId: result.data.id
    };

  } catch (error) {
    console.error('Erreur lors de la création du ticket JIRA:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
}

/**
 * Met à jour le statut d'un ticket JIRA
 * 
 * @param jiraIssueKey - Clé du ticket JIRA (ex: OD-1234)
 * @param statusName - Nom du nouveau statut (ex: "Traitement en Cours")
 * @returns true si la mise à jour a réussi
 */
export async function updateJiraIssueStatus(
  jiraIssueKey: string,
  statusName: string
): Promise<boolean> {
  try {
    const config = getJiraConfig();

    // Récupérer les transitions disponibles pour ce ticket
    const transitionsResponse = await fetch(
      `${config.url}/rest/api/3/issue/${jiraIssueKey}/transitions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!transitionsResponse.ok) {
      console.error('Erreur lors de la récupération des transitions JIRA');
      return false;
    }

    const transitionsData = await transitionsResponse.json();
    const transitions = transitionsData.transitions || [];

    // Trouver la transition correspondant au statut cible
    const targetTransition = transitions.find((t: any) => 
      t.to?.name === statusName || t.name?.toLowerCase().includes(statusName.toLowerCase())
    );

    if (!targetTransition) {
      console.warn(`Aucune transition trouvée pour le statut "${statusName}"`);
      return false;
    }

    // Exécuter la transition
    const updateResponse = await fetch(
      `${config.url}/rest/api/3/issue/${jiraIssueKey}/transitions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${config.auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transition: {
            id: targetTransition.id
          }
        })
      }
    );

    return updateResponse.ok;

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut JIRA:', error);
    return false;
  }
}

/**
 * Supprime un ticket JIRA
 * 
 * @param jiraIssueKey - Clé du ticket JIRA (ex: OD-1234)
 * @throws ApplicationError si la suppression échoue
 */
export async function deleteJiraIssue(jiraIssueKey: string): Promise<void> {
  const config = getJiraConfig();

  const response = await fetch(`${config.url}/rest/api/3/issue/${jiraIssueKey}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Basic ${config.auth}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    
    // ✅ Si le ticket est déjà supprimé dans JIRA (404), considérer comme succès
    // Le ticket n'existe plus dans JIRA, on peut continuer la suppression dans Supabase
    if (response.status === 404) {
      // Log pour information mais ne pas faire échouer la suppression
      console.log(`[JIRA] Ticket ${jiraIssueKey} déjà supprimé dans JIRA (404), continuation de la suppression dans Supabase`);
      return; // Retourner sans erreur
    }
    
    if (response.status >= 400 && response.status < 500) {
      throw createError.jiraError(
        `Impossible de supprimer le ticket JIRA ${jiraIssueKey}: ${response.status}`,
        undefined,
        { status: response.status, jiraIssueKey, error: errorText.substring(0, 200) }
      );
    }
    
    throw createError.jiraError(
      `Erreur lors de la suppression du ticket JIRA ${jiraIssueKey}: ${response.status}`,
      undefined,
      { status: response.status, jiraIssueKey, error: errorText.substring(0, 200) }
    );
  }
}

