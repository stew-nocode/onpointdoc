# Guide : Extraire les correspondances OBCS depuis JIRA

## Objectif

Extraire toutes les correspondances OBCS → OD depuis JIRA en utilisant le champ **"Lien de ticket sortant (Duplicate)"** présent dans chaque ticket OD.

## Méthode recommandée : Utiliser le MCP JIRA dans Cursor

### Étape 1 : Identifier le champ dans JIRA

1. Ouvrez un ticket OD dans JIRA (ex: `OD-2373`)
2. Notez le nom exact du champ "Lien de ticket sortant (Duplicate)"
3. Vérifiez s'il s'agit d'un :
   - **Issue Link** de type "Duplicate" (dans les liens de ticket)
   - **Champ personnalisé** (customfield_XXXXX)

### Étape 2 : Utiliser le MCP JIRA

Le MCP JIRA peut être utilisé directement dans Cursor avec des commandes comme :
- `mcp_jira_jira_get_issue` pour récupérer un ticket avec tous ses champs
- `mcp_jira_jira_search` pour rechercher des tickets avec JQL

### Étape 3 : Script d'extraction

Un script est disponible : `scripts/extract-obcs-correspondances-from-jira.mjs`

**Prérequis :**
- Variables JIRA dans `.env.local` :
  ```env
  JIRA_URL=https://votre-entreprise.atlassian.net
  JIRA_EMAIL=votre-email@example.com
  JIRA_API_TOKEN=votre-api-token
  ```

## Alternative : Export CSV depuis JIRA

1. Allez dans JIRA → Advanced Search
2. JQL : `project = OD`
3. Exportez en CSV avec les colonnes :
   - Key
   - Summary
   - "Lien de ticket sortant (Duplicate)" (ou le nom exact du champ)
4. Le script pourra ensuite parser ce CSV

## Statut actuel

- ✅ 1934 correspondances déjà dans `docs/ticket/correspondance - Jira (3).csv`
- ✅ 8 correspondances trouvées par titre exact
- ❓ 130+ tickets OBCS restants à mapper depuis JIRA





