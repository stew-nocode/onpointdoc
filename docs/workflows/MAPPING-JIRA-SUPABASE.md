# Mapping Complet JIRA ↔ Supabase

Document de référence pour la synchronisation bidirectionnelle entre JIRA et Supabase.

---

## 📋 Table des Matières

1. [Mapping JIRA → Supabase (Import/Sync)](#mapping-jira--supabase)
2. [Mapping Supabase → JIRA (Transfert)](#mapping-supabase--jira)
3. [Code N8N Complet](#code-n8n-complet)
4. [Exemples Pratiques](#exemples-pratiques)
5. [Gestion des Erreurs](#gestion-des-erreurs)

---

## 🔄 Mapping JIRA → Supabase (Import/Synchronisation)

### 1. Champs Directs (Mapping Simple)

| Champ JIRA | Chemin | Type | Champ Supabase | Table | Type | Notes |
|------------|--------|------|----------------|-------|------|-------|
| `issue.key` | `issue.key` | string | `jira_issue_key` | `tickets` | text (UNIQUE) | Ex: "PROJ-123" |
| `issue.id` | `issue.id` | string | - | `jira_sync` | - | Stocké dans `jira_metadata` JSONB |
| `fields.summary` | `issue.fields.summary` | string | `title` | `tickets` | text | Titre du ticket |
| `fields.description` | `issue.fields.description` | string | `description` | `tickets` | text | Peut être vide/null |
| `fields.created` | `issue.fields.created` | ISO 8601 | `created_at` | `tickets` | timestamptz | Conversion automatique |
| `fields.updated` | `issue.fields.updated` | ISO 8601 | `updated_at` | `tickets` | timestamptz | Conversion automatique |

### 2. Mapping des Types de Tickets

```javascript
const typeMap = {
  'Bug': 'BUG',
  'Task': 'REQ',
  'Story': 'REQ',
  'Sub-task': 'REQ',
  'Epic': 'REQ',        // Optionnel
  'Improvement': 'REQ'   // Optionnel
};

// Utilisation
const jiraType = issue.fields.issuetype.name;
const supabaseType = typeMap[jiraType] || 'BUG';

// Résultat dans Supabase
tickets.ticket_type = supabaseType; // Enum: 'BUG' | 'REQ' | 'ASSISTANCE'
```

**Mapping Inverse (Supabase → JIRA) :**
```javascript
const reverseTypeMap = {
  'BUG': 'Bug',
  'REQ': 'Task',
  'ASSISTANCE': 'Bug' // Les assistances transférées deviennent des Bugs
};
```

### 3. Mapping des Statuts

```javascript
const statusMap = {
  'To Do': 'Nouveau',
  'In Progress': 'En_cours',
  'Done': 'Resolue',
  'Closed': 'Resolue',
  'Resolved': 'Resolue',
  'Reopened': 'En_cours',
  'In Review': 'En_cours',    // Optionnel
  'Blocked': 'En_cours'       // Optionnel
};

// Utilisation
const jiraStatus = issue.fields.status.name;
const supabaseStatus = statusMap[jiraStatus] || 'En_cours';

// Résultat dans Supabase
tickets.status = supabaseStatus; // Enum: 'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue'
```

**Statuts Supabase disponibles :**
- `Nouveau` : Ticket créé, pas encore pris en charge
- `En_cours` : Ticket en cours de traitement
- `Transfere` : Ticket transféré vers JIRA (pour ASSISTANCE)
- `Resolue` : Ticket résolu/fermé

### 4. Mapping des Priorités

```javascript
const priorityMap = {
  'Lowest': 'Low',
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Highest': 'High',
  'Critical': 'High',
  'Blocker': 'High'  // Optionnel
};

// Utilisation
const jiraPriority = issue.fields.priority?.name || 'Medium';
const supabasePriority = priorityMap[jiraPriority] || 'Medium';

// Résultat dans Supabase
tickets.priority = supabasePriority; // Enum: 'Low' | 'Medium' | 'High' | 'Critical'
```

**Mapping Inverse (Supabase → JIRA) :**
```javascript
const reversePriorityMap = {
  'Low': 'Lowest',
  'Medium': 'Medium',
  'High': 'High',
  'Critical': 'Highest'
};
```

### 5. Extraction depuis les Labels JIRA

Les informations produit/module/canal sont stockées dans les **labels JIRA** au format :
- `product:OBC`
- `module:RH`
- `canal:Whatsapp`

```javascript
// Extraire les labels
const labels = issue.fields.labels || [];

// Fonction helper pour extraire un label
function extractLabel(labels, prefix) {
  const label = labels.find(l => l.startsWith(`${prefix}:`));
  return label ? label.replace(`${prefix}:`, '') : null;
}

// Extraction
const productName = extractLabel(labels, 'product');
const moduleName = extractLabel(labels, 'module');
const canalName = extractLabel(labels, 'canal');

// Résultat dans Supabase
// productName → Lookup dans products.name → tickets.product_id
// moduleName → Lookup dans modules.name + product_id → tickets.module_id
// canalName → tickets.canal (enum: 'Whatsapp' | 'Email' | 'Appel' | 'Autre')
```

**Format des Labels JIRA :**
```
Labels: [
  "product:OBC",
  "module:RH",
  "canal:Whatsapp",
  "urgent",  // Autres labels optionnels
  "customer:ACME"
]
```

### 6. Résolution Product/Module ID

Après extraction des noms depuis les labels, il faut résoudre les IDs :

```javascript
// 1. Résoudre product_id
async function resolveProductId(productName) {
  if (!productName) return null;
  
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('name', productName)
    .single();
  
  return product?.id || null;
}

// 2. Résoudre module_id (nécessite product_id)
async function resolveModuleId(moduleName, productId) {
  if (!moduleName || !productId) return null;
  
  const { data: module } = await supabase
    .from('modules')
    .select('id')
    .eq('name', moduleName)
    .eq('product_id', productId)
    .single();
  
  return module?.id || null;
}
```

### 7. Utilisateurs (Assigné/Reporter)

```javascript
// Assigné
const assigneeEmail = issue.fields.assignee?.emailAddress || null;
const assigneeName = issue.fields.assignee?.displayName || null;

// Reporter
const reporterEmail = issue.fields.reporter?.emailAddress || null;
const reporterName = issue.fields.reporter?.displayName || null;

// Résolution dans Supabase
async function resolveUserId(email) {
  if (!email) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  return profile?.id || null;
}

// Résultat
tickets.assigned_to = await resolveUserId(assigneeEmail);
tickets.created_by = await resolveUserId(reporterEmail);
// Si utilisateur non trouvé → null (utilisateur IT externe)
```

### 8. Champs Spéciaux et Métadonnées

| Champ JIRA | Champ Supabase | Valeur | Notes |
|------------|----------------|--------|-------|
| `webhookEvent` | `jira_sync.origin` | `'jira'` | Toujours 'jira' pour tickets importés |
| - | `tickets.origin` | `'jira'` | Indique que le ticket vient de JIRA |
| - | `tickets.last_update_source` | `'jira'` | Pour règles anti-boucle N8N |
| `issue.self` | `jira_metadata` | JSONB | URL complète de l'issue JIRA |
| `changelog.items` | `ticket_status_history` | Table séparée | Historique des changements |

**Structure `jira_metadata` (JSONB) :**
```json
{
  "jira_issue_id": "10001",
  "jira_self": "https://company.atlassian.net/rest/api/2/issue/10001",
  "jira_url": "https://company.atlassian.net/browse/PROJ-123",
  "project_key": "PROJ",
  "project_id": "10000"
}
```

---

## 📤 Mapping Supabase → JIRA (Transfert)

### 1. Champs Directs

| Champ Supabase | Champ JIRA | Transformation |
|----------------|------------|----------------|
| `tickets.title` | `fields.summary` | Direct |
| `tickets.description` | `fields.description` | Enrichi avec `customer_context` |
| `tickets.ticket_type` | `fields.issuetype` | BUG → "Bug", REQ → "Task" |

### 2. Construction de la Description

```javascript
function buildJiraDescription(ticket) {
  let description = ticket.description || '';
  
  // Ajouter contexte client si disponible
  if (ticket.customer_context) {
    description += `\n\n---\n**Contexte Client:**\n${ticket.customer_context}`;
  }
  
  // Ajouter canal de contact
  if (ticket.canal) {
    description += `\n\n**Canal:** ${ticket.canal}`;
  }
  
  // Ajouter lien vers ticket Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  description += `\n\n---\n**Ticket Supabase:** ${supabaseUrl}/gestion/tickets/${ticket.id}`;
  
  return description;
}
```

### 3. Construction des Labels JIRA

```javascript
async function buildJiraLabels(ticket) {
  const labels = [];
  
  // Product
  if (ticket.product_id) {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', ticket.product_id)
      .single();
    
    if (product) {
      labels.push(`product:${product.name}`);
    }
  }
  
  // Module
  if (ticket.module_id) {
    const { data: module } = await supabase
      .from('modules')
      .select('name')
      .eq('id', ticket.module_id)
      .single();
    
    if (module) {
      labels.push(`module:${module.name}`);
    }
  }
  
  // Canal
  if (ticket.canal) {
    labels.push(`canal:${ticket.canal}`);
  }
  
  return labels;
}
```

### 4. Payload JIRA Complet

```javascript
async function buildJiraPayload(ticket) {
  const labels = await buildJiraLabels(ticket);
  const description = buildJiraDescription(ticket);
  
  // Mapping type
  const typeMap = {
    'BUG': 'Bug',
    'REQ': 'Task',
    'ASSISTANCE': 'Bug' // Les assistances deviennent des Bugs
  };
  
  // Mapping priorité
  const priorityMap = {
    'Low': 'Lowest',
    'Medium': 'Medium',
    'High': 'High',
    'Critical': 'Highest'
  };
  
  return {
    fields: {
      project: {
        key: process.env.JIRA_PROJECT_KEY // Ex: "PROJ"
      },
      issuetype: {
        name: typeMap[ticket.ticket_type] || 'Bug'
      },
      summary: ticket.title,
      description: description,
      priority: {
        name: priorityMap[ticket.priority] || 'Medium'
      },
      labels: labels,
      // Custom field pour liaison inverse
      customfield_supabase_ticket_id: ticket.id
    }
  };
}
```

---

## 💻 Code N8N Complet

### Node Function : Map JIRA → Supabase (Import)

```javascript
// Input: JIRA Issue JSON depuis webhook ou recherche
const jiraIssue = $input.item.json;

// ============================================
// 1. MAPPING DES TYPES
// ============================================
const typeMap = {
  'Bug': 'BUG',
  'Task': 'REQ',
  'Story': 'REQ',
  'Sub-task': 'REQ'
};

// ============================================
// 2. MAPPING DES STATUTS
// ============================================
const statusMap = {
  'To Do': 'Nouveau',
  'In Progress': 'En_cours',
  'Done': 'Resolue',
  'Closed': 'Resolue',
  'Resolved': 'Resolue',
  'Reopened': 'En_cours'
};

// ============================================
// 3. MAPPING DES PRIORITÉS
// ============================================
const priorityMap = {
  'Lowest': 'Low',
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Highest': 'High',
  'Critical': 'High'
};

// ============================================
// 4. EXTRACTION DES LABELS
// ============================================
const labels = jiraIssue.fields.labels || [];

function extractLabel(prefix) {
  const label = labels.find(l => l.startsWith(`${prefix}:`));
  return label ? label.replace(`${prefix}:`, '') : null;
}

const productName = extractLabel('product');
const moduleName = extractLabel('module');
const canal = extractLabel('canal') || 'Email';

// ============================================
// 5. DATES
// ============================================
const createdAt = new Date(jiraIssue.fields.created).toISOString();
const updatedAt = new Date(jiraIssue.fields.updated || jiraIssue.fields.created).toISOString();

// ============================================
// 6. UTILISATEURS
// ============================================
const assigneeEmail = jiraIssue.fields.assignee?.emailAddress || null;
const reporterEmail = jiraIssue.fields.reporter?.emailAddress || null;

// ============================================
// 7. OUTPUT FORMAT SUPABASE
// ============================================
return {
  json: {
    // Identifiants
    jira_issue_key: jiraIssue.key,
    jira_issue_id: jiraIssue.id,
    
    // Champs directs
    title: jiraIssue.fields.summary || 'Sans titre',
    description: jiraIssue.fields.description || '',
    
    // Champs mappés
    ticket_type: typeMap[jiraIssue.fields.issuetype.name] || 'BUG',
    status: statusMap[jiraIssue.fields.status.name] || 'En_cours',
    priority: priorityMap[jiraIssue.fields.priority?.name] || 'Medium',
    canal: canal,
    
    // Pour lookup ultérieur
    product_name: productName,
    module_name: moduleName,
    
    // Utilisateurs (emails pour lookup)
    assignee_email: assigneeEmail,
    reporter_email: reporterEmail,
    
    // Dates
    created_at_jira: createdAt,
    updated_at_jira: updatedAt,
    
    // Métadonnées
    jira_self: jiraIssue.self,
    origin: 'jira',
    last_update_source: 'jira',
    
    // Flags pour lookup
    needs_product_lookup: !!productName,
    needs_module_lookup: !!moduleName
  }
};
```

### Node Function : Resolve Product ID

```javascript
// Input: { product_name: "OBC" }
const productName = $input.item.json.product_name;

if (!productName) {
  return { json: { product_id: null } };
}

// Utiliser le node Supabase ou HTTP Request
// Via Supabase Node:
const supabase = $supabaseClient;
const { data: product, error } = await supabase
  .from('products')
  .select('id')
  .eq('name', productName)
  .single();

if (error || !product) {
  console.warn(`Product "${productName}" non trouvé`);
  return { json: { product_id: null } };
}

return {
  json: {
    product_id: product.id
  }
};
```

### Node Function : Resolve Module ID

```javascript
// Input: { module_name: "RH", product_id: "uuid-..." }
const moduleName = $input.item.json.module_name;
const productId = $input.item.json.product_id;

if (!moduleName || !productId) {
  return { json: { module_id: null } };
}

const supabase = $supabaseClient;
const { data: module, error } = await supabase
  .from('modules')
  .select('id')
  .eq('name', moduleName)
  .eq('product_id', productId)
  .single();

if (error || !module) {
  console.warn(`Module "${moduleName}" non trouvé pour product "${productId}"`);
  return { json: { module_id: null } };
}

return {
  json: {
    module_id: module.id
  }
};
```

### Node Function : Resolve User ID

```javascript
// Input: { email: "user@example.com" }
const email = $input.item.json.email;

if (!email) {
  return { json: { user_id: null } };
}

const supabase = $supabaseClient;
const { data: profile, error } = await supabase
  .from('profiles')
  .select('id')
  .eq('email', email)
  .single();

if (error || !profile) {
  // Utilisateur IT externe non trouvé → null
  console.warn(`Utilisateur "${email}" non trouvé dans Supabase`);
  return { json: { user_id: null } };
}

return {
  json: {
    user_id: profile.id
  }
};
```

---

## 📝 Exemples Pratiques

### Exemple 1 : Ticket JIRA → Supabase

**Input JIRA :**
```json
{
  "key": "PROJ-123",
  "id": "10001",
  "fields": {
    "summary": "Bug dans le module RH",
    "description": "Le calcul de la paie est incorrect",
    "issuetype": { "name": "Bug" },
    "status": { "name": "In Progress" },
    "priority": { "name": "High" },
    "labels": ["product:OBC", "module:RH", "canal:Email"],
    "assignee": { "emailAddress": "it.agent@example.com" },
    "reporter": { "emailAddress": "support@example.com" },
    "created": "2025-01-15T10:00:00.000Z",
    "updated": "2025-01-17T14:30:00.000Z"
  }
}
```

**Output Supabase (après mapping) :**
```json
{
  "jira_issue_key": "PROJ-123",
  "title": "Bug dans le module RH",
  "description": "Le calcul de la paie est incorrect",
  "ticket_type": "BUG",
  "status": "En_cours",
  "priority": "High",
  "canal": "Email",
  "product_name": "OBC",
  "module_name": "RH",
  "assignee_email": "it.agent@example.com",
  "reporter_email": "support@example.com",
  "created_at_jira": "2025-01-15T10:00:00.000Z",
  "updated_at_jira": "2025-01-17T14:30:00.000Z",
  "origin": "jira",
  "last_update_source": "jira"
}
```

**Après résolution des lookups :**
```json
{
  "jira_issue_key": "PROJ-123",
  "title": "Bug dans le module RH",
  "description": "Le calcul de la paie est incorrect",
  "ticket_type": "BUG",
  "status": "En_cours",
  "priority": "High",
  "canal": "Email",
  "product_id": "uuid-product-obc",
  "module_id": "uuid-module-rh",
  "assigned_to": "uuid-user-it-agent",
  "created_by": "uuid-user-support",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-17T14:30:00.000Z",
  "origin": "jira",
  "last_update_source": "jira"
}
```

### Exemple 2 : Ticket Supabase → JIRA

**Input Supabase :**
```json
{
  "id": "uuid-ticket-123",
  "title": "Demande d'amélioration",
  "description": "Ajouter un filtre de recherche",
  "ticket_type": "REQ",
  "priority": "Medium",
  "canal": "Whatsapp",
  "product_id": "uuid-product-obc",
  "module_id": "uuid-module-rh",
  "customer_context": "Client ACME, utilisateur principal: John Doe"
}
```

**Output JIRA (après mapping) :**
```json
{
  "fields": {
    "project": { "key": "PROJ" },
    "issuetype": { "name": "Task" },
    "summary": "Demande d'amélioration",
    "description": "Ajouter un filtre de recherche\n\n---\n**Contexte Client:**\nClient ACME, utilisateur principal: John Doe\n\n**Canal:** Whatsapp\n\n---\n**Ticket Supabase:** https://app.example.com/gestion/tickets/uuid-ticket-123",
    "priority": { "name": "Medium" },
    "labels": ["product:OBC", "module:RH", "canal:Whatsapp"],
    "customfield_supabase_ticket_id": "uuid-ticket-123"
  }
}
```

---

## ⚠️ Gestion des Erreurs

### Cas d'Erreur Courants

1. **Product/Module non trouvé**
   - **Action** : Logger l'erreur, continuer avec `product_id = null`
   - **Impact** : Ticket créé mais sans produit/module assigné

2. **Utilisateur non trouvé**
   - **Action** : Logger l'erreur, continuer avec `created_by = null`
   - **Impact** : Ticket créé mais sans créateur assigné (utilisateur IT externe)

3. **Label mal formaté**
   - **Action** : Ignorer le label, logger un warning
   - **Impact** : Information perdue (product/module/canal)

4. **Statut/Priorité inconnu**
   - **Action** : Utiliser valeur par défaut (`En_cours`, `Medium`)
   - **Impact** : Ticket créé avec statut/priorité par défaut

### Code de Gestion d'Erreurs

```javascript
try {
  // Mapping JIRA → Supabase
  const mapped = mapJiraToSupabase(jiraIssue);
  
  // Résolution des lookups
  if (mapped.needs_product_lookup) {
    mapped.product_id = await resolveProductId(mapped.product_name);
    if (!mapped.product_id) {
      console.warn(`Product "${mapped.product_name}" non trouvé`);
    }
  }
  
  // ... autres lookups
  
} catch (error) {
  // Logger dans jira_sync.sync_error
  await supabase.from('jira_sync').upsert({
    jira_issue_key: jiraIssue.key,
    sync_error: error.message,
    last_synced_at: new Date().toISOString()
  });
  
  throw error;
}
```

---

## 📚 Références

- [Documentation JIRA REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Documentation Supabase](https://supabase.com/docs)
- [Workflows N8N Complets](./n8n-jira-full-sync.md)

---

**Dernière mise à jour :** 2025-01-17

