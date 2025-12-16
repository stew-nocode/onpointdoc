# Flux de Transfert d'un Ticket ASSISTANCE vers JIRA (IT)

**Date :** 2025-01-27  
**Version :** 1.0

## 📋 Vue d'ensemble

Quand un ticket **ASSISTANCE** est transféré vers les IT, il devient un ticket **BUG** dans JIRA et suit désormais le cycle de vie JIRA. Le ticket reste dans Supabase mais est synchronisé avec JIRA.

---

## 🔄 Flux Complet : De l'Action Utilisateur à la Synchronisation

### Étape 1 : Action Utilisateur (Frontend)

**Fichier** : `src/components/tickets/transfer-ticket-button.tsx`

1. L'agent Support clique sur le bouton **"Transférer vers JIRA"**
2. Une confirmation est demandée : *"Êtes-vous sûr de vouloir transférer ce ticket vers JIRA ? Cette action changera le statut à 'Transféré'."*
3. Si confirmé, la fonction `onTransfer()` est appelée

**Conditions d'affichage du bouton** :
- Ticket de type `ASSISTANCE`
- Statut actuel : `En_cours`
- Visible par Agents/Managers Support uniquement

---

### Étape 2 : Server Action (Next.js)

**Fichier** : `src/app/(main)/gestion/tickets/actions.ts`

```typescript
export async function transferTicketAction(ticketId: string): Promise<void> {
  const { transferTicketToJira } = await import('@/services/tickets/jira-transfer');
  await transferTicketToJira(ticketId);
  
  // Revalide les pages pour rafraîchir l'affichage
  revalidatePath(`/gestion/tickets/${ticketId}`);
  revalidatePath('/gestion/tickets');
}
```

**Actions** :
- Appelle le service `transferTicketToJira()`
- Revalide les pages concernées (pas besoin de `router.refresh()` côté client)

---

### Étape 3 : Service de Transfert (Logique Métier)

**Fichier** : `src/services/tickets/jira-transfer.ts`

#### 3.1 Vérifications Préalables

```typescript
// 1. Récupérer le ticket
const ticket = await supabase
  .from('tickets')
  .select('id, ticket_type, status, title, description, canal, priority, product_id, module_id, customer_context')
  .eq('id', ticketId)
  .single();

// 2. Vérifications
if (ticket.ticket_type !== 'ASSISTANCE') {
  throw new Error('Seuls les tickets ASSISTANCE peuvent être transférés vers JIRA');
}

if (ticket.status !== 'En_cours') {
  throw new Error('Le ticket doit être en statut "En_cours" pour être transféré');
}
```

**Validations** :
- ✅ Le ticket existe
- ✅ Le ticket est de type `ASSISTANCE`
- ✅ Le ticket est en statut `En_cours`

---

#### 3.2 Mise à Jour du Statut dans Supabase

```typescript
// Mettre à jour le statut à "Transféré"
await supabase
  .from('tickets')
  .update({
    status: 'Transfere',
    last_update_source: 'supabase'
  })
  .eq('id', ticketId);

// Enregistrer dans l'historique
await supabase.from('ticket_status_history').insert({
  ticket_id: ticketId,
  status_from: 'En_cours',
  status_to: 'Transfere',
  source: 'supabase'
});
```

**Résultat** :
- Statut du ticket : `En_cours` → `Transfere`
- Historique enregistré avec `source='supabase'`
- `last_update_source='supabase'` pour éviter les boucles de synchronisation

---

#### 3.3 Création du Ticket JIRA

**Fichier** : `src/services/jira/client.ts`

```typescript
const jiraResponse = await createJiraIssue({
  ticketId: ticket.id,
  title: ticket.title,
  description: ticket.description || '',
  ticketType: 'BUG', // ⚠️ Les ASSISTANCE transférés deviennent des BUG dans JIRA
  priority: ticket.priority as 'Low' | 'Medium' | 'High' | 'Critical',
  canal: ticket.canal || null,
  productId: ticket.product_id || undefined,
  moduleId: ticket.module_id || undefined,
  customerContext: ticket.customer_context || undefined
});
```

**Détails de la création JIRA** :

1. **Récupération des données** :
   - Nom du produit (si `product_id` existe)
   - Nom du module (si `module_id` existe)

