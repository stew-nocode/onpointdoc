# Phase 1 : Mapping des Champs Standards Jira → Supabase

**Date** : 2025-01-18  
**Source** : Analyse structure Supabase via MCP  
**Projet** : ONPOINT CENTRAL (xjcttqaiplnoalolebls)

---

## Tableau de Mapping - Champs Standards Jira

| # | Champ Jira | Type Jira | Colonne Supabase | Table | Statut Actuel | Action Requise | Notes |
|---|------------|-----------|------------------|-------|---------------|----------------|-------|
| 1 | `key` | String | `jira_issue_key` | `tickets` | ✅ **Existant** | Aucune | Clé unique Jira (ex: "OD-123"). Déjà présent dans `tickets` et `jira_sync` |
| 2 | `id` | String (numeric) | `jira_issue_id` | `tickets` | ✅ **Existant** | Aucune | ID numérique Jira. Déjà présent dans `tickets` |
| 3 | `summary` | String | `title` | `tickets` | ✅ **Existant** | Aucune | Titre du ticket |
| 4 | `description` | Text | `description` | `tickets` | ✅ **Existant** | Aucune | Description complète (nullable) |
| 5 | `issuetype.name` | Enum | `ticket_type` | `tickets` | ✅ **Existant** | Aucune | Enum: `BUG`, `REQ`, `ASSISTANCE` |
| 6 | `status.name` | Enum | `status` | `tickets` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | Enum Supabase: `Nouveau`, `En_cours`, `Transfere`, `Resolue`, `To_Do`, `In_Progress`, `Done`, `Closed` |
| 7 | `priority.name` | Enum | `priority` | `tickets` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | Enum Supabase: `Low`, `Medium`, `High`, `Critical` |
| 8 | `created` | DateTime | `created_at` | `tickets` | ✅ **Existant** | Aucune | Timestamptz avec default `now()` |
| 9 | `updated` | DateTime | `updated_at` | `tickets` | ✅ **Existant** | Aucune | Timestamptz avec default `now()` |
| 10 | `reporter.accountId` | String (UUID) | `created_by` | `tickets` | ✅ **Existant** | ⚠️ **Mapping via `profiles.jira_user_id`** | UUID nullable. Mapping via `profiles.jira_user_id` (existe déjà) |
| 11 | `assignee.accountId` | String (UUID) | `assigned_to` | `tickets` | ✅ **Existant** | ⚠️ **Mapping via `profiles.jira_user_id`** | UUID nullable. Mapping via `profiles.jira_user_id` (existe déjà) |
| 12 | `resolution.name` | String | `resolution` | `tickets` | ❌ **À ajouter** | ➕ **Nouveau champ** | Résolution Jira (ex: "Terminé"). Type: `TEXT NULLABLE` |
| 13 | `fixVersions[].name` | Array[String] | `fix_version` | `tickets` | ❌ **À ajouter** | ➕ **Nouveau champ** | Version de correction (ex: "OBC V T1 2024"). Type: `TEXT NULLABLE` |
| 14 | `labels[]` | Array[String] | - | `jira_sync.sync_metadata` | ⚠️ **Via JSONB** | ➕ **Extension `jira_sync`** | Stocker dans `sync_metadata->>'labels'` (JSONB) |
| 15 | `components[]` | Array[String] | - | `jira_sync.sync_metadata` | ⚠️ **Via JSONB** | ➕ **Extension `jira_sync`** | Stocker dans `sync_metadata->>'components'` (JSONB) |

---

## Extension de la table `jira_sync`

### Champs à ajouter dans `jira_sync`

| Colonne | Type | Nullable | Description | Exemple |
|---------|------|----------|-------------|---------|
| `jira_status` | TEXT | ✅ Oui | Statut Jira original | `"Sprint Backlog"` |
| `jira_priority` | TEXT | ✅ Oui | Priorité Jira original | `"Priorité 1"` |
| `jira_assignee_account_id` | TEXT | ✅ Oui | AccountId Jira de l'assigné | `"712020:bb02e93b-c270-4c40-a166-a19a42e5629a"` |
| `jira_reporter_account_id` | TEXT | ✅ Oui | AccountId Jira du reporter | `"712020:5c9548c8-e063-4cc7-b9e3-98eb370e0d9e"` |
| `jira_resolution` | TEXT | ✅ Oui | Résolution Jira | `"Terminé"` |
| `jira_fix_version` | TEXT | ✅ Oui | Version de correction | `"OBC V T1 2024"` |
| `jira_sprint_id` | TEXT | ✅ Oui | ID du sprint (optionnel) | `"352"` |
| `last_status_sync` | TIMESTAMPTZ | ✅ Oui | Dernière sync du statut | `2025-01-18T10:30:00Z` |
| `last_priority_sync` | TIMESTAMPTZ | ✅ Oui | Dernière sync de la priorité | `2025-01-18T10:30:00Z` |
| `sync_metadata` | JSONB | ✅ Oui | Métadonnées supplémentaires | `{"labels": [], "components": []}` |

