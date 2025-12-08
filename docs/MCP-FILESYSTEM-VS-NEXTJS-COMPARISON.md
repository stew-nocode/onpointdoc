# Comparaison : Filesystem MCP vs Next.js Devtools MCP

Comparaison détaillée entre les deux serveurs MCP pour le développement Next.js.

---

## 📊 Tableau Comparatif Complet

| Critère | **Filesystem MCP** | **Next.js Devtools MCP** |
|---------|-------------------|-------------------------|
| **Fournisseur** | Anthropic (officiel MCP) | Vercel (officiel Next.js) |
| **Compatibilité** | ✅ Universel (tous projets) | ✅ Next.js 16+ uniquement |
| **État actuel** | ✅ Stable et fonctionnel | ⚠️ Problème dépendances React 19 |
| **Installation** | ✅ Configuré et opérationnel | ⚠️ Erreur module SDK |

---

## 🔧 Fonctionnalités Détaillées

### 1️⃣ Filesystem MCP (@modelcontextprotocol/server-filesystem)

#### **Capacités Principales**
- ✅ **Lecture de fichiers** : Lire n'importe quel fichier dans les répertoires autorisés
- ✅ **Écriture de fichiers** : Créer/modifier des fichiers
- ✅ **Manipulation de répertoires** : Créer, lister, supprimer des dossiers
- ✅ **Opérations sûres** : Hints pour opérations read-only, idempotent, destructive

#### **Sécurité & Contrôle d'Accès**
```bash
# Configuration avec restrictions de dossiers
npx @modelcontextprotocol/server-filesystem \
  --allow-read "." \
  --allow-write "src,scripts,docs,public"
```

**Méthodes de contrôle** :
1. **Ligne de commande** : Spécifier les dossiers autorisés au démarrage
2. **Roots protocol** : Mise à jour dynamique des permissions sans redémarrage (recommandé)

#### **Avantages**
- ✅ Universel : fonctionne avec Next.js, React, Node.js, tout projet
- ✅ Stable : produit par Anthropic, bien maintenu
- ✅ Léger : 64.3 kB, aucune dépendance complexe
- ✅ Sécurisé : contrôle granulaire des accès
- ✅ Hints opérationnels : `readOnlyHint`, `idempotentHint`, `destructiveHint`

#### **Limitations**
- ❌ Pas de diagnostics runtime Next.js
- ❌ Pas d'accès aux erreurs de build Next.js
- ❌ Pas d'inspection des Server Actions
- ❌ Pas d'intégration avec le dev server Next.js

---

### 2️⃣ Next.js Devtools MCP (next-devtools-mcp)

#### **Capacités Principales** (Next.js 16+)

##### **A. Diagnostics Runtime** 🔥
- ✅ **Détection d'erreurs** : Récupère les erreurs de build, runtime, et TypeScript
- ✅ **Requêtes état live** : Accès à l'état de l'application en temps réel
- ✅ **Métadonnées des pages** : Routes, composants, détails de rendu
- ✅ **Server Actions** : Inspection des Server Actions et hiérarchies de composants
- ✅ **Logs de développement** : Accès aux logs du dev server et console output

##### **B. Base de Connaissances Next.js** 📚
- ✅ Query documentation Next.js complète
- ✅ Best practices intégrées
- ✅ Exemples de code contextuels

##### **C. Outils de Migration** 🔄
- ✅ **Codemods automatisés** : Migration vers Next.js 16
- ✅ **Guide Cache Components** : Configuration et setup
- ✅ **Helpers d'upgrade** : Assistance automatisée

##### **D. Tests Navigateur** 🧪
- ✅ **Intégration Playwright** : Vérification des pages dans le navigateur
- ✅ **Tests E2E** : Automatisation via MCP

#### **Architecture**
```
Next.js Devtools MCP (Bridge)
    ↓
    ├─ Next.js Dev Server (_next/mcp) ← Diagnostics runtime
    ├─ Playwright MCP Server ← Tests navigateur
    └─ Knowledge Base & Tools ← Documentation
```

#### **Avantages** 🎯
- ✅ Diagnostics runtime en temps réel
- ✅ Accès direct aux erreurs Next.js
- ✅ Documentation intégrée
- ✅ Codemods de migration automatisés
- ✅ Tests Playwright intégrés
- ✅ Inspection Server Actions (Next.js 16+)

#### **Limitations** ⚠️
- ❌ **Next.js 16+ uniquement** (ne fonctionne pas avec Next.js 15 et antérieurs)
- ❌ **Problème dépendances** : Erreur module `@modelcontextprotocol/sdk` dans notre config
- ❌ **Incompatibilité React 19** : Conflit peer dependencies avec React 19.2.0
- ❌ Nécessite dev server Next.js actif (`npm run dev`)
- ❌ Plus complexe : 3 serveurs interconnectés

---

## 🎯 Cas d'Usage Recommandés

