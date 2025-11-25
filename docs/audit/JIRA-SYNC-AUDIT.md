# 🔍 Audit Synchronisation Bidirectionnelle JIRA

**Date**: 2025-01-16  
**Objectif**: Vérifier que la synchronisation bidirectionnelle JIRA ↔ Supabase fonctionne correctement  
**Statut**: ✅ Audit complet

---

## 📊 Résumé Exécutif

### ✅ Points Forts
- **Mécanisme anti-boucle** : Utilisation de `last_update_source` pour éviter les boucles infinies
- **Synchronisation complète** : Statut, priorité, assignation, commentaires, pièces jointes
- **Gestion d'erreur robuste** : Try/catch et enregistrement des erreurs dans `jira_sync`
- **Webhook handler** : Route API dédiée pour recevoir les mises à jour JIRA
- **Création directe** : Tickets BUG/REQ créés directement dans JIRA à la création

### ✅ Améliorations Appliquées
- ✅ `last_update_source` ajouté dans `updateTicket()` pour éviter les boucles
- ✅ Documenté dans l'audit les cas de synchronisation unidirectionnelle (ASSISTANCE → JIRA)

---

## 🔄 Flux 1: Supabase → JIRA

### 1.1 Création de Tickets BUG/REQ

**Fichier**: `src/services/tickets/index.ts` (ligne 54-111)

**Workflow**:
1. ✅ Ticket créé dans Supabase avec `origin: 'supabase'`
2. ✅ Appel direct à `createJiraIssue()` (sans N8N)
3. ✅ Mise à jour du ticket avec `jira_issue_key`
4. ✅ Enregistrement dans `jira_sync` avec `origin: 'supabase'`

**Points vérifiés**:
- ✅ `last_update_source` n'est **pas** défini à la création (normal, pas de boucle ici)
- ✅ Enregistrement dans `jira_sync` pour tracking
- ✅ Gestion d'erreur : si JIRA échoue, le ticket Supabase est quand même créé
- ✅ Erreurs enregistrées dans `jira_sync.sync_error`

**Code clé**:
```typescript
// Ligne 54-111
if (payload.type === 'BUG' || payload.type === 'REQ') {
  const jiraResponse = await createJiraIssue({...});
  if (jiraResponse.success && jiraResponse.jiraIssueKey) {
    await supabase.from('tickets').update({
      jira_issue_key: jiraResponse.jiraIssueKey,
      origin: 'supabase'
    });
    await supabase.from('jira_sync').upsert({
      ticket_id: data.id,
      jira_issue_key: jiraResponse.jiraIssueKey,
      origin: 'supabase',
      last_synced_at: new Date().toISOString()
    });
  }
}
```

---

### 1.2 Transfert d'ASSISTANCE vers JIRA

**Fichier**: `src/services/tickets/jira-transfer.ts`

**Workflow**:
1. ✅ Vérification que le ticket est ASSISTANCE et en statut "En_cours"
2. ✅ Mise à jour du statut à "Transféré"
3. ✅ Création du ticket JIRA avec `createJiraIssue()`
4. ✅ Mise à jour avec `jira_issue_key`
5. ✅ Upload des pièces jointes vers JIRA

**Points vérifiés**:
- ✅ `last_update_source: 'supabase'` défini lors du changement de statut
- ✅ Enregistrement dans `ticket_status_history` avec `source: 'supabase'`
- ✅ Enregistrement dans `jira_sync` avec `origin: 'supabase'`

**Code clé**:
```typescript
// Ligne 39-44
await supabase.from('tickets').update({
  status: 'Transfere',
  last_update_source: 'supabase'
});

// Ligne 54-59
await supabase.from('ticket_status_history').insert({
  ticket_id: ticketId,
  status_from: 'En_cours',
  status_to: 'Transfere',
  source: 'supabase'
});
```

---

### 1.3 Mise à jour de Tickets dans JIRA

**⚠️ Manquant**: Pas de mécanisme automatique pour synchroniser les mises à jour Supabase → JIRA

**Observations**:
- Les modifications de statut pour ASSISTANCE sont bloquées si le ticket a un `jira_issue_key`
- Pas de synchronisation automatique des changements Supabase → JIRA pour les tickets déjà transférés

**Recommandation**: 
- Ajouter un mécanisme de synchronisation (via N8N ou webhook Supabase) pour propager les changements Supabase → JIRA

---

## 🔄 Flux 2: JIRA → Supabase

