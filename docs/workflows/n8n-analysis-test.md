# Guide de Test de l'Analyse N8N

Ce guide explique comment tester la fonctionnalité d'analyse N8N une fois le webhook configuré.

## Prérequis

1. ✅ Webhook N8N configuré dans `.env.local`
2. ✅ Workflow N8N créé et actif
3. ✅ Application Next.js démarrée

## Configuration .env.local

Vérifier que vous avez bien ajouté :

```env
# URL du webhook N8N pour l'analyse
N8N_ANALYSIS_WEBHOOK_URL=https://votre-n8n.example.com/webhook/analysis

# Optionnel : clé API pour authentification
N8N_API_KEY=votre-cle-api
```

⚠️ **Important** : Utilisez `N8N_ANALYSIS_WEBHOOK_URL` (sans `NEXT_PUBLIC_`) car le service s'exécute côté serveur dans la route API.

## Test du Webhook N8N directement

Avant de tester depuis l'application, tester le webhook N8N directement :

### Avec curl
```bash
curl -X POST https://votre-n8n.example.com/webhook/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "context": "ticket",
    "id": "uuid-d-un-ticket-test",
    "question": "Analyse l'historique complet du ticket uuid-d-un-ticket-test. Fournis une analyse détaillée des interactions, des statuts, des commentaires, des tendances et des recommandations."
  }'
```

### Réponse attendue
```json
{
  "success": true,
  "analysis": "## Analyse détaillée\n\n**Points clés** :\n- ..."
}
```

## Test depuis l'Application

### 1. Démarrer l'application

```bash
npm run dev
```

### 2. Se connecter à l'application

- Aller sur `http://localhost:3000`
- Se connecter avec un compte ayant le rôle `admin`, `manager` ou `agent`

### 3. Tester le bouton d'analyse

1. Aller sur la page des tickets : `/gestion/tickets`
2. Repérer un ticket dans le tableau
3. Survoler la ligne du ticket pour voir les actions
4. Cliquer sur l'icône **✨** (Sparkles) à côté du bouton "Éditer"
5. Le modal s'ouvre automatiquement et commence la génération de l'analyse

### 4. Comportement attendu

#### Pendant le chargement
- Le modal s'ouvre
- Un spinner s'affiche avec le message "Génération de l'analyse en cours..."
- Le bouton de fermeture est désactivé

#### En cas de succès
- L'analyse générée s'affiche dans le modal
- Le texte est formaté et lisible
- Le bouton "Fermer" devient actif

#### En cas d'erreur
- Un message d'erreur s'affiche dans une alerte rouge
- Le message indique la cause de l'erreur
- Le bouton "Fermer" devient actif

## Erreurs courantes

### "Le webhook N8N pour l'analyse n'est pas configuré"

**Cause** : La variable `N8N_ANALYSIS_WEBHOOK_URL` n'est pas définie ou l'application n'a pas été redémarrée.

**Solution** :
1. Vérifier que `.env.local` contient bien `N8N_ANALYSIS_WEBHOOK_URL=...`
2. Redémarrer l'application (`npm run dev`)
3. Vérifier qu'il n'y a pas d'espaces autour du `=`

### "Le webhook N8N a pris trop de temps à répondre (timeout 60s)"

**Cause** : Le workflow N8N prend plus de 60 secondes.

**Solutions** :
1. Optimiser le workflow N8N (réduire les appels API, utiliser le cache)
2. Augmenter le timeout dans `src/services/n8n/analysis.ts` (ligne 75) :
   ```typescript
   signal: AbortSignal.timeout(120000) // 120 secondes
   ```

### "Erreur HTTP 404"

**Cause** : L'URL du webhook est incorrecte ou le workflow N8N n'est pas actif.

**Solution** :
1. Vérifier l'URL dans `.env.local`
2. Vérifier que le workflow N8N est actif
3. Vérifier le path du webhook dans N8N (`/webhook/analysis`)

### "Erreur HTTP 401" ou "Erreur HTTP 403"

**Cause** : Authentification requise mais `N8N_API_KEY` non configuré ou incorrect.

**Solution** :
1. Vérifier que `N8N_API_KEY` est défini dans `.env.local`
2. Vérifier que le workflow N8N accepte le header `Authorization: Bearer ...`
3. Ou désactiver l'authentification dans le workflow N8N si non nécessaire

### "Le webhook N8N n'a pas retourné d'analyse valide"

**Cause** : Le workflow N8N ne retourne pas le bon format.

**Solution** :
1. Vérifier que le workflow retourne bien :
   ```json
   {
     "success": true,
     "analysis": "texte de l'analyse"
   }
   ```
2. Vérifier les logs N8N pour voir ce qui est retourné
3. Utiliser le node "Respond to Webhook" pour formater la réponse

## Vérification des logs

### Logs Next.js
Dans le terminal où tourne `npm run dev`, vous verrez :
- Les erreurs de configuration
- Les erreurs de réseau lors de l'appel au webhook

### Logs N8N
Dans l'interface N8N :
1. Aller sur l'exécution du workflow
2. Cliquer sur chaque node pour voir les données entrantes/sortantes
3. Vérifier les erreurs dans les nodes en rouge

## Test de différents contextes

Actuellement, seul le contexte `ticket` est intégré dans l'UI. Pour tester les autres contextes :

### Via l'API directement
```bash
# Test avec un ticket
curl -X POST http://localhost:3000/api/n8n/analysis \
  -H "Content-Type: application/json" \
  -d '{"context": "ticket", "id": "uuid-du-ticket"}'

# Test avec une entreprise (à venir)
curl -X POST http://localhost:3000/api/n8n/analysis \
  -H "Content-Type: application/json" \
  -d '{"context": "company", "id": "uuid-de-l-entreprise"}'

# Test avec un contact (à venir)
curl -X POST http://localhost:3000/api/n8n/analysis \
  -H "Content-Type: application/json" \
  -d '{"context": "contact", "id": "uuid-du-contact"}'
```

## Prochaines étapes

Une fois que le test fonctionne pour les tickets :

1. ✅ **Tester avec différents tickets** : Vérifier que l'analyse s'adapte au contenu
2. ✅ **Optimiser le workflow N8N** : Ajouter du cache, optimiser les prompts
3. 🔄 **Ajouter les autres contextes** : Entreprises et contacts (quand les boutons seront ajoutés dans l'UI)
4. 🔄 **Personnaliser les questions** : Adapter `buildQuestion()` selon vos besoins

## Support

En cas de problème :
1. Vérifier les logs N8N et Next.js
2. Tester le webhook directement avec curl
3. Vérifier la configuration dans `.env.local`
4. Consulter `docs/workflows/n8n-analysis-setup.md` pour la configuration complète