### Utiliser **Filesystem MCP** quand :
1. ✅ Tu veux manipuler des fichiers Next.js (routes, composants, config)
2. ✅ Tu as besoin d'un accès universel aux fichiers du projet
3. ✅ Tu veux créer/modifier des fichiers `.tsx`, `.ts`, `.json`, etc.
4. ✅ La stabilité et la compatibilité sont critiques
5. ✅ Tu travailles sur Next.js < 16 ou React < 19

### Utiliser **Next.js Devtools MCP** quand :
1. ✅ Tu utilises **Next.js 16+** (strictement requis)
2. ✅ Tu as besoin de diagnostics runtime en temps réel
3. ✅ Tu veux débugger des erreurs de build/runtime Next.js
4. ✅ Tu veux inspecter les Server Actions
5. ✅ Tu as besoin d'accéder aux logs du dev server
6. ✅ Tu veux des codemods de migration automatisés
7. ✅ Le dev server Next.js est actif (`npm run dev`)

---

## 🔍 Comparaison des Opérations

| Opération | Filesystem MCP | Next.js Devtools MCP |
|-----------|----------------|---------------------|
| **Lire un fichier** | ✅ Oui | ✅ Oui (via Filesystem sous-jacent) |
| **Écrire un fichier** | ✅ Oui | ✅ Oui (via Filesystem sous-jacent) |
| **Lister les routes Next.js** | ✅ Oui (via lecture de `app/`) | ✅ Oui + métadonnées runtime |
| **Voir erreurs TypeScript** | ❌ Non | ✅ Oui (temps réel) |
| **Voir erreurs de build** | ❌ Non | ✅ Oui (temps réel) |
| **Inspecter Server Actions** | ❌ Non | ✅ Oui |
| **Accès logs dev server** | ❌ Non | ✅ Oui |
| **Documentation Next.js** | ❌ Non | ✅ Oui (base de connaissances) |
| **Codemods migration** | ❌ Non | ✅ Oui |
| **Tests Playwright** | ❌ Non | ✅ Oui |
| **Fonctionne hors ligne** | ✅ Oui | ❌ Non (nécessite dev server) |
| **Sécurité granulaire** | ✅ Oui (--allow-read/write) | ⚠️ Partielle |

---

## 🚀 Notre Configuration Actuelle

### ✅ Filesystem MCP (Opérationnel)
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

**Statut** : ✅ Fonctionne parfaitement

### ⚠️ Next.js Devtools MCP (Ajouté mais problématique)
```json
{
  "next-devtools": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "next-devtools-mcp@latest"]
  }
}
```

**Problème identifié** :
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'@modelcontextprotocol/sdk/server/index.js'
```

**Cause** : Dépendances manquantes ou incompatibilité React 19.2.0

---

## 💡 Recommandation pour OnpointDoc

### Configuration Optimale Actuelle

| Besoin | Solution MCP |
|--------|-------------|
| **Manipulation fichiers Next.js** | ✅ Filesystem MCP (configuré) |
| **Création/modification routes** | ✅ Filesystem MCP |
| **Accès aux composants** | ✅ Filesystem MCP |
| **Diagnostics runtime** | ⏳ Attendre fix Next.js Devtools ou Next.js 17 |
| **Erreurs de build** | ⏳ Utiliser `npm run build` + Filesystem pour corriger |

### Prochaines Étapes

1. **Court terme** : Utiliser **Filesystem MCP** pour toutes les opérations fichiers
2. **Moyen terme** : Surveiller les mises à jour de `next-devtools-mcp` pour compatibilité React 19
3. **Alternative** : Créer une fonction RPC personnalisée dans l'app Next.js pour exposer les diagnostics

---

## 📚 Sources

### Filesystem MCP
- [Documentation officielle MCP](https://modelcontextprotocol.io/examples)
- [GitHub - MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Filesystem MCP README](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- [NPM Package](https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem)

### Next.js Devtools MCP
- [Documentation officielle Next.js](https://nextjs.org/docs/app/guides/mcp)
- [GitHub - Vercel Next Devtools MCP](https://github.com/vercel/next-devtools-mcp)
- [NPM Package](https://www.npmjs.com/package/next-devtools-mcp)
- [Article Trevor Lasn](https://www.trevorlasn.com/blog/next-js-devtools-mcp)
- [LobeHub MCP Servers](https://lobehub.com/mcp/vercel-next-devtools-mcp)

---

## 🔄 Statut de Compatibilité

| Version | Filesystem MCP | Next.js Devtools MCP |
|---------|----------------|---------------------|
| **Next.js 14** | ✅ Compatible | ❌ Non supporté |
| **Next.js 15** | ✅ Compatible | ❌ Non supporté |
| **Next.js 16.0.5** | ✅ Compatible | ⚠️ Requis mais problème dépendances |
| **React 18** | ✅ Compatible | ✅ Compatible |
| **React 19.2.0** | ✅ Compatible | ⚠️ Conflit peer dependencies |

---

**Conclusion** : Pour OnpointDoc (Next.js 16.0.5 + React 19.2.0), **Filesystem MCP** est actuellement la solution la plus fiable et stable. Next.js Devtools MCP sera une excellente addition une fois les problèmes de dépendances résolus.

**Dernière mise à jour** : 2025-12-08
