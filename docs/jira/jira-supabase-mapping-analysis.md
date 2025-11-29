# Analyse des Structures JIRA ↔ Supabase

## Objectif

Documenter les mappings nécessaires pour mettre à jour Supabase avec les données JIRA.

---

## Structure Supabase - Table `tickets`

### Champs Principaux

| Champ Supabase | Type | Nullable | Description |
|----------------|------|----------|-------------|
| `id` | uuid | NO | ID unique Supabase |
| `title` | text | NO | Titre du ticket |
| `description` | text | YES | Description du ticket |
| `ticket_type` | enum | NO | BUG, REQ, ASSISTANCE |
| `priority` | enum | YES | Low, Medium, High, Critical |
| `canal` | enum | YES | Canal de contact (Whatsapp, Email, etc.) |
| `status` | text | NO | Statut du ticket (dynamique) |
| `jira_issue_key` | text | YES | Clé JIRA (ex: OD-2373) |
| `jira_issue_id` | text | YES | ID JIRA (ex: 31102) |
| `origin` | enum | YES | supabase, jira |
| `last_update_source` | text | YES | Source de la dernière mise à jour |

### Champs de Relations

| Champ | Type | Relation |
|-------|------|----------|
| `product_id` | uuid | → products.id |
| `module_id` | uuid | → modules.id |
| `submodule_id` | uuid | → submodules.id |
| `feature_id` | uuid | → features.id |
| `company_id` | uuid | → companies.id |
| `contact_user_id` | uuid | → profiles.id (client) |
| `created_by` | uuid | → profiles.id (agent/manager) |
| `assigned_to` | uuid | → profiles.id (agent assigné) |

### Champs JIRA Spécifiques

| Champ | Type | Description |
|-------|------|-------------|
| `resolution` | text | Résolution JIRA (ex: "Terminé") |
| `fix_version` | text | Version de correction (ex: "OBC V T1 2024") |
| `workflow_status` | text | Statut workflow (ex: "Analyse terminée") |
| `test_status` | text | Statut test (ex: "Test Concluant") |
| `issue_type` | text | Type d'issue JIRA (Bug, Task, Story) |
| `sprint_id` | text | ID du sprint JIRA |
| `related_ticket_key` | text | Clé du ticket lié (ex: "B-OD-029") |
| `target_date` | date | Date cible de résolution |
| `resolved_at` | timestamptz | Date de résolution effective |
| `bug_type` | enum | Type de bug (si applicable) |
| `custom_fields` | jsonb | Champs personnalisés JIRA (JSONB) |
| `jira_metadata` | jsonb | Métadonnées JIRA brutes |

---

## Structure JIRA - API REST v3

### Champs Standards JIRA

| Champ JIRA | Type | Description |
|------------|------|-------------|
| `key` | string | Clé du ticket (ex: "OD-2373") |
| `id` | string | ID JIRA (ex: "31102") |
| `fields.summary` | string | Titre du ticket |
| `fields.description` | ADF/string | Description (format ADF ou texte) |
| `fields.status.name` | string | Statut (ex: "Terminé(e)", "Sprint Backlog") |
| `fields.status.id` | string | ID du statut |
| `fields.priority.name` | string | Priorité (ex: "Priorité 1", "Priorité 2") |
| `fields.priority.id` | string | ID de la priorité |
| `fields.issuetype.name` | string | Type (Bug, Task, Story, Requêtes) |
| `fields.reporter.accountId` | string | AccountId du reporter |
| `fields.reporter.displayName` | string | Nom du reporter |
| `fields.assignee.accountId` | string | AccountId de l'assigné |
| `fields.assignee.displayName` | string | Nom de l'assigné |
| `fields.resolution.name` | string | Résolution (ex: "Terminé") |
| `fields.fixVersions[]` | array | Versions de correction |
| `fields.created` | string | Date de création (ISO 8601) |
| `fields.updated` | string | Date de mise à jour (ISO 8601) |
| `fields.resolutiondate` | string | Date de résolution (ISO 8601) |
| `fields.duedate` | string | Date d'échéance (ISO 8601) |
| `fields.labels[]` | array | Labels |
| `fields.components[]` | array | Composants |
| `fields.issuelinks[]` | array | Liens vers d'autres tickets |

### Champs Personnalisés JIRA (Custom Fields)

D'après l'analyse du ticket OD-2373, voici les champs personnalisés identifiés :

