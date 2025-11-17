# Vérification Base de Données vs Mapping JIRA ↔ Supabase

Date : 2025-01-17

## ✅ Champs Présents et Conformes

### Table `tickets`

Tous les champs requis par le mapping sont présents :

| Champ Requis | Présent | Type | Notes |
|--------------|---------|------|-------|
| `jira_issue_key` | ✅ | text (UNIQUE) | Conforme |
| `title` | ✅ | text | Conforme |
| `description` | ✅ | text (nullable) | Conforme |
| `ticket_type` | ✅ | enum `ticket_type_t` | Conforme |
| `status` | ✅ | enum `ticket_status_t` | ⚠️ Voir section Statuts |
| `priority` | ✅ | enum `priority_t` | Conforme |
| `canal` | ✅ | enum `canal_t` | Conforme |
| `product_id` | ✅ | uuid (nullable) | Conforme |
| `module_id` | ✅ | uuid (nullable) | Conforme |
| `submodule_id` | ✅ | uuid (nullable) | Conforme |
| `feature_id` | ✅ | uuid (nullable) | Conforme |
| `created_by` | ✅ | uuid (nullable) | Conforme |
| `assigned_to` | ✅ | uuid (nullable) | Conforme |
| `origin` | ✅ | enum `origin_t` | Conforme |
| `last_update_source` | ✅ | text (nullable) | Conforme |
| `jira_metadata` | ✅ | jsonb (nullable) | Conforme |
| `created_at` | ✅ | timestamptz | Conforme |
| `updated_at` | ✅ | timestamptz | Conforme |
| `customer_context` | ✅ | text (nullable) | Conforme |
| `contact_user_id` | ✅ | uuid (nullable) | Conforme |

### Table `jira_sync`

Tous les champs requis sont présents :

| Champ Requis | Présent | Type | Notes |
|--------------|---------|------|-------|
| `ticket_id` | ✅ | uuid (NOT NULL, UNIQUE) | Conforme |
| `jira_issue_key` | ✅ | text (UNIQUE) | Conforme |
| `origin` | ✅ | enum `origin_t` | Conforme |
| `last_synced_at` | ✅ | timestamptz (nullable) | Conforme |
| `sync_error` | ✅ | text (nullable) | Conforme |
| `customfield_supabase_ticket_id` | ✅ | text (nullable) | Conforme |

### Table `ticket_status_history`

Tous les champs requis sont présents :

| Champ Requis | Présent | Type | Notes |
|--------------|---------|------|-------|
| `ticket_id` | ✅ | uuid | Conforme |
| `status_from` | ✅ | enum `ticket_status_t` | Conforme |
| `status_to` | ✅ | enum `ticket_status_t` | Conforme |
| `source` | ✅ | enum `origin_t` | Conforme |
| `changed_by` | ✅ | uuid (nullable) | Conforme |
| `changed_at` | ✅ | timestamptz | Conforme |

### Table `ticket_comments`

Tous les champs requis sont présents :

| Champ Requis | Présent | Type | Notes |
|--------------|---------|------|-------|
| `ticket_id` | ✅ | uuid | Conforme |
| `user_id` | ✅ | uuid (nullable) | Conforme |
| `content` | ✅ | text | Conforme |
| `origin` | ✅ | enum `comment_origin_t` | Conforme |
| `created_at` | ✅ | timestamptz | Conforme |

---

## ⚠️ Points d'Attention Identifiés

### 1. Enum `ticket_status_t` : Statuts JIRA Mélangés avec Statuts Supabase

**État actuel :**
```
ticket_status_t = {
  'Nouveau',      // Statut Supabase
  'En_cours',     // Statut Supabase
  'Transfere',    // Statut Supabase
  'Resolue',      // Statut Supabase
  'To_Do',        // Statut JIRA (devrait être mappé vers 'Nouveau')
  'In_Progress',  // Statut JIRA (devrait être mappé vers 'En_cours')
  'Done',         // Statut JIRA (devrait être mappé vers 'Resolue')
  'Closed'        // Statut JIRA (devrait être mappé vers 'Resolue')
}
```

**Problème :**
Le mapping indique que les statuts JIRA doivent être **convertis** vers les statuts Supabase, pas stockés tels quels. Avoir les statuts JIRA dans l'enum peut créer de la confusion.

**Recommandation :**
- **Option 1 (Recommandée)** : Garder les statuts JIRA dans l'enum pour compatibilité, mais toujours mapper vers les statuts Supabase lors de l'import
- **Option 2** : Supprimer les statuts JIRA de l'enum et forcer le mapping (risque de casser des données existantes)

**Impact :**
- Les workflows N8N doivent **toujours mapper** les statuts JIRA vers les statuts Supabase
- Les statuts JIRA dans l'enum peuvent être utilisés temporairement pendant la migration

### 2. Enum `ticket_type_t` : Conforme

**État actuel :**
```
ticket_type_t = {
  'BUG',
  'REQ',
  'ASSISTANCE'
}
```

**Vérification mapping :**
- ✅ JIRA 'Bug' → Supabase 'BUG' ✅
- ✅ JIRA 'Task' → Supabase 'REQ' ✅
- ✅ JIRA 'Story' → Supabase 'REQ' ✅
- ✅ JIRA 'Sub-task' → Supabase 'REQ' ✅

**Conclusion :** ✅ **Conforme** - Aucun changement nécessaire

### 3. Enum `priority_t` : Conforme

**État actuel :**
```
priority_t = {
  'Low',
  'Medium',
  'High',
  'Critical'
}
```

