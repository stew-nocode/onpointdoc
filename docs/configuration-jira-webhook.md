# Configuration du Webhook JIRA pour la Synchronisation

Ce guide explique comment configurer le webhook JIRA pour synchroniser automatiquement les changements de statut, commentaires et assignations vers Supabase.

## 📋 Prérequis

- Accès administrateur à JIRA
- URL publique de votre application Next.js (ex: `https://votre-app.vercel.app`)
- Route API webhook configurée : `/api/webhooks/jira`

## 🔧 Configuration du Webhook dans JIRA

### Étape 1 : Accéder aux Webhooks JIRA

1. Connectez-vous à JIRA en tant qu'administrateur
2. Allez dans **Settings** (⚙️) → **System**
3. Dans le menu de gauche, cliquez sur **Webhooks**
4. Cliquez sur **Create a webhook**

### Étape 2 : Configurer le Webhook

**Nom** : `OnpointDoc Sync` (ou un nom de votre choix)

**URL** : 
```
https://votre-app.vercel.app/api/webhooks/jira
```

**Pour le développement local avec ngrok** :
```
https://votre-tunnel.ngrok-free.app/api/webhooks/jira
```
> 📖 **Guide complet ngrok** : Voir [`configuration-ngrok-local-testing.md`](./configuration-ngrok-local-testing.md)

**Status** : ✅ **Enabled**

**Events** : Sélectionnez les événements suivants :
- ✅ **Issue created**
- ✅ **Issue updated** (inclut les changements de statut, assignation, etc.)
- ✅ **Issue deleted**
- ✅ **Comment created**
- ✅ **Comment updated**
- ✅ **Comment deleted**

**Projects** : Sélectionnez le projet **OD** (OBC)

**Issue types** : Sélectionnez **Bug** et **Requêtes** (ou tous)

### Étape 3 : Tester le Webhook

1. Créez ou modifiez un ticket dans JIRA
2. Vérifiez les logs de votre application Next.js pour voir si le webhook est appelé
3. Vérifiez dans Supabase que le ticket a été mis à jour

## 🔍 Vérification

### Vérifier que le Webhook est Actif

1. Dans JIRA, allez dans **Settings** → **System** → **Webhooks**
2. Vérifiez que votre webhook est dans la liste avec le statut **Enabled**
3. Cliquez sur le webhook pour voir les détails et l'historique des appels

### Tester Manuellement

Vous pouvez tester la synchronisation manuellement via l'API :

```bash
# Synchroniser un ticket spécifique
curl -X GET "https://votre-app.vercel.app/api/tickets/{ticket_id}/sync-jira"
```

Ou utiliser le script :

```bash
node scripts/sync-ticket-from-jira.js OD-2991
```

## 🐛 Dépannage

### Le webhook n'est pas appelé

1. **Vérifier l'URL** : Assurez-vous que l'URL est accessible publiquement
2. **Vérifier les événements** : Vérifiez que les événements sélectionnés correspondent aux actions effectuées
3. **Vérifier les projets** : Assurez-vous que le projet "OD" est bien sélectionné
4. **Vérifier les logs JIRA** : Dans JIRA, consultez l'historique du webhook pour voir les erreurs

### Erreur 404 lors de l'appel du webhook

- Vérifiez que la route `/api/webhooks/jira` existe dans votre application
- Vérifiez que l'application est déployée et accessible

### Erreur 500 lors de l'appel du webhook

- Vérifiez les logs de l'application pour voir l'erreur exacte
- Vérifiez que les variables d'environnement sont correctement configurées
- Vérifiez que la base de données Supabase est accessible

### Les changements ne se synchronisent pas

1. **Vérifier le format du payload** : Le webhook attend un format spécifique (voir `src/app/api/webhooks/jira/route.ts`)
2. **Vérifier les mappings** : Vérifiez que les statuts JIRA sont correctement mappés dans `jira_status_mapping`
3. **Synchroniser manuellement** : Utilisez la route `/api/tickets/{id}/sync-jira` pour forcer la synchronisation

## 📝 Format du Payload Webhook

Le webhook JIRA envoie un payload au format suivant :

```json
{
  "webhookEvent": "jira:issue_updated",
  "issue": {
    "key": "OD-2991",
    "fields": {
      "status": {
        "name": "Traitement en Cours"
      },
      "assignee": {
        "accountId": "712020:bb02e93b-c270-4c40-a166-a19a42e5629a"
      }
    }
  },
  "changelog": {
    "items": [
      {
        "field": "status",
        "fromString": "Sprint Backlog",
        "toString": "Traitement en Cours"
      }
    ]
  }
}
```

Notre route webhook transforme ce payload et appelle `syncJiraToSupabase()` pour mettre à jour Supabase.

## 🔄 Synchronisation Manuelle

Si le webhook ne fonctionne pas ou pour corriger des tickets non synchronisés, vous pouvez :

1. **Via l'API** :
   ```bash
   GET /api/tickets/{ticket_id}/sync-jira
   ```

2. **Via le script** :
   ```bash
   node scripts/sync-ticket-from-jira.js OD-2991
   ```

3. **Via le code** :
   ```typescript
   import { syncTicketFromJira } from '@/services/jira/sync-manual';
   await syncTicketFromJira('OD-2991');
   ```

## 📚 Ressources

- [Documentation JIRA Webhooks](https://developer.atlassian.com/cloud/jira/platform/webhooks/)
- [Route Webhook dans l'application](./src/app/api/webhooks/jira/route.ts)
- [Service de synchronisation](./src/services/jira/sync.ts)

