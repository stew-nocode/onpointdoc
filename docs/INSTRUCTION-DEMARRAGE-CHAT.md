# Instruction de Démarrage pour Nouveau Chat

## 🎯 Question/Instruction à Poser au Début de Chaque Nouveau Chat

Copier-coller cette instruction au début de chaque nouveau chat pour garantir que l'IA prend en compte toutes les règles de développement :

---

```
⚠️ INSTRUCTION IMPORTANTE - LIRE AVANT TOUT ⚠️

Avant de commencer, je dois m'assurer que tu prends en compte toutes les règles de développement du projet OnpointDoc.

PRIORITÉ ABSOLUE - Lis et applique STRICTEMENT :

1. **Workflow de Déploiement** :
   - Lire : docs/WORKFLOW-DEPLOIEMENT-PRODUCTION.md
   - Processus en 10 étapes OBLIGATOIRE
   - JAMAIS de push direct sur main/staging
   - TOUJOURS merger avec --no-ff
   - Tests DEV → STAGING → PRODUCTION obligatoires

2. **Règles TypeScript Essentielles** :
   - Lire : .cursor/rules/typescript-patterns-essential.mdc
   - Relations Supabase : TOUJOURS gérer Array OU Object
   - Type predicates : Utiliser flatMap + type local
   - Zod schemas : JAMAIS .default([]) avec .optional()
   - Error handling : TOUJOURS createError.method()
   - Types async : Utiliser Awaited<>
   - 0 erreurs TypeScript tolérées

3. **Clean Code Methodology** :
   - Lire : .cursor/rules/clean-code-methodology.mdc
   - Principes SOLID, DRY, KISS, YAGNI
   - Composants < 100 lignes, fonctions < 20 lignes
   - Pas de logique métier dans composants UI

4. **Règles Maîtres** :
   - Lire : .cursor/rules/master.mdc
   - Utiliser MCP systématiquement (Next.js, Supabase, ShadCN)
   - Suivre development-methodology.mdc
   - Architecture : services/, hooks/, components/

5. **Convention de Commits** :
   - Lire : .github/COMMIT_CONVENTION.md
   - Format : type(scope): description
   - Si généré par Claude : inclure template Claude Code

✅ Confirme-moi que tu as lu ces documents et que tu les appliqueras STRICTEMENT pour ce chat.
```

---

## 📋 Version Courte (Si Chat Déjà Initialisé)

Si tu as déjà initialisé le chat et que tu veux juste rappeler les règles importantes :

```
Rappel important : Respecte STRICTEMENT :
- Workflow 10 étapes : docs/WORKFLOW-DEPLOIEMENT-PRODUCTION.md
- Règles TypeScript : .cursor/rules/typescript-patterns-essential.mdc
- Clean Code : .cursor/rules/clean-code-methodology.mdc
- 0 erreurs TypeScript avant commit/build
```

---

## 🔍 Vérification

Après avoir posé la question, l'IA devrait :

1. ✅ Confirmer avoir lu les documents
2. ✅ Résumer les règles clés (workflow, TypeScript, Clean Code)
3. ✅ Indiquer qu'elle appliquera ces règles strictement
4. ✅ Demander confirmation avant de commencer

Si l'IA ne confirme pas clairement, **répéter l'instruction** ou **référencer directement les fichiers**.

---

## 📚 Documents de Référence Rapide

### Workflow & Déploiement
- `docs/WORKFLOW-DEPLOIEMENT-PRODUCTION.md` - ⭐ **Processus en 10 étapes OBLIGATOIRE**
- `.cursor/rules/deployment-workflow-vercel.mdc` - Workflow Vercel
- `.github/BRANCH-STRATEGY.md` - Stratégie des branches

### Qualité de Code
- `.cursor/rules/typescript-patterns-essential.mdc` - ⭐ **Règles TypeScript OBLIGATOIRES**
- `.cursor/rules/clean-code-methodology.mdc` - ⭐ **Clean Code OBLIGATOIRE**
- `.cursor/rules/eslint-patterns.mdc` - ⭐ **Règles ESLint OBLIGATOIRES**
- `docs/TYPESCRIPT-QUICK-RULES.md` - Référence rapide TypeScript
- `docs/ESLINT-GUIDE.md` - Guide ESLint complet

