# Configuration N8N en Développement Local

Ce guide explique comment configurer N8N pour le développement local avec Next.js.

## Scénarios possibles

### 1. N8N en local + Next.js en local ✅ Le plus simple

**Configuration** :
- N8N tourne sur votre machine : `http://localhost:5678`
- Next.js tourne sur : `http://localhost:3000`

**Configuration `.env.local`** :
```env
N8N_ANALYSIS_WEBHOOK_URL=http://localhost:5678/webhook/analysis
```

**Avantages** :
- Pas de configuration réseau supplémentaire
- Fonctionne immédiatement
- Parfait pour le développement

**Inconvénients** :
- N8N doit tourner en même temps que Next.js
- Les deux doivent être démarrés

### 2. N8N en cloud + Next.js en local ⚠️ Nécessite un tunnel

**Configuration** :
- N8N est hébergé (cloud) : `https://votre-n8n.example.com`
- Next.js est en local : `http://localhost:3000`

**Problème** :
Si N8N a besoin de rappeler votre application Next.js (pour webhooks inversés), il ne peut pas accéder à `localhost:3000` depuis l'extérieur.

**Solution** : Utiliser ngrok ou un tunnel similaire

#### Configuration avec ngrok

1. **Installer ngrok** :
   ```bash
   # Windows
   winget install ngrok.ngrok
   
   # Ou télécharger depuis https://ngrok.com/download
   ```

2. **Démarrer ngrok** :
   ```bash
   ngrok http 3000
   ```

3. **Récupérer l'URL publique** :
   ```
   Forwarding: https://abc123.ngrok.io -> http://localhost:3000
   ```

4. **Configurer N8N** (si N8N doit rappeler Next.js) :
   - Utiliser `https://abc123.ngrok.io` au lieu de `http://localhost:3000`

**Pour notre cas d'usage** (Next.js appelle N8N) :
- ✅ **Pas besoin de ngrok** car Next.js peut appeler N8N directement
- ✅ Utiliser l'URL publique de N8N dans `.env.local` :
  ```env
  N8N_ANALYSIS_WEBHOOK_URL=https://votre-n8n.example.com/webhook/analysis
  ```

### 3. N8N en local + Next.js en local (URL différente)

**Si N8N utilise un nom d'hôte spécifique** :
```env
N8N_ANALYSIS_WEBHOOK_URL=http://n8n.local:5678/webhook/analysis
```

**Vérification** :
- Tester l'URL dans le navigateur : `http://localhost:5678` ou `http://n8n.local:5678`
- Vérifier que N8N est bien accessible

## Vérification de la Configuration

### 1. Vérifier que N8N est accessible

Depuis votre machine (où tourne Next.js), tester :

```bash
# Si N8N est en local
curl http://localhost:5678

# Si N8N est en cloud
curl https://votre-n8n.example.com
```

### 2. Tester le webhook directement

```bash
# Si N8N est en local
curl -X POST http://localhost:5678/webhook/analysis \
  -H "Content-Type: application/json" \
  -d '{"context": "ticket", "id": "test", "question": "test"}'

# Si N8N est en cloud
curl -X POST https://votre-n8n.example.com/webhook/analysis \
  -H "Content-Type: application/json" \
  -d '{"context": "ticket", "id": "test", "question": "test"}'
```

**Résultat attendu** :
- ✅ Si le workflow est **actif** : Réponse JSON (succès ou erreur de traitement)
- ❌ Si le workflow est **inactif** : `{"code":404,"message":"The requested webhook is not registered..."}`

## Solutions selon votre configuration

### Configuration A : N8N en local

**Dans `.env.local`** :
```env
N8N_ANALYSIS_WEBHOOK_URL=http://localhost:5678/webhook/analysis
```

**Vérifications** :
1. ✅ N8N tourne sur `http://localhost:5678`
2. ✅ Le workflow est **ACTIVE** (bouton vert)
3. ✅ Le path du webhook est `/webhook/analysis`
4. ✅ Next.js peut accéder à `http://localhost:5678`

