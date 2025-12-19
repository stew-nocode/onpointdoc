# Audit des Règles Obsoletes - master.mdc

> **Date :** 2025-12-19  
> **Objectif :** Identifier les fichiers de règles obsolètes ou redondants dans `.cursor/rules/`

## 📊 État des Lieux

### Fichiers référencés dans master.mdc ✅

| Fichier | Statut | Priorité | Note |
|---------|--------|----------|------|
| `user-flow.mdc` | ✅ Actif | 2 | Référencé dans rule-mapping |
| `project-structure.mdc` | ✅ Actif | 2 | Référencé dans rule-mapping |
| `prd.mdc` | ✅ Actif | 1 | Référencé dans rule-mapping |
| `tech-stack.mdc` | ✅ Actif | 2 | Référencé dans rule-mapping |
| `schema-design.mdc` | ✅ Actif | 1 | Référencé dans rule-mapping |
| `conventions-base-donnees-supabase.mdc` | ✅ Actif | - | Référencé dans rule-mapping |
| `workflow-tickets-automatisation.mdc` | ✅ Actif | 2 | Référencé dans rule-mapping |
| `style-guide.mdc` | ✅ Actif | 2 | Référencé dans rule-mapping |
| `architecture-frontend-interface-utilisateur.mdc` | ✅ Actif | 2 | Référencé dans rule-mapping |
| `typescript-patterns-essential.mdc` | ✅ Actif | 1 | Référencé dans rule-mapping |
| `development-methodology.mdc` | ✅ Actif | - | Référencé dans master.mdc |
| `mcp-methodology-mandatory.mdc` | ✅ Actif | 1 | Référencé dans master.mdc |

### Fichiers existants NON référencés dans master.mdc ⚠️

| Fichier | Statut | Priorité | Recommandation |
|---------|--------|----------|----------------|
| `clean-code-methodology.mdc` | ⚠️ Non référencé | 1 | **À AJOUTER** - Règle importante |
| `ui-patterns.mdc` | ⚠️ Non référencé | - | **À AJOUTER** - Patterns UI (infinite scroll) |
| `context-general.mdc` | 🔴 OBSOLÈTE | 4 | **À SUPPRIMER** - Contenu dupliqué |
| `contexte-philosophie-du-projet.mdc` | 🔴 OBSOLÈTE | - | **À SUPPRIMER** - Redondant avec context-general |
| `qualite-de-code-typage-modularite.mdc` | 🔴 OBSOLÈTE | - | **À SUPPRIMER** - Redondant avec clean-code-methodology |
| `development-methodology-command.md` | 🟡 Optionnel | - | **À CONSERVER** (aide-mémoire, pas une règle) |

---

## 🔴 Fichiers OBSOLÈTES à SUPPRIMER

### 1. `qualite-de-code-typage-modularite.mdc` ❌

**Raison :** Contenu TOTALEMENT redondant avec `clean-code-methodology.mdc`

**Contenu actuel :**
```markdown
Tout module doit être fortement typé (TypeScript), utiliser Zod pour les schémas, éviter le code spaghetti.  
Les fonctions exportées doivent être documentées, les modules petits et focalisés.  
Respecter les principes SOLID, ne pas imbriquer la logique métier dans les composants UI.  
Les modifications majeures doivent inclure tests unitaires ou e2e selon contexte.
```

**Remplacement :** `clean-code-methodology.mdc` couvre tout cela de manière beaucoup plus détaillée avec :
- Principes SOLID expliqués
- Standards de code détaillés
- Gestion d'erreur
- Validation Zod
- Types explicites
- etc.

**Action :** **SUPPRIMER** ce fichier

---

### 2. `context-general.mdc` ❌

**Raison :** 
- Fichier très long (1007 lignes) contenant beaucoup de duplication
- Contenu dupliqué dans `prd.mdc`, `tech-stack.mdc`, `style-guide.mdc`, etc.
- Semble être un ancien fichier "tout-en-un" remplacé par des fichiers spécialisés
- Priorité 4 (la plus basse) mais marqué `alwaysApply: true` → conflit
- Non référencé dans `master.mdc`

**Action :** **SUPPRIMER** ce fichier (contenu déjà présent dans les autres règles)

---