### Méthodologie
- `.cursor/rules/master.mdc` - ⭐ **Règles maîtres**
- `.cursor/rules/development-methodology.mdc` - Méthodologie de développement
- `.cursor/rules/mcp-methodology-mandatory.mdc` - Méthodologie MCP

### Documentation
- `.github/COMMIT_CONVENTION.md` - Convention de commits
- `.github/PULL_REQUEST_TEMPLATE.md` - Template PR
- `docs/TYPESCRIPT-PATTERNS-GUIDE.md` - Guide TypeScript complet

---

## 💡 Exemple d'Utilisation

### Au Début d'un Nouveau Chat

**Toi** :
```
⚠️ INSTRUCTION IMPORTANTE - LIRE AVANT TOUT ⚠️

Avant de commencer, je dois m'assurer que tu prends en compte toutes les règles de développement du projet OnpointDoc.

PRIORITÉ ABSOLUE - Lis et applique STRICTEMENT :

1. **Workflow de Déploiement** :
   - Lire : docs/WORKFLOW-DEPLOIEMENT-PRODUCTION.md
   - Processus en 10 étapes OBLIGATOIRE
   - JAMAIS de push direct sur main/staging
   - TOUJOURS merger avec --no-ff
   - Tests DEV → STAGING → PRODUCTION obligatoires

2. **Règles TypeScript Essentielles** :
   - Lire : .cursor/rules/typescript-patterns-essential.mdc
   - Relations Supabase : TOUJOURS gérer Array OU Object
   - Type predicates : Utiliser flatMap + type local
   - Zod schemas : JAMAIS .default([]) avec .optional()
   - Error handling : TOUJOURS createError.method()
   - Types async : Utiliser Awaited<>
   - 0 erreurs TypeScript tolérées

3. **Clean Code Methodology** :
   - Lire : .cursor/rules/clean-code-methodology.mdc
   - Principes SOLID, DRY, KISS, YAGNI
   - Composants < 100 lignes, fonctions < 20 lignes
   - Pas de logique métier dans composants UI

4. **Règles Maîtres** :
   - Lire : .cursor/rules/master.mdc
   - Utiliser MCP systématiquement (Next.js, Supabase, ShadCN)
   - Suivre development-methodology.mdc
   - Architecture : services/, hooks/, components/

5. **Convention de Commits** :
   - Lire : .github/COMMIT_CONVENTION.md
   - Format : type(scope): description
   - Si généré par Claude : inclure template Claude Code

✅ Confirme-moi que tu as lu ces documents et que tu les appliqueras STRICTEMENT pour ce chat.

Je veux maintenant [ta tâche ici]
```

**Réponse attendue de l'IA** :
```
✅ Confirmation - J'ai lu et compris toutes les règles importantes :

1. ✅ Workflow en 10 étapes : feature → develop (--no-ff) → staging (--no-ff) → PR main
2. ✅ Règles TypeScript : Relations Supabase (Array/Object), flatMap, createError.method(), Awaited<>
3. ✅ Clean Code : SOLID, DRY, composants < 100 lignes, fonctions < 20 lignes
4. ✅ Architecture : services/ (logique métier), hooks/, components/ (UI uniquement)
5. ✅ Commits : Format conventionnel avec template Claude si applicable

Je vais appliquer ces règles STRICTEMENT. Comment puis-je t'aider avec [ta tâche] ?
```

---

## 🎯 Points Clés à Vérifier dans la Réponse

L'IA doit confirmer :
- [x] Workflow en 10 étapes
- [x] Règles TypeScript (relations Supabase, flatMap, etc.)
- [x] Clean Code (SOLID, tailles limites)
- [x] Architecture (services/, hooks/, components/)
- [x] Convention de commits
- [x] Règles ESLint (apostrophes, useEffect, next/image)

Si l'IA omet certains points, **demander confirmation explicite** pour ces points manquants.

---

**Dernière mise à jour** : 2025-12-19

