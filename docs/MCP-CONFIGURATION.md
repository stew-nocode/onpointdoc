# Configuration MCP - OnpointDoc

Ce document explique la configuration des serveurs MCP (Model Context Protocol) pour le projet OnpointDoc.

## 📋 Serveurs MCP Configurés

### 1. ✅ **ShadCN MCP**
**Objectif** : Gérer les composants UI ShadCN directement depuis Claude Code

**Configuration** :
```json
{
  "shadcn": {
    "type": "stdio",
    "command": "npx",
    "args": ["shadcn@latest", "mcp"]
  }
}
```

**Utilisation** :
- Ajouter des composants ShadCN : `@shadcn:add button`
- Lister les composants : `@shadcn:list`

---

### 2. 🗄️ **PostgreSQL MCP** (Remplace Supabase MCP)
**Objectif** : Accéder directement à la base de données Supabase (PostgreSQL)

**Configuration** :
```json
{
  "postgresql": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": {
      "DATABASE_URL": "postgresql://postgres.xjcttqaiplnoalolebls:${SUPABASE_DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
    }
  }
}
```

**Variables requises** :
- `SUPABASE_DB_PASSWORD` : Mot de passe de la base de données Supabase

**Utilisation** :
- Exécuter des requêtes SQL : `@postgresql:query SELECT * FROM tickets LIMIT 10`
- Lister les tables : `@postgresql:tables`

**⚠️ Important** :
- Utilise le **connection pooler** Supabase (port 6543) pour éviter les timeouts
- N'expose JAMAIS ce mot de passe dans le code client

---

### 3. 📁 **Filesystem MCP** (Remplace Next.js MCP)
**Objectif** : Accéder au système de fichiers du projet

**Configuration** :
```json
{
  "filesystem": {
    "type": "stdio",
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "--allow-read", ".",
      "--allow-write", "src,scripts,docs,public"
    ]
  }
}
```

**Permissions** :
- **Lecture** : Tout le projet (`.`)
- **Écriture** : `src/`, `scripts/`, `docs/`, `public/`

**Utilisation** :
- Lire des fichiers : `@filesystem:read src/app/page.tsx`
- Écrire des fichiers : `@filesystem:write src/components/new-component.tsx`
- Lister des dossiers : `@filesystem:list src/components`

---

### 4. 🌐 **Fetch MCP** (Pour JIRA API)
**Objectif** : Effectuer des requêtes HTTP vers JIRA et autres APIs

**Configuration** :
```json
{
  "fetch": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-fetch"]
  }
}
```

**Utilisation pour JIRA** :
```javascript
// Exemple : Récupérer un ticket JIRA
@fetch:get https://onpointdigital.atlassian.net/rest/api/3/issue/OBC-123 \
  --header "Authorization: Basic ${JIRA_AUTH_BASIC}" \
  --header "Content-Type: application/json"
```

**Variables requises** :
- `JIRA_AUTH_BASIC` : Token d'authentification JIRA (encodé en base64)

**Génération du token** :
```bash
echo -n "support@onpointafrica.com:VOTRE_JIRA_API_TOKEN" | base64
```

---

### 5. 🐙 **GitHub MCP**
**Objectif** : Interagir avec GitHub (PRs, Issues, Commits)

**Configuration** :
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

**Variables requises** :
- `GITHUB_TOKEN` : Personal Access Token GitHub

**Utilisation** :
- Créer une PR : `@github:create-pr`
- Lister les issues : `@github:list-issues`
- Commenter une PR : `@github:comment-pr 123`

---

## 🔧 Configuration des Variables d'Environnement

### Fichier `.env.local` (Ajouts nécessaires)

Ajoute ces variables à ton fichier `.env.local` :

```env
# --- Supabase Database ---
SUPABASE_DB_PASSWORD="ton_mot_de_passe_supabase"

# --- GitHub ---
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# --- JIRA (pour MCP Fetch) ---
JIRA_AUTH_BASIC="$(echo -n 'your-email@example.com:YOUR_JIRA_API_TOKEN' | base64)"
```

### Trouver le mot de passe Supabase