**Test** :
```bash
curl http://localhost:5678
# Doit retourner quelque chose (page N8N ou réponse)
```

### Configuration B : N8N en cloud/serveur distant

**Dans `.env.local`** :
```env
N8N_ANALYSIS_WEBHOOK_URL=https://votre-n8n.example.com/webhook/analysis
```

**Vérifications** :
1. ✅ L'URL de N8N est accessible depuis votre machine
2. ✅ Le workflow est **ACTIVE** (bouton vert)
3. ✅ Le path du webhook est `/webhook/analysis`
4. ✅ Pas de problème de firewall/CORS

**Test** :
```bash
curl https://votre-n8n.example.com/webhook/analysis \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "test"}'
```

### Configuration C : N8N avec tunnel local (ex: Tailscale, Zerotier)

Si vous utilisez un réseau privé virtuel :

**Dans `.env.local`** :
```env
N8N_ANALYSIS_WEBHOOK_URL=http://n8n.local:5678/webhook/analysis
# ou
N8N_ANALYSIS_WEBHOOK_URL=https://n8n-vpn.example.com/webhook/analysis
```

**Vérifications** :
1. ✅ Le tunnel VPN est actif
2. ✅ N8N est accessible via l'URL du tunnel
3. ✅ Le workflow est **ACTIVE**

## Dépannage Local

### Problème : "Cannot connect to localhost:5678"

**Causes possibles** :
1. N8N n'est pas démarré
2. N8N tourne sur un autre port
3. Problème de firewall Windows

**Solutions** :
1. Démarrer N8N :
   ```bash
   n8n start
   ```

2. Vérifier le port :
   - Par défaut : `5678`
   - Vérifier dans la console N8N ou la config

3. Vérifier le firewall :
   - Windows peut bloquer les connexions localhost
   - Ajouter une exception si nécessaire

### Problème : "Connection refused" pour N8N cloud

**Causes possibles** :
1. URL incorrecte dans `.env.local`
2. N8N n'est pas accessible depuis votre réseau
3. Problème de DNS

**Solutions** :
1. Vérifier l'URL dans le navigateur
2. Tester avec `ping` ou `curl`
3. Vérifier la connectivité réseau

### Problème : CORS ou erreurs de réseau

Si vous voyez des erreurs CORS dans la console :

**Solution pour N8N en local** :
- N8N accepte normalement les requêtes depuis `localhost`
- Si problème, vérifier les paramètres CORS dans N8N

**Solution pour Next.js** :
- Les appels API se font côté serveur (Route API), pas de problème CORS

## Recommandation pour le Développement

### 🎯 Configuration recommandée

**Pour le développement local** :
```env
# N8N en local
N8N_ANALYSIS_WEBHOOK_URL=http://localhost:5678/webhook/analysis
```

**Avantages** :
- ✅ Pas de dépendance réseau externe
- ✅ Fonctionne hors ligne
- ✅ Plus rapide (pas de latence réseau)
- ✅ Facile à déboguer

**Pour la production** :
```env
# N8N en cloud/serveur
N8N_ANALYSIS_WEBHOOK_URL=https://votre-n8n.example.com/webhook/analysis
```

## Résumé

✅ **Pour le développement local** :
1. Installer N8N localement : `npm install -g n8n` puis `n8n start`
2. Configurer `.env.local` : `N8N_ANALYSIS_WEBHOOK_URL=http://localhost:5678/webhook/analysis`
3. Activer le workflow dans N8N (bouton "Active" vert)
4. Redémarrer Next.js : `npm run dev`

✅ **Si N8N est déjà en cloud** :
1. Utiliser l'URL publique : `https://votre-n8n.example.com/webhook/analysis`
2. S'assurer que le workflow est **ACTIVE**
3. Pas besoin de ngrok (Next.js appelle N8N, pas l'inverse)

Le fait d'être en local n'est **pas** un problème tant que :
- L'URL dans `.env.local` correspond à la configuration réelle de N8N
- Le workflow N8N est **ACTIVE**

