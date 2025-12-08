# 🔥 MCP Supabase Officiel - Guide Complet

**Mise à jour importante** : Supabase a lancé un **MCP officiel** bien plus puissant que l'accès PostgreSQL direct !

## 🆚 Comparaison : PostgreSQL MCP vs Supabase MCP Officiel

| Fonctionnalité | PostgreSQL MCP | **Supabase MCP Officiel** |
|----------------|----------------|---------------------------|
| **Accès Base de Données** | ✅ SQL direct | ✅ Tables + Migrations + SQL |
| **Authentification** | ❌ Non | ✅ **Gestion users, tokens, keys** |
| **Edge Functions** | ❌ Non | ✅ **Déploiement et gestion** |
| **Logs & Debugging** | ❌ Non | ✅ **Logs applicatifs + alertes sécurité** |
| **Documentation** | ❌ Non | ✅ **Recherche dans docs Supabase** |
| **Types TypeScript** | ❌ Non | ✅ **Génération auto des types** |
| **Sécurité** | ⚠️ SQL direct (risqué) | ✅ **Read-only mode + project scoping** |
| **Setup** | Variables DB password | ✅ **OAuth automatique (0 config)** |
| **Hébergement** | Local (npx) | ✅ **Distant (Supabase cloud)** |

**Verdict** : Le MCP Supabase officiel est **10x meilleur** ! 🚀

---

## 📦 Configuration Actuelle

Dans [.cursor/mcp.json](../.cursor/mcp.json) :

```json
{
  "supabase": {
    "type": "http",
    "url": "https://mcp.supabase.com/mcp?project_ref=xjcttqaiplnoalolebls&read_only=false&features=database,auth,functions,logs,docs",
    "headers": {
      "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
    }
  }
}
```

