# Convention de Commits - OnpointDoc

Nous utilisons les **Conventional Commits** pour garantir la cohérence et faciliter l'automatisation.

## 📋 Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Exemple

```
feat(tickets): ajout infinite scroll pour la liste des tickets

Implémente un scroll infini avec Intersection Observer pour améliorer 
les performances lors du chargement des tickets.

Closes #123
```

## 🏷️ Types

| Type | Description | Exemple |
|------|-------------|---------|
| `feat` | Nouvelle fonctionnalité | `feat: ajout formulaire création ticket` |
| `fix` | Correction de bug | `fix: correction erreur TypeScript relations Supabase` |
| `docs` | Documentation uniquement | `docs: mise à jour guide TypeScript patterns` |
| `style` | Formatage (pas de changement de code) | `style: formatage avec Prettier` |
| `refactor` | Refactoring sans changement fonctionnel | `refactor: extraction logique métier dans service` |
| `perf` | Amélioration de performance | `perf: optimisation requêtes Supabase avec cache` |
| `test` | Ajout/modification de tests | `test: ajout tests unitaires service tickets` |
| `chore` | Tâches de maintenance | `chore: mise à jour dépendances npm` |
| `ci` | Changements CI/CD | `ci: ajout GitHub Actions workflow` |
| `build` | Changements système de build | `build: configuration Vercel` |
| `revert` | Revert d'un commit précédent | `revert: revert "feat: ajout feature X"` |

## 📍 Scope (Optionnel)

Le scope indique la partie de l'application affectée :

- `tickets` : Gestion des tickets
- `activities` : Gestion des activités
- `tasks` : Gestion des tâches
- `auth` : Authentification
- `dashboard` : Tableaux de bord
- `ui` : Composants UI
- `api` : Routes API
- `db` : Base de données / migrations
- `deps` : Dépendances

### Exemples avec scope

```
feat(tickets): ajout filtre par statut
fix(api): correction validation Zod route tickets
docs(workflow): mise à jour guide déploiement
refactor(services): extraction logique métier
```

## ✏️ Subject (Sujet)

- **Première ligne** : Maximum 72 caractères
- **Commence par une minuscule** (sauf si nom propre)
- **Pas de point final**
- **Temps présent** ("ajoute" pas "ajouté")
- **Impératif** ("fix" pas "fixes" ou "fixed")

### ❌ Mauvais

```
fix: Correction du bug.
feat: Ajout d'une nouvelle fonctionnalité pour les tickets
fix: fixes bug in dashboard
```

### ✅ Bon

```
fix: correction bug dashboard statistiques
feat: ajout filtre par date pour les tickets
fix: correction erreur affichage nom utilisateur
```

## 📄 Body (Optionnel)

- Expliquer **pourquoi** et **comment** (pas le "quoi" qui est dans le subject)
- Séparer du subject par une ligne vide
- Utiliser l'impératif, temps présent

### Exemple

```
fix(api): correction validation email route auth

La validation Zod utilisait une regex incorrecte qui rejetait 
les emails avec caractères spéciaux. Remplacement par la validation 
native Zod email().

Impact: Les utilisateurs avec emails comme "user+tag@example.com" 
pouvaient maintenant s'inscrire.
```

## 🔗 Footer (Optionnel)

Pour référencer des issues GitHub :

```
Closes #123
Fixes #456
Refs #789
```

### Exemple

```
feat(tickets): ajout export CSV liste tickets

Implémente l'export CSV avec bibliothèque papaparse.

Closes #42
```

## ✅ Exemples Complets

### Feature (Format standard)

```
feat(tickets): ajout pagination infinite scroll

Remplace la pagination traditionnelle par un scroll infini 
utilisant Intersection Observer pour améliorer l'UX.

Closes #123
```

### Feature (Format avec Claude Code - Si généré par IA)

```
feat(tickets): ajout pagination infinite scroll

Remplace la pagination traditionnelle par un scroll infini 
utilisant Intersection Observer pour améliorer l'UX.

- Implémentation Intersection Observer
- Optimisation performance avec debounce
- Ajout indicateur de chargement

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

Closes #123
```

**Note** : Si le code est généré ou fortement assisté par Claude Code, inclure les lignes "🤖 Generated with Claude Code" et "Co-Authored-By" pour traçabilité.

### Fix

```
fix(api): correction gestion erreurs Supabase

Les erreurs Supabase n'étaient pas correctement catchées dans 
la route API /api/tickets, causant des erreurs 500.

Impact: Les erreurs sont maintenant correctement formatées avec 
ApplicationError.

Fixes #456
```

### Refactor

```
refactor(services): extraction logique métier tickets

Extrait la logique métier des composants vers le service 
src/services/tickets/index.ts pour respecter Clean Architecture.

Aucun changement fonctionnel.
```

### Docs

```
docs: mise à jour guide TypeScript patterns

Ajout de nouvelles règles pour les relations Supabase et les 
type predicates avec flatMap.
```

### Chore

```
chore(deps): mise à jour Next.js vers 16.0.5

Mise à jour des dépendances pour corriger les vulnérabilités 
de sécurité.
```

## 🔍 Validation

### Vérifier avant commit

```bash
# Vérifier le format
git log --oneline

# Vérifier les derniers commits
git log --format="%s" -10
```

### Script de validation (optionnel)

Vous pouvez utiliser des outils comme :
- **commitlint** : Validation automatique des messages
- **husky** : Git hooks pour validation pré-commit

---

## 📚 Références

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Message Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Workflow Déploiement](.cursor/rules/deployment-workflow-vercel.mdc)

