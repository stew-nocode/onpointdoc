# Solution : Mapping du Vrai Créateur (OBSC → OD)

## 🔍 Problème Identifié

### Situation Actuelle
1. **OBSC** = Projet source de vérité dans JIRA
2. **OD** = Projet de duplication (automatisation)
3. **Automatisation** : Duplique TYPE et REQUETE de OBSC → OD
4. **Compte automatique** : Utilise le compte de **Vivien DAKPOGAN**
5. **Résultat** : Tous les tickets OD ont Vivien comme rapporteur (pas le vrai créateur)

### Impact
- `tickets.created_by = NULL` dans Supabase (car Vivien n'est pas le vrai créateur)
- Impossible de tracer qui a vraiment créé le ticket
- Statistiques et rapports incorrects

---

## 💡 Solution Proposée

### Option 1 : Utiliser un Custom Field JIRA (Recommandé)

**Principe** : Stocker le vrai créateur dans un custom field lors de la duplication OBSC → OD

#### Étape 1 : Modifier l'automatisation N8N (OBSC → OD)
Lors de la duplication du ticket :
```json
{
  "project": { "key": "OD" },
  "summary": "...",
  "description": "...",
  "reporter": { "accountId": "vivien_account_id" },  // Compte automatique
  "customfield_XXXXX": {  // Nouveau custom field
    "accountId": "vrai_createur_account_id"  // Vrai créateur depuis OBSC
  }
}
```

#### Étape 2 : Modifier la synchronisation Supabase
Dans `src/services/jira/sync.ts`, au lieu d'utiliser `reporter.accountId`, utiliser le custom field :

```typescript
// Avant (actuel)
const createdBy = jiraData.reporter?.accountId
  ? await mapJiraAccountIdToProfileId(jiraData.reporter.accountId)
  : null;

// Après (proposé)
const realCreatorAccountId = jiraData.customfield_XXXXX?.accountId || jiraData.reporter?.accountId;
const createdBy = realCreatorAccountId
  ? await mapJiraAccountIdToProfileId(realCreatorAccountId)
  : null;
```

**Avantages** :
- ✅ Simple à implémenter
- ✅ Pas besoin d'appel API supplémentaire
- ✅ Données disponibles directement dans le webhook

**Inconvénients** :
- ⚠️ Nécessite de modifier l'automatisation N8N
- ⚠️ Nécessite un custom field JIRA (à créer)

---

### Option 2 : Requête API JIRA pour le Ticket Source

**Principe** : Lors de la synchronisation, récupérer le ticket source dans OBSC via l'API JIRA

#### Étape 1 : Identifier le ticket source
Utiliser un custom field ou une convention de nommage pour lier OD → OBSC :
- Custom field `customfield_supabase_ticket_id` ou similaire
- Convention : Le ticket OD contient la clé OBSC dans la description

#### Étape 2 : Récupérer le vrai créateur
```typescript
async function getRealCreatorFromOBSC(jiraIssueKey: string): Promise<string | null> {
  // 1. Identifier le ticket source OBSC (via custom field ou parsing)
  const obscIssueKey = extractOBSCKey(jiraIssueKey);
  
  // 2. Appeler l'API JIRA pour récupérer le ticket OBSC
  const obscIssue = await jiraAPI.getIssue(obscIssueKey);
  
  // 3. Extraire le vrai rapporteur
  return obscIssue.fields.reporter?.accountId || null;
}
```

#### Étape 3 : Utiliser dans la synchronisation
```typescript
// Si le ticket vient du projet OD
if (jiraData.project?.key === 'OD') {
  const realCreatorAccountId = await getRealCreatorFromOBSC(jiraData.key);
  createdBy = realCreatorAccountId
    ? await mapJiraAccountIdToProfileId(realCreatorAccountId)
    : null;
} else {
  // Ticket direct (OBSC ou autre)
  createdBy = jiraData.reporter?.accountId
    ? await mapJiraAccountIdToProfileId(jiraData.reporter.accountId)
    : null;
}
```

**Avantages** :
- ✅ Pas besoin de modifier l'automatisation N8N
- ✅ Fonctionne avec les tickets existants (si on peut identifier OBSC)

**Inconvénients** :
- ⚠️ Nécessite un appel API JIRA supplémentaire (latence)
- ⚠️ Nécessite des credentials JIRA dans Supabase
- ⚠️ Plus complexe à implémenter

---

### Option 3 : Script de Correction Rétroactive + Synchronisation Future

**Principe** : Corriger les tickets existants + modifier la synchronisation pour l'avenir

#### Phase 1 : Script de Correction Rétroactive
1. Pour chaque ticket OD dans Supabase :
   - Récupérer la clé JIRA OD
   - Identifier le ticket source OBSC (via API ou custom field)
   - Récupérer le vrai créateur depuis OBSC
   - Mettre à jour `tickets.created_by` dans Supabase

#### Phase 2 : Modifier la Synchronisation Future
Implémenter l'Option 1 ou 2 pour les nouveaux tickets

**Avantages** :
- ✅ Corrige les données historiques
- ✅ Assure la cohérence future

**Inconvénients** :
- ⚠️ Nécessite un script de migration
- ⚠️ Peut être long si beaucoup de tickets

---

## 🎯 Recommandation : Option 1 (Custom Field)

### Plan d'Implémentation

#### 1. Créer le Custom Field dans JIRA
- Nom : "Vrai Créateur" ou "Original Reporter"
- Type : User Picker
- Projet : OD uniquement (ou tous)

#### 2. Modifier l'Automatisation N8N
Dans le workflow OBSC → OD :
```javascript
// Lors de la création du ticket OD
{
  // ... autres champs ...
  "reporter": { "accountId": "vivien_account_id" },  // Compte automatique
  "customfield_XXXXX": {  // Nouveau custom field
    "accountId": originalIssue.fields.reporter.accountId  // Vrai créateur
  }
}
```

#### 3. Modifier la Synchronisation Supabase
```typescript
// Dans src/services/jira/sync.ts
const realCreatorAccountId = 
  jiraData.customfield_XXXXX?.accountId ||  // Custom field (vrai créateur)
  jiraData.reporter?.accountId;              // Fallback (reporter direct)

const createdBy = realCreatorAccountId
  ? await mapJiraAccountIdToProfileId(realCreatorAccountId)
  : null;
```

#### 4. Script de Correction Rétroactive (Optionnel)
Pour les tickets existants, utiliser l'Option 3 Phase 1.

---

## 📋 Questions à Clarifier

1. **Custom Field JIRA** : Existe-t-il déjà un custom field pour stocker le vrai créateur ? Sinon, pouvez-vous en créer un ?

2. **Identification OBSC → OD** : Comment identifier le ticket source OBSC depuis un ticket OD ?
   - Custom field de liaison ?
   - Convention de nommage dans la description ?
   - Autre méthode ?

3. **Tickets Existants** : Voulez-vous corriger les tickets existants (1000 tickets) ou seulement les nouveaux ?

4. **API JIRA** : Avez-vous les credentials JIRA disponibles dans Supabase pour faire des appels API si nécessaire ?

5. **Automatisation N8N** : Pouvez-vous modifier l'automatisation N8N pour ajouter le custom field lors de la duplication ?

---

## ✅ Prochaines Étapes

Une fois vos réponses obtenues, je pourrai :
1. Implémenter la solution choisie
2. Créer le script de correction rétroactive si nécessaire
3. Tester et valider la solution

