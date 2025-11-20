/**
 * Fonctions pour synchroniser manuellement un ticket JIRA vers Supabase
 * Utile pour tester ou corriger des tickets non synchronisés
 */

import { createSupabaseServerClient, createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { syncJiraToSupabase, type JiraIssueData } from './sync';

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
 * Récupère les données d'un ticket JIRA via l'API
 * 
 * @param jiraIssueKey - Clé du ticket JIRA (ex: "OD-2991")
 * @returns Les données du ticket JIRA ou null si erreur
 */
export async function fetchJiraIssue(jiraIssueKey: string): Promise<JiraIssueData | null> {
  try {
    const config = getJiraConfig();

    const response = await fetch(`${config.url}/rest/api/3/issue/${jiraIssueKey}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${config.auth}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur lors de la récupération du ticket JIRA ${jiraIssueKey}:`, errorText);
      return null;
    }

    const jiraIssue = await response.json();

    // Transformer le format JIRA API vers notre format JiraIssueData
    const jiraData: JiraIssueData = {
      key: jiraIssue.key,
      id: jiraIssue.id,
      summary: jiraIssue.fields.summary || '',
      description: typeof jiraIssue.fields.description === 'string' 
        ? jiraIssue.fields.description 
        : JSON.stringify(jiraIssue.fields.description || {}),
      status: {
        name: jiraIssue.fields.status?.name || ''
      },
      priority: {
        name: jiraIssue.fields.priority?.name || ''
      },
      issuetype: {
        name: jiraIssue.fields.issuetype?.name || ''
      },
      reporter: jiraIssue.fields.reporter ? {
        accountId: jiraIssue.fields.reporter.accountId,
        displayName: jiraIssue.fields.reporter.displayName
      } : undefined,
      assignee: jiraIssue.fields.assignee ? {
        accountId: jiraIssue.fields.assignee.accountId,
        displayName: jiraIssue.fields.assignee.displayName
      } : undefined,
      resolution: jiraIssue.fields.resolution ? {
        name: jiraIssue.fields.resolution.name
      } : undefined,
      fixVersions: jiraIssue.fields.fixVersions?.map((fv: any) => ({ name: fv.name })) || [],
      created: jiraIssue.fields.created || '',
      updated: jiraIssue.fields.updated || '',
      labels: jiraIssue.fields.labels || [],
      components: jiraIssue.fields.components?.map((c: any) => ({ name: c.name })) || [],
      // Custom fields
      customfield_10020: jiraIssue.fields.customfield_10020,
      customfield_10021: jiraIssue.fields.customfield_10021,
      customfield_10045: jiraIssue.fields.customfield_10045,
      customfield_10052: jiraIssue.fields.customfield_10052,
      customfield_10053: jiraIssue.fields.customfield_10053,
      customfield_10054: jiraIssue.fields.customfield_10054,
      customfield_10055: jiraIssue.fields.customfield_10055,
      customfield_10057: jiraIssue.fields.customfield_10057,
      customfield_10083: jiraIssue.fields.customfield_10083,
      customfield_10084: jiraIssue.fields.customfield_10084,
      customfield_10111: jiraIssue.fields.customfield_10111,
      customfield_10115: jiraIssue.fields.customfield_10115
    };

    return jiraData;
  } catch (error) {
    console.error(`Erreur lors de la récupération du ticket JIRA ${jiraIssueKey}:`, error);
    return null;
  }
}

/**
 * Synchronise manuellement un ticket depuis JIRA vers Supabase
 * 
 * @param jiraIssueKey - Clé du ticket JIRA (ex: "OD-2991")
 * @returns true si la synchronisation a réussi
 */
export async function syncTicketFromJira(jiraIssueKey: string): Promise<boolean> {
  try {
    // Utiliser Service Role pour contourner les RLS (synchronisation système)
    const supabase = createSupabaseServiceRoleClient();

    // 1. Trouver le ticket Supabase correspondant
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('id, ticket_type')
      .eq('jira_issue_key', jiraIssueKey)
      .single();

    if (ticketError || !ticket) {
      console.error(`Ticket Supabase non trouvé pour ${jiraIssueKey}`);
      return false;
    }

    // 2. Récupérer les données JIRA
    const jiraData = await fetchJiraIssue(jiraIssueKey);
    if (!jiraData) {
      console.error(`Impossible de récupérer les données JIRA pour ${jiraIssueKey}`);
      return false;
    }

    // 3. Synchroniser vers Supabase (passer explicitement le client Service Role)
    await syncJiraToSupabase(ticket.id, jiraData, supabase);

    console.log(`✅ Ticket ${jiraIssueKey} synchronisé avec succès`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la synchronisation de ${jiraIssueKey}:`, error);
    return false;
  }
}

/**
 * Synchronise tous les tickets avec jira_issue_key depuis JIRA
 * Utile pour une synchronisation en masse
 * 
 * @param limit - Nombre maximum de tickets à synchroniser (défaut: 50)
 * @returns Nombre de tickets synchronisés avec succès
 */
export async function syncAllTicketsFromJira(limit: number = 50): Promise<number> {
  try {
    // Utiliser Service Role pour contourner les RLS (synchronisation système)
    const supabase = createSupabaseServiceRoleClient();

    // Récupérer tous les tickets avec jira_issue_key
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, jira_issue_key')
      .not('jira_issue_key', 'is', null)
      .limit(limit);

    if (error || !tickets) {
      console.error('Erreur lors de la récupération des tickets:', error);
      return 0;
    }

    let successCount = 0;
    for (const ticket of tickets) {
      if (ticket.jira_issue_key) {
        const success = await syncTicketFromJira(ticket.jira_issue_key);
        if (success) {
          successCount++;
        }
        // Attendre un peu entre chaque synchronisation pour éviter de surcharger l'API JIRA
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`✅ ${successCount}/${tickets.length} tickets synchronisés`);
    return successCount;
  } catch (error) {
    console.error('Erreur lors de la synchronisation en masse:', error);
    return 0;
  }
}

