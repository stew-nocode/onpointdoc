# 🔧 GitHub MCP - Configuration et Dépannage

Guide pour configurer et utiliser le MCP GitHub sur OnpointDoc.

---

## ✅ État Actuel

- ✅ MCP GitHub configuré dans [.cursor/mcp.json](.cursor/mcp.json)
- ⚠️ Token GitHub ajouté mais nécessite vérification
- 📍 Variable : `GITHUB_TOKEN` dans [.env.local](.env.local)

---

## 🔑 Configuration du Token GitHub

### Génération d'un Nouveau Token

1. **Accède aux Paramètres GitHub** :
   - Va sur https://github.com/settings/tokens
   - Clique sur "Generate new token" → "Generate new token (classic)"

2. **Configure les Permissions** :
   Pour le MCP GitHub, tu as besoin de ces scopes minimum :

   **Obligatoires** :
   - ✅ `repo` (Accès complet aux repos privés/publics)
     - `repo:status`
     - `repo_deployment`
     - `public_repo`
     - `repo:invite`

   **Recommandés** :
   - ✅ `workflow` (Gérer les GitHub Actions)
   - ✅ `read:org` (Lire les infos de l'organisation)
   - ✅ `read:user` (Lire les infos du profil)
   - ✅ `user:email` (Accès aux emails)

3. **Génère et Copie le Token** :
   - Clique sur "Generate token"
   - **⚠️ Important** : Copie le token IMMÉDIATEMENT (tu ne pourras plus le voir)
   - Le token commence par `ghp_` ou `github_pat_`

4. **Ajoute le Token dans `.env.local`** :
   ```env
   # --- GitHub MCP ---
   GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

---

## 🧪 Vérification du Token

### Test 1 : Via API GitHub

```bash
# Remplace YOUR_TOKEN par ton token
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user
```

**Résultat attendu** :
```json
{
  "login": "ton-username",
  "id": 12345,
  "name": "Ton Nom",
  ...
}
```

**Si erreur "Bad credentials"** :
- ❌ Token invalide, expiré, ou incomplet
- ➡️ Génère un nouveau token

### Test 2 : Via MCP GitHub

Une fois le token configuré et VS Code / Claude Code redémarré :

```
"Claude, liste mes repositories GitHub"
"Claude, montre les issues ouvertes du repo OnpointDoc"
```

---

## 🚀 Fonctionnalités du MCP GitHub

### 1️⃣ Gestion des Repositories

**Lister tes repos** :
```
"Claude, liste tous mes repositories GitHub"
```

**Infos sur un repo spécifique** :
```
"Claude, donne-moi les infos sur le repo OnpointDoc"
```

### 2️⃣ Gestion des Issues

**Créer une issue** :
```
"Claude, crée une issue GitHub :
- Titre : Bug dans le dashboard
- Description : Le graphique ne s'affiche pas
- Labels : bug, dashboard"
```

**Lister les issues** :
```
"Claude, liste les issues ouvertes"
"Claude, montre-moi les issues avec le label 'bug'"
```

**Fermer une issue** :
```
"Claude, ferme l'issue #42 avec un commentaire de résolution"
```

### 3️⃣ Gestion des Pull Requests

**Créer une PR** :
```
"Claude, crée une pull request :
- Titre : Fix dashboard bug
- De : feature/fix-dashboard
- Vers : main
- Description : Correction du bug d'affichage"
```

**Lister les PRs** :
```
"Claude, liste les pull requests ouvertes"
```

**Review et merge** :
```
"Claude, approuve la PR #15"
"Claude, merge la PR #15"
```

### 4️⃣ Gestion des Commits

**Voir l'historique** :
```
"Claude, montre les 10 derniers commits"
"Claude, qui a modifié le fichier dashboard/page.tsx récemment?"
```

**Infos sur un commit** :
```
"Claude, donne les détails du commit abc1234"
```

### 5️⃣ Gestion des Branches

**Lister les branches** :
```
"Claude, liste toutes les branches du repo"
```

**Créer/supprimer une branche** :
```
"Claude, crée une branche feature/new-feature depuis main"
"Claude, supprime la branche old-feature"
```

---

## 🔄 Workflow Complet : Développement avec GitHub MCP

### Scénario 1 : Créer une Fonctionnalité

```bash
# 1. Créer une branche
"Claude, crée une branche feature/sla-management depuis main"

# 2. Développer (avec Filesystem et Next.js MCP)
# ... écriture du code ...

# 3. Créer une PR
"Claude, crée une pull request :
- Titre : Add SLA management to tickets
- De : feature/sla-management
- Vers : main
- Description : Ajout système de SLA avec deadlines et escalations"

# 4. Gérer la review
"Claude, montre-moi les commentaires de review sur ma PR"
"Claude, marque les commentaires comme résolus"

# 5. Merge
"Claude, merge la PR feature/sla-management"
```

### Scénario 2 : Corriger un Bug

```bash
# 1. Créer une issue
"Claude, crée une issue :
- Titre : Dashboard CEO - Graphique MTTR incorrect
- Description : Le graphique MTTR affiche des valeurs négatives
- Labels : bug, high-priority, dashboard"

# 2. Créer une branche depuis l'issue
"Claude, crée une branche fix/dashboard-mttr-issue-42"

# 3. Fix le bug
# ... développement ...

# 4. Créer PR liée à l'issue
"Claude, crée une PR qui ferme l'issue #42"

# 5. Merge et fermer l'issue
"Claude, merge la PR et ferme automatiquement l'issue #42"
```

---

## ⚠️ Dépannage

### Problème : "Bad credentials"

**Causes possibles** :
1. Token expiré
2. Token incomplet (copié partiellement)
3. Permissions insuffisantes

**Solution** :
1. Génère un **nouveau token** sur https://github.com/settings/tokens
2. Copie le token **entièrement** (généralement 93-95 caractères pour `github_pat_`)
3. Remplace dans `.env.local`
4. Redémarre VS Code / Claude Code

### Problème : "MCP GitHub not found"

**Solution** :
1. Vérifie que [.cursor/mcp.json](.cursor/mcp.json) contient :
   ```json
   {
     "github": {
       "type": "stdio",
       "command": "npx",
       "args": ["-y", "@modelcontextprotocol/server-github"],
       "env": {
         "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
       }
     }
   }
   ```

2. Redémarre VS Code / Claude Code

### Problème : "Permission denied"

**Cause** : Permissions insuffisantes sur le token

**Solution** :
1. Va sur https://github.com/settings/tokens
2. Clique sur le token existant
3. Ajoute les scopes manquants (`repo`, `workflow`, etc.)
4. Régénère le token si nécessaire

---

## 📊 Comparaison : Avec vs Sans GitHub MCP

| Tâche | Sans MCP | Avec MCP GitHub |
|-------|----------|-----------------|
| **Créer une issue** | Aller sur GitHub.com, cliquer, remplir | "Claude, crée une issue..." |
| **Créer une PR** | Switch navigateur, remplir formulaire | "Claude, crée une PR..." |
| **Voir les issues** | Ouvrir GitHub, filtrer manuellement | "Claude, liste les issues bug" |
| **Merge une PR** | GitHub.com → PR → Review → Merge | "Claude, merge la PR #15" |
| **Check commit history** | Git log ou GitHub.com | "Claude, derniers commits?" |

**Gain de temps** : ~70% sur les opérations Git/GitHub courantes

---

## 🎯 Configuration Actuelle

### Fichier `.env.local`
```env
# --- GitHub MCP ---
GITHUB_TOKEN="github_pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**⚠️ Note** : Remplace par ton token GitHub valide généré sur https://github.com/settings/tokens

**Action recommandée** :
1. Génère un nouveau token sur https://github.com/settings/tokens
2. Sélectionne les scopes : `repo`, `workflow`, `read:org`, `read:user`
3. Remplace le token dans `.env.local`
4. Teste avec : `curl -H "Authorization: Bearer TON_TOKEN" https://api.github.com/user`

---

## 📚 Ressources

### Documentation
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [MCP GitHub Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)

### Génération de Token
- [Create Token (Classic)](https://github.com/settings/tokens/new)
- [Token Scopes Explained](https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps)

---

## ✅ Checklist de Configuration

- [x] MCP GitHub configuré dans `.cursor/mcp.json`
- [x] Variable `GITHUB_TOKEN` ajoutée dans `.env.local`
- [ ] Token vérifié et fonctionnel
- [ ] Permissions correctes (repo, workflow)
- [ ] VS Code / Claude Code redémarré
- [ ] Test MCP : "Claude, liste mes repos GitHub"

---

**Prochaine étape** : Génère un nouveau token GitHub avec les bonnes permissions et teste !

**Dernière mise à jour** : 2025-12-08
