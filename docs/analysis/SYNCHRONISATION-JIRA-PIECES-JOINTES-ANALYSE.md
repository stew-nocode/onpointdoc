# 📎 Synchronisation JIRA - Analyse des Pièces Jointes

**Date** : 2025-01-21  
**Statut** : ⚠️ **INCOMPLET** - Les pièces jointes ne sont PAS synchronisées avec JIRA

---

## 📊 Résumé de l'analyse

La synchronisation avec JIRA est **partiellement implémentée** pour les tickets et commentaires, mais **les pièces jointes ne sont PAS synchronisées** dans aucun sens.

---

## ✅ Ce qui est synchronisé

### 1. Tickets Supabase → JIRA ✅

**Fonctionnalité** : `transferTicketToJira()` et `createJiraIssue()`

**Champs synchronisés** :
- ✅ Titre (`title` → `summary`)
- ✅ Description (`description`)
- ✅ Type de ticket (`ticket_type` → `issuetype`)
- ✅ Priorité (`priority`)
- ✅ Contexte client (`customer_context`)
- ✅ Produit et module (`product_id`, `module_id` → labels)
- ✅ Canal (`canal` → label)

**Champs NON synchronisés** :
- ❌ **Pièces jointes des tickets** : Les fichiers ne sont pas transférés vers JIRA
- ❌ **Pièces jointes des commentaires** : Les fichiers ne sont pas transférés vers JIRA

### 2. Tickets JIRA → Supabase ✅

**Fonctionnalité** : `syncJiraToSupabase()` et webhook JIRA

**Champs synchronisés** :
- ✅ Statut (`status`)
- ✅ Priorité (`priority`)
- ✅ Assigné (`assigned_to`)
- ✅ Reporter (`created_by`)
- ✅ Titre et description (`title`, `description`)
- ✅ Custom fields (produits, modules, clients, etc.)
- ✅ Historique des statuts (`ticket_status_history`)

**Champs NON synchronisés** :
- ❌ **Pièces jointes des tickets JIRA** : Les fichiers ne sont pas téléchargés vers Supabase
- ❌ **Pièces jointes des commentaires JIRA** : Les fichiers ne sont pas téléchargés vers Supabase

### 3. Commentaires Supabase → JIRA ❌

**Fonctionnalité** : **AUCUNE**

**Problème** : Les commentaires créés dans Supabase ne sont PAS synchronisés vers JIRA, même sans pièces jointes.

**Champs NON synchronisés** :
- ❌ Commentaires (texte)
- ❌ **Pièces jointes des commentaires**

### 4. Commentaires JIRA → Supabase ✅

**Fonctionnalité** : Webhook JIRA (`comment_added`)

**Champs synchronisés** :
- ✅ Contenu du commentaire (`content`)
- ✅ Origine (`origin = 'jira'`)

**Champs NON synchronisés** :
- ❌ **Pièces jointes des commentaires JIRA** : Les fichiers ne sont pas téléchargés vers Supabase

---

## ❌ Ce qui manque

### 1. Pièces jointes des tickets

#### Supabase → JIRA ❌

**Problème actuel** :
- `transferTicketToJira()` ne récupère pas les pièces jointes
- `createJiraIssue()` ne transfère pas les fichiers vers JIRA
- Les pièces jointes restent dans Supabase Storage uniquement

**Action requise** :
1. Récupérer les pièces jointes du ticket depuis `ticket_attachments`
2. Télécharger les fichiers depuis Supabase Storage
3. Uploader les fichiers vers JIRA via l'API JIRA (`/rest/api/3/issue/{issueIdOrKey}/attachments`)
4. Mettre à jour les métadonnées dans Supabase (optionnel : tracker les IDs JIRA)

#### JIRA → Supabase ❌

**Problème actuel** :
- Les webhooks JIRA ne gèrent pas les pièces jointes
- `syncJiraToSupabase()` ne synchronise pas les attachments
- Les pièces jointes JIRA ne sont pas téléchargées vers Supabase Storage

**Action requise** :
1. Détecter les pièces jointes dans les webhooks JIRA (`issue.fields.attachment`)
2. Télécharger les fichiers depuis JIRA via l'API JIRA
3. Uploader les fichiers vers Supabase Storage (`ticket-attachments`)
4. Créer les métadonnées dans `ticket_attachments`

