# Guide d'Activation du Workflow N8N

Ce guide explique comment activer votre workflow N8N pour que le webhook soit accessible en production.

## Problème : Erreur 404 "webhook is not registered"

Si vous voyez cette erreur :
```
[NETWORK_ERROR] Erreur HTTP 404: {"code":404,"message":"The requested webhook \"...\" is not registered.","hint":"Click the 'Execute workflow' button..."}
```

Cela signifie que votre workflow N8N n'est **pas actif**.

## Solution : Activer le Workflow

### Étape 1 : Ouvrir votre workflow dans N8N

1. Connectez-vous à votre instance N8N
2. Dans la liste des workflows, trouvez votre workflow d'analyse
3. Cliquez sur le workflow pour l'ouvrir

### Étape 2 : Activer le workflow

1. En haut à droite de l'interface N8N, vous verrez un bouton :
   - **"Inactive"** (gris) = Workflow désactivé ❌
   - **"Active"** (vert) = Workflow activé ✅

2. Cliquez sur le bouton pour activer le workflow
   - Le bouton doit passer en vert et afficher "Active"
   - Un indicateur vert apparaît en haut à droite

### Étape 3 : Vérifier l'activation

Une fois activé, vous devriez voir :
- ✅ Le bouton "Active" en vert
- ✅ Un indicateur vert dans l'interface
- ✅ Le webhook est maintenant accessible en permanence

## Différence entre Mode Test et Mode Production

### Mode Test (Workflow Inactive)
- Le webhook ne fonctionne **qu'après avoir cliqué sur "Execute workflow"**
- Valable pour **un seul appel**
- Utile pour tester le workflow manuellement

### Mode Production (Workflow Active)
- Le webhook est accessible **en permanence**
- Fonctionne pour **tous les appels**
- Nécessaire pour l'utilisation en production

## Vérification

Pour vérifier que le webhook est bien actif :

### 1. Dans N8N
- Le workflow doit être "Active" (bouton vert)
- Le node Webhook doit être configuré avec le bon path

### 2. Tester avec curl
```bash
curl -X POST https://votre-n8n.example.com/webhook/analysis \
  -H "Content-Type: application/json" \
  -d '{"context": "ticket", "id": "test", "question": "test"}'
```

Si le workflow est actif, vous devriez recevoir une réponse (même si c'est une erreur de traitement, pas une 404).

### 3. Tester dans l'application
1. Aller sur la page des tickets
2. Cliquer sur l'icône ✨ pour générer une analyse
3. L'erreur 404 devrait disparaître (il peut y avoir d'autres erreurs à résoudre, mais plus de 404)

## Dépannage

### Le bouton "Active" ne s'active pas

**Causes possibles** :
1. **Erreurs dans le workflow** : Vérifiez qu'il n'y a pas de nodes en rouge
2. **Workflow vide** : Assurez-vous qu'il y a au moins un node Webhook configuré
3. **Permissions** : Vérifiez que vous avez les droits pour activer des workflows

**Solution** :
1. Vérifier tous les nodes du workflow
2. Corriger les erreurs (nodes en rouge)
3. Réessayer d'activer le workflow

### Le webhook fonctionne en test mais pas en production

**Cause** : Le workflow est toujours en mode "Inactive"

**Solution** : Activer le workflow (voir Étape 2 ci-dessus)

### Le webhook est actif mais retourne toujours 404

**Causes possibles** :
1. L'URL dans `.env.local` ne correspond pas au path du webhook
2. Le webhook utilise un path différent

**Vérification** :
- Dans N8N, cliquez sur le node Webhook
- Vérifiez le "Path" configuré (ex: `/webhook/analysis`)
- Vérifiez que l'URL dans `.env.local` se termine par ce path

**Exemple** :
- Path dans N8N : `/webhook/analysis`
- URL N8N : `https://n8n.example.com`
- URL complète : `https://n8n.example.com/webhook/analysis`

## Résumé

✅ **Pour que le webhook fonctionne en production** :
1. Le workflow doit être **"Active"** (bouton vert)
2. Le node Webhook doit être configuré correctement
3. L'URL dans `.env.local` doit correspondre au path du webhook
4. L'application Next.js doit être redémarrée après modification de `.env.local`

Une fois ces étapes complétées, l'erreur 404 devrait disparaître et vous pourrez générer des analyses !

