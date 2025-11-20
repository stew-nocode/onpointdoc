# Guide de Test Local avec ngrok

Ce guide explique comment tester le webhook JIRA localement en utilisant ngrok pour exposer votre application Next.js sur Internet.

## 📋 Prérequis

- Application Next.js fonctionnelle
- Compte ngrok (gratuit) : https://ngrok.com/signup
- Accès administrateur à JIRA pour configurer le webhook

## 🔧 Installation de ngrok

### Option 1 : Installation via winget (Windows)

```powershell
winget install ngrok.ngrok
```

### Option 2 : Installation manuelle

1. Téléchargez ngrok depuis : https://ngrok.com/download
2. Extrayez l'archive dans un dossier (ex: `C:\ngrok`)
3. Ajoutez ngrok au PATH Windows :
   - Ouvrez "Variables d'environnement"
   - Ajoutez le chemin vers ngrok dans "Path"
   - Ou utilisez le chemin complet : `C:\ngrok\ngrok.exe`

### Option 3 : Installation via Chocolatey

```powershell
choco install ngrok
```

### Vérifier l'installation

```bash
ngrok version
```

## 🔑 Configuration de ngrok (Première fois)

1. Créez un compte gratuit sur https://ngrok.com/signup
2. Connectez-vous et récupérez votre authtoken : https://dashboard.ngrok.com/get-started/your-authtoken
3. Configurez ngrok avec votre token :

```bash
ngrok config add-authtoken VOTRE_AUTHTOKEN_ICI
```

## 🚀 Utilisation

### Étape 1 : Démarrer l'application Next.js

Dans un terminal, démarrez votre application :

```bash
npm run dev
```

L'application devrait être accessible sur `http://localhost:3000`

### Étape 2 : Démarrer ngrok

Dans un **nouveau terminal**, lancez ngrok :

```bash
ngrok http 3000
```

Vous devriez voir quelque chose comme :

```
ngrok

Session Status                online
Account                       votre-email@example.com
Version                       3.x.x
Region                        Europe (eu)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Important** : Copiez l'URL `https://abc123def456.ngrok-free.app` (celle qui commence par `https://`)

### Étape 3 : Configurer le Webhook JIRA

1. Connectez-vous à JIRA en tant qu'administrateur
2. Allez dans **Settings** (⚙️) → **System** → **Webhooks**
3. Cliquez sur **Create a webhook** (ou modifiez un webhook existant)
4. Configurez :
   - **Name** : `OnpointDoc Local Test`
   - **URL** : `https://abc123def456.ngrok-free.app/api/webhooks/jira` (remplacez par votre URL ngrok)
   - **Status** : ✅ **Enabled**
   - **Events** :
     - ✅ Issue created
     - ✅ Issue updated
     - ✅ Issue deleted
     - ✅ Comment created
     - ✅ Comment updated
     - ✅ Comment deleted
   - **Projects** : Sélectionnez **OD**
   - **Issue types** : Sélectionnez **Bug** et **Requêtes**

5. Cliquez sur **Create** (ou **Update**)

### Étape 4 : Tester le Webhook

1. **Dans JIRA** : Modifiez le statut d'un ticket existant (ex: OD-2991)
2. **Dans ngrok** : Ouvrez l'interface web http://127.0.0.1:4040 pour voir les requêtes entrantes
3. **Dans le terminal Next.js** : Vérifiez les logs pour voir si le webhook a été reçu
4. **Dans Supabase** : Vérifiez que le ticket a été mis à jour

## 🔍 Vérification et Dépannage

### Vérifier que ngrok fonctionne

1. Ouvrez l'interface web ngrok : http://127.0.0.1:4040
2. Vous devriez voir toutes les requêtes HTTP entrantes
3. Cliquez sur une requête pour voir les détails (headers, body, response)

### Le webhook n'est pas appelé

1. **Vérifier que ngrok est toujours actif** : Le tunnel doit rester ouvert
2. **Vérifier l'URL dans JIRA** : Assurez-vous que l'URL est correcte et commence par `https://`
3. **Vérifier les événements JIRA** : Vérifiez que les événements sélectionnés correspondent aux actions
4. **Vérifier les logs JIRA** : Dans JIRA, consultez l'historique du webhook pour voir les erreurs

### Erreur "ngrok: command not found"

- Vérifiez que ngrok est installé : `ngrok version`
- Vérifiez que ngrok est dans le PATH Windows
- Utilisez le chemin complet : `C:\ngrok\ngrok.exe http 3000`

### L'URL ngrok change à chaque redémarrage

C'est normal avec le plan gratuit. Solutions :
1. **Garder ngrok actif** : Ne fermez pas le terminal ngrok
2. **Mettre à jour le webhook JIRA** : Si vous redémarrez ngrok, mettez à jour l'URL dans JIRA
3. **Plan payant** : Avec un compte payant, vous pouvez avoir une URL fixe

### Erreur 404 dans ngrok

- Vérifiez que Next.js est bien démarré sur le port 3000
- Vérifiez que la route `/api/webhooks/jira` existe
- Vérifiez les logs Next.js pour voir les erreurs

### Erreur 500 dans ngrok

- Vérifiez les logs Next.js pour voir l'erreur exacte
- Vérifiez que les variables d'environnement sont configurées (`.env.local`)
- Vérifiez que Supabase est accessible

## 📝 Script Helper (Optionnel)

Pour faciliter le démarrage, vous pouvez créer un script PowerShell :

**`scripts/start-ngrok.ps1`** :

```powershell
# Vérifier que Next.js est démarré
$response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction SilentlyContinue
if (-not $response) {
    Write-Host "❌ Next.js n'est pas démarré sur le port 3000" -ForegroundColor Red
    Write-Host "Démarrez d'abord: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Next.js est actif sur le port 3000" -ForegroundColor Green
Write-Host "🚀 Démarrage de ngrok..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Une fois ngrok démarré, copiez l'URL HTTPS et configurez-la dans JIRA" -ForegroundColor Yellow
Write-Host "🌐 Interface ngrok: http://127.0.0.1:4040" -ForegroundColor Yellow
Write-Host ""

ngrok http 3000
```

Utilisation :

```powershell
.\scripts\start-ngrok.ps1
```

## 🎯 Workflow Complet

1. **Terminal 1** : `npm run dev` (Next.js)
2. **Terminal 2** : `ngrok http 3000` (Tunnel)
3. **Copier l'URL ngrok** : `https://xxxx.ngrok-free.app`
4. **Configurer JIRA** : Webhook → URL = `https://xxxx.ngrok-free.app/api/webhooks/jira`
5. **Tester** : Modifier un ticket dans JIRA
6. **Vérifier** : Interface ngrok (http://127.0.0.1:4040) et logs Next.js

## ⚠️ Notes Importantes

- **Garder les deux terminaux ouverts** : Next.js et ngrok doivent rester actifs
- **URL temporaire** : L'URL ngrok change à chaque redémarrage (plan gratuit)
- **Limite de connexions** : Le plan gratuit a des limites (suffisant pour les tests)
- **Sécurité** : L'URL ngrok est publique, mais uniquement pour les tests locaux

## 🔗 Ressources

- [Documentation ngrok](https://ngrok.com/docs)
- [Dashboard ngrok](https://dashboard.ngrok.com/)
- [Guide Webhook JIRA](./configuration-jira-webhook.md)

