/**
 * Types pour les données JIRA
 * Utilisés pour la synchronisation JIRA ↔ Supabase
 */

/**
 * Structure de base d'une issue JIRA
 */
export type JiraIssueData = {
  key: string;
  id: string;
  summary?: string;
  description?: string;
  status: {
    name: string;
    id?: string;
  };
  priority: {
    name: string;
    id?: string;
  };
  assignee?: {
    accountId: string;
    displayName?: string;
    emailAddress?: string;
  } | null;
  reporter?: {
    accountId: string;
    displayName?: string;
    emailAddress?: string;
  } | null;
  resolution?: {
    name: string;
    id?: string;
  } | null;
  fixVersions?: Array<{
    name: string;
    id?: string;
  }>;
  labels?: string[];
  components?: Array<{
    name: string;
    id?: string;
  }>;
  // Champs personnalisés JIRA (dynamic)
  [key: string]: unknown;
};

/**
 * Type pour les valeurs de champs personnalisés JIRA
 * Peut être string, object avec value/name, ou array
 */
export type JiraCustomFieldValue =
  | string
  | { value?: string; name?: string; id?: string; [key: string]: unknown }
  | Array<string | { value?: string; name?: string; [key: string]: unknown }>
  | null
  | undefined;

/**
 * Helper pour extraire la valeur d'un champ personnalisé JIRA
 */
export function extractJiraCustomFieldValue(fieldValue: JiraCustomFieldValue): string | null {
  if (!fieldValue) return null;

  if (typeof fieldValue === 'string') {
    return fieldValue;
  }

  if (Array.isArray(fieldValue)) {
    const values = fieldValue
      .map((v) => {
        if (typeof v === 'string') return v;
        return v?.value || v?.name || null;
      })
      .filter((v): v is string => Boolean(v));
    return values.length > 0 ? values.join(', ') : null;
  }

  if (typeof fieldValue === 'object') {
    return fieldValue.value || fieldValue.name || null;
  }

  return null;
}

