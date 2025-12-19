# 🚀 Plan de Refactoring Progressif - Page Tickets

## Objectif
Optimiser la page tickets **sans tout détruire**, en suivant les meilleures pratiques Next.js 16+.

## 📋 Stratégie : Refactoring Incrémental

### Principe : Une étape à la fois, testée à chaque fois

---

## ✅ Phase 1 : Extraire la Server Action (Sans risque) ✅ COMPLÉTÉE

### Étape 1.1 : Créer le fichier d'actions

**Fichier** : `src/app/(main)/gestion/tickets/actions.ts`

✅ Server Action `createTicketAction` créée et extraite du composant Server.

### Étape 1.2 : Modifier la page pour utiliser l'action

✅ La page utilise maintenant directement `createTicketAction` au lieu d'une fonction inline.

**✅ Résultat** : Fonction stable (pas recréée à chaque recompilation)

---

## ✅ Phase 2 : Optimiser router.refresh() (Impact élevé) ✅ COMPLÉTÉE

### Ce qui a été fait :

1. ✅ **Server Action `updateTicketAction` créée**
   - Remplace l'API route `/api/tickets/${ticketId}` 
   - Utilise directement le service `updateTicket`
   - Applique `revalidatePath()` pour les pages concernées

2. ✅ **`ticket-edit-form.tsx` optimisé**
   - Utilise maintenant `updateTicketAction` (Server Action)
   - `router.refresh()` supprimé (remplacé par `revalidatePath()` dans la Server Action)
   - Code conforme aux principes Clean Code (SRP, documentation)

3. ✅ **Vérification complète**
   - Tous les composants utilisent maintenant des Server Actions
   - Tous les `router.refresh()` sont remplacés par `revalidatePath()` côté serveur
   - Aucun appel API route intermédiaire pour les actions de tickets

### Server Actions disponibles :

| Action | Service | Pages revalidées |
|--------|---------|------------------|
| `createTicketAction` | `createTicket` | `/gestion/tickets` |
| `updateTicketAction` | `updateTicket` | `/gestion/tickets/{id}`, `/gestion/tickets` |
| `validateTicketAction` | `validateTicket` | `/gestion/tickets` |
| `addCommentAction` | `createComment` | `/gestion/tickets` |
| `transferTicketAction` | `transferTicketToJira` | `/gestion/tickets/{id}`, `/gestion/tickets` |

**✅ Résultat** : 
- Pas de recompilations inutiles côté client
- Meilleure performance (appels directs au serveur)
- Code plus maintenable et testable

---

## ✅ Phase 3 : Stabiliser searchParams (Impact élevé) ✅ COMPLÉTÉE

### Ce qui a été fait :

1. ✅ **Création de `src/lib/utils/search-params.ts`** (Standards Senior)
   - Fonction `getCachedSearchParams()` utilisant React `cache()`
   - Fonction `stabilizeSearchParams()` pour normaliser les params
   - Utilitaires `createSearchParamsCacheKey()` et `areSearchParamsEqual()`
   - Documentation JSDoc complète avec exemples
   - Types explicites partout (Type-safe)

2. ✅ **Optimisation de `page.tsx`**
   - Utilisation de `getCachedSearchParams()` pour mémoriser la résolution
   - Stabilisation des searchParams avec `stabilizeSearchParams()`
   - Extraction des paramètres dans des variables typées
   - Code conforme aux standards Next.js 16+ de niveau senior

### Principes Clean Code appliqués :

- ✅ **SRP** : Chaque fonction a une responsabilité unique
- ✅ **Fonctions pures** : Pas d'effets de bord
- ✅ **Type-safe** : Types explicites partout
- ✅ **Documentation** : JSDoc complète avec exemples
- ✅ **Optimisations** : Utilisation de `cache()` pour éviter les recompilations

**✅ Résultat** :
- Réduction des recompilations lors des changements de filtres
- Code maintenable et testable
- Performance optimisée avec mémorisation

**✅ Test** : Vérifier que les changements de filtres ne causent plus de recompilations inutiles

---

## ✅ Phase 4 : Optimiser noStore() (Impact élevé) ✅ COMPLÉTÉE (Adaptée)

### ⚠️ Important : Limitation Next.js découverte

**Problème :** Les tickets dépendent de `cookies()` (authentification), ce qui est incompatible avec `unstable_cache()`.

**Erreur Next.js :**
```
Route used cookies() inside a function cached with unstable_cache().
Accessing Dynamic data sources inside a cache scope is not supported.
```

### Solution appliquée

#### ✅ `noStore()` conservé pour les tickets

**Raison :** Les tickets sont des données dynamiques qui :
- Dépendent de `cookies()` pour l'authentification
- Utilisent RLS (Row Level Security) - chaque utilisateur voit des tickets différents
- Changent en temps réel (statuts, commentaires, etc.)

```typescript
async function loadInitialTickets(...) {
  // ✅ noStore() nécessaire : tickets dépendent de cookies() (authentification)
  // Impossible d'utiliser unstable_cache() avec cookies() selon Next.js
  noStore();
  
  return await listTicketsPaginated(...);
}
```

#### ✅ `revalidatePath()` dans les Server Actions

Toutes les Server Actions utilisent `revalidatePath()` pour invalider immédiatement après modifications :

```typescript
export async function createTicketAction(...) {
  await createTicket(...);
  revalidatePath('/gestion/tickets'); // ✅ Mise à jour immédiate
  return created.id;
}
```

### 📚 Documentation

Voir `docs/refactoring/phase4-cache-tickets-explanation.md` pour l'explication complète.