### 2.1 Webhook Handler

**Fichier**: `src/app/api/webhooks/jira/route.ts`

**Formats supportés**:
1. ✅ Format webhook JIRA natif : `{ webhookEvent, issue, ... }`
2. ✅ Format simplifié (legacy) : `{ event_type, ticket_id, jira_issue_key, updates }`
3. ✅ Format complet (Phase 1) : `{ ticket_id, jira_data: JiraIssueData }`

**Points vérifiés**:
- ✅ Filtrage par projet OD (ignorer OBCS et autres projets)
- ✅ Recherche du ticket existant par `jira_issue_key`
- ✅ Création de ticket si non trouvé (avec `origin: 'jira'`)
- ✅ Mise à jour si trouvé (via `syncJiraToSupabase`)

**Code clé**:
```typescript
// Ligne 96-107
const { data: existingTicket } = await supabase
  .from('tickets')
  .select('id, ticket_type')
  .eq('jira_issue_key', jiraIssueKey)
  .single();

if (existingTicket) {
  await syncJiraToSupabase(existingTicket.id, jiraData, supabase);
} else {
  await createTicketFromJira(jiraData, supabase);
}
```

---

### 2.2 Synchronisation Complète (syncJiraToSupabase)

**Fichier**: `src/services/jira/sync.ts`

**Données synchronisées**:
1. ✅ **Statut** : Mappé depuis JIRA avec `getSupabaseStatusFromJira()`
2. ✅ **Priorité** : Mappé depuis JIRA avec `getSupabasePriorityFromJira()`
3. ✅ **Assignation** : Mappé depuis `assignee.accountId` vers `profile_id`
4. ✅ **Reporter** : Mappé depuis `reporter.accountId` vers `profile_id`
5. ✅ **Client/Contact** : Mappé depuis custom fields JIRA
6. ✅ **Entreprise** : Mappé depuis custom fields JIRA
7. ✅ **Canal** : Mappé depuis custom fields JIRA
8. ✅ **Fonctionnalité/Module** : Mappé depuis custom fields JIRA
9. ✅ **Workflow/Test Status** : Mappé depuis custom fields JIRA
10. ✅ **Commentaires** : Synchronisés séparément via `syncJiraCommentToSupabase()`
11. ✅ **Pièces jointes** : Téléchargées depuis JIRA vers Supabase Storage

**Points vérifiés**:
- ✅ **`last_update_source: 'jira'`** défini lors de la mise à jour (ligne 191)
- ✅ Historique de statut enregistré avec `source: 'jira'` (ligne 455-460)
- ✅ Mise à jour de `jira_sync` avec métadonnées complètes (ligne 432-439)
- ✅ Gestion d'erreur robuste : erreurs enregistrées dans `jira_sync.sync_error`

**Code clé**:
```typescript
// Ligne 187-192
const ticketUpdate: Record<string, unknown> = {
  title: jiraData.summary,
  description: jiraData.description || null,
  updated_at: jiraData.updated,
  last_update_source: 'jira' // ⚠️ PROTECTION ANTI-BOUCLE
};

// Ligne 455-460
await supabase.from('ticket_status_history').insert({
  ticket_id: ticketId,
  status_from: oldTicket.status,
  status_to: supabaseStatus,
  source: 'jira'
});
```

---

### 2.3 Synchronisation des Commentaires

**Fichier**: `src/services/jira/comments/sync.ts`

**Workflow**:
1. ✅ Création du commentaire dans `ticket_comments` avec `origin: 'jira'`
2. ✅ Téléchargement des pièces jointes vers Supabase Storage

**Points vérifiés**:
- ✅ `origin: 'jira'` défini pour distinguer les commentaires JIRA
- ✅ Gestion d'erreur : ne fait pas échouer la synchronisation si les pièces jointes échouent

---

## 🔐 Mécanisme Anti-Boucle

### Champ `last_update_source`

**Objectif**: Éviter que les mises à jour ne créent des boucles infinies entre Supabase et JIRA.

**Valeurs possibles**:
- `'supabase'` : Mise à jour provenant de Supabase
- `'jira'` : Mise à jour provenant de JIRA

**Utilisation**:

1. **Supabase → JIRA** (ligne 43 dans `jira-transfer.ts`):
   ```typescript
   await supabase.from('tickets').update({
     status: 'Transfere',
     last_update_source: 'supabase' // ✅ Défini
   });
   ```