### 2. Pièces jointes des commentaires

#### Supabase → JIRA ❌

**Problème actuel** :
- Aucune synchronisation des commentaires vers JIRA (même sans pièces jointes)
- Les pièces jointes des commentaires ne sont pas synchronisées

**Action requise** :
1. Créer un service pour synchroniser les commentaires vers JIRA
2. Récupérer les pièces jointes depuis `comment_attachments`
3. Télécharger les fichiers depuis Supabase Storage
4. Uploader les fichiers vers JIRA via l'API JIRA (`/rest/api/3/issue/{issueIdOrKey}/comment/{commentId}/attachments`)

#### JIRA → Supabase ❌

**Problème actuel** :
- Les webhooks JIRA gèrent les commentaires mais pas leurs pièces jointes
- Les pièces jointes des commentaires JIRA ne sont pas téléchargées

**Action requise** :
1. Détecter les pièces jointes dans les commentaires JIRA (`comment.attachments`)
2. Télécharger les fichiers depuis JIRA via l'API JIRA
3. Uploader les fichiers vers Supabase Storage (`comment-attachments`)
4. Créer les métadonnées dans `comment_attachments`

---

## 🔧 Architecture actuelle

### Transfert Supabase → JIRA

```
Application
  ↓
transferTicketToJira()
  ↓
createJiraIssue() → JIRA API
  ↓
Ticket créé dans JIRA
  ❌ Pièces jointes NON transférées
```

### Synchronisation JIRA → Supabase

```
JIRA Webhook
  ↓
/api/webhooks/jira (POST)
  ↓
syncJiraToSupabase()
  ↓
Ticket mis à jour dans Supabase
  ❌ Pièces jointes NON synchronisées
```

### Commentaires JIRA → Supabase

```
JIRA Webhook (comment_added)
  ↓
/api/webhooks/jira (POST)
  ↓
INSERT ticket_comments
  ❌ Pièces jointes NON synchronisées
```

---

## 📋 Plan d'implémentation recommandé

### Phase 1 : Pièces jointes des tickets (Priorité Haute)

#### 1.1. Supabase → JIRA

**Fichier à modifier** : `src/services/jira/client.ts`

**Actions** :
1. Créer `uploadAttachmentsToJiraIssue(jiraIssueKey: string, attachments: TicketAttachment[])`
2. Modifier `createJiraIssue()` pour :
   - Récupérer les pièces jointes du ticket
   - Les uploader vers JIRA après création de l'issue

**Exemple d'API JIRA** :
```typescript
// POST /rest/api/3/issue/{issueIdOrKey}/attachments
// Content-Type: multipart/form-data
// Authorization: Basic {base64(username:token)}
// X-Atlassian-Token: no-check

const formData = new FormData();
formData.append('file', fileBlob, filename);

await fetch(`${jiraUrl}/rest/api/3/issue/${jiraIssueKey}/attachments`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'X-Atlassian-Token': 'no-check'
  },
  body: formData
});
```

#### 1.2. JIRA → Supabase

**Fichier à modifier** : `src/services/jira/sync.ts`

**Actions** :
1. Modifier `syncJiraToSupabase()` pour :
   - Détecter les pièces jointes dans `jiraData.attachments`
   - Les télécharger depuis JIRA
   - Les uploader vers Supabase Storage
   - Créer les métadonnées dans `ticket_attachments`

**Webhook JIRA** :
```json
{
  "webhookEvent": "jira:issue_updated",
  "issue": {
    "fields": {
      "attachment": [
        {
          "id": "12345",
          "filename": "screenshot.png",
          "content": "https://jira.example.com/secure/attachment/12345/screenshot.png",
          "size": 1024
        }
      ]
    }
  }
}
```

### Phase 2 : Pièces jointes des commentaires (Priorité Moyenne)

#### 2.1. Synchronisation des commentaires vers JIRA

**Fichier à créer** : `src/services/jira/comments.ts`

**Actions** :
1. Créer `syncCommentToJira(ticketId: string, commentId: string)`
2. Créer `uploadCommentAttachmentsToJira(jiraIssueKey: string, commentId: string, attachments: CommentAttachment[])`

**Exemple d'API JIRA** :
```typescript
// POST /rest/api/3/issue/{issueIdOrKey}/comment/{commentId}/attachments
```

