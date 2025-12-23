# Ce qui est Synchronisé entre OnpointDoc et JIRA

> **Documentation actuelle** : Ce qui est réellement synchronisé en ce moment dans l'application

## 📊 Vue d'Ensemble

La synchronisation est **bidirectionnelle** :
- **Supabase → JIRA** : Transfert de tickets ASSISTANCE
- **JIRA → Supabase** : Synchronisation des mises à jour JIRA (webhooks)

---

## 🔄 FLUX 1 : Supabase → JIRA (Transfert)

### Déclencheur
- Utilisateur clique sur **"Transférer vers JIRA"** sur un ticket ASSISTANCE

### Ce qui est transféré

#### 1. **Données du Ticket Principal**

| Champ Supabase | → | Champ JIRA | Notes |
|----------------|---|------------|-------|
| `title` | → | `summary` | Titre du ticket |
| `description` | → | `description` | Description enrichie avec contexte |
| `priority` | → | `priority` | Mapping : Low→Priorité 4, Medium→Priorité 3, High→Priorité 2, Critical→Priorité 1 |
| `ticket_type` | → | `issuetype` | ASSISTANCE → "Bug" dans JIRA |
| `id` (UUID) | → | `customfield_10001` | ID Supabase stocké dans custom field JIRA |

#### 2. **Contexte Client (dans la description)**

La description JIRA est enrichie avec :
- **Contexte Client** : `customer_context`
- **Canal** : `canal` (WhatsApp, Email, etc.)
- **Produit** : Nom du produit depuis `product_id`
- **Module** : Nom du module depuis `module_id`

#### 3. **Labels JIRA**

Labels automatiquement ajoutés :
- `canal:{canal}` (ex: `canal:WhatsApp`)
- `product:{product_name}` (ex: `product:OBC`)
- `module:{module_name}` (ex: `module:RH`)

#### 4. **Pièces Jointes**

- **Toutes les pièces jointes** du ticket Supabase sont **uploadées vers JIRA**
- Stockées dans Supabase Storage (`ticket-attachments` bucket)
- Téléchargées et attachées au ticket JIRA créé

### Processus de Transfert

```
1. Vérification
   └─ Ticket type = ASSISTANCE
   └─ Statut = "En_cours"

2. Mise à jour Supabase
   └─ status = "Transfere"
   └─ last_update_source = "supabase"
   └─ Insert dans ticket_status_history

3. Création JIRA
   └─ Appel API JIRA (createJiraIssue)
   └─ Récupération jira_issue_key (ex: "OD-2991")

4. Mise à jour Supabase
   └─ jira_issue_key = "OD-2991"
   └─ Insert/Upsert dans jira_sync

5. Upload Pièces Jointes
   └─ Téléchargement depuis Supabase Storage
   └─ Upload vers JIRA
```

---

## 🔄 FLUX 2 : JIRA → Supabase (Synchronisation)

### Déclencheur
- **Webhook JIRA** reçu sur `/api/webhooks/jira`
- Événements JIRA : `jira:issue_updated`, `jira:issue_created`, `comment_created`

### Ce qui est synchronisé

#### 1. **Données du Ticket Principal**

| Champ JIRA | → | Champ Supabase | Notes |
|------------|---|----------------|-------|
| `summary` | → | `title` | Titre du ticket |
| `description` | → | `description` | Description complète |
| `status.name` | → | `status` | Mapping selon type de ticket |
| `priority.name` | → | `priority` | Mapping via `jira_priority_mapping` |
| `fields.updated` | → | `updated_at` | Date de dernière mise à jour |
| `resolution.name` | → | `resolution` | Résolution JIRA |
| `fixVersions[0].name` | → | `fix_version` | Version de correction |

#### 2. **Utilisateurs**

| Champ JIRA | → | Champ Supabase | Mapping |
|------------|---|----------------|---------|
| `reporter.accountId` | → | `created_by` | Via `profiles.jira_user_id` |
| `assignee.accountId` | → | `assigned_to` | Via `profiles.jira_user_id` |