**Note** : `sync_metadata` peut être utilisé pour stocker temporairement des données non mappées avant traitement.

---

## Mapping des Statuts Jira → Supabase

### Statuts trouvés dans Jira (projet OD)
- `Sprint Backlog`
- `Traitement en Cours`
- `Terminé(e)`

### Statuts disponibles dans Supabase (`ticket_status_t`)
- `Nouveau`
- `En_cours`
- `Transfere`
- `Resolue`
- `To_Do`
- `In_Progress`
- `Done`
- `Closed`

### Proposition de mapping

| Statut Jira | Statut Supabase | Type Ticket | Notes |
|-------------|-----------------|-------------|-------|
| `Sprint Backlog` | `Nouveau` | BUG/REQ | Statut initial |
| `Traitement en Cours` | `En_cours` | BUG/REQ | En cours de traitement |
| `Terminé(e)` | `Resolue` | BUG/REQ | Résolu/Clôturé |

**Note** : Les statuts `To_Do`, `In_Progress`, `Done`, `Closed` semblent être des statuts Jira anglophones. À valider si d'autres projets Jira utilisent ces statuts.

---

## Mapping des Priorités Jira → Supabase

### Priorités trouvées dans Jira (projet OD)
- `Priorité 1`
- `Priorité 2`
- `Priorité 3`
- `Priorité 4`

### Priorités disponibles dans Supabase (`priority_t`)
- `Low`
- `Medium`
- `High`
- `Critical`

### Proposition de mapping

| Priorité Jira | Priorité Supabase | Valeur DB | Notes |
|---------------|-------------------|-----------|-------|
| `Priorité 1` | `Critical` | `'Critical'` | Urgence maximale |
| `Priorité 2` | `High` | `'High'` | Urgence élevée |
| `Priorité 3` | `Medium` | `'Medium'` | Urgence moyenne |
| `Priorité 4` | `Low` | `'Low'` | Urgence faible |

---

## Récapitulatif des Actions Phase 1

### ✅ Champs déjà existants (aucune action)
- `jira_issue_key` (dans `tickets` et `jira_sync`)
- `jira_issue_id` (dans `tickets`)
- `title`, `description`, `ticket_type`
- `status`, `priority` (enums existants, mapping nécessaire)
- `created_at`, `updated_at`
- `created_by`, `assigned_to` (mapping via `profiles.jira_user_id`)

### ➕ Nouveaux champs à ajouter

#### Dans `tickets` :
1. `resolution` (TEXT, nullable) - Résolution Jira
2. `fix_version` (TEXT, nullable) - Version de correction

#### Dans `jira_sync` :
3. `jira_status` (TEXT, nullable)
4. `jira_priority` (TEXT, nullable)
5. `jira_assignee_account_id` (TEXT, nullable)
6. `jira_reporter_account_id` (TEXT, nullable)
7. `jira_resolution` (TEXT, nullable)
8. `jira_fix_version` (TEXT, nullable)
9. `jira_sprint_id` (TEXT, nullable)
10. `last_status_sync` (TIMESTAMPTZ, nullable)
11. `last_priority_sync` (TIMESTAMPTZ, nullable)
12. `sync_metadata` (JSONB, nullable, default `'{}'::jsonb`)

### ⚠️ Actions de mapping à implémenter

1. **Créer table `jira_status_mapping`** pour gérer les mappings dynamiques
2. **Créer table `jira_priority_mapping`** pour gérer les mappings dynamiques
3. **Insérer les mappings initiaux** (3 statuts, 4 priorités)
4. **Implémenter la logique de mapping** dans les services de synchronisation

---

## Questions de Validation

1. **Statuts** : Les statuts Supabase actuels couvrent-ils tous les cas Jira, ou faut-il ajouter d'autres statuts ?
2. **Priorités** : Le mapping `Priorité 1` → `Critical` est-il correct selon votre logique métier ?
3. **`resolution` et `fix_version`** : Ces champs sont-ils nécessaires dans `tickets` ou peuvent-ils rester uniquement dans `jira_sync` ?
4. **`sync_metadata`** : Préférez-vous stocker `labels` et `components` dans `sync_metadata` (JSONB) ou créer des tables dédiées ?

---

**Document créé le** : 2025-01-18  
**Dernière mise à jour** : 2025-01-18

