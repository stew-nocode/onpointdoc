# Synchronisation Bidirectionnelle : Commentaires et Pièces Jointes

**Date :** 2025-01-27  
**Version :** 1.0

## 📊 Vue d'ensemble

Analyse de la synchronisation bidirectionnelle des commentaires et pièces jointes entre JIRA et Supabase.

---

## ✅ Ce qui est IMPLÉMENTÉ

### 1. **JIRA → Supabase (Commentaires)**

**Statut** : ✅ **FONCTIONNEL**

**Fichiers** :
- `src/services/jira/comments/sync.ts` : `syncJiraCommentToSupabase()`
- `src/app/api/webhooks/jira/route.ts` : Appelé dans le webhook (lignes 224-243)

**Fonctionnalités** :
- ✅ Création de commentaires Supabase depuis JIRA
- ✅ Marque `origin='jira'` pour distinguer l'origine
- ✅ Téléchargement automatique des pièces jointes des commentaires JIRA
- ✅ Stockage dans `comment-attachments` (Supabase Storage)

**Déclencheur** :
- Webhook JIRA : `comment_added` (format simplifié legacy)
- Webhook JIRA natif : `jira:issue_updated` avec commentaire (à vérifier)

---

### 2. **JIRA → Supabase (Pièces Jointes Ticket)**

**Statut** : ✅ **FONCTIONNEL**

**Fichiers** :
- `src/services/jira/attachments/download.ts` : `downloadJiraAttachmentsToSupabase()`
- `src/services/jira/sync.ts` : Appelé dans `syncJiraToSupabase()` (lignes 465-471)

**Fonctionnalités** :
- ✅ Téléchargement des pièces jointes JIRA vers Supabase Storage
- ✅ Stockage dans `ticket-attachments` (bucket Supabase)
- ✅ Enregistrement des métadonnées dans `ticket_attachments`
- ✅ Vérification d'idempotence (évite les doublons)

**Déclencheur** :
- Appelé automatiquement lors de `syncJiraToSupabase()`
- Synchronisé à chaque webhook JIRA

---

### 3. **Supabase → JIRA (Pièces Jointes Ticket)**

**Statut** : ✅ **FONCTIONNEL**

**Fichiers** :
- `src/services/jira/attachments/upload.ts` : `uploadTicketAttachmentsToJira()`
- `src/services/tickets/jira-transfer.ts` : Appelé lors du transfert (lignes 91-97)

**Fonctionnalités** :
- ✅ Upload des pièces jointes Supabase vers JIRA
- ✅ Appelé lors du transfert Assistance → JIRA
- ✅ Upload lors de la création BUG/REQ (si pièces jointes présentes)

**Déclencheur** :
- Transfert Assistance → JIRA
- Création BUG/REQ (si pièces jointes)

---

### 4. **JIRA → Supabase (Pièces Jointes Commentaires)**

**Statut** : ✅ **FONCTIONNEL**

**Fichiers** :
- `src/services/jira/comments/attachments.ts` : `downloadJiraCommentAttachmentsToSupabase()`
- `src/services/jira/comments/sync.ts` : Appelé dans `syncJiraCommentToSupabase()` (lignes 81-92)

**Fonctionnalités** :
- ✅ Téléchargement des pièces jointes des commentaires JIRA
- ✅ Stockage dans `comment-attachments` (Supabase Storage)
- ✅ Enregistrement dans `comment_attachments`

**Déclencheur** :
- Automatique lors de la synchronisation d'un commentaire JIRA

---

## ❌ Ce qui est MANQUANT

### 1. **Supabase → JIRA (Commentaires)**

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Problème** :
- Quand un utilisateur crée un commentaire dans Supabase, il n'est **PAS** envoyé vers JIRA
- Le commentaire reste uniquement dans Supabase

**Fichiers concernés** :
- `src/services/tickets/comments/crud.ts` : `createComment()` ne crée que dans Supabase

**Solution nécessaire** :
```typescript
// src/services/jira/comments/create.ts
export async function createJiraComment(
  jiraIssueKey: string,
  content: string,
  attachments?: File[]
): Promise<{ id: string; key: string }> {
  // Créer le commentaire dans JIRA via API
  // Upload des pièces jointes si présentes
}

// Modifier createComment() pour :
// 1. Vérifier si le ticket a une jira_issue_key
// 2. Si oui, créer le commentaire dans JIRA aussi
// 3. Marquer origin='app' dans Supabase
```

**Impact** :
- Les commentaires créés dans Supabase ne sont pas visibles dans JIRA
- L'IT ne voit pas les commentaires du Support

---

### 2. **Supabase → JIRA (Pièces Jointes Commentaires)**

**Statut** : ⚠️ **FONCTION EXISTE MAIS NON UTILISÉE**

**Problème** :
- La fonction `uploadCommentAttachmentsToJira()` existe
- **MAIS** elle n'est jamais appelée car il n'y a pas de création de commentaire JIRA

**Fichiers** :
- `src/services/jira/comments/attachments.ts` : `uploadCommentAttachmentsToJira()` existe

**Solution** :
- Une fois la création de commentaire JIRA implémentée, appeler cette fonction

---

## 📋 Tableau Récapitulatif

