# Guide de Configuration N8N pour OnpointDoc

Ce guide explique comment configurer les workflows N8N pour l'intégration Supabase ↔ JIRA.

## Prérequis

- Instance N8N accessible (auto-hébergée ou cloud)
- Accès API JIRA avec token
- Accès Supabase avec Service Role Key
- Variables d'environnement configurées dans N8N

## Configuration des Variables d'Environnement

Dans N8N, allez dans **Settings → Environment Variables** et ajoutez :

```env
SUPABASE_URL=https://xjcttqaiplnoalolebls.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
JIRA_URL=https://votre-entreprise.atlassian.net
JIRA_EMAIL=votre-email@example.com
JIRA_API_TOKEN=votre-api-token
JIRA_PROJECT_KEY=PROJ
N8N_WEBHOOK_BASE_URL=https://votre-n8n.example.com
```

## Workflow 1 : Transfert Assistance → JIRA

### Étape 1 : Créer le Webhook Trigger

1. Créer un nouveau workflow dans N8N
2. Ajouter un node **Webhook**
3. Configurer :
   - **HTTP Method** : POST
   - **Path** : `/webhook/transfer-ticket`
   - **Response Mode** : Respond to Webhook
   - **Authentication** : Header Auth (optionnel, avec token)

### Étape 2 : Récupérer les Données du Ticket

1. Ajouter un node **Supabase**
2. Action : **Get**
3. Table : `tickets`
4. ID : `{{ $json.ticket_id }}`
5. Select : `*, product:products(*), module:modules(*)`

### Étape 3 : Mapper vers Format JIRA

1. Ajouter un node **Code** (Function)
2. Code JavaScript :

```javascript
const ticket = $input.item.json;

// Mapping des statuts
const statusMap = {
  'Low': 'Lowest',
  'Medium': 'Medium',
  'High': 'High',
  'Critical': 'Highest'
};

// Enrichir la description
const description = `
${ticket.description}

---
**Contexte Client** : ${ticket.customer_context || 'N/A'}
**Canal** : ${ticket.canal}
**Produit** : ${ticket.product?.name || 'N/A'}
**Module** : ${ticket.module?.name || 'N/A'}
`;

// Préparer les labels
const labels = [
  `canal:${ticket.canal}`,
  `product:${ticket.product?.name || 'unknown'}`,
  `module:${ticket.module?.name || 'unknown'}`
];

return {
  fields: {
    project: {
      key: $env.JIRA_PROJECT_KEY
    },
    summary: ticket.title,
    description: description,
    issuetype: {
      name: 'Bug' // ou 'Task' selon configuration
    },
    priority: {
      name: statusMap[ticket.priority] || 'Medium'
    },
    labels: labels,
    customfield_10001: ticket.id // Custom field pour stocker l'ID Supabase
  }
};
```

### Étape 4 : Créer l'Issue JIRA

1. Ajouter un node **JIRA**
2. Operation : **Create Issue**
3. Project Key : `{{ $env.JIRA_PROJECT_KEY }}`
4. Fields : `{{ $json.fields }}`

### Étape 5 : Mettre à Jour Supabase

1. Ajouter un node **Supabase**
2. Action : **Update**
3. Table : `tickets`
4. ID : `{{ $('Supabase Get').item.json.id }}`
5. Data :
```json
{
  "jira_issue_key": "{{ $json.key }}",
  "last_update_source": "supabase"
}
```

6. Ajouter un autre node **Supabase** pour `jira_sync`
7. Action : **Insert**
8. Data :
```json
{
  "ticket_id": "{{ $('Supabase Get').item.json.id }}",
  "jira_issue_key": "{{ $('JIRA').item.json.key }}",
  "origin": "supabase",
  "last_synced_at": "{{ $now }}"
}
```

### Étape 6 : Répondre au Webhook

1. Ajouter un node **Respond to Webhook**
2. Response Body :
```json
{
  "success": true,
  "jira_issue_key": "{{ $('JIRA').item.json.key }}"
}
```

## Workflow 2 : Synchronisation JIRA → Supabase

### Étape 1 : Configurer le Webhook dans JIRA

1. Aller dans **JIRA Settings → System → Webhooks**
2. Créer un nouveau webhook
3. URL : `https://votre-n8n.example.com/webhook/jira-update`
4. Événements :
   - `jira:issue_updated`
   - `comment_created`

