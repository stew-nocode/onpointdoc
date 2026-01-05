# Analyse des Erreurs de Synchronisation BUG/REQ → JIRA

**Date d'analyse** : 2026-01-05  
**Branche** : `fix/tickets-filter-all`

## 📊 Résumé Exécutif

### État Actuel
- **Tickets BUG/REQ créés dans l'application** (7 derniers jours) : 2
- **Tickets avec clé JIRA** : 0 ❌
- **Tickets sans clé JIRA** : 2 ❌
- **Tickets avec erreur de synchronisation** : 2 ❌

### Tickets en Erreur

| Ticket ID | Titre | Type | Créé le | Dernière tentative | Erreur |
|-----------|-------|------|---------|---------------------|--------|
| `a5c9b5a8-c2e1-407b-ae7e-3b079ef105fb` | TEST5 | BUG | 2026-01-05 19:35:06 | 2026-01-05 19:49:05 | `Erreur après plusieurs tentatives` |
| `2a1c5757-5128-4a3b-a9e5-3e92d9329bd1` | TEST | REQ | 2026-01-05 19:14:29 | 2026-01-05 19:28:29 | `Erreur après plusieurs tentatives` |

## 🔍 Analyse du Problème

### Flux de Synchronisation

Quand un ticket BUG ou REQ est créé dans l'application :

1. **Création dans Supabase** : Le ticket est créé avec `origin = 'supabase'`
2. **Appel JIRA** : `createJiraIssue()` est appelé automatiquement (ligne 131 de `src/services/tickets/index.ts`)
3. **Retry System** : Utilise `withRetrySafe()` avec `JIRA_RETRY_CONFIG` (4 tentatives par défaut)
4. **En cas d'échec** : L'erreur est enregistrée dans `jira_sync.sync_error`

### Problème Identifié

**Erreur générique masquant la cause réelle** :

L'erreur enregistrée est `"Erreur après plusieurs tentatives"`, ce qui ne donne aucune information sur :
- Le code d'erreur HTTP (400, 401, 403, 404, 500, etc.)
- Le message d'erreur JIRA
- La cause réelle de l'échec

### Code Concerné

**Fichier** : `src/lib/utils/retry.ts` (ligne ~196)

```typescript
// L'erreur finale est générique
throw new Error('Erreur après plusieurs tentatives');
```

**Fichier** : `src/services/jira/client.ts` (lignes 202-207)

```typescript
if (!result.success) {
  console.error('Erreur lors de la création du ticket JIRA après retries:', result.error);
  return {
    success: false,
    error: result.error?.message ?? 'Erreur inconnue' // ← Erreur générique
  };
}
```

## 🎯 Causes Probables

### 1. Configuration JIRA Manquante ou Incorrecte

**Variables d'environnement requises** :
- `JIRA_URL` ou `JIRA_BASE_URL`
- `JIRA_USERNAME` ou `JIRA_EMAIL` ou `JIRA_API_EMAIL`
- `JIRA_TOKEN` ou `JIRA_API_TOKEN`

**Vérification** : Le code lance une exception si ces variables sont manquantes (ligne 21 de `client.ts`), donc ce n'est probablement pas le problème.

### 2. Erreur API JIRA (400, 401, 403, 404, 500)

**Causes possibles** :
- **401 Unauthorized** : Credentials invalides
- **403 Forbidden** : Permissions insuffisantes pour créer des tickets dans le projet OD
- **400 Bad Request** : Format de payload incorrect (ADF, custom fields, etc.)
- **404 Not Found** : Projet OD ou type d'issue inexistant
- **500 Internal Server Error** : Problème côté JIRA

### 3. Format ADF Incorrect

Le code convertit la description en format ADF (Atlassian Document Format) requis par JIRA API v3. Si la conversion échoue ou produit un format invalide, JIRA rejettera la requête.

### 4. Custom Field Invalide

Le code utilise `customfield_10001` par défaut pour stocker l'ID Supabase. Si ce custom field n'existe pas dans JIRA ou n'est pas configuré correctement, cela peut causer une erreur 400.

### 5. Type d'Issue JIRA Incorrect

Le code mappe :
- `BUG` → `'Bug'`
- `REQ` → `'Requêtes'`

Si ces types n'existent pas dans le projet OD, JIRA retournera une erreur 400.

## 🔧 Recommandations

### 1. Améliorer le Logging des Erreurs

**Action** : Modifier `src/lib/utils/retry.ts` pour préserver l'erreur originale dans le message final.

```typescript
// Au lieu de :
throw new Error('Erreur après plusieurs tentatives');

// Utiliser :
throw new Error(`Erreur après plusieurs tentatives. Dernière erreur: ${lastError.message}`);
```

### 2. Améliorer la Gestion d'Erreur dans `createJiraIssue()`

**Action** : Modifier `src/services/jira/client.ts` pour extraire et logger les détails de l'erreur JIRA.

```typescript
if (!result.success) {
  const errorDetails = result.error?.message || 'Erreur inconnue';
  
  // Extraire le code HTTP et le message JIRA si disponible
  const httpMatch = errorDetails.match(/JIRA (\d+):/);
  const httpCode = httpMatch ? httpMatch[1] : 'unknown';
  
  console.error(`[JIRA] Échec création ticket après retries:`, {
    httpCode,
    error: errorDetails,
    ticketId: input.ticketId,
    ticketType: input.ticketType
  });
  
  return {
    success: false,
    error: `JIRA ${httpCode}: ${errorDetails}`
  };
}
```

