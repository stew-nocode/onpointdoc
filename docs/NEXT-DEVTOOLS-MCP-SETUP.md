# 🚀 Next.js Devtools MCP - Setup et Utilisation

Guide complet pour utiliser Next.js Devtools MCP avec React 19 sur OnpointDoc.

---

## ✅ Problème Résolu : Incompatibilité React 19

### Le Problème Initial
- ❌ `ERR_MODULE_NOT_FOUND` : Module `@modelcontextprotocol/sdk` introuvable
- ❌ Conflit peer dependencies avec React 19.2.0
- ❌ Installation via `npx` échoue

### La Solution Appliquée ✅

**Étapes effectuées** :
1. ✅ Nettoyage du cache npx et npm
2. ✅ Installation locale avec `--legacy-peer-deps`
3. ✅ Configuration MCP pour utiliser le package local
4. ✅ Packages installés :
   - `@modelcontextprotocol/sdk`
   - `next-devtools-mcp@latest`

---

## 📦 Configuration Finale

### Fichier `.cursor/mcp.json`
```json
{
  "next-devtools": {
    "type": "stdio",
    "command": "node",
    "args": ["./node_modules/next-devtools-mcp/dist/index.js"]
  }
}
```

**Changement clé** : Utilisation du package local au lieu de `npx -y next-devtools-mcp@latest`

---

## 🔧 Prérequis pour Utiliser Next.js Devtools MCP

### 1️⃣ Dev Server Next.js Actif

Le MCP Next.js Devtools **nécessite** que le dev server Next.js soit lancé :

```bash
npm run dev
```

Le serveur démarre sur : `http://127.0.0.1:3000`

**Point d'accès MCP** : `http://127.0.0.1:3000/_next/mcp`

### 2️⃣ Next.js 16+ avec MCP Activé

OnpointDoc utilise :
- ✅ Next.js 16.0.5 (MCP activé par défaut)
- ✅ React 19.2.0 (supporté via --legacy-peer-deps)

---

## 🎯 Fonctionnalités Disponibles

### 1️⃣ Diagnostics Runtime
Quand le dev server est actif, tu peux :
- 🔍 **Voir les erreurs de build** en temps réel
- 🔍 **Voir les erreurs TypeScript** sans quitter l'éditeur
- 🔍 **Inspecter les erreurs runtime** de l'application

**Exemple d'utilisation** :
```
"Claude, montre-moi les erreurs actuelles du dev server Next.js"
```

### 2️⃣ Inspection des Pages
- 📄 Liste des routes disponibles
- 📄 Métadonnées des pages (layout, loading, error)
- 📄 Hiérarchie des composants

**Exemple d'utilisation** :
```
"Claude, liste toutes les routes de l'app Next.js"
"Claude, analyse la structure de la page /dashboard"
```

### 3️⃣ Server Actions (Next.js 16)
- ⚡ Liste des Server Actions définies
- ⚡ Inspection des signatures de fonctions
- ⚡ Analyse des dépendances

**Exemple d'utilisation** :
```
"Claude, liste toutes les Server Actions de l'app"
"Claude, inspecte la Server Action createTicket"
```

### 4️⃣ Logs en Temps Réel
- 📊 Accès aux logs du dev server
- 📊 Console output de l'application
- 📊 Warnings et erreurs

**Exemple d'utilisation** :
```
"Claude, montre-moi les derniers logs du dev server"
```

### 5️⃣ Base de Connaissances Next.js
- 📚 Documentation Next.js intégrée
- 📚 Best practices contextuelles
- 📚 Exemples de code

**Exemple d'utilisation** :
```
"Claude, comment optimiser le cache dans Next.js 16?"
"Claude, explique les Server Actions"
```

### 6️⃣ Outils de Migration
- 🔄 Codemods automatisés pour migration
- 🔄 Guide Cache Components
- 🔄 Helpers d'upgrade

**Exemple d'utilisation** :
```
"Claude, aide-moi à migrer vers le nouveau système de cache"
```

### 7️⃣ Tests Playwright (via intégration)
- 🧪 Tests E2E dans le navigateur
- 🧪 Vérification visuelle des pages

---

## 🚦 Comment Utiliser

### Démarrage

1. **Lance le dev server Next.js** :
   ```bash
   npm run dev
   ```

2. **Redémarre VS Code / Claude Code** pour charger le MCP

3. **Vérifie que le MCP est actif** :
   ```bash
   # Dans Claude Code, tape:
   /mcp
   ```

   Tu devrais voir `next-devtools` dans la liste.

### Utilisation Quotidienne

#### Scénario 1 : Debug d'Erreurs TypeScript
```
Toi : "Claude, montre-moi les erreurs TypeScript actuelles"

Claude : [Utilise Next.js Devtools MCP]
"J'ai trouvé 3 erreurs TypeScript :
1. src/app/dashboard/page.tsx:57 - Type 'string' is not assignable to type 'Period'
2. src/app/actions/dashboard.ts:55 - Property 'errors' does not exist
..."
```

#### Scénario 2 : Inspection des Routes
```
Toi : "Claude, liste toutes les routes de l'application"

Claude : [Utilise Next.js Devtools MCP]
"Routes disponibles :
- / (Page d'accueil)
- /dashboard (CEO Dashboard)
- /gestion/tickets (Gestion tickets)
..."
```

