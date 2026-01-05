# Correction de l'Erreur Custom Field JIRA

**Date** : 2026-01-05  
**Problème** : Erreur 400 lors de la création de tickets BUG/REQ dans JIRA  
**Cause** : Custom field `customfield_10001` non configuré dans JIRA

## 🔍 Problème Identifié

### Erreur JIRA
```
JIRA 400: {"errorMessages":[],"errors":{"customfield_10001":"Field 'customfield_10001' cannot be set. It is not on the appropriate screen, or unknown."}}
```

### Cause
Le code tentait d'ajouter automatiquement le custom field `customfield_10001` pour stocker l'ID Supabase du ticket, mais :
1. Ce custom field n'existe pas dans le projet JIRA OD
2. Ou il n'est pas configuré sur l'écran de création des tickets

## ✅ Solution Appliquée

### 1. Custom Field Optionnel

**Fichier** : `src/services/jira/client.ts` (lignes 159-164)

**Avant** :
```typescript
const supabaseTicketIdCustomField = process.env.JIRA_SUPABASE_TICKET_ID_FIELD || 'customfield_10001';
if (supabaseTicketIdCustomField) {
  jiraPayload.fields[supabaseTicketIdCustomField] = input.ticketId;
}
```

**Après** :
```typescript
// Ne pas définir par défaut si la variable d'environnement n'est pas définie
const supabaseTicketIdCustomField = process.env.JIRA_SUPABASE_TICKET_ID_FIELD;
if (supabaseTicketIdCustomField && supabaseTicketIdCustomField.trim() !== '') {
  jiraPayload.fields[supabaseTicketIdCustomField.trim()] = input.ticketId;
}
```

**Changement** :
- ✅ Le custom field n'est ajouté que si `JIRA_SUPABASE_TICKET_ID_FIELD` est explicitement défini
- ✅ Plus de valeur par défaut `customfield_10001`
- ✅ Trim pour éviter les espaces

### 2. Amélioration de l'Extraction du Code HTTP

**Fichier** : `src/services/jira/client.ts` (lignes 205-211)

**Avant** :
```typescript
const httpMatch = errorMessage.match(/JIRA (\d+):/);
const httpCode = httpMatch ? httpMatch[1] : 'unknown';
```

**Après** :
```typescript
// Supporte les formats: "JIRA 400:", "JIRA_NON_RETRYABLE: 400:", etc.
const httpMatch = errorMessage.match(/(?:JIRA|JIRA_NON_RETRYABLE)[\s:]+(\d+)[\s:]+/);
const httpCode = httpMatch ? httpMatch[1] : 'unknown';
```

**Changement** :
- ✅ Supporte maintenant `JIRA_NON_RETRYABLE: 400:` en plus de `JIRA 400:`
- ✅ Extraction correcte du code HTTP 400

## 📝 Configuration Optionnelle

Si vous souhaitez stocker l'ID Supabase dans JIRA, vous devez :

1. **Créer le custom field dans JIRA** :
   - Aller dans JIRA → Settings → Issues → Custom Fields
   - Créer un nouveau custom field (ex: "Supabase Ticket ID")
   - L'ajouter à l'écran de création des tickets du projet OD

2. **Configurer la variable d'environnement** :
   ```env
   JIRA_SUPABASE_TICKET_ID_FIELD=customfield_XXXXX
   ```
   (Remplacer `XXXXX` par l'ID réel du custom field)

3. **Redémarrer le serveur** pour que les changements prennent effet

## 🧪 Test

Après cette correction, la création de tickets BUG/REQ devrait fonctionner sans erreur 400.

**Pour tester** :
1. Créer un nouveau ticket BUG via l'interface
2. Vérifier que la clé JIRA est créée (ex: `OD-XXXX`)
3. Vérifier que `jira_sync.sync_error` est `null`

## 📊 Résultat Attendu

- ✅ Tickets BUG/REQ créés avec succès dans JIRA
- ✅ Clé JIRA (`OD-XXXX`) assignée au ticket
- ✅ Synchronisation réussie sans erreur 400
- ✅ Message d'erreur détaillé si d'autres problèmes surviennent

---

**Note** : Si vous n'avez pas besoin de stocker l'ID Supabase dans JIRA, vous pouvez simplement ne pas définir `JIRA_SUPABASE_TICKET_ID_FIELD` et laisser le code tel quel.