### 3. `contexte-philosophie-du-projet.mdc` ❌

**Raison :**
- Très court (12 lignes)
- Redondant avec le début de `context-general.mdc`
- Même contenu sur la description du projet déjà présent dans plusieurs autres fichiers

**Contenu actuel :**
```markdown
Le projet «OnpointDoc» est une application web full-stack (Next.js + TypeScript + Tailwind + ShadCN UI) avec backend via Supabase (DB/Auth/Storage) et automatisation via N8N + JIRA.  
Les objectifs principaux : gestion des tickets (BUG/REQ/Assistance), activités & tâches, dashboards managériaux pour les DG/DAF.  
Les choix technologiques, la modularité, la lisibilité, l'automatisation et la structuration doivent guider **tous** les développements.
```

**Remplacement :** Ce contenu est déjà présent dans :
- `tech-stack.mdc`
- `prd.mdc`
- Et d'autres fichiers

**Action :** **SUPPRIMER** ce fichier

---

## ⚠️ Fichiers IMPORTANTS non référencés - À AJOUTER

### 1. `clean-code-methodology.mdc` ⚠️

**Problème :** N'est PAS référencé dans `master.mdc` alors qu'il est marqué `priority: 1` et `alwaysApply: true`

**Contenu :** Méthodologie Clean Code complète avec :
- Principes SOLID, DRY, KISS, YAGNI
- Standards de code (100 lignes max composants, 20 lignes max fonctions)
- Gestion d'erreur
- Validation Zod
- Clean Architecture

**Recommandation :** **AJOUTER** dans `master.mdc` section `rule-mapping` :
```
- clean-code-methodology.mdc → méthodologie Clean Code (OBLIGATOIRE)
```

---

### 2. `ui-patterns.mdc` ⚠️

**Problème :** N'est PAS référencé dans `master.mdc`

**Contenu :** Patterns UI importants :
- Infinite scroll obligatoire pour tous les tableaux
- Pas de pagination avec boutons
- Structure standardisée

**Recommandation :** **AJOUTER** dans `master.mdc` section `rule-mapping` :
```
- ui-patterns.mdc → patterns UI (infinite scroll, etc.)
```

---

## 🟡 Fichiers OPTIONNELS

### `development-methodology-command.md` 🟡

**Statut :** Aide-mémoire, pas vraiment une règle

**Contenu :** Commandes à utiliser pour forcer l'agent à suivre la méthodologie

**Recommandation :** **CONSERVER** (utile comme documentation, mais pas une règle active)

---

## 📋 Plan d'Action Recommandé

### Phase 1 : Supprimer les fichiers obsolètes

1. ✅ Supprimer `qualite-de-code-typage-modularite.mdc`
2. ✅ Supprimer `context-general.mdc`
3. ✅ Supprimer `contexte-philosophie-du-projet.mdc`

### Phase 2 : Mettre à jour master.mdc

1. ✅ Ajouter `clean-code-methodology.mdc` dans `rule-mapping`
2. ✅ Ajouter `ui-patterns.mdc` dans `rule-mapping`

### Phase 3 : Vérification

1. ✅ Vérifier qu'aucun fichier ne référence les fichiers supprimés
2. ✅ Tester que les règles fonctionnent toujours correctement

---

## 📊 Résumé des Actions

| Action | Fichier | Raison |
|--------|---------|--------|
| **SUPPRIMER** | `qualite-de-code-typage-modularite.mdc` | Redondant avec `clean-code-methodology.mdc` |
| **SUPPRIMER** | `context-general.mdc` | Contenu dupliqué dans plusieurs fichiers spécialisés |
| **SUPPRIMER** | `contexte-philosophie-du-projet.mdc` | Redondant avec d'autres fichiers |
| **AJOUTER** | `clean-code-methodology.mdc` → master.mdc | Règle importante non référencée |
| **AJOUTER** | `ui-patterns.mdc` → master.mdc | Patterns UI importants |

---

## ✅ Validation

- [x] Analyse complète des fichiers
- [x] Identification des redondances
- [x] Recommandations documentées
- [ ] Suppression des fichiers obsolètes (à faire)
- [ ] Mise à jour de master.mdc (à faire)
- [ ] Test après modifications (à faire)

---

**Dernière mise à jour :** 2025-12-19