**✅ Résultat :** Code conforme aux limitations Next.js, sans erreurs, avec les optimisations appropriées.

**✅ Test** : Vérifier que les tickets se chargent toujours correctement

---

## ✅ Phase 5 : Simplifier TicketsInfiniteScroll (Impact très élevé) ⏳ EN COURS (58.3%)

### 📊 Analyse Complète

**Voir** : `docs/refactoring/phase5-strategy-analysis.md` pour l'analyse détaillée.

### 📈 Statistiques
- **Lignes initiales** : 1159 lignes (11.6x la limite Clean Code)
- **Lignes actuelles** : 722 lignes (-37.7%)
- **Responsabilités initiales** : 6 responsabilités mélangées
- **Objectif** : Réduire à ~300-400 lignes (-60%)
- **Progression** : 58.3% de l'objectif atteint (437/750 lignes)

### 🎯 Plan de Refactoring en 5 Étapes

#### ✅ Étape 3 : Extraire la gestion du tri ✅ COMPLÉTÉE
- **Fichier** : `src/hooks/tickets/use-tickets-sort.ts` (~168 lignes)
- **Impact** : -60 lignes dans le composant principal
- **Risque** : Faible
- **Complexité** : Faible
- **Documentation** : `docs/refactoring/phase5-step3-completed.md`

#### ✅ Étape 4 : Extraire le rendu d'une ligne de ticket ✅ COMPLÉTÉE
- **Fichier** : `src/components/tickets/tickets-infinite-scroll/ticket-row.tsx` (~310 lignes)
- **Impact** : -284 lignes dans le composant principal
- **Risque** : Faible
- **Complexité** : Faible
- **Documentation** : `docs/refactoring/phase5-step4-completed.md`

#### ✅ Étape 5 : Extraire le rendu de l'en-tête du tableau ✅ COMPLÉTÉE
- **Fichier** : `src/components/tickets/tickets-infinite-scroll/tickets-table-header.tsx` (~180 lignes)
- **Impact** : -93 lignes dans le composant principal
- **Risque** : Faible
- **Complexité** : Faible
- **Documentation** : `docs/refactoring/phase5-step5-completed.md`

#### ✅ Étape 1 : Extraire la logique de chargement des tickets
- **Fichier** : `src/hooks/tickets/use-tickets-infinite-load.ts`
- **Impact** : ~150 lignes en moins
- **Risque** : Moyen
- **Complexité** : Moyenne

#### ✅ Étape 2 : Extraire la gestion du scroll
- **Fichier** : `src/hooks/tickets/use-scroll-restoration.ts`
- **Impact** : ~100 lignes en moins
- **Risque** : Moyen (nécessite tests approfondis)
- **Complexité** : Moyenne

### 📚 Documentation Complète

Voir `docs/refactoring/phase5-strategy-analysis.md` pour :
- Analyse détaillée des responsabilités
- Stratégie de refactoring progressive
- Ordre d'implémentation recommandé
- Critères de succès pour chaque étape

---

## 📊 Ordre d'Implémentation Recommandé

| Phase | Complexité | Impact | Risque | Priorité | Status |
|-------|-----------|--------|--------|----------|--------|
| Phase 1 | Faible | Moyen | Faible | ⭐⭐⭐ | ✅ COMPLÉTÉE |
| Phase 2 | Moyen | Élevé | Moyen | ⭐⭐⭐ | ✅ COMPLÉTÉE |
| Phase 3 | Moyen | Élevé | Faible | ⭐⭐⭐ | ✅ COMPLÉTÉE |
| Phase 4 | Élevé | Élevé | Moyen | ⭐⭐ | ✅ COMPLÉTÉE (corrigée) |
| Phase 5 | Très élevé | Très élevé | Élevé | ⭐ | ⏳ ANALYSÉE - Prêt pour implémentation |

---

## 🧪 Stratégie de Test

### Après chaque phase :

1. **Test manuel** :
   - Créer un ticket ✅
   - Filtrer les tickets ✅
   - Scroller et charger plus ✅
   - Tri des tickets ✅
   - Éditer un ticket ✅

2. **Vérifier les recompilations** :
   - Ouvrir DevTools
   - Observer le bouton Next.js (ne doit pas clignoter en continu)

3. **Vérifier le scroll** :
   - Scroller jusqu'en bas
   - Cliquer "Voir plus"
   - Vérifier que le scroll ne remonte pas

---

## 🔄 Plan de Rollback

Si une phase cause des problèmes :

1. **Git commit avant chaque phase**
   ```bash
   git add .
   git commit -m "Avant Phase X: [description]"
   ```

2. **Rollback rapide**
   ```bash
   git revert HEAD
   ```

3. **Tester la phase suivante** avec les corrections

---

## 📝 Notes Importantes

### ✅ À FAIRE :
- ✅ Une phase à la fois
- ✅ Tester après chaque phase
- ✅ Commiter avant chaque phase
- ✅ Documenter les changements

### ❌ À ÉVITER :
- ❌ Tout changer d'un coup
- ❌ Sauter les tests
- ❌ Modifier plusieurs fichiers en même temps sans test

---

## 🎯 Résultats Attendus

Après toutes les phases :

- ✅ **-80% de recompilations** (grâce à cache() et Server Actions externes)
- ✅ **Scroll stable** (grâce à la simplification du composant)
- ✅ **Performance améliorée** (grâce à la mise en cache)
- ✅ **Code plus maintenable** (grâce à la séparation des responsabilités)

---

## 🚀 Prochaines Étapes

**Phase 3** : Stabiliser les `searchParams` pour éviter les recompilations inutiles lors des changements de filtres.