| Direction | Type | Statut | Fichier | Notes |
|-----------|------|--------|---------|-------|
| **JIRA → Supabase** | Commentaires | ✅ Fonctionnel | `src/services/jira/comments/sync.ts` | Via webhook |
| **JIRA → Supabase** | Pièces jointes ticket | ✅ Fonctionnel | `src/services/jira/attachments/download.ts` | Automatique |
| **JIRA → Supabase** | Pièces jointes commentaires | ✅ Fonctionnel | `src/services/jira/comments/attachments.ts` | Automatique |
| **Supabase → JIRA** | Commentaires | ❌ **Manquant** | - | À implémenter |
| **Supabase → JIRA** | Pièces jointes ticket | ✅ Fonctionnel | `src/services/jira/attachments/upload.ts` | Lors transfert |
| **Supabase → JIRA** | Pièces jointes commentaires | ⚠️ Non utilisé | `src/services/jira/comments/attachments.ts` | Fonction existe mais pas appelée |

---

## 🎯 Recommandation : Implémenter Supabase → JIRA (Commentaires)

### Pourquoi c'est important

1. **Visibilité IT** : L'IT doit voir les commentaires du Support dans JIRA
2. **Cohérence** : Les commentaires doivent être synchronisés bidirectionnellement
3. **Workflow** : Le Support peut ajouter des informations après création du ticket

### Implémentation nécessaire

**Fichier à créer** : `src/services/jira/comments/create.ts`

```typescript
/**
 * Crée un commentaire dans JIRA depuis Supabase
 * 
 * @param jiraIssueKey - Clé du ticket JIRA
 * @param content - Contenu du commentaire
 * @param attachments - Pièces jointes optionnelles
 * @returns ID du commentaire JIRA créé
 */
export async function createJiraComment(
  jiraIssueKey: string,
  content: string,
  attachments?: Array<{ path: string; fileName: string; mimeType: string | null }>
): Promise<{ id: string; key: string }> {
  // 1. Créer le commentaire dans JIRA via API
  // 2. Upload des pièces jointes si présentes
  // 3. Retourner l'ID du commentaire JIRA
}
```

**Fichier à modifier** : `src/services/tickets/comments/crud.ts`

```typescript
export async function createComment(
  ticketId: string,
  content: string,
  commentType: 'comment' | 'followup' = 'comment'
): Promise<TicketComment> {
  // ... code existant ...
  
  // NOUVEAU : Si le ticket a une jira_issue_key, créer aussi dans JIRA
  const { data: ticket } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .eq('id', ticketId)
    .single();
  
  if (ticket?.jira_issue_key) {
    try {
      const { createJiraComment } = await import('@/services/jira/comments/create');
      const jiraComment = await createJiraComment(
        ticket.jira_issue_key,
        content,
        // Pièces jointes si présentes
      );
      
      // Optionnel : Stocker l'ID JIRA dans ticket_comments pour référence
      // (nécessite ajout d'une colonne jira_comment_id)
    } catch (jiraError) {
      // Ne pas faire échouer la création Supabase si JIRA échoue
      // Logger l'erreur pour diagnostic
    }
  }
  
  return buildCommentResponse(comment, profileId);
}
```

---

## ✅ Résumé

### Synchronisation Actuelle

**Bidirectionnelle** :
- ✅ Pièces jointes ticket (JIRA ↔ Supabase)

**Unidirectionnelle (JIRA → Supabase)** :
- ✅ Commentaires
- ✅ Pièces jointes commentaires

**Manquante (Supabase → JIRA)** :
- ❌ Commentaires (à implémenter)
- ⚠️ Pièces jointes commentaires (fonction existe mais pas utilisée)

### Impact

**Problème principal** :
- Les commentaires créés dans Supabase ne sont **PAS** visibles dans JIRA
- L'IT ne voit pas les commentaires du Support

**Solution** :
- Implémenter `createJiraComment()` et l'appeler dans `createComment()`

### Priorité

**Haute** : Les commentaires sont essentiels pour la communication Support ↔ IT

---

## 📝 Plan d'Action

1. ✅ **Créer** `src/services/jira/comments/create.ts`
2. ✅ **Modifier** `src/services/tickets/comments/crud.ts` pour appeler la création JIRA
3. ✅ **Ajouter** gestion d'erreurs (ne pas faire échouer si JIRA échoue)
4. ✅ **Tester** la création bidirectionnelle
5. ⚠️ **Optionnel** : Ajouter colonne `jira_comment_id` dans `ticket_comments` pour référence

---

## 🔍 Points d'Attention

1. **Gestion des boucles** :
   - Vérifier `origin='app'` avant de créer dans JIRA
   - Ne pas créer dans JIRA si le commentaire vient déjà de JIRA

2. **Idempotence** :
   - Vérifier si le commentaire existe déjà dans JIRA avant création
   - Utiliser un identifiant unique (ex: hash du contenu + timestamp)

3. **Pièces jointes** :
   - Uploader les pièces jointes après création du commentaire JIRA
   - Utiliser `uploadCommentAttachmentsToJira()` existante

4. **Erreurs** :
   - Ne pas faire échouer la création Supabase si JIRA échoue
   - Logger l'erreur pour diagnostic
   - Permettre retry manuel plus tard