**Note** : Si `jira_user_id` n'existe pas dans `profiles`, les champs restent `null`.

#### 3. **Client/Contact (Phase 2)**

| Custom Field JIRA | → | Champ Supabase | Description |
|-------------------|---|----------------|-------------|
| `customfield_10053` | → | `contact_user_id` | Nom du client (mappé vers `profiles`) |
| `customfield_10054.value` | → | `profiles.job_title` | Fonction/Poste du client |
| `customfield_10045` | → | `companies.id` | Entreprise (mappé vers `companies`) |
| `customfield_10055.value` | → | `canal` | Canal de contact |

#### 4. **Fonctionnalité/Module (Phase 3)**

| Custom Field JIRA | → | Champ Supabase | Description |
|-------------------|---|----------------|-------------|
| `customfield_10052.value` | → | `feature_id`, `submodule_id` | Module/Fonctionnalité (mappé vers `features`/`submodules`) |

#### 5. **Workflow et Suivi (Phase 4)**

| Custom Field JIRA | → | Champ Supabase | Description |
|-------------------|---|----------------|-------------|
| `customfield_10083` | → | `workflow_status` | Statut workflow |
| `customfield_10084` | → | `test_status` | Statut test |
| `customfield_10021` | → | `issue_type` | Type d'issue (Bug, Impediment, etc.) |
| `customfield_10020` | → | `sprint_id` | ID du sprint |
| `customfield_10057` | → | `related_ticket_key`, `related_ticket_id` | Ticket lié |
| `customfield_10111` | → | `target_date` | Date cible |
| `customfield_10115` | → | `resolved_at` | Date de résolution |

#### 6. **Champs Spécifiques Produits (Phase 5)**

Stockés dans `tickets.custom_fields` (JSONB) :

| Custom Field JIRA | Produit | Description |
|-------------------|---------|-------------|
| `customfield_10297` | OBC | Opérations |
| `customfield_10298` | OBC | Finance |
| `customfield_10300` | OBC | RH |
| `customfield_10299` | OBC | Projets |
| `customfield_10301` | OBC | CRM |
| `customfield_10313` | - | Finance |
| `customfield_10324` | - | RH |
| `customfield_10364` | - | Paramétrage admin |

#### 7. **Commentaires**

| Champ JIRA | → | Champ Supabase | Notes |
|------------|---|----------------|-------|
| `comment.body` | → | `ticket_comments.content` | Contenu du commentaire |
| `comment.created` | → | `ticket_comments.created_at` | Date de création |
| `comment.author.accountId` | → | `ticket_comments.user_id` | Via `profiles.jira_user_id` (ou null) |
| `comment.attachments` | → | `ticket_attachments` | Pièces jointes du commentaire |

**Note** : Les commentaires JIRA ont `origin='jira'` dans `ticket_comments`.

#### 8. **Pièces Jointes**

- **Pièces jointes du ticket JIRA** → Téléchargées vers Supabase Storage
- **Pièces jointes des commentaires JIRA** → Téléchargées vers Supabase Storage
- Stockées dans le bucket `ticket-attachments`
- Métadonnées enregistrées dans `ticket_attachments`

#### 9. **Métadonnées (jira_sync)**

Table `jira_sync` mise à jour avec :

| Champ | Source | Description |
|-------|--------|-------------|
| `jira_issue_key` | `issue.key` | Clé JIRA (ex: "OD-2991") |
| `jira_status` | `status.name` | Statut JIRA original |
| `jira_priority` | `priority.name` | Priorité JIRA original |
| `jira_assignee_account_id` | `assignee.accountId` | AccountId JIRA |
| `jira_reporter_account_id` | `reporter.accountId` | AccountId JIRA |
| `jira_resolution` | `resolution.name` | Résolution JIRA |
| `jira_fix_version` | `fixVersions[0].name` | Version de correction |
| `jira_sprint_id` | `customfield_10020` | ID du sprint |
| `jira_workflow_status` | `customfield_10083` | Statut workflow |
| `jira_test_status` | `customfield_10084` | Statut test |
| `jira_issue_type` | `customfield_10021` | Type d'issue |
| `jira_related_ticket_key` | `customfield_10057` | Ticket lié |
| `jira_target_date` | `customfield_10111` | Date cible |
| `jira_resolved_at` | `customfield_10115` | Date de résolution |
| `sync_metadata` | JSONB | Labels, components, métadonnées client/contact |
| `last_synced_at` | Timestamp | Dernière synchronisation |

