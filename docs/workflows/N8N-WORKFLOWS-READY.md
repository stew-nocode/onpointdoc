# Workflows N8N Prêts à l'Emploi - Synchronisation Complète JIRA

Ce document contient tous les workflows N8N prêts à être importés et configurés pour synchroniser **TOUS** les tickets JIRA vers Supabase.

## 📦 Fichiers Disponibles

1. **`n8n-jira-full-sync.md`** : Documentation complète des workflows
2. **`n8n-jira-import-initial.json`** : Workflow JSON pour l'import initial (à importer dans N8N)
3. **`n8n-jira-sync-continue.json`** : Workflow JSON pour la synchronisation continue (à importer dans N8N)
4. **`GUIDE-SYNCHRONISATION-COMPLETE.md`** : Guide de mise en place étape par étape

## 🚀 Démarrage Rapide

### Étape 1 : Importer les Workflows dans N8N

1. Ouvrir N8N
2. Cliquer sur "Workflows" → "Import from File"
3. Importer `n8n-jira-import-initial.json` → Nommer "Import Initial JIRA Tickets"
4. Importer `n8n-jira-sync-continue.json` → Nommer "Sync JIRA to Supabase (Full Sync)"

### Étape 2 : Configurer les Credentials

Dans chaque workflow, configurer :

**JIRA Credentials** :
- URL : `{{ $env.JIRA_URL }}`
- Email : `{{ $env.JIRA_EMAIL }}`
- API Token : `{{ $env.JIRA_API_TOKEN }}`

**Supabase Credentials** :
- URL : `{{ $env.SUPABASE_URL }}`
- Service Role Key : `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}`

### Étape 3 : Compléter les Nodes Manquants

Les fichiers JSON contiennent la structure de base. Vous devrez compléter :

#### Pour "Import Initial" :
- Node "Resolve Product ID" : Ajouter la logique de recherche Supabase
- Node "Resolve Module ID" : Ajouter la logique de recherche Supabase
- Node "Create Ticket" : Compléter avec tous les champs
- Node "Update Ticket" : Compléter avec tous les champs

#### Pour "Sync Continue" :
- Node "Resolve Product/Module" : Ajouter la logique de recherche
- Node "Create Ticket" : Compléter avec tous les champs
- Node "Update Status/Comment/Assignee" : Compléter selon le type d'événement

### Étape 4 : Configurer le Webhook JIRA

Dans JIRA → Settings → System → Webhooks :
- URL : `https://votre-n8n.example.com/webhook/jira-full-sync`
- Events : `jira:issue_created`, `jira:issue_updated`, `comment_created`

## 📝 Code Complet des Nodes Critiques

### Node : Resolve Product ID (pour les deux workflows)

```javascript
// Résoudre product_id depuis product_name
const productName = $input.item.json.product_name;

if (!productName) {
  return { json: { product_id: null } };
}

// Utiliser le node Supabase pour chercher
// Dans N8N, utiliser un node Supabase avec :
// Operation: Get
// Table: products
// Filter: name = productName
// Return single row

// Ou via HTTP Request si Supabase node non disponible :
const supabaseUrl = $env.SUPABASE_URL;
const supabaseKey = $env.SUPABASE_SERVICE_ROLE_KEY;

const response = await fetch(`${supabaseUrl}/rest/v1/products?name=eq.${encodeURIComponent(productName)}&select=id`, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
});

const data = await response.json();
return {
  json: {
    product_id: data[0]?.id || null
  }
};
```

### Node : Resolve Module ID

```javascript
// Résoudre module_id depuis module_name et product_id
const moduleName = $input.item.json.module_name;
const productId = $input.item.json.product_id;

if (!moduleName || !productId) {
  return { json: { module_id: null } };
}

// Via Supabase node ou HTTP Request
const supabaseUrl = $env.SUPABASE_URL;
const supabaseKey = $env.SUPABASE_SERVICE_ROLE_KEY;

const response = await fetch(
  `${supabaseUrl}/rest/v1/modules?name=eq.${encodeURIComponent(moduleName)}&product_id=eq.${productId}&select=id`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
);

const data = await response.json();
return {
  json: {
    module_id: data[0]?.id || null
  }
};
```