### 3. Ajouter un Endpoint de Diagnostic

**Action** : Créer une route API `/api/jira/test-connection` pour tester la configuration JIRA et les permissions.

### 4. Vérifier les Variables d'Environnement

**Action** : Vérifier que les variables d'environnement JIRA sont correctement configurées dans :
- `.env.local` (développement)
- Vercel (production/staging/develop)

### 5. Vérifier la Configuration JIRA

**Action** : Vérifier dans JIRA :
- Le projet `OD` existe
- Les types d'issues `Bug` et `Requêtes` existent dans le projet OD
- Le custom field `customfield_10001` existe (ou utiliser la variable `JIRA_SUPABASE_TICKET_ID_FIELD`)
- Les credentials ont les permissions pour créer des tickets

## 📝 Prochaines Étapes

1. ✅ **Améliorer le logging** pour capturer les erreurs détaillées
2. ✅ **Créer un endpoint de diagnostic** pour tester la configuration
3. ⏳ **Tester l'endpoint de diagnostic** : `GET /api/jira/test-connection`
4. ⏳ **Analyser les nouvelles erreurs** après amélioration du logging
5. ⏳ **Vérifier les variables d'environnement** JIRA dans Vercel si nécessaire

## ✅ Améliorations Apportées

### 1. Amélioration du Logging dans `retry.ts`

**Fichier** : `src/lib/utils/retry.ts` (ligne 196)

**Avant** :
```typescript
createError.internalError('Erreur après plusieurs tentatives', lastError);
```

**Après** :
```typescript
createError.internalError(
  `Erreur après ${attempts} tentatives. Dernière erreur: ${lastError.message}`,
  lastError
);
```

**Bénéfice** : Le message d'erreur original est maintenant inclus dans le message final, permettant de diagnostiquer la cause réelle.

### 2. Amélioration de la Gestion d'Erreur dans `createJiraIssue()`

**Fichier** : `src/services/jira/client.ts` (lignes 202-207)

**Avant** :
```typescript
if (!result.success) {
  console.error('Erreur lors de la création du ticket JIRA après retries:', result.error);
  return {
    success: false,
    error: result.error?.message ?? 'Erreur inconnue'
  };
}
```

**Après** :
```typescript
if (!result.success) {
  const errorMessage = result.error?.message ?? 'Erreur inconnue';
  
  // Extraire le code HTTP et le message JIRA si disponible
  const httpMatch = errorMessage.match(/JIRA (\d+):/);
  const httpCode = httpMatch ? httpMatch[1] : 'unknown';
  
  // Extraire le message d'erreur JIRA (après le code HTTP)
  const jiraErrorMatch = errorMessage.match(/JIRA \d+: (.+)/);
  const jiraErrorText = jiraErrorMatch ? jiraErrorMatch[1] : errorMessage;
  
  console.error('[JIRA] Échec création ticket après retries:', {
    httpCode,
    error: jiraErrorText,
    ticketId: input.ticketId,
    ticketType: input.ticketType,
    attempts: result.attempts,
    fullError: errorMessage
  });
  
  return {
    success: false,
    error: `JIRA ${httpCode}: ${jiraErrorText.substring(0, 200)}` // Limiter à 200 caractères
  };
}
```

**Bénéfice** : 
- Extraction du code HTTP et du message JIRA
- Logging structuré avec tous les détails
- Message d'erreur plus informatif dans `jira_sync.sync_error`

### 3. Endpoint de Diagnostic

**Fichier** : `src/app/api/jira/test-connection/route.ts` (nouveau)

**Endpoint** : `GET /api/jira/test-connection`

**Fonctionnalités** :
- ✅ Vérifie la configuration JIRA (variables d'environnement)
- ✅ Teste la connexion à l'API JIRA (`/rest/api/3/myself`)
- ✅ Vérifie que le projet OD existe
- ✅ Vérifie que les types d'issues "Bug" et "Requêtes" existent

**Réponse** :
```json
{
  "success": true/false,
  "message": "...",
  "results": {
    "config": { "status": "ok|error", "message": "...", "details": {...} },
    "connection": { "status": "ok|error", "message": "...", "details": {...} },
    "project": { "status": "ok|error", "message": "...", "details": {...} },
    "issueTypes": { "status": "ok|error", "message": "...", "details": {...} }
  }
}
```

**Utilisation** :
```bash
# Tester la connexion JIRA
curl https://votre-app.vercel.app/api/jira/test-connection
```

**Bénéfice** : Permet de diagnostiquer rapidement les problèmes de configuration JIRA sans créer de ticket.

## 🔗 Fichiers Concernés

- `src/services/tickets/index.ts` (lignes 128-187) : Création automatique JIRA pour BUG/REQ
- `src/services/jira/client.ts` (lignes 69-223) : Fonction `createJiraIssue()`
- `src/lib/utils/retry.ts` (ligne ~196) : Système de retry avec erreur générique
- `src/services/tickets/index.ts` (lignes 161-186) : Gestion d'erreur lors de la création

---

**Note** : Cette analyse est basée sur le code actuel. Les erreurs réelles peuvent être différentes selon la configuration JIRA et les variables d'environnement.