#### 10. **Historique des Statuts**

| Champ JIRA | → | Champ Supabase | Notes |
|------------|---|----------------|-------|
| Changement de statut | → | `ticket_status_history` | `status_from`, `status_to`, `source='jira'` |

### Processus de Synchronisation

```
1. Réception Webhook
   └─ Format JIRA natif ou simplifié
   └─ Filtrage : seulement tickets OD-* (ignore OBCS, etc.)

2. Recherche Ticket
   └─ Par jira_issue_key dans tickets
   └─ Si non trouvé : création depuis JIRA

3. Synchronisation Complète (syncJiraToSupabase)
   ├─ Mapping statut/priorité
   ├─ Mapping utilisateurs (reporter, assignee)
   ├─ Mapping client/contact/entreprise
   ├─ Mapping fonctionnalité/module
   ├─ Mapping champs workflow
   ├─ Mapping champs produits
   ├─ Mise à jour ticket
   ├─ Mise à jour jira_sync
   ├─ Historique statut (si changement)
   └─ Téléchargement pièces jointes

4. Synchronisation Commentaires (si webhook comment_created)
   ├─ Création commentaire dans ticket_comments
   └─ Téléchargement pièces jointes du commentaire
```

---

## 🔄 FLUX COMPLET : Diagramme

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX SUPABASE → JIRA                         │
└─────────────────────────────────────────────────────────────────┘

[Utilisateur] 
    │
    │ Clic "Transférer vers JIRA"
    ▼
[transferTicketToJira()]
    │
    ├─ 1. Vérification (ASSISTANCE, statut "En_cours")
    │
    ├─ 2. Mise à jour Supabase
    │   ├─ status = "Transfere"
    │   ├─ last_update_source = "supabase"
    │   └─ ticket_status_history
    │
    ├─ 3. Création JIRA
    │   └─ createJiraIssue()
    │       ├─ title → summary
    │       ├─ description (enrichie)
    │       ├─ priority (mappée)
    │       ├─ labels (canal, product, module)
    │       └─ customfield_10001 = ticket.id
    │
    ├─ 4. Mise à jour Supabase
    │   ├─ jira_issue_key = "OD-2991"
    │   └─ jira_sync (upsert)
    │
    └─ 5. Upload Pièces Jointes
        └─ uploadTicketAttachmentsToJira()
            └─ Supabase Storage → JIRA


┌─────────────────────────────────────────────────────────────────┐
│                    FLUX JIRA → SUPABASE                          │
└─────────────────────────────────────────────────────────────────┘

[JIRA]
    │
    │ Webhook (issue_updated, comment_created)
    ▼
[POST /api/webhooks/jira]
    │
    ├─ 1. Réception & Filtrage
    │   └─ Seulement tickets OD-*
    │
    ├─ 2. Recherche Ticket
    │   └─ Par jira_issue_key
    │
    ├─ 3. Synchronisation Ticket
    │   └─ syncJiraToSupabase()
    │       ├─ Mapping statut/priorité
    │       ├─ Mapping utilisateurs
    │       ├─ Mapping client/contact
    │       ├─ Mapping fonctionnalité/module
    │       ├─ Mapping workflow
    │       ├─ Mapping produits
    │       ├─ Update tickets
    │       ├─ Update jira_sync
    │       ├─ Insert ticket_status_history (si changement)
    │       └─ downloadJiraAttachmentsToSupabase()
    │
    └─ 4. Synchronisation Commentaires (si webhook)
        └─ syncJiraCommentToSupabase()
            ├─ Insert ticket_comments (origin='jira')
            └─ downloadJiraCommentAttachmentsToSupabase()