### Node : Create Ticket (Import Initial)

**Supabase Node** :
- Operation : Insert
- Table : `tickets`
- Data :
```json
{
  "jira_issue_key": "={{ $('Map JIRA').item.json.jira_issue_key }}",
  "title": "={{ $('Map JIRA').item.json.title }}",
  "description": "={{ $('Map JIRA').item.json.description }}",
  "ticket_type": "={{ $('Map JIRA').item.json.ticket_type }}",
  "status": "={{ $('Map JIRA').item.json.status }}",
  "priority": "={{ $('Map JIRA').item.json.priority }}",
  "canal": "={{ $('Map JIRA').item.json.canal }}",
  "product_id": "={{ $('Resolve Product').item.json.product_id }}",
  "module_id": "={{ $('Resolve Module').item.json.module_id }}",
  "created_at": "={{ $('Map JIRA').item.json.created_at_jira }}",
  "origin": "jira",
  "last_update_source": "jira",
  "created_by": null
}
```

### Node : Create Ticket (Sync Continue)

Même structure que l'import, mais utiliser les données de `Extract and Validate`.

### Node : Update Status History

**Supabase Node** :
- Operation : Insert
- Table : `ticket_status_history`
- Data :
```json
{
  "ticket_id": "={{ $('Create/Update Ticket').item.json.id }}",
  "status_from": "={{ $json.changelog.items.find(i => i.field === 'status')?.fromString }}",
  "status_to": "={{ $json.changelog.items.find(i => i.field === 'status')?.toString }}",
  "source": "jira"
}
```

### Node : Insert Comment

**Supabase Node** :
- Operation : Insert
- Table : `ticket_comments`
- Data :
```json
{
  "ticket_id": "={{ $('Create/Update Ticket').item.json.id }}",
  "content": "={{ $json.comment.body }}",
  "origin": "jira_comment",
  "user_id": null
}
```

## 🔧 Configuration Avancée

### Gestion des Utilisateurs IT

Pour les tickets créés directement dans JIRA, vous pouvez mapper les utilisateurs :

```javascript
// Node : Resolve User from Email
const email = $input.item.json.assignee_email || $input.item.json.reporter_email;

if (!email) {
  return { json: { user_id: null } };
}

// Chercher dans Supabase profiles
const supabaseUrl = $env.SUPABASE_URL;
const supabaseKey = $env.SUPABASE_SERVICE_ROLE_KEY;

const response = await fetch(
  `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id`,
  {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
);

const data = await response.json();

// Si utilisateur non trouvé, créer un profil IT par défaut ou retourner null
return {
  json: {
    user_id: data[0]?.id || null
  }
};
```

### Pagination pour l'Import Initial

Si vous avez plus de 1000 tickets, modifier le node "JIRA Search Issues" :

```javascript
// Dans un node Code avant la recherche
const batchSize = 1000;
const totalIssues = 5000; // À ajuster selon votre nombre de tickets
const batches = [];

for (let startAt = 0; startAt < totalIssues; startAt += batchSize) {
  batches.push({
    json: {
      startAt: startAt,
      maxResults: batchSize
    }
  });
}

return batches;
```

Puis utiliser un node "Loop Over Items" pour exécuter la recherche JIRA pour chaque batch.

## ✅ Checklist de Validation

- [ ] Workflows importés dans N8N
- [ ] Credentials JIRA et Supabase configurés
- [ ] Nodes complétés avec la logique de résolution Product/Module
- [ ] Nodes Create/Update complétés
- [ ] Webhook JIRA configuré
- [ ] Test import initial réussi
- [ ] Test synchronisation continue réussi
- [ ] Vérification que tous les tickets JIRA sont dans Supabase

## 📚 Documentation Complète

- **Guide de mise en place** : `GUIDE-SYNCHRONISATION-COMPLETE.md`
- **Documentation détaillée** : `n8n-jira-full-sync.md`
- **Intégration générale** : `n8n-jira-integration.md`

## 🆘 Support

En cas de problème :
1. Vérifier les logs N8N
2. Vérifier `jira_sync.sync_error` dans Supabase
3. Tester les webhooks manuellement avec curl
4. Vérifier les permissions Supabase (RLS)