| Custom Field ID | Nom (d'après JIRA) | Type | Mapping Supabase |
|-----------------|-------------------|------|------------------|
| `customfield_10020` | Sprint | array | `sprint_id` (extrait) |
| `customfield_10021` | Flagged | ? | ? |
| `customfield_10045` | Client(s) | array | `company_id` (via mapping) |
| `customfield_10052` | Sous-Module(s) (ancien) | array | `submodule_id` (via jira_feature_mapping) |
| `customfield_10053` | Interlocuteur | string | `contact_user_id` (via recherche) |
| `customfield_10054` | Poste | array | ? |
| `customfield_10055` | Canal | array | `canal` (mapping direct) |
| `customfield_10056` | Type de bugs | array | `bug_type` (mapping enum) |
| `customfield_10057` | Code Trello | ? | ? |
| `customfield_10083` | Statut du traitement | array | `workflow_status` |
| `customfield_10084` | Statut des tests | array | `test_status` |
| `customfield_10111` | Date d'enregistrement | date | `created_at` (si différent) |
| `customfield_10115` | Date cible de résolution | date | `target_date` |
| `customfield_10297` | Sous-Module(s) Opérations | array | `submodule_id` |
| `customfield_10298` | Sous-Module(s) Finance | array | `submodule_id` |
| `customfield_10299` | Sous-Module(s) Projet | array | `submodule_id` |
| `customfield_10300` | Sous-Module(s) RH | array | `submodule_id` |
| `customfield_10301` | Sous-Module(s) CRM | array | `submodule_id` |
| `customfield_10302` | Sous-Module(s) Paiement | array | `submodule_id` |
| `customfield_10330` | ? | ? | ? |

### Issue Links

| Type de Lien | Description | Mapping |
|--------------|------------|---------|
| `Duplicate` (outwardIssue) | Lien vers ticket OBCS | Stocké dans `custom_fields` ou table `od_obcs_mapping` |

---

## Mappings Nécessaires

### 1. Champs Directs (1:1)

| JIRA → Supabase | Transformation |
|-----------------|----------------|
| `key` → `jira_issue_key` | Direct |
| `id` → `jira_issue_id` | Direct |
| `fields.summary` → `title` | Direct |
| `fields.description` → `description` | Convertir ADF → texte si nécessaire |
| `fields.created` → `created_at` | Parser ISO 8601 |
| `fields.updated` → `updated_at` | Parser ISO 8601 |
| `fields.resolutiondate` → `resolved_at` | Parser ISO 8601 |
| `fields.duedate` → `target_date` | Parser ISO 8601 |

### 2. Champs avec Mapping/Transformation

| JIRA → Supabase | Transformation Nécessaire |
|-----------------|---------------------------|
| `fields.status.name` → `status` | Utiliser `jira_status_mapping` ou garder brut |
| `fields.priority.name` → `priority` | Mapping via `jira_priority_mapping` (Priorité 1 → Critical, etc.) |
| `fields.issuetype.name` → `ticket_type` | Bug → BUG, Requêtes → REQ, Task → REQ |
| `fields.resolution.name` → `resolution` | Direct |
| `fields.fixVersions[0].name` → `fix_version` | Prendre le premier |
| `customfield_10055` → `canal` | Extraire valeur et mapper vers enum `canal_t` |
| `customfield_10056` → `bug_type` | Extraire valeur et mapper vers enum `bug_type_enum` |
| `customfield_10083` → `workflow_status` | Extraire valeur |
| `customfield_10084` → `test_status` | Extraire valeur |
| `customfield_10115` → `target_date` | Parser date |
| `customfield_10020` → `sprint_id` | Extraire ID du sprint |

### 3. Relations (Requièrent Recherche)

| JIRA → Supabase | Méthode de Recherche |
|-----------------|----------------------|
| `fields.reporter.accountId` → `created_by` | Chercher `profiles.jira_user_id` ou `profiles.account` |
| `fields.assignee.accountId` → `assigned_to` | Chercher `profiles.jira_user_id` ou `profiles.account` |
| `customfield_10053` (Interlocuteur) → `contact_user_id` | Chercher par nom dans `profiles` (role='client') |
| `customfield_10045` (Client) → `company_id` | Chercher par nom dans `companies` ou créer |
| `customfield_10052/10297-10302` → `submodule_id` | Utiliser `jira_feature_mapping` ou `modules.id_module_jira` |
| `fields.components[]` → `module_id` | Chercher par nom dans `modules` |
| `fields.labels[]` → `product_id` | Chercher par label dans `products` |

### 4. Champs Personnalisés (JSONB)

Tous les champs personnalisés JIRA non mappés doivent être stockés dans `custom_fields` (JSONB) :

```json
{
  "product_specific": {
    "customfield_10020": "...",
    "customfield_10021": "...",
    ...
  },
  "metadata": {
    "labels": [...],
    "components": [...],
    "issuelinks": [...]
  }
}
```

---

## Ce Qu'il Faut Faire

### ✅ Déjà en Place

1. ✅ Structure Supabase complète avec tous les champs nécessaires
2. ✅ Types TypeScript (`JiraIssueData`) pour les données JIRA
3. ✅ Fonction `syncJiraToSupabase()` dans `src/services/jira/sync.ts`
4. ✅ Route webhook `/api/webhooks/jira` pour recevoir les événements
5. ✅ Tables de mapping (`jira_status_mapping`, `jira_priority_mapping`, `jira_feature_mapping`)

### ⚠️ À Compléter/Améliorer

1. **Mapping des Custom Fields**
   - Identifier tous les custom fields utilisés dans JIRA
   - Créer un mapping complet custom field → champ Supabase
   - Gérer les cas où un custom field peut être dans plusieurs produits

2. **Recherche des Relations**
   - Améliorer la recherche `reporter/assignee` par `accountId`
   - Améliorer la recherche `contact_user_id` par nom (gérer accents, variations)
   - Améliorer la recherche `company_id` par nom (gérer typos, variations)
   - Améliorer la recherche `module_id/submodule_id` via les IDs JIRA

3. **Gestion des Issue Links**
   - Extraire les liens "Duplicate" vers OBCS
   - Stocker dans `custom_fields` ou table `od_obcs_mapping`

4. **Conversion ADF → Texte**
   - Si `description` est en format ADF (Atlassian Document Format), le convertir en texte
   - Utiliser une bibliothèque ou parser simple

5. **Gestion des Erreurs**
   - Gérer les cas où une relation n'est pas trouvée
   - Logger les erreurs pour diagnostic
   - Créer des entités manquantes si nécessaire (entreprises, utilisateurs)

6. **Performance**
   - Mettre en cache les mappings (modules, produits, utilisateurs)
   - Utiliser des batch requests quand possible

---

## Exemple de Mapping Complet

### Ticket JIRA OD-2373

**Données JIRA :**
```json
{
  "key": "OD-2373",
  "id": "31102",
  "fields": {
    "summary": "CRM > DASHBOARD > ETAT DES DEALS : Corriger le bug...",
    "status": { "name": "Terminé(e)" },
    "priority": { "name": "Priorité 2" },
    "issuetype": { "name": "Bug" },
    "customfield_10055": [{ "value": "En présentiel" }],
    "customfield_10052": [{ "value": "CRM - Analytique" }],
    "customfield_10053": "M.SANANKOUA",
    "customfield_10045": [{ "value": "ONPOINT" }],
    "issuelinks": [{
      "type": { "name": "Duplicate" },
      "outwardIssue": { "key": "OBCS-8648" }
    }]
  }
}
```

**Mapping vers Supabase :**
```typescript
{
  jira_issue_key: "OD-2373",
  jira_issue_id: "31102",
  title: "CRM > DASHBOARD > ETAT DES DEALS : Corriger le bug...",
  status: "Terminé(e)", // Garder brut JIRA
  priority: "High", // Mapping: Priorité 2 → High
  ticket_type: "BUG", // Mapping: Bug → BUG
  canal: "En présentiel", // Extraction customfield_10055
  submodule_id: "...", // Recherche via customfield_10052
  contact_user_id: "...", // Recherche "M.SANANKOUA" dans profiles
  company_id: "...", // Recherche "ONPOINT" dans companies
  custom_fields: {
    metadata: {
      obcs_duplicate: "OBCS-8648" // Issue Link Duplicate
    }
  }
}
```

---

## Prochaines Étapes

1. **Créer un script de test** pour mapper un ticket JIRA complet vers Supabase
2. **Identifier tous les custom fields** utilisés dans votre instance JIRA
3. **Créer les mappings manquants** dans les tables de mapping
4. **Tester avec plusieurs tickets** pour valider les mappings
5. **Documenter les cas limites** (utilisateurs non trouvés, entreprises à créer, etc.)

---

## Questions à Résoudre

1. **Quels custom fields sont utilisés pour identifier le produit ?** (actuellement via `components` ou `labels`)
2. **Comment gérer les utilisateurs JIRA non trouvés dans Supabase ?** (créer automatiquement ou ignorer ?)
3. **Comment gérer les entreprises non trouvées ?** (créer automatiquement ou ignorer ?)
4. **Faut-il synchroniser les commentaires JIRA ?** (table `ticket_comments`)
5. **Faut-il synchroniser l'historique des statuts ?** (table `ticket_status_history`)