```

---

## 📋 Résumé : Ce qui est Synchronisé

### ✅ Synchronisé (Supabase → JIRA)

- ✅ Titre du ticket
- ✅ Description (enrichie avec contexte)
- ✅ Priorité (mappée)
- ✅ Labels (canal, produit, module)
- ✅ Pièces jointes du ticket
- ✅ ID Supabase (dans custom field)

### ✅ Synchronisé (JIRA → Supabase)

- ✅ **Ticket Principal** : Titre, description, statut, priorité, dates
- ✅ **Utilisateurs** : Reporter, assigné (si `jira_user_id` configuré)
- ✅ **Client/Contact** : Nom, fonction, entreprise, canal
- ✅ **Fonctionnalité/Module** : Feature, submodule
- ✅ **Workflow** : Workflow status, test status, issue type, sprint
- ✅ **Suivi** : Related ticket, target date, resolved at
- ✅ **Produits** : Champs spécifiques produits (OBC, etc.)
- ✅ **Commentaires** : Contenu, auteur, date, pièces jointes
- ✅ **Pièces Jointes** : Ticket et commentaires
- ✅ **Métadonnées** : Labels, components, toutes les données JIRA originales
- ✅ **Historique** : Changements de statut

### ❌ NON Synchronisé

- ❌ **Modifications depuis Supabase vers JIRA** (sauf transfert initial)
  - Si un ticket est modifié dans Supabase après transfert, JIRA n'est **pas** mis à jour
  - JIRA devient la source de vérité après transfert

- ❌ **Commentaires créés dans Supabase**
  - Les commentaires créés dans l'application ne sont **pas** envoyés vers JIRA
  - Seulement les commentaires JIRA → Supabase

- ❌ **Activités et Tâches**
  - Les activités et tâches ne sont **pas** synchronisées avec JIRA
  - Elles restent uniquement dans Supabase

---

## 🔐 Règles Anti-Boucle

### Champ `last_update_source`

- **`'supabase'`** : Dernière mise à jour depuis l'application
- **`'jira'`** : Dernière mise à jour depuis JIRA

**Logique** :
- Si `last_update_source='jira'` → Ne pas renvoyer vers JIRA
- Si `last_update_source='supabase'` → Ne pas renvoyer vers Supabase

### Champ `origin`

Dans `ticket_status_history` et `ticket_comments` :
- **`'supabase'`** : Origine application
- **`'jira'`** : Origine JIRA

Permet de distinguer l'origine dans l'UI.

---

## 🎯 Points Clés

1. **Direction** : Synchronisation **unidirectionnelle** après transfert
   - Supabase → JIRA : Seulement lors du transfert initial
   - JIRA → Supabase : En continu via webhooks

2. **Source de Vérité** :
   - **Avant transfert** : Supabase (pour ASSISTANCE)
   - **Après transfert** : JIRA (pour tous les tickets transférés)
   - **BUG/REQ** : JIRA (toujours)

3. **Mapping des Statuts** :
   - **BUG/REQ** : Statuts JIRA stockés directement (pas de mapping)
   - **ASSISTANCE** : Mapping dynamique via `jira_status_mapping` (avant transfert), puis statuts JIRA bruts (après transfert)

4. **Pièces Jointes** :
   - **Transfert** : Supabase Storage → JIRA
   - **Synchronisation** : JIRA → Supabase Storage

5. **Commentaires** :
   - **Seulement JIRA → Supabase**
   - Les commentaires créés dans Supabase ne sont **pas** envoyés vers JIRA

---

## 📝 Notes Importantes

- ⚠️ **Les modifications dans Supabase ne sont PAS synchronisées vers JIRA** après le transfert initial
- ⚠️ **Les commentaires créés dans Supabase ne sont PAS envoyés vers JIRA**
- ✅ **Toutes les modifications JIRA sont synchronisées vers Supabase** (via webhooks)
- ✅ **Les pièces jointes sont synchronisées dans les deux sens** (transfert et webhooks)

