# Guide : Synchronisation Complète JIRA → Supabase

Ce guide vous accompagne pour synchroniser **TOUS** les tickets JIRA (existants et futurs) vers Supabase afin d'avoir une vue complète dans votre application.

## 🎯 Objectif

- ✅ Importer tous les tickets JIRA existants dans Supabase
- ✅ Synchroniser automatiquement tous les nouveaux tickets créés dans JIRA
- ✅ Suivre tous les changements (statuts, commentaires, assignations) en temps réel
- ✅ Permettre au Support de voir l'évolution de tous les tickets dans l'application

## 📋 Prérequis

- Instance N8N configurée et accessible
- Accès API JIRA avec token
- Accès Supabase avec Service Role Key
- Webhooks JIRA configurés

## 🚀 Étapes de Mise en Place

### Étape 1 : Configurer les Variables d'Environnement N8N

Dans N8N → Settings → Environment Variables :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
JIRA_URL=https://votre-entreprise.atlassian.net
JIRA_EMAIL=votre-email@example.com
JIRA_API_TOKEN=votre-api-token
JIRA_PROJECT_KEY=PROJ
```

### Étape 2 : Créer le Workflow "Import Initial"

1. Créer un nouveau workflow dans N8N
2. Nom : `Import Initial JIRA Tickets to Supabase`
3. Suivre la documentation dans `docs/workflows/n8n-jira-full-sync.md` section "Workflow 1"
4. Ou importer le JSON depuis `docs/workflows/n8n-jira-import-initial.json`

**Nodes principaux** :
- Manual Trigger
- JIRA Search Issues
- Split In Batches
- Map JIRA to Supabase
- Check if Ticket Exists
- Switch (Create/Update)
- Supabase Create/Update Ticket
- Resolve Product/Module
- Upsert jira_sync

### Étape 3 : Exécuter l'Import Initial

1. Activer le workflow
2. Cliquer sur "Execute Workflow"
3. Surveiller l'exécution dans les logs N8N
4. Vérifier dans Supabase que les tickets sont importés

**Vérification** :
```sql
-- Compter les tickets importés
SELECT COUNT(*) 
FROM tickets 
WHERE origin = 'jira';

-- Vérifier les correspondances
SELECT 
  t.jira_issue_key,
  js.jira_issue_key,
  t.title
FROM tickets t
INNER JOIN jira_sync js ON js.ticket_id = t.id
WHERE t.origin = 'jira';
```

### Étape 4 : Créer le Workflow "Synchronisation Continue"

1. Créer un nouveau workflow dans N8N
2. Nom : `Sync JIRA to Supabase (Full Sync)`
3. Suivre la documentation dans `docs/workflows/n8n-jira-full-sync.md` section "Workflow 2"

**Nodes principaux** :
- Webhook Trigger (`/webhook/jira-full-sync`)
- Extract and Validate
- Check if Ticket Exists
- Switch (Create/Update)
- Resolve Product/Module
- Create/Update Ticket
- Switch Event Type
- Insert Status History/Comment
- Upsert jira_sync
- Respond to Webhook

### Étape 5 : Configurer les Webhooks JIRA

Dans JIRA → Settings → System → Webhooks :

1. Créer un nouveau webhook
2. **URL** : `https://votre-n8n.example.com/webhook/jira-full-sync`
3. **Events** :
   - ✅ `jira:issue_created`
   - ✅ `jira:issue_updated`
   - ✅ `comment_created`
   - ✅ `jira:issue_deleted` (optionnel)
4. **Status** : Enabled

### Étape 6 : Tester la Synchronisation

#### Test 1 : Créer un nouveau ticket dans JIRA

1. Créer un ticket Bug ou Task dans JIRA
2. Vérifier dans N8N que le webhook est reçu
3. Vérifier dans Supabase que le ticket est créé automatiquement
4. Vérifier que `jira_issue_key` est renseigné

#### Test 2 : Modifier un ticket dans JIRA

1. Changer le statut d'un ticket dans JIRA
2. Vérifier que le statut est mis à jour dans Supabase
3. Vérifier qu'une entrée est créée dans `ticket_status_history`

#### Test 3 : Ajouter un commentaire dans JIRA

1. Ajouter un commentaire dans JIRA
2. Vérifier que le commentaire apparaît dans `ticket_comments` avec `origin='jira_comment'`