#### 2.2. Synchronisation des commentaires JIRA → Supabase

**Fichier à modifier** : `src/app/api/webhooks/jira/route.ts`

**Actions** :
1. Détecter les pièces jointes dans les commentaires JIRA
2. Les télécharger depuis JIRA
3. Les uploader vers Supabase Storage (`comment-attachments`)
4. Créer les métadonnées dans `comment_attachments`

**Webhook JIRA** :
```json
{
  "webhookEvent": "comment_created",
  "comment": {
    "id": "12345",
    "body": "Commentaire avec pièce jointe",
    "attachments": [
      {
        "id": "67890",
        "filename": "file.pdf",
        "content": "https://jira.example.com/secure/attachment/67890/file.pdf"
      }
    ]
  }
}
```

---

## 🚨 Problèmes identifiés

### 1. Synchronisation unidirectionnelle des commentaires

**Problème** : Les commentaires créés dans Supabase ne sont PAS synchronisés vers JIRA.

**Impact** : Si un utilisateur ajoute un commentaire avec pièces jointes dans Supabase, elles ne sont jamais visibles dans JIRA.

### 2. Pièces jointes non synchronisées

**Problème** : Aucune synchronisation des pièces jointes dans aucun sens.

**Impact** : 
- Les pièces jointes des tickets restent dans Supabase uniquement
- Les pièces jointes JIRA ne sont pas accessibles dans Supabase
- Perte de contexte lors du transfert vers JIRA

### 3. Pas de tracking des IDs JIRA

**Problème** : Les métadonnées des pièces jointes ne stockent pas les IDs JIRA.

**Impact** : Impossible de synchroniser les suppressions/modifications des pièces jointes JIRA.

---

## ✅ Recommandations

### Priorité 1 : Pièces jointes des tickets Supabase → JIRA

**Justification** : Les tickets Assistance sont transférés vers JIRA avec pièces jointes critiques.

**Action immédiate** :
1. Modifier `createJiraIssue()` pour inclure l'upload des pièces jointes
2. Récupérer les pièces jointes avant le transfert
3. Uploader vers JIRA après création de l'issue

### Priorité 2 : Pièces jointes des tickets JIRA → Supabase

**Justification** : Les IT ajoutent des pièces jointes dans JIRA qui doivent être visibles dans Supabase.

**Action immédiate** :
1. Modifier `syncJiraToSupabase()` pour gérer les attachments
2. Modifier les webhooks JIRA pour détecter les pièces jointes

### Priorité 3 : Synchronisation des commentaires vers JIRA

**Justification** : Les commentaires avec pièces jointes doivent être synchronisés dans les deux sens.

**Action immédiate** :
1. Créer un service de synchronisation des commentaires vers JIRA
2. Intégrer dans le workflow de création de commentaire

### Priorité 4 : Pièces jointes des commentaires

**Justification** : Compléter la synchronisation bidirectionnelle complète.

**Action immédiate** :
1. Implémenter l'upload des pièces jointes des commentaires vers JIRA
2. Implémenter le téléchargement des pièces jointes des commentaires JIRA vers Supabase

---

## 📝 Modifications nécessaires

### Fichiers à modifier

1. **`src/services/jira/client.ts`**
   - Ajouter `uploadAttachmentsToJiraIssue()`
   - Modifier `createJiraIssue()` pour inclure les pièces jointes

2. **`src/services/jira/sync.ts`**
   - Modifier `syncJiraToSupabase()` pour gérer les attachments
   - Ajouter `downloadJiraAttachments()`
   - Ajouter `uploadAttachmentsToSupabase()`

3. **`src/services/tickets/jira-transfer.ts`**
   - Modifier `transferTicketToJira()` pour récupérer et transférer les pièces jointes

4. **`src/app/api/webhooks/jira/route.ts`**
   - Ajouter la gestion des pièces jointes dans les webhooks
   - Synchroniser les attachments des commentaires JIRA

5. **`src/services/jira/comments.ts`** (à créer)
   - Créer `syncCommentToJira()`
   - Créer `uploadCommentAttachmentsToJira()`

---

**Statut** : ⚠️ **SYNCHRONISATION INCOMPLÈTE** - Les pièces jointes ne sont PAS synchronisées avec JIRA

