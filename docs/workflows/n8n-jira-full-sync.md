# Workflow N8N : Synchronisation Complète JIRA ↔ Supabase

Ce document décrit les workflows N8N pour synchroniser **TOUS** les tickets JIRA (existants et futurs) vers Supabase, permettant un reporting complet dans l'application.

## Vue d'ensemble

Deux workflows sont nécessaires :
1. **Import Initial** : Importe tous les tickets JIRA existants vers Supabase (à exécuter une fois)
2. **Synchronisation Continue** : Synchronise en temps réel tous les changements JIRA → Supabase (création auto si ticket manquant)

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│    JIRA     │ ──────> │     N8N    │ ──────> │  Supabase   │
│ (Tous tickets)│       │ (Sync + Create)│      │  (Reporting)│
└─────────────┘         └─────────────┘         └─────────────┘
       ▲                        │                       │
       │                        │                       │
       └────────────────────────┴───────────────────────┘
                    (Webhooks JIRA)
```

---

## Workflow 1 : Import Initial des Tickets Existants

### Objectif
Importer tous les tickets JIRA existants dans Supabase pour avoir une vue complète.

### Configuration N8N

**Workflow Name** : `Import Initial JIRA Tickets to Supabase`

#### Node 1 : Trigger (Manual ou Schedule)

- **Type** : Manual Trigger (pour exécution unique) ou Schedule (pour exécution périodique)
- **Configuration** : 
  - Si Schedule : Exécuter une fois par jour pendant la période d'import

#### Node 2 : JIRA - Search Issues

- **Operation** : Search Issues
- **JQL Query** : 
  ```
  project = {{ $env.JIRA_PROJECT_KEY }} AND issuetype IN (Bug, Task, Story) ORDER BY created DESC
  ```
- **Max Results** : 1000 (ou paginer avec `startAt`)
- **Fields** : `summary,description,status,priority,assignee,reporter,created,updated,labels,issuetype`

#### Node 3 : Split In Batches

- **Batch Size** : 50 (pour éviter la surcharge)
- **Options** : Reset

#### Node 4 : Function - Map JIRA to Supabase Format

```javascript
// Map JIRA Issue to Supabase Ticket Format
const issues = $input.all();
const results = [];

for (const issue of issues) {
  const jiraIssue = issue.json;
  
  // Mapping des types
  const typeMap = {
    'Bug': 'BUG',
    'Task': 'REQ',
    'Story': 'REQ',
    'Sub-task': 'REQ'
  };
  
  // Mapping des statuts
  const statusMap = {
    'To Do': 'Nouveau',
    'In Progress': 'En_cours',
    'Done': 'Resolue',
    'Closed': 'Resolue',
    'Resolved': 'Resolue',
    'Reopened': 'En_cours'
  };
  
  // Mapping des priorités
  const priorityMap = {
    'Lowest': 'Low',
    'Low': 'Low',
    'Medium': 'Medium',
    'High': 'High',
    'Highest': 'High',
    'Critical': 'High'
  };
  
  // Extraire les labels
  const labels = jiraIssue.fields.labels || [];
  const productLabel = labels.find(l => l.startsWith('product:'));
  const moduleLabel = labels.find(l => l.startsWith('module:'));
  const canalLabel = labels.find(l => l.startsWith('canal:'));
  
  const productName = productLabel ? productLabel.replace('product:', '') : null;
  const moduleName = moduleLabel ? moduleLabel.replace('module:', '') : null;
  const canal = canalLabel ? canalLabel.replace('canal:', '') : 'Email';
  
  // Dates
  const createdAt = new Date(jiraIssue.fields.created).toISOString();
  const updatedAt = new Date(jiraIssue.fields.updated || jiraIssue.fields.created).toISOString();
  
  results.push({
    json: {
      jira_issue_key: jiraIssue.key,
      jira_issue_id: jiraIssue.id,
      title: jiraIssue.fields.summary || 'Sans titre',
      description: jiraIssue.fields.description || '',
      ticket_type: typeMap[jiraIssue.fields.issuetype.name] || 'BUG',
      status: statusMap[jiraIssue.fields.status.name] || 'En_cours',
      priority: priorityMap[jiraIssue.fields.priority?.name] || 'Medium',
      canal: canal,
      product_name: productName,
      module_name: moduleName,
      assignee_email: jiraIssue.fields.assignee?.emailAddress || null,
      reporter_email: jiraIssue.fields.reporter?.emailAddress || null,
      created_at_jira: createdAt,
      updated_at_jira: updatedAt,
      jira_self: jiraIssue.self,
      // Métadonnées pour lookup
      needs_product_lookup: !!productName,
      needs_module_lookup: !!moduleName
    }
  });
}

