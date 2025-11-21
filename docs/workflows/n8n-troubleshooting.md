# Guide de Dépannage - Analyse N8N

Ce guide vous aide à résoudre les erreurs courantes lors de l'utilisation de la fonctionnalité d'analyse N8N.

## Erreur HTTP 500

### Symptômes
- Le modal affiche "Erreur HTTP 500"
- L'analyse ne se génère pas

### Causes possibles

#### 1. Webhook N8N non configuré

**Vérification** :
- Ouvrir `.env.local`
- Vérifier que `N8N_ANALYSIS_WEBHOOK_URL` est défini et correct

**Solution** :
```env
N8N_ANALYSIS_WEBHOOK_URL=https://votre-n8n.example.com/webhook/analysis
```

#### 2. Application Next.js non redémarrée

**Vérification** :
- La variable d'environnement a été ajoutée après le démarrage de l'app

**Solution** :
1. Arrêter l'application (Ctrl+C)
2. Redémarrer : `npm run dev`

#### 3. Workflow N8N non actif ⚠️ **CAUSE COURANTE**

**Symptôme** :
```
[NETWORK_ERROR] Erreur HTTP 404: {"code":404,"message":"The requested webhook \"...\" is not registered.","hint":"Click the 'Execute workflow' button..."}
```

**Vérification** :
- Aller dans l'interface N8N
- Ouvrir votre workflow d'analyse
- Vérifier que le workflow est **ACTIF** (bouton "Active" vert en haut à droite)

**Solution** :
1. Dans N8N, ouvrir votre workflow d'analyse
2. Cliquer sur le bouton **"Active"** (ou "Inactive" si désactivé) en haut à droite
3. Le workflow doit passer en mode **ACTIVE** (bouton vert)
4. Le webhook sera alors accessible en permanence

📖 **Guide détaillé** : Voir `docs/workflows/n8n-activation-guide.md`

#### 4. Nœud "Respond to Webhook" inutilisé ⚠️ **CAUSE COURANTE**

**Symptôme** :
```
[NETWORK_ERROR] Erreur HTTP 500: {"code":0,"message":"Unused Respond to Webhook node found in the workflow"}
```

**Causes** :
- Plusieurs nœuds "Respond to Webhook" dans le workflow
- Un nœud "Respond to Webhook" non connecté au flux
- Un nœud "Respond to Webhook" dans une branche jamais exécutée

**Vérification** :
1. Ouvrir le workflow dans N8N
2. Compter les nœuds "Respond to Webhook" (il ne doit y en avoir **qu'un seul**)
3. Vérifier que ce nœud est **à la fin** du workflow
4. Vérifier qu'il est **connecté** à tous les chemins (succès et erreur)

**Solution** :
1. Identifier tous les nœuds "Respond to Webhook" dans le workflow
2. Supprimer tous sauf **un seul**
3. Placer ce nœud unique **à la fin** du workflow
4. Connecter ce nœud à **tous les chemins** de sortie (succès et erreur)

📖 **Guide détaillé** : Voir `docs/workflows/n8n-fix-unused-respond-to-webhook.md`

⚠️ **Note** : En mode "Inactive", le webhook ne fonctionne qu'en mode test après avoir cliqué sur "Execute workflow". Pour une utilisation en production, le workflow doit être **ACTIVE**.

#### 4. Webhook N8N inaccessible

**Vérification** :
```bash
curl -X POST https://votre-n8n.example.com/webhook/analysis \
  -H "Content-Type: application/json" \
  -d '{"context": "ticket", "id": "test-id", "question": "test"}'
```

**Solution** :
- Vérifier l'URL du webhook dans N8N
- Vérifier que N8N est accessible depuis votre réseau
- Vérifier les règles de firewall

#### 5. Erreur dans le workflow N8N

**Vérification** :
- Aller dans l'interface N8N
- Voir les exécutions du workflow
- Chercher les nodes en rouge (erreurs)

**Solution** :
- Vérifier les logs dans chaque node
- Vérifier les variables d'environnement N8N (Supabase, OpenAI, etc.)

#### 6. Format de réponse incorrect

**Vérification** :
Le workflow N8N doit retourner :
```json
{
  "success": true,
  "analysis": "texte de l'analyse"
}
```

**Solution** :
- Vérifier que le node "Respond to Webhook" retourne le bon format
- Vérifier que tous les nodes avant sont réussis

## Vérification des logs

### Logs Next.js
Dans le terminal où tourne `npm run dev`, chercher :
```
[API Error] { code: '...', message: '...', ... }
```

### Logs N8N
1. Aller dans l'interface N8N
2. Cliquer sur l'exécution du workflow
3. Examiner chaque node pour voir les données et erreurs

## Test pas à pas

### 1. Tester la variable d'environnement

Dans le terminal Next.js :
```bash
node -e "console.log(process.env.N8N_ANALYSIS_WEBHOOK_URL)"
```

Doit afficher l'URL du webhook.

### 2. Tester le webhook directement

```bash
curl -X POST https://votre-n8n.example.com/webhook/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "context": "ticket",
    "id": "uuid-d-un-ticket-test",
    "question": "Test question"
  }'
```

### 3. Tester la route API directement

```bash
curl -X POST http://localhost:3000/api/n8n/analysis \
  -H "Content-Type: application/json" \
  -H "Cookie: votre-session-cookie" \
  -d '{
    "context": "ticket",
    "id": "uuid-d-un-ticket"
  }'
```

## Messages d'erreur courants

### "Le webhook N8N pour l'analyse n'est pas configuré"
**Cause** : `N8N_ANALYSIS_WEBHOOK_URL` non défini dans `.env.local`  
**Solution** : Ajouter la variable et redémarrer l'application

### "Le webhook N8N a pris trop de temps à répondre (timeout 60s)"
**Cause** : Le workflow N8N prend plus de 60 secondes  
**Solution** : Optimiser le workflow ou augmenter le timeout dans `src/services/n8n/analysis.ts`

### "Erreur HTTP 404"
**Cause** : URL du webhook incorrecte ou workflow non actif  
**Solution** : Vérifier l'URL et activer le workflow dans N8N

### "Erreur HTTP 500"
**Cause** : Erreur dans le workflow N8N ou dans la route API  
**Solution** : Vérifier les logs Next.js et N8N pour plus de détails

### "Le webhook N8N n'a pas retourné d'analyse valide"
**Cause** : Le workflow retourne un format incorrect  
**Solution** : Vérifier que le workflow retourne `{ success: true, analysis: "..." }`

## Support

Si le problème persiste :
1. Vérifier les logs Next.js (terminal `npm run dev`)
2. Vérifier les logs N8N (interface N8N → Exécutions)
3. Tester le webhook directement avec curl
4. Consulter `docs/workflows/n8n-analysis-setup.md` pour la configuration complète

