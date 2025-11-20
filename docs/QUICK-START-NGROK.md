# 🚀 Guide Rapide : Tester le Webhook JIRA avec ngrok

Guide ultra-rapide pour tester le webhook JIRA localement en 5 minutes.

## ⚡ Installation Express

### 1. Installer ngrok

**Windows (winget)** :
```powershell
winget install ngrok.ngrok
```

**Ou télécharger** : https://ngrok.com/download

### 2. Configurer ngrok (première fois)

1. Créer un compte gratuit : https://ngrok.com/signup
2. Récupérer votre authtoken : https://dashboard.ngrok.com/get-started/your-authtoken
3. Configurer :
   ```bash
   ngrok config add-authtoken VOTRE_AUTHTOKEN_ICI
   ```

## 🎯 Utilisation (3 étapes)

### Terminal 1 : Démarrer Next.js
```bash
npm run dev
```

### Terminal 2 : Démarrer ngrok
```bash
ngrok http 3000
```

**Ou utiliser le script helper** :
```powershell
.\scripts\start-ngrok.ps1
```

### Configurer JIRA

1. Copiez l'URL HTTPS affichée par ngrok (ex: `https://abc123.ngrok-free.app`)
2. Dans JIRA : **Settings** → **System** → **Webhooks** → **Create a webhook**
3. URL : `https://abc123.ngrok-free.app/api/webhooks/jira`
4. Events : ✅ Issue created, ✅ Issue updated
5. Projects : **OD**
6. **Create**

## ✅ Tester

1. Modifier un ticket dans JIRA (ex: changer le statut)
2. Vérifier l'interface ngrok : http://127.0.0.1:4040
3. Vérifier les logs Next.js
4. Vérifier dans Supabase que le ticket est mis à jour

## 🔍 Vérifications

- **ngrok actif ?** : L'URL doit être visible dans le terminal
- **Next.js actif ?** : http://localhost:3000 doit fonctionner
- **Webhook configuré ?** : Vérifier dans JIRA Settings → Webhooks
- **Requêtes reçues ?** : Interface ngrok http://127.0.0.1:4040

## ⚠️ Important

- **Garder les deux terminaux ouverts** (Next.js + ngrok)
- **L'URL change** si vous redémarrez ngrok (plan gratuit)
- **Mettre à jour JIRA** si l'URL change

## 📚 Documentation Complète

- Guide détaillé : [`configuration-ngrok-local-testing.md`](./configuration-ngrok-local-testing.md)
- Configuration webhook : [`configuration-jira-webhook.md`](./configuration-jira-webhook.md)