return results;
```

#### Node 5 : Supabase - Check if Ticket Exists

- **Operation** : Get
- **Table** : `tickets`
- **Filter** : `jira_issue_key.eq.{{ $json.jira_issue_key }}`
- **Options** : Return single row

#### Node 6 : Switch - Ticket Exists or Not

- **Mode** : Rules
- **Rules** :
  - Rule 1: `{{ $json.id }}` exists → Route to "Update Ticket"
  - Rule 2: Default → Route to "Create Ticket"

#### Node 7a : Supabase - Create Ticket (si n'existe pas)

- **Operation** : Insert
- **Table** : `tickets`
- **Data** :
```json
{
  "jira_issue_key": "{{ $('Map JIRA').item.json.jira_issue_key }}",
  "title": "{{ $('Map JIRA').item.json.title }}",
  "description": "{{ $('Map JIRA').item.json.description }}",
  "ticket_type": "{{ $('Map JIRA').item.json.ticket_type }}",
  "status": "{{ $('Map JIRA').item.json.status }}",
  "priority": "{{ $('Map JIRA').item.json.priority }}",
  "canal": "{{ $('Map JIRA').item.json.canal }}",
  "product_id": "{{ $('Resolve Product').item.json.product_id }}",
  "module_id": "{{ $('Resolve Module').item.json.module_id }}",
  "created_at": "{{ $('Map JIRA').item.json.created_at_jira }}",
  "origin": "jira",
  "last_update_source": "jira"
}
```

#### Node 7b : Supabase - Update Ticket (si existe)

- **Operation** : Update
- **Table** : `tickets`
- **Filter** : `id.eq.{{ $('Check Exists').item.json.id }}`
- **Data** : Même structure que Create, mais seulement les champs à mettre à jour

#### Node 8 : Function - Resolve Product ID

```javascript
// Résoudre product_id depuis product_name
const productName = $input.item.json.product_name;

if (!productName) {
  return { json: { product_id: null } };
}

// Appel Supabase pour chercher le product
const supabase = $supabaseClient;
const { data: product } = await supabase
  .from('products')
  .select('id')
  .eq('name', productName)
  .single();

return {
  json: {
    product_id: product?.id || null
  }
};
```

#### Node 9 : Function - Resolve Module ID

```javascript
// Résoudre module_id depuis module_name et product_id
const moduleName = $input.item.json.module_name;
const productId = $input.item.json.product_id;

if (!moduleName || !productId) {
  return { json: { module_id: null } };
}

// Appel Supabase pour chercher le module
const supabase = $supabaseClient;
const { data: module } = await supabase
  .from('modules')
  .select('id')
  .eq('name', moduleName)
  .eq('product_id', productId)
  .single();