2. **JIRA → Supabase** (ligne 191 dans `sync.ts`):
   ```typescript
   const ticketUpdate = {
     updated_at: jiraData.updated,
     last_update_source: 'jira' // ✅ Défini
   };
   ```

3. **Format simplifié webhook** (ligne 208 dans `route.ts`):
   ```typescript
   await supabase.from('tickets').update({
     status: updates.status,
     last_update_source: 'jira' // ✅ Défini
   });
   ```

**⚠️ Point d'Attention**: 
- Le champ `last_update_source` est défini mais **pas utilisé pour bloquer les synchronisations**
- N8N ou les webhooks Supabase devraient vérifier ce champ avant de synchroniser

**Recommandation**:
- Documenter que N8N doit vérifier `last_update_source` avant de synchroniser Supabase → JIRA
- Ajouter un commentaire dans le code expliquant que ce champ doit être utilisé par les intégrations externes

---

## 📋 Checklist de Vérification

### Supabase → JIRA

- [x] Création BUG/REQ : Crée directement dans JIRA
- [x] Transfert ASSISTANCE : Crée dans JIRA avec statut "Transféré"
- [x] `last_update_source` : Défini à `'supabase'` lors des mises à jour
- [x] Enregistrement dans `jira_sync` : Effectué avec `origin: 'supabase'`
- [x] Gestion d'erreur : Ticket Supabase créé même si JIRA échoue
- [ ] **Mise à jour automatique** : ❌ Manquant (changements Supabase → JIRA)

### JIRA → Supabase

- [x] Webhook handler : Route API `/api/webhooks/jira` fonctionnelle
- [x] Format natif JIRA : Supporté
- [x] Format simplifié : Supporté (legacy)
- [x] Format complet : Supporté
- [x] Création ticket : Si non trouvé, crée avec `origin: 'jira'`
- [x] Mise à jour ticket : Si trouvé, synchronise via `syncJiraToSupabase`
- [x] `last_update_source` : Défini à `'jira'` lors des mises à jour
- [x] Historique statut : Enregistré avec `source: 'jira'`
- [x] Commentaires : Synchronisés avec `origin: 'jira'`
- [x] Pièces jointes : Téléchargées depuis JIRA

### Anti-Boucle

- [x] `last_update_source` : Défini dans tous les flux
- [x] `origin` : Défini dans `jira_sync` et `ticket_comments`
- [x] `source` : Défini dans `ticket_status_history`
- [ ] **Utilisation active** : ⚠️ Défini mais pas utilisé pour bloquer (N8N doit le vérifier)

---

## 🎯 Recommandations

### Priorité 1 : Documentation

1. **Documenter le mécanisme anti-boucle** :
   - Créer un document expliquant comment N8N doit utiliser `last_update_source`
   - Ajouter des commentaires dans le code expliquant l'usage de ce champ

2. **Documenter les flux unidirectionnels** :
   - ASSISTANCE → JIRA : Unidirectionnel (pas de retour)
   - BUG/REQ : Bidirectionnel (création → JIRA, puis synchronisation JIRA → Supabase)

### Priorité 2 : Améliorations (Optionnel)

1. **Ajouter synchronisation Supabase → JIRA** :
   - Utiliser les webhooks Supabase pour déclencher la mise à jour JIRA
   - Vérifier `last_update_source !== 'jira'` avant de synchroniser

2. **Vérification active du champ anti-boucle** :
   - Ajouter une fonction utilitaire pour vérifier si une synchronisation est nécessaire
   - Exemple : `shouldSyncToJira(ticket)` qui vérifie `last_update_source !== 'supabase'`

---

## ✅ Conclusion

La synchronisation bidirectionnelle JIRA est **bien implémentée** avec :

1. ✅ **Flux Supabase → JIRA** : 
   - Création directe pour BUG/REQ
   - Transfert pour ASSISTANCE
   - Champ `last_update_source` défini

2. ✅ **Flux JIRA → Supabase** :
   - Webhook handler complet
   - Synchronisation exhaustive (statut, priorité, assignation, commentaires, pièces jointes)
   - Création automatique de tickets si non trouvés
   - Champ `last_update_source` défini

3. ✅ **Mécanisme anti-boucle** :
   - Champ `last_update_source` présent
   - Historique avec `source` pour traçabilité
   - ⚠️ Utilisation passive (N8N doit le vérifier)

**Recommandation principale** : Documenter l'utilisation de `last_update_source` pour N8N et les intégrations externes.