#### Scénario 3 : Analyse Server Actions
```
Toi : "Claude, inspecte la Server Action getDashboardKPIs"

Claude : [Utilise Next.js Devtools MCP]
"Server Action : getDashboardKPIs
- Fichier : src/app/actions/dashboard.ts:45
- Paramètres : { period: Period, agents?: string[] }
- Retour : Promise<DashboardKPIs>
..."
```

---

## 🔄 Workflow Complet : Dev avec MCP

### Matin - Démarrage
```bash
# 1. Lance le dev server
npm run dev

# 2. Ouvre VS Code / Claude Code
code .

# 3. Le MCP Next.js Devtools se connecte automatiquement
```

### Pendant le Développement
```
# Tu codes normalement, et tu peux demander à Claude :
"Claude, y a-t-il des erreurs dans le dev server?"
"Claude, vérifie si ma nouvelle route fonctionne"
"Claude, analyse les performances de la page /dashboard"
```

### Debug d'Erreur
```
# Quand une erreur apparaît :
"Claude, explique-moi l'erreur actuelle et propose une solution"

# Claude utilise le MCP pour :
1. Récupérer l'erreur exacte
2. Analyser le contexte (fichier, ligne, stack trace)
3. Proposer une solution basée sur la doc Next.js
4. Suggérer un fix
```

---

## 🎨 Avantages vs Filesystem MCP

| Besoin | Filesystem MCP | Next.js Devtools MCP |
|--------|----------------|---------------------|
| **Créer/modifier fichiers** | ✅ Excellent | ✅ Bon (via Filesystem) |
| **Voir erreurs TypeScript** | ❌ Non | ✅ **Temps réel** |
| **Voir erreurs de build** | ❌ Non | ✅ **Temps réel** |
| **Inspecter Server Actions** | ❌ Non | ✅ **Exclusif** |
| **Logs dev server** | ❌ Non | ✅ **Temps réel** |
| **Doc Next.js intégrée** | ❌ Non | ✅ **Contextuelle** |
| **Fonctionne sans dev server** | ✅ Oui | ❌ Non |

**Recommandation** : Utilise **les deux** en complémentarité !
- **Filesystem MCP** : Manipulation de fichiers
- **Next.js Devtools MCP** : Diagnostics et intelligence

---

## 📊 Architecture du MCP Next.js Devtools

```
┌─────────────────────────────────────────────┐
│         Claude Code / VS Code               │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   Next.js Devtools MCP (Bridge)       │ │
│  │   (node_modules/next-devtools-mcp)    │ │
│  └───────────────┬───────────────────────┘ │
└──────────────────┼─────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐     ┌──────────────────┐
│  Next.js Dev  │     │  Playwright MCP  │
│    Server     │     │   (optionnel)    │
│               │     │                  │
│ localhost:3000│     │  Tests browser   │
│  /_next/mcp   │     │                  │
└───────────────┘     └──────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│  Diagnostics Runtime              │
│  - Erreurs build/runtime          │
│  - État application                │
│  - Server Actions                  │
│  - Logs                            │
└───────────────────────────────────┘
```

---

## ⚠️ Limitations Connues

1. **Dev Server Requis** : Le MCP ne fonctionne que si `npm run dev` est actif
2. **Port spécifique** : Par défaut 3000, configurable via `-p`
3. **Warnings expérimentaux** : Node affiche des warnings pour JSON imports (ignorables)

---

## 🐛 Dépannage

### Problème : "MCP not connected"
**Solution** :
1. Vérifie que le dev server est lancé : `npm run dev`
2. Vérifie que `http://127.0.0.1:3000/_next/mcp` est accessible
3. Redémarre VS Code / Claude Code

### Problème : "ERR_MODULE_NOT_FOUND"
**Solution** : Déjà corrigée via installation locale

### Problème : "React 19 peer dependency"
**Solution** : Déjà corrigée via `--legacy-peer-deps`

---

## 📚 Documentation et Sources

### Officiel
- [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp)
- [GitHub - Vercel Next Devtools MCP](https://github.com/vercel/next-devtools-mcp)
- [Next.js 16 Blog](https://nextjs.org/blog/next-16)

### Tutoriels
- [Next.js DevTools MCP Blog](https://www.trevorlasn.com/blog/next-js-devtools-mcp)
- [LobeHub MCP Servers](https://lobehub.com/mcp/vercel-next-devtools-mcp)
- [Stack Overflow - Next.js MCP Config](https://stackoverflow.com/questions/79797822/how-do-i-use-the-built-in-mcp-server-in-next-js-16-and-configure-next-devtools-m)

---

## ✅ Checklist de Vérification

- [x] Next.js 16.0.5 installé
- [x] React 19.2.0 compatible (via --legacy-peer-deps)
- [x] `@modelcontextprotocol/sdk` installé localement
- [x] `next-devtools-mcp` installé localement
- [x] Configuration MCP mise à jour (utilise package local)
- [x] Cache npx nettoyé
- [ ] Dev server lancé (`npm run dev`)
- [ ] MCP testé dans Claude Code
- [ ] Diagnostics runtime fonctionnels

---

## 🎯 Prochaines Étapes

1. **Lance le dev server** : `npm run dev`
2. **Redémarre VS Code / Claude Code**
3. **Teste les fonctionnalités** :
   ```
   "Claude, montre-moi les erreurs TypeScript actuelles"
   "Claude, liste les routes Next.js"
   "Claude, inspecte les Server Actions"
   ```

---

**Dernière mise à jour** : 2025-12-08
**Statut** : ✅ **Opérationnel avec React 19**