return {
  json: {
    module_id: module?.id || null
  }
};
```

#### Node 10 : Supabase - Upsert jira_sync

- **Operation** : Upsert
- **Table** : `jira_sync`
- **Data** :
```json
{
  "ticket_id": "{{ $('Create/Update Ticket').item.json.id }}",
  "jira_issue_key": "{{ $('Map JIRA').item.json.jira_issue_key }}",
  "origin": "jira",
  "last_synced_at": "{{ $now }}",
  "sync_error": null
}
```

#### Node 11 : Error Trigger (Optionnel)

- Gérer les erreurs et logger dans `jira_sync.sync_error`

---

## Workflow 2 : Synchronisation Continue JIRA → Supabase

### Objectif
Synchroniser en temps réel tous les changements JIRA vers Supabase, en créant automatiquement les tickets manquants.

### Configuration N8N

**Workflow Name** : `Sync JIRA to Supabase (Full Sync)`

#### Node 1 : Webhook Trigger

- **HTTP Method** : POST
- **Path** : `/webhook/jira-full-sync`
- **Response Mode** : Respond to Webhook
- **Authentication** : Header Auth (recommandé)

#### Node 2 : Function - Extract and Validate

```javascript
// Extraire et valider les données du webhook JIRA
const webhook = $input.item.json;
const issue = webhook.issue;

if (!issue || !issue.key) {
  throw new Error('Issue key manquant dans le webhook');
}

const jiraKey = issue.key;
const webhookEvent = webhook.webhookEvent;

// Mapping des statuts (même logique que l'import)
const statusMap = {
  'To Do': 'Nouveau',
  'In Progress': 'En_cours',
  'Done': 'Resolue',
  'Closed': 'Resolue',
  'Resolved': 'Resolue',
  'Reopened': 'En_cours'
};

const typeMap = {
  'Bug': 'BUG',
  'Task': 'REQ',
  'Story': 'REQ',
  'Sub-task': 'REQ'
};

const priorityMap = {
  'Lowest': 'Low',
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Highest': 'High',
  'Critical': 'High'
};

// Extraire les labels
const labels = issue.fields.labels || [];
const productLabel = labels.find(l => l.startsWith('product:'));
const moduleLabel = labels.find(l => l.startsWith('module:'));
const canalLabel = labels.find(l => l.startsWith('canal:'));

return {
  json: {
    jira_issue_key: jiraKey,
    jira_issue_id: issue.id,
    webhook_event: webhookEvent,
    issue: issue,
    changelog: webhook.changelog || {},
    // Données mappées
    title: issue.fields.summary || 'Sans titre',
    description: issue.fields.description || '',
    ticket_type: typeMap[issue.fields.issuetype.name] || 'BUG',
    status: statusMap[issue.fields.status.name] || 'En_cours',
    priority: priorityMap[issue.fields.priority?.name] || 'Medium',
    canal: canalLabel ? canalLabel.replace('canal:', '') : 'Email',
    product_name: productLabel ? productLabel.replace('product:', '') : null,
    module_name: moduleLabel ? moduleLabel.replace('module:', '') : null,
    assignee_email: issue.fields.assignee?.emailAddress || null,
    reporter_email: issue.fields.reporter?.emailAddress || null,
    created_at_jira: new Date(issue.fields.created).toISOString(),
    updated_at_jira: new Date(issue.fields.updated || issue.fields.created).toISOString()
  }
};
```

#### Node 3 : Supabase - Check if Ticket Exists

- **Operation** : Get
- **Table** : `tickets`
- **Filter** : `jira_issue_key.eq.{{ $json.jira_issue_key }}`
- **Options** : Return single row

#### Node 4 : Switch - Create or Update

- **Mode** : Rules
- **Rules** :
  - Rule 1: `{{ $json.id }}` exists → Route to "Update Path"
  - Rule 2: Default → Route to "Create Path"

#### Node 5a : Function - Resolve Product/Module (Create Path)

```javascript
// Résoudre product_id et module_id
const productName = $input.item.json.product_name;
const moduleName = $input.item.json.module_name;