### Paramètres URL Expliqués

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| `project_ref` | `xjcttqaiplnoalolebls` | ID de ton projet Supabase (limite l'accès à ce projet) |
| `read_only` | `false` | **Mode lecture/écriture** (mettre `true` pour prod) |
| `features` | `database,auth,functions,logs,docs` | Fonctionnalités activées |

---

## 🔑 Authentification : 2 Options

### Option A : OAuth Automatique (Recommandé, 0 config)

**Le plus simple** : Aucune configuration nécessaire !

1. Au premier lancement de Claude Code après configuration
2. Une popup s'ouvrira automatiquement dans ton navigateur
3. Authentifie-toi sur Supabase
4. Claude Code stockera le token automatiquement
5. ✅ C'est tout !

**Avantages** :
- ✅ Zero config
- ✅ Token rafraîchi automatiquement
- ✅ Sécurisé (stockage chiffré)
- ✅ Fonctionne immédiatement

**Inconvénient** :
- ❌ Nécessite un navigateur (ne fonctionne pas en CI/CD)

---

### Option B : Token Manuel (Pour CI/CD ou sans navigateur)

**Pour les environnements serveur** ou si tu préfères la configuration manuelle.

#### 1️⃣ Générer un Access Token

1. Va sur https://supabase.com/dashboard/account/tokens
2. Clique sur **"Generate new token"**
3. Nom du token : `Claude Code MCP` (ou autre nom descriptif)
4. Permissions : **Full access** (ou restreint selon besoin)
5. Copie le token `sbp_xxxxxxxxxxxxxxxxx`

#### 2️⃣ Ajouter dans .env.local

Édite [.env.local](../.env.local) :

```env
# --- Supabase MCP Access Token ---
# Généré sur https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

#### 3️⃣ Redémarrer Claude Code

Ferme et réouvre Claude Code pour charger le token.

---

## 🛠️ Fonctionnalités Disponibles

### 1. 🗄️ Database (Gestion Base de Données)

**Capacités** :
- ✅ Lister les tables et schémas
- ✅ Créer/modifier/supprimer tables
- ✅ Exécuter des requêtes SQL
- ✅ Créer et appliquer des migrations
- ✅ Voir la structure des tables (colonnes, types, contraintes)

**Exemples d'utilisation** :

```
Claude, liste toutes les tables de ma base de données
Claude, crée une migration pour ajouter une colonne 'email_verified' à la table 'profiles'
Claude, exécute SELECT COUNT(*) FROM tickets WHERE status = 'Nouveau'
Claude, montre-moi la structure de la table 'companies'
```

---

### 2. 🔐 Auth (Authentification)

**Capacités** :
- ✅ Gérer les utilisateurs (créer, lister, supprimer)
- ✅ Configurer les providers OAuth (Google, GitHub, etc.)
- ✅ Récupérer les clés API (anon key, service role key)
- ✅ Configurer les politiques d'authentification

**Exemples d'utilisation** :

```
Claude, liste les 10 derniers utilisateurs créés
Claude, quelle est ma clé API publique Supabase ?
Claude, active le provider Google OAuth
Claude, crée un nouvel utilisateur test avec l'email test@example.com
```

---

### 3. ⚡ Edge Functions (Fonctions Serverless)

**Capacités** :
- ✅ Lister les fonctions déployées
- ✅ Déployer de nouvelles fonctions
- ✅ Voir les logs des fonctions
- ✅ Gérer les variables d'environnement

**Exemples d'utilisation** :

```
Claude, liste toutes mes Edge Functions
Claude, déploie la fonction 'send-email' depuis ./functions/send-email
Claude, montre-moi les logs de la fonction 'jira-webhook'
Claude, crée une nouvelle Edge Function pour valider les tickets
```

---

### 4. 📊 Logs (Journaux et Debugging)

**Capacités** :
- ✅ Consulter les logs applicatifs
- ✅ Voir les requêtes SQL lentes
- ✅ Alertes de sécurité
- ✅ Monitoring des performances

**Exemples d'utilisation** :

```
Claude, montre-moi les logs des 10 dernières minutes
Claude, quelles sont les requêtes SQL les plus lentes ?
Claude, y a-t-il des alertes de sécurité récentes ?
Claude, affiche les erreurs 500 de la dernière heure
```

---

### 5. 📚 Docs (Documentation Supabase)

**Capacités** :
- ✅ Rechercher dans la documentation officielle
- ✅ Obtenir des exemples de code
- ✅ Trouver les meilleures pratiques

**Exemples d'utilisation** :

```
Claude, comment configurer les RLS (Row Level Security) dans Supabase ?
Claude, donne-moi un exemple de politique RLS pour restreindre l'accès par entreprise
Claude, quelle est la syntaxe pour créer une fonction PostgreSQL dans Supabase ?
Claude, montre-moi comment uploader un fichier dans Supabase Storage
```

---

## 🔒 Sécurité : Best Practices

### ⚠️ IMPORTANT : Ne JAMAIS connecter la Production

Supabase recommande **fortement** :
- ✅ **Développement** : Connecter le MCP (lecture/écriture OK)
- ⚠️ **Staging** : Connecter en mode `read_only=true` uniquement
- ❌ **Production** : **NE JAMAIS CONNECTER** le MCP

**Pourquoi ?**
- Risque d'injection de prompts (données malveillantes dans la DB)
- L'IA pourrait supprimer/modifier des données involontairement
- Pas de rollback automatique

### 🛡️ Configurations Sécurisées

#### 1. Mode Read-Only (Recommandé pour Staging)

```json
{
  "supabase": {
    "url": "https://mcp.supabase.com/mcp?project_ref=xjcttqaiplnoalolebls&read_only=true"
  }
}
```

**Effet** : Toutes les requêtes SQL sont exécutées avec un utilisateur PostgreSQL en lecture seule.

---

#### 2. Limiter les Fonctionnalités

```json
{
  "supabase": {
    "url": "https://mcp.supabase.com/mcp?project_ref=xjcttqaiplnoalolebls&features=database,docs"
  }
}
```

**Effet** : Seulement Database et Docs, pas d'Edge Functions ni Auth.

---

#### 3. Approuver Manuellement les Outils

Dans Claude Code, configure :
- Settings → MCP → Supabase → **"Require manual approval for tool calls"**

**Effet** : Chaque action MCP nécessite ta validation manuelle avant exécution.

---

## 🚀 Exemples d'Utilisation Avancés

### Exemple 1 : Migration Automatique

```
User: Claude, j'ai besoin d'ajouter un champ 'archived_at' à la table tickets

Claude: [Utilise le MCP Supabase pour créer une migration]
✅ Migration créée : 20250108_add_archived_at_to_tickets.sql
✅ Migration appliquée avec succès
✅ Types TypeScript régénérés
```

---

### Exemple 2 : Debugging Performance

```
User: Claude, pourquoi mon dashboard est lent ?

Claude: [Utilise le MCP Supabase pour analyser les logs]
📊 J'ai trouvé 3 requêtes SQL lentes :
1. SELECT * FROM tickets WHERE ... (2.3s en moyenne) - Manque un index sur 'status'
2. SELECT * FROM companies JOIN ... (1.8s) - Join non optimisé
3. ...

💡 Recommandations :
- Ajouter un index sur tickets(status)
- Réécrire la jointure companies
```

---

### Exemple 3 : Génération de Types

```
User: Claude, génère les types TypeScript pour ma base de données

Claude: [Utilise le MCP Supabase pour générer les types]
✅ Types générés dans src/types/supabase.ts
✅ Fichier mis à jour avec 47 tables et leurs relations
```

---

## 🔄 Migration depuis PostgreSQL MCP

Si tu utilisais le PostgreSQL MCP avant :

### Avantages du Changement

| Avant (PostgreSQL MCP) | Après (Supabase MCP) |
|------------------------|----------------------|
| Seulement SQL direct | SQL + Auth + Functions + Logs |
| Connexion locale (npx) | Connexion cloud (plus rapide) |
| Password DB requis | OAuth automatique (0 config) |
| Pas de type safety | Types TypeScript auto-générés |
| Pas de logs | Logs et monitoring intégrés |

### Étapes de Migration

1. ✅ **Fait** : Configuration `.cursor/mcp.json` mise à jour
2. ⏳ **À faire** : Obtenir `SUPABASE_ACCESS_TOKEN` (ou utiliser OAuth auto)
3. ⏳ **À faire** : Redémarrer Claude Code
4. ⏳ **À faire** : Tester avec `/mcp`

---

## 📚 Ressources Officielles

- [Documentation Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [GitHub supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp)
- [Supabase MCP Features](https://supabase.com/features/mcp-server)
- [Guide Composio : Supabase MCP with Claude Code](https://composio.dev/blog/supabase-mcp-with-claude-code)

---

## ❓ Dépannage

### Erreur "Unauthorized" ou 401

**Cause** : Token invalide ou expiré

**Solution** :
1. Régénère un token sur https://supabase.com/dashboard/account/tokens
2. Mets à jour `SUPABASE_ACCESS_TOKEN` dans `.env.local`
3. Redémarre Claude Code

---

### MCP ne se charge pas

**Cause** : Configuration JSON invalide

**Solution** :
1. Vérifie la syntaxe de `.cursor/mcp.json` (JSON valide ?)
2. Vérifie que l'URL contient bien `project_ref=xjcttqaiplnoalolebls`
3. Redémarre Claude Code

---

### OAuth ne s'ouvre pas automatiquement

**Cause** : Navigateur bloqué ou environnement sans UI

**Solution** : Utilise l'Option B (Token Manuel) au lieu de l'OAuth automatique

---

## 🎯 Prochaines Étapes

1. **Obtenir le token** : Choisis OAuth auto (plus simple) ou Token manuel (CI/CD)
2. **Redémarrer Claude Code** : Pour charger le nouveau MCP
3. **Tester** : Lance `/mcp` et vérifie que `mcp__supabase__*` apparaît
4. **Première commande** : "Claude, liste toutes mes tables Supabase"

---

**Dernière mise à jour** : 2025-12-08
**Source** : [Article Medium Dan Avila](https://medium.com/@dan.avila7/claude-code-supabase-integration-complete-guide-with-agents-commands-and-mcp-427613d9051e) (via recherche web)
