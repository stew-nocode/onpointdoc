/**
 * Client JIRA pour appels directs à l'API JIRA (sans N8N)
 * 
 * Ce service permet de créer et mettre à jour des tickets JIRA directement
 * depuis l'application Next.js, sans passer par N8N.
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { TicketType } from '@/types/ticket';
import { textToADF } from '@/lib/utils/adf-parser';

/**
 * Configuration JIRA depuis les variables d'environnement
 */
function getJiraConfig() {
  const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
  const jiraUsername = process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || process.env.JIRA_API_EMAIL;
  const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

  if (!jiraUrl || !jiraUsername || !jiraToken) {
    throw new Error('Configuration JIRA manquante. Vérifiez JIRA_URL, JIRA_USERNAME et JIRA_TOKEN.');
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

    // Préparer les labels
    const labels: string[] = [];
    if (input.canal) {
      labels.push(`canal:${input.canal}`);
    }
    if (productName) {
      labels.push(`product:${productName}`);
    }
    if (moduleName) {
      labels.push(`module:${moduleName}`);
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
    // Note: Remplacer customfield_10001 par le custom field réel dans votre JIRA
    const supabaseTicketIdCustomField = process.env.JIRA_SUPABASE_TICKET_ID_FIELD || 'customfield_10001';
    if (supabaseTicketIdCustomField) {
      jiraPayload.fields[supabaseTicketIdCustomField] = input.ticketId;
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
      console.error('Erreur lors de la création du ticket JIRA après retries:', result.error);
      return {
        success: false,
        error: result.error?.message ?? 'Erreur inconnue'
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