// Appels Supabase pour résoudre les IDs
// (Même logique que dans l'import initial)
```

#### Node 5b : Supabase - Create Ticket (si n'existe pas)

- **Operation** : Insert
- **Table** : `tickets`
- **Data** : Structure complète du ticket avec tous les champs mappés

#### Node 6a : Supabase - Update Ticket (si existe)

- **Operation** : Update
- **Table** : `tickets`
- **Filter** : `id.eq.{{ $('Check Exists').item.json.id }}`
- **Data** : Champs à mettre à jour selon le type d'événement

#### Node 7 : Switch - Event Type

- **Mode** : Rules
- **Rules** :
  - `status_changed` → Route to "Update Status"
  - `comment_added` → Route to "Add Comment"
  - `assignee_changed` → Route to "Update Assignee"
  - Default → Skip

#### Node 8a : Supabase - Insert Status History

- **Operation** : Insert
- **Table** : `ticket_status_history`
- **Data** :
```json
{
  "ticket_id": "{{ $('Create/Update Ticket').item.json.id }}",
  "status_from": "{{ $json.changelog.items[0].fromString }}",
  "status_to": "{{ $json.changelog.items[0].toString }}",
  "source": "jira"
}
```

#### Node 8b : Supabase - Insert Comment

- **Operation** : Insert
- **Table** : `ticket_comments`
- **Data** :
```json
{
  "ticket_id": "{{ $('Create/Update Ticket').item.json.id }}",
  "content": "{{ $json.comment.body }}",
  "origin": "jira_comment",
  "user_id": null
}
```

#### Node 9 : Supabase - Upsert jira_sync

- **Operation** : Upsert
- **Table** : `jira_sync`
- **Data** :
```json
{
  "ticket_id": "{{ $('Create/Update Ticket').item.json.id }}",
  "jira_issue_key": "{{ $json.jira_issue_key }}",
  "origin": "jira",
  "last_synced_at": "{{ $now }}",
  "sync_error": null
}
```

#### Node 10 : Respond to Webhook

- **Response Body** :
```json
{
  "success": true,
  "action": "{{ $('Switch Create/Update').item.json.action }}",
  "ticket_id": "{{ $('Create/Update Ticket').item.json.id }}",
  "jira_issue_key": "{{ $json.jira_issue_key }}"
}
```

---

## Configuration JIRA Webhooks

Dans JIRA → Settings → System → Webhooks, créer un webhook avec :

- **URL** : `https://votre-n8n.example.com/webhook/jira-full-sync`
- **Events** :
  - `jira:issue_created`
  - `jira:issue_updated`
  - `comment_created`
  - `jira:issue_deleted` (optionnel)

---

## Variables d'Environnement N8N

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
JIRA_URL=https://votre-entreprise.atlassian.net
JIRA_EMAIL=votre-email@example.com
JIRA_API_TOKEN=votre-api-token
JIRA_PROJECT_KEY=PROJ
```

---

## Tests

### Test Import Initial

1. Exécuter le workflow "Import Initial"
2. Vérifier le nombre de tickets importés
3. Comparer avec le nombre de tickets dans JIRA
4. Vérifier que les `jira_issue_key` correspondent

### Test Synchronisation Continue

1. Créer un nouveau ticket dans JIRA
2. Vérifier qu'il apparaît automatiquement dans Supabase
3. Modifier le statut dans JIRA
4. Vérifier que le statut est mis à jour dans Supabase
5. Ajouter un commentaire dans JIRA
6. Vérifier que le commentaire apparaît dans Supabase

---

## Gestion des Erreurs

- Les erreurs sont loggées dans `jira_sync.sync_error`
- Les tickets en erreur peuvent être retry manuellement
- Monitoring via requête SQL :

```sql
SELECT 
  js.jira_issue_key,
  t.title,
  js.sync_error,
  js.last_synced_at
FROM jira_sync js
INNER JOIN tickets t ON t.id = js.ticket_id
WHERE js.sync_error IS NOT NULL
ORDER BY js.last_synced_at DESC;
```

---

## Maintenance

- Exécuter l'import initial une fois
- La synchronisation continue fonctionne automatiquement via webhooks
- Surveiller `jira_sync.sync_error` pour détecter les problèmes
- Vérifier périodiquement que tous les tickets JIRA sont bien dans Supabase