## 🔍 Mapping des Données

### Mapping des Types

| Type JIRA | Type Supabase |
|-----------|---------------|
| Bug | BUG |
| Task | REQ |
| Story | REQ |
| Sub-task | REQ |

### Mapping des Statuts

| Statut JIRA | Statut Supabase |
|-------------|-----------------|
| To Do | Nouveau |
| In Progress | En_cours |
| Done | Resolue |
| Closed | Resolue |
| Resolved | Resolue |
| Reopened | En_cours |

### Mapping des Priorités

| Priorité JIRA | Priorité Supabase |
|---------------|-------------------|
| Lowest | Low |
| Low | Low |
| Medium | Medium |
| High | High |
| Highest | High |
| Critical | High |

### Extraction des Labels

Les informations suivantes sont extraites des labels JIRA :
- `product:XXX` → Recherche du product_id dans Supabase
- `module:XXX` → Recherche du module_id dans Supabase
- `canal:XXX` → Canal de contact (Whatsapp, Email, etc.)

## 📊 Monitoring et Maintenance

### Vérifier les Tickets Non Synchronisés

```sql
-- Tickets JIRA non importés (à exécuter après l'import initial)
-- Comparer avec la liste JIRA manuellement
SELECT 
  t.jira_issue_key,
  t.title,
  t.status,
  js.last_synced_at
FROM tickets t
INNER JOIN jira_sync js ON js.ticket_id = t.id
WHERE t.origin = 'jira'
ORDER BY js.last_synced_at DESC;
```

### Vérifier les Erreurs de Synchronisation

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

### Statistiques de Synchronisation

```sql
-- Nombre de tickets par origine
SELECT 
  origin,
  COUNT(*) as count
FROM tickets
GROUP BY origin;

-- Tickets synchronisés aujourd'hui
SELECT COUNT(*)
FROM jira_sync
WHERE last_synced_at >= CURRENT_DATE;
```

## 🐛 Dépannage

### Le webhook N8N ne reçoit pas les requêtes

- Vérifier que l'URL est accessible publiquement
- Vérifier les règles de firewall
- Vérifier les logs N8N
- Tester le webhook manuellement avec curl

### Les tickets ne sont pas créés automatiquement

- Vérifier que le workflow "Synchronisation Continue" est activé
- Vérifier les logs N8N pour les erreurs
- Vérifier que le webhook JIRA est bien configuré
- Vérifier les permissions Supabase (Service Role Key)

### Les product_id/module_id ne sont pas résolus

- Vérifier que les labels JIRA contiennent `product:XXX` et `module:XXX`
- Vérifier que les noms correspondent exactement dans Supabase
- Vérifier les logs N8N pour les erreurs de lookup

### Les statuts ne sont pas mappés correctement

- Vérifier le mapping dans le code N8N
- Ajouter les nouveaux statuts JIRA au mapping si nécessaire
- Vérifier que les enums Supabase correspondent

## ✅ Checklist de Validation

- [ ] Variables d'environnement N8N configurées
- [ ] Workflow "Import Initial" créé et testé
- [ ] Import initial exécuté avec succès
- [ ] Workflow "Synchronisation Continue" créé et activé
- [ ] Webhook JIRA configuré et testé
- [ ] Test création ticket JIRA → Supabase réussi
- [ ] Test modification statut JIRA → Supabase réussi
- [ ] Test commentaire JIRA → Supabase réussi
- [ ] Monitoring configuré
- [ ] Documentation partagée avec l'équipe

## 📚 Documentation Complète

- **Workflow détaillé** : `docs/workflows/n8n-jira-full-sync.md`
- **JSON workflow import** : `docs/workflows/n8n-jira-import-initial.json`
- **Intégration générale** : `docs/workflows/n8n-jira-integration.md`

## 🎯 Résultat Attendu

Après la mise en place complète :

1. ✅ Tous les tickets JIRA existants sont dans Supabase
2. ✅ Tous les nouveaux tickets créés dans JIRA apparaissent automatiquement dans Supabase
3. ✅ Tous les changements (statuts, commentaires, assignations) sont synchronisés en temps réel
4. ✅ Le Support peut voir et suivre tous les tickets dans l'application
5. ✅ Le reporting est complet avec tous les tickets