1. Va sur [app.supabase.com](https://app.supabase.com)
2. Ouvre ton projet `xjcttqaiplnoalolebls`
3. Settings → Database → Connection string (Direct connection)
4. Copie le mot de passe depuis l'URL PostgreSQL

### Créer un GitHub Token

1. Va sur [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token (classic)
3. Permissions :
   - `repo` (Full control)
   - `workflow` (si tu utilises GitHub Actions)
4. Copie le token `ghp_...`

---

## 📦 Installation des MCP

### Option 1 : Automatique (via npx)

Les MCP sont installés automatiquement via `npx` quand tu les utilises. **Aucune installation manuelle requise**.

### Option 2 : Installation locale (optionnel, plus rapide)

```bash
npm install -D @modelcontextprotocol/server-postgres
npm install -D @modelcontextprotocol/server-filesystem
npm install -D @modelcontextprotocol/server-fetch
npm install -D @modelcontextprotocol/server-github
```

Ensuite, modifie `.cursor/mcp.json` pour utiliser les binaires locaux :

```json
{
  "postgresql": {
    "command": "node",
    "args": ["./node_modules/@modelcontextprotocol/server-postgres/dist/index.js"]
  }
}
```

---

## 🚀 Activation dans Claude Code

### 1. Redémarrer Claude Code

Après modification de `.cursor/mcp.json`, redémarre Claude Code pour charger les nouveaux MCP.

### 2. Vérifier les MCP actifs

Dans Claude Code, tape :
```
/mcp
```

Tu devrais voir les 5 serveurs MCP listés.

### 3. Utiliser les MCP dans les conversations

Les MCP seront automatiquement disponibles via les outils :
- `mcp__shadcn__*`
- `mcp__postgresql__*`
- `mcp__filesystem__*`
- `mcp__fetch__*`
- `mcp__github__*`

---

## ❌ MCP Non Disponibles (Alternatives)

### Context7 MCP
**Statut** : ❌ N'existe pas

**Alternatives** :
1. Utilise `CLAUDE.md` à la racine du projet pour le contexte global
2. Utilise `/memory` dans Claude Code pour sauvegarder du contexte
3. Utilise les commentaires de code pour documenter le contexte

### MCP Supabase Officiel
**Statut** : ❌ N'existe pas

**Alternative** : PostgreSQL MCP (accès direct à la DB Supabase)

### MCP Next.js Officiel
**Statut** : ❌ N'existe pas

**Alternative** : Filesystem MCP (accès aux routes/composants Next.js)

---

## 🔒 Sécurité

### Variables sensibles

**Ne JAMAIS commiter** ces variables dans Git :
- ✅ `.env.local` est dans `.gitignore`
- ✅ `.cursor/mcp.json` utilise des références `${VAR}`
- ❌ Ne pas hardcoder les tokens dans `mcp.json`

### Permissions Filesystem MCP

Le Filesystem MCP est configuré pour :
- **Lecture** : Tout le projet (pour exploration)
- **Écriture** : Seulement `src/`, `scripts/`, `docs/`, `public/`

**Pas d'écriture sur** :
- `.env.local` (sécurité)
- `node_modules/` (génération automatique)
- `.git/` (intégrité Git)

---

## 📚 Ressources

- [Documentation MCP officielle](https://modelcontextprotocol.io)
- [Claude Code MCP Guide](https://code.claude.com/docs/en/mcp.md)
- [Serveurs MCP disponibles](https://github.com/modelcontextprotocol/servers)

---

## 🐛 Dépannage

### MCP ne se charge pas

1. Vérifie la syntaxe JSON de `.cursor/mcp.json`
2. Vérifie que les variables d'environnement sont définies
3. Redémarre complètement Claude Code
4. Vérifie les logs : Menu → View → Output → Claude Code

### Erreur "DATABASE_URL invalid"

1. Vérifie que `SUPABASE_DB_PASSWORD` est défini dans `.env.local`
2. Vérifie la connection string Supabase (Settings → Database)
3. Utilise le **pooler connection** (port 6543) pas la direct connection (port 5432)

### Erreur "GitHub authentication failed"

1. Vérifie que `GITHUB_TOKEN` est valide (teste avec `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user`)
2. Régénère le token si expiré
3. Vérifie les permissions du token (besoin de `repo`)

---

**Dernière mise à jour** : 2025-01-XX
**Auteur** : OnpointDoc Team