2. **Mapping des champs** :
   - **Type JIRA** : Toujours `'Bug'` (même si c'était une ASSISTANCE)
   - **Priorité** : Mapping vers IDs JIRA (1=Highest, 2=High, 3=Medium, 4=Lowest)
   - **Description enrichie** : Description + contexte client + canal + produit + module
   - **Labels** : `canal:{canal}`, `product:{productName}`, `module:{moduleName}`
   - **Custom field** : Stockage de l'ID Supabase dans `customfield_10001` (ou configuré)

3. **Format de description** :
   - Conversion en format ADF (Atlassian Document Format) requis par JIRA API v3
   - Enrichissement avec contexte client, canal, produit, module

4. **Appel API JIRA** :
   ```typescript
   POST /rest/api/3/issue
   {
     fields: {
       project: { key: 'OD' },
       summary: ticket.title,
       description: descriptionADF,
       issuetype: { name: 'Bug' },
       priority: { id: jiraPriorityId },
       labels: ['canal:WhatsApp', 'product:OBC', 'module:RH'],
       customfield_10001: ticket.id // ID Supabase
     }
   }
   ```

**Résultat** :
- Ticket créé dans JIRA avec clé (ex: `OD-2991`)
- Retour de `jiraIssueKey` et `jiraIssueId`

---

#### 3.4 Mise à Jour Supabase avec la Clé JIRA

```typescript
// Mettre à jour le ticket avec la clé JIRA
await supabase
  .from('tickets')
  .update({ jira_issue_key: jiraResponse.jiraIssueKey })
  .eq('id', ticketId);

// Enregistrer dans jira_sync pour tracking
await supabase.from('jira_sync').upsert({
  ticket_id: ticketId,
  jira_issue_key: jiraResponse.jiraIssueKey,
  origin: 'supabase',
  last_synced_at: new Date().toISOString()
});
```

**Résultat** :
- `tickets.jira_issue_key` = `OD-2991` (exemple)
- Entrée dans `jira_sync` pour le suivi de synchronisation

---

#### 3.5 Upload des Pièces Jointes (Optionnel)

```typescript
try {
  const { uploadTicketAttachmentsToJira } = await import('@/services/jira/attachments/upload');
  await uploadTicketAttachmentsToJira(jiraResponse.jiraIssueKey, ticketId);
} catch (attachmentError) {
  // Ne pas faire échouer le transfert si l'upload échoue
}
```

**Résultat** :
- Les pièces jointes du ticket Supabase sont uploadées vers JIRA
- Si l'upload échoue, le transfert continue (erreur silencieuse)

---

## 📊 État du Ticket Après Transfert

### Dans Supabase

| Champ | Avant | Après |
|-------|-------|-------|
| `status` | `En_cours` | `Transfere` |
| `jira_issue_key` | `null` | `OD-2991` (exemple) |
| `last_update_source` | `supabase` | `supabase` |
| `ticket_type` | `ASSISTANCE` | `ASSISTANCE` (ne change pas) |

### Dans JIRA

| Champ | Valeur |
|-------|--------|
| `key` | `OD-2991` (exemple) |
| `issuetype` | `Bug` |
| `summary` | Titre du ticket ASSISTANCE |
| `description` | Description enrichie avec contexte |
| `priority` | Priorité mappée (1-4) |
| `labels` | `canal:...`, `product:...`, `module:...` |
| `customfield_10001` | UUID du ticket Supabase |

---

## 🔄 Synchronisation Inverse : JIRA → Supabase

### Après le Transfert

Une fois le ticket transféré, **JIRA devient la source de vérité** pour les statuts. Les mises à jour dans JIRA sont synchronisées vers Supabase via webhooks.

### Webhook JIRA → Supabase

**Fichier** : `src/app/api/webhooks/jira/route.ts`

**Déclencheurs** :
- Changement de statut dans JIRA
- Ajout de commentaire dans JIRA
- Changement d'assigné dans JIRA
- Ajout de pièce jointe dans JIRA

**Processus** :

1. **Réception du webhook** :
   ```json
   {
     "webhookEvent": "jira:issue_updated",
     "issue": {
       "key": "OD-2991",
       "fields": {
         "status": { "name": "In Progress" },
         "assignee": { ... },
         ...
       }
     }
   }
   ```

2. **Recherche du ticket Supabase** :
   ```typescript
   const ticket = await supabase
     .from('tickets')
     .select('id, ticket_type')
     .eq('jira_issue_key', 'OD-2991')
     .single();
   ```

3. **Synchronisation complète** :
   ```typescript
   await syncJiraToSupabase(ticket.id, jiraData, supabase);
   ```

**Fichier** : `src/services/jira/sync.ts`

**Données synchronisées** :
- ✅ Statut JIRA → Statut Supabase (avec mapping)
- ✅ Priorité
- ✅ Assigné (via `jira_user_id` → `profile_id`)
- ✅ Commentaires (avec `origin='jira'`)
- ✅ Pièces jointes (téléchargement depuis JIRA)
- ✅ Custom fields (client, canal, fonctionnalité, etc.)
- ✅ Historique des statuts (`ticket_status_history` avec `source='jira'`)

---

## 🎯 Cycle de Vie Après Transfert

### Avant Transfert (ASSISTANCE dans Supabase)

```
Nouveau → En_cours → [Transfert] → Transfere
```

### Après Transfert (Synchronisé avec JIRA)

```
Transfere → [JIRA: To Do] → [JIRA: In Progress] → [JIRA: Done] → Resolue
```

**Important** :
- Le statut `Transfere` est le dernier statut géré uniquement dans Supabase
- Après le transfert, les statuts viennent de JIRA via synchronisation
- Le mapping des statuts JIRA → Supabase est géré par `getSupabaseStatusFromJira()`

---

## ⚠️ Points d'Attention

### 1. Type de Ticket Ne Change Pas

**Important** : Le `ticket_type` reste `ASSISTANCE` dans Supabase même après transfert. C'est normal car :
- Le ticket garde son historique dans Supabase
- Dans JIRA, il devient un `Bug` mais c'est une transformation, pas un changement de type source

### 2. Statut "Transféré" est Temporaire

Le statut `Transfere` est un statut de transition. Une fois que JIRA synchronise le premier statut, il sera remplacé par le statut JIRA (ex: `To Do`, `In Progress`, etc.).

### 3. Gestion des Boucles

Le champ `last_update_source` évite les boucles :
- Si `last_update_source='supabase'` → Les mises à jour depuis Supabase ne déclenchent pas de sync vers JIRA
- Si `last_update_source='jira'` → Les mises à jour depuis JIRA ne déclenchent pas de sync vers Supabase

### 4. Erreurs de Création JIRA

Si la création JIRA échoue :
- Le statut reste `En_cours` (pas mis à jour à `Transfere`)
- L'erreur est remontée à l'utilisateur
- Le ticket peut être retransféré

---

## 📝 Résumé du Flux

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Agent Support clique sur "Transférer vers JIRA"         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Action : transferTicketAction()                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Service : transferTicketToJira()                        │
│    ├─ Vérifie ASSISTANCE + statut En_cours                 │
│    ├─ Met à jour statut → "Transfere"                      │
│    ├─ Enregistre dans ticket_status_history                │
│    ├─ Crée ticket JIRA (type: Bug)                         │
│    ├─ Met à jour jira_issue_key dans Supabase              │
│    ├─ Enregistre dans jira_sync                            │
│    └─ Upload pièces jointes vers JIRA                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Ticket dans Supabase :                                   │
│    - status = "Transfere"                                   │
│    - jira_issue_key = "OD-2991"                            │
│    - last_update_source = "supabase"                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Ticket dans JIRA :                                      │
│    - key = "OD-2991"                                        │
│    - issuetype = "Bug"                                     │
│    - customfield_10001 = UUID Supabase                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. IT travaille dans JIRA (change statut, ajoute comment)  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Webhook JIRA → /api/webhooks/jira                       │
│    └─ syncJiraToSupabase() synchronise les changements     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Ticket dans Supabase mis à jour :                        │
│    - status = statut JIRA (mappé)                           │
│    - commentaires JIRA ajoutés                              │
│    - assigné mis à jour                                    │
│    - last_update_source = "jira"                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Conclusion

**Logique actuelle** :
1. ✅ Transfert manuel via bouton (Agent Support)
2. ✅ Création directe dans JIRA (sans N8N)
3. ✅ Synchronisation bidirectionnelle via webhooks
4. ✅ Gestion des statuts et commentaires
5. ✅ Upload des pièces jointes

**État** : **Fonctionnel et complet**

Le flux est opérationnel. Le seul point à vérifier est que le webhook JIRA est bien configuré pour pointer vers `/api/webhooks/jira`.