### Étape 2 : Créer le Webhook Trigger dans N8N

1. Créer un nouveau workflow
2. Ajouter un node **Webhook**
3. Path : `/webhook/jira-update`
4. Method : POST

### Étape 3 : Extraire l'ID du Ticket Supabase

1. Ajouter un node **Code** (Function)
2. Code :

```javascript
const webhook = $input.item.json;
const issue = webhook.issue;

// Récupérer l'ID Supabase depuis le custom field
const supabaseTicketId = issue.fields.customfield_10001;

// Si pas de custom field, chercher par jira_issue_key
const jiraKey = issue.key;

return {
  supabase_ticket_id: supabaseTicketId,
  jira_issue_key: jiraKey,
  webhook_event: webhook.webhookEvent,
  issue: issue,
  changelog: webhook.changelog
};
```

### Étape 4 : Récupérer le Ticket Supabase

1. Ajouter un node **Supabase**
2. Action : **Get**
3. Table : `tickets`
4. ID : `{{ $json.supabase_ticket_id }}`
5. Ou par `jira_issue_key` si custom field vide

### Étape 5 : Router selon le Type d'Événement

1. Ajouter un node **Switch**
2. Conditions :
   - `{{ $json.webhook_event }}` contient `issue_updated` → Route vers "Status Update"
   - `{{ $json.webhook_event }}` contient `comment_created` → Route vers "Comment"

### Étape 6 : Traiter le Changement de Statut

1. Node **Code** pour mapper le statut JIRA → Supabase :

```javascript
const statusMap = {
  'To Do': 'To_Do',
  'In Progress': 'En_cours',
  'Done': 'Resolue',
  'Closed': 'Resolue'
};

const changelog = $input.item.json.changelog;
const statusChange = changelog.items.find(item => item.field === 'status');

if (!statusChange) return null;

return {
  ticket_id: $('Supabase Get').item.json.id,
  status_from: statusMap[statusChange.fromString] || statusChange.fromString,
  status_to: statusMap[statusChange.toString] || statusChange.toString
};
```

2. Node **Supabase** pour mettre à jour le ticket
3. Node **Supabase** pour insérer dans `ticket_status_history`

### Étape 7 : Traiter le Commentaire

1. Node **Code** pour extraire le commentaire :

```javascript
const webhook = $input.item.json;
const comment = webhook.comment;

return {
  ticket_id: $('Supabase Get').item.json.id,
  content: comment.body,
  created_at: comment.created
};
```

2. Node **Supabase** pour insérer dans `ticket_comments` avec `origin='jira_comment'`

### Étape 8 : Mettre à Jour jira_sync

1. Node **Supabase** pour mettre à jour `jira_sync`
2. Set `last_synced_at` à maintenant
3. Clear `sync_error` si présent

## Test des Workflows

### Test Transfert

1. Dans l'application, créer un ticket Assistance
2. Le mettre en statut "En cours"
3. Cliquer sur "Transférer vers JIRA"
4. Vérifier dans N8N que le workflow s'exécute
5. Vérifier dans JIRA que le ticket est créé
6. Vérifier dans Supabase que `jira_issue_key` est renseigné

### Test Synchronisation

1. Dans JIRA, changer le statut d'un ticket transféré
2. Vérifier dans N8N que le webhook est reçu
3. Vérifier dans Supabase que le statut est mis à jour
4. Vérifier dans `ticket_status_history` que l'entrée est créée

## Dépannage

### Le webhook N8N ne reçoit pas les requêtes

- Vérifier que l'URL est accessible publiquement
- Vérifier les règles de firewall
- Vérifier les logs N8N

### Le ticket JIRA n'est pas créé

- Vérifier les credentials JIRA dans N8N
- Vérifier que le Project Key est correct
- Vérifier les logs N8N pour les erreurs API

### La synchronisation ne fonctionne pas

- Vérifier que le custom field `customfield_10001` est configuré dans JIRA
- Vérifier que le webhook JIRA pointe vers la bonne URL N8N
- Vérifier les logs N8N et JIRA

## Sécurité

- Utiliser l'authentification sur les webhooks N8N (Header Auth ou Query Auth)
- Ne pas exposer le Service Role Key dans les logs
- Limiter les IPs autorisées pour les webhooks (si possible)
- Utiliser HTTPS pour toutes les communications

