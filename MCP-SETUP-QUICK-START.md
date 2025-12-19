# 🚀 MCP Setup - Quick Start

Configuration rapide des serveurs MCP pour OnpointDoc.

## ✅ Configuration Effectuée

J'ai configuré **5 serveurs MCP** dans [.cursor/mcp.json](.cursor/mcp.json) :

| MCP | Statut | Utilité |
|-----|--------|---------|
| **ShadCN** | ✅ Configuré | Gérer les composants UI |
| **Supabase** | ✅ Configuré | 🔥 **MCP Officiel** : DB + Auth + Edge Functions + Logs + Docs |
| **Next.js Devtools** | ⚠️ Incompatible React 19 | Outils Next.js (utiliser Filesystem à la place) |
| **Filesystem** | ✅ Prêt | Lire/écrire les fichiers du projet Next.js |
| **Fetch** | ✅ Prêt | Appels HTTP vers JIRA API |
| **GitHub** | ⚠️ Token à vérifier | Gérer PRs, Issues, Commits |

## 🔧 Actions Requises

### 1️⃣ Variables d'Environnement - ✅ Configurées

Les variables suivantes sont déjà dans [.env.local](.env.local) :

```env
# ✅ Supabase MCP (configuré)
SUPABASE_ACCESS_TOKEN="sbp_xxxxx"  # Remplacez par votre token Supabase

# ⚠️ GitHub MCP (optionnel)
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # À ajouter si besoin
```

### 2️⃣ Utiliser le Script Automatique

**Option rapide** (recommandé) :
```powershell
.\scripts\setup-mcp-env.ps1
```

Le script va :
- ✅ Vérifier les variables existantes
- ✅ Te demander les variables manquantes
- ✅ Générer automatiquement `JIRA_AUTH_BASIC`
- ✅ Mettre à jour `.env.local`

### 3️⃣ Redémarrer Claude Code

Après modification de `.env.local` :
1. Ferme Claude Code complètement
2. Réouvre le projet
3. Vérifie que les MCP sont chargés : `/mcp`

---

## 📚 Documentation Complète

Consulte [docs/MCP-CONFIGURATION.md](docs/MCP-CONFIGURATION.md) pour :
- Configuration détaillée de chaque MCP
- Comment obtenir les tokens (Supabase, GitHub, JIRA)
- Exemples d'utilisation
- Dépannage

---

## 🎯 MCP vs Demandes Initiales

| Demandé | MCP Configuré | Notes |
|---------|---------------|-------|
| ShadCN | ✅ ShadCN | Serveur officiel |
| Supabase | 🔄 PostgreSQL | Pas d'MCP Supabase officiel, PostgreSQL accède directement à la DB |
| Next.js | 🔄 Filesystem | Pas d'MCP Next.js officiel, Filesystem lit les routes/composants |
| Context7 | ❌ Aucun | N'existe pas, utilise `CLAUDE.md` ou `/memory` |
| JIRA | 🔄 Fetch | Pas d'MCP JIRA officiel, Fetch permet d'appeler l'API JIRA |

---

## 🚦 Vérification Rapide

### Tester les MCP

Dans Claude Code, teste chaque MCP :

```bash
# 1. ShadCN
@shadcn:list

# 2. PostgreSQL (après config)
@postgresql:query SELECT COUNT(*) FROM tickets

# 3. Filesystem
@filesystem:list src/components

# 4. Fetch (appel API JIRA)
@fetch:get https://onpointdigital.atlassian.net/rest/api/3/project/OBC

# 5. GitHub (après config)
@github:list-repos
```

---

## ❓ Besoin d'Aide ?

- 📖 Documentation complète : [docs/MCP-CONFIGURATION.md](docs/MCP-CONFIGURATION.md)
- 🐛 Problèmes ? Vérifie la section "Dépannage" dans la doc
- 💬 Questions ? Demande-moi dans Claude Code !

---

**Dernière mise à jour** : 2025-12-08