**Vérification mapping :**
- ✅ JIRA 'Lowest' → Supabase 'Low' ✅
- ✅ JIRA 'Low' → Supabase 'Low' ✅
- ✅ JIRA 'Medium' → Supabase 'Medium' ✅
- ✅ JIRA 'High' → Supabase 'High' ✅
- ✅ JIRA 'Highest' → Supabase 'High' ✅
- ✅ JIRA 'Critical' → Supabase 'High' ✅

**Conclusion :** ✅ **Conforme** - Aucun changement nécessaire

### 4. Enum `canal_t` : Conforme

**État actuel :**
```
canal_t = {
  'Whatsapp',
  'Email',
  'Appel',
  'Autre'
}
```

**Vérification mapping :**
- ✅ Labels JIRA `canal:Whatsapp` → Supabase 'Whatsapp' ✅
- ✅ Labels JIRA `canal:Email` → Supabase 'Email' ✅
- ✅ Labels JIRA `canal:Appel` → Supabase 'Appel' ✅
- ✅ Labels JIRA `canal:Autre` → Supabase 'Autre' ✅
- ✅ Par défaut si label manquant → 'Email' ✅

**Conclusion :** ✅ **Conforme** - Aucun changement nécessaire

### 5. Enum `origin_t` : Conforme

**État actuel :**
```
origin_t = {
  'supabase',
  'jira'
}
```

**Vérification mapping :**
- ✅ Tickets créés dans Supabase → 'supabase' ✅
- ✅ Tickets importés depuis JIRA → 'jira' ✅

**Conclusion :** ✅ **Conforme** - Aucun changement nécessaire

### 6. Enum `comment_origin_t` : Conforme

**État actuel :**
```
comment_origin_t = {
  'app',
  'jira_comment'
}
```

**Vérification mapping :**
- ✅ Commentaires créés dans l'app → 'app' ✅
- ✅ Commentaires synchronisés depuis JIRA → 'jira_comment' ✅

**Conclusion :** ✅ **Conforme** - Aucun changement nécessaire

---

## 📊 Résumé de la Vérification

### ✅ Points Conformes

1. **Tous les champs requis sont présents** dans les tables `tickets`, `jira_sync`, `ticket_status_history`, `ticket_comments`
2. **Tous les enums sont conformes** sauf `ticket_status_t` qui contient des statuts JIRA
3. **Structure JSONB `jira_metadata`** est disponible pour stocker les métadonnées JIRA
4. **Relations FK** sont toutes correctement configurées

### ⚠️ Point d'Attention

**Enum `ticket_status_t` contient des statuts JIRA :**
- Les statuts `To_Do`, `In_Progress`, `Done`, `Closed` sont présents dans l'enum
- Selon le mapping, ces statuts doivent être **convertis** vers `Nouveau`, `En_cours`, `Resolue`
- **Recommandation** : Garder ces statuts pour compatibilité, mais s'assurer que les workflows N8N mappent toujours correctement

### ✅ Conclusion Générale

**La base de données est globalement conforme au mapping.** 

Le seul point d'attention concerne l'enum `ticket_status_t` qui contient des statuts JIRA, mais cela ne pose pas de problème si les workflows N8N effectuent correctement le mapping.

**Action recommandée :**
- ✅ Aucune migration nécessaire
- ⚠️ S'assurer que les workflows N8N mappent toujours les statuts JIRA vers les statuts Supabase
- ✅ Documenter que les statuts JIRA dans l'enum sont pour compatibilité uniquement

---

## 🔍 Vérification Détaillée des Mappings

### Mapping Types de Tickets

| JIRA | Supabase | Présent dans Enum | Statut |
|------|----------|-------------------|--------|
| Bug | BUG | ✅ | ✅ Conforme |
| Task | REQ | ✅ | ✅ Conforme |
| Story | REQ | ✅ | ✅ Conforme |
| Sub-task | REQ | ✅ | ✅ Conforme |
| Epic | REQ | ✅ | ✅ Conforme (optionnel) |
| Improvement | REQ | ✅ | ✅ Conforme (optionnel) |

### Mapping Statuts

| JIRA | Supabase (Mapping) | Présent dans Enum | Statut |
|------|-------------------|-------------------|--------|
| To Do | Nouveau | ✅ | ⚠️ Enum contient aussi 'To_Do' |
| In Progress | En_cours | ✅ | ⚠️ Enum contient aussi 'In_Progress' |
| Done | Resolue | ✅ | ⚠️ Enum contient aussi 'Done' |
| Closed | Resolue | ✅ | ⚠️ Enum contient aussi 'Closed' |
| Resolved | Resolue | ✅ | ✅ Conforme |
| Reopened | En_cours | ✅ | ✅ Conforme |
| In Review | En_cours | ✅ | ✅ Conforme (optionnel) |
| Blocked | En_cours | ✅ | ✅ Conforme (optionnel) |

**Note :** Les statuts JIRA (`To_Do`, `In_Progress`, `Done`, `Closed`) sont présents dans l'enum mais ne doivent **pas** être utilisés directement. Ils doivent être mappés vers les statuts Supabase.

### Mapping Priorités

| JIRA | Supabase | Présent dans Enum | Statut |
|------|----------|-------------------|--------|
| Lowest | Low | ✅ | ✅ Conforme |
| Low | Low | ✅ | ✅ Conforme |
| Medium | Medium | ✅ | ✅ Conforme |
| High | High | ✅ | ✅ Conforme |
| Highest | High | ✅ | ✅ Conforme |
| Critical | High | ✅ | ✅ Conforme |
| Blocker | High | ✅ | ✅ Conforme (optionnel) |

---

## ✅ Validation Finale

**Résultat :** ✅ **Base de données conforme au mapping**

**Points à surveiller :**
1. ⚠️ S'assurer que les workflows N8N mappent toujours les statuts JIRA vers les statuts Supabase
2. ✅ Tous les autres champs et enums sont conformes

**Aucune migration nécessaire.**

