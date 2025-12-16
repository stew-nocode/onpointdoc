# Analyse des Optimisations - Page Tâches

## 📊 Comparaison avec la Page Entreprises

Après avoir refactorisé la page Entreprises avec les meilleures pratiques, voici les optimisations possibles pour la page Tâches.

---

## 🔍 Points d'Amélioration Identifiés

### 1. **Support du Tri via URL** ⭐⭐⭐ (PRIORITAIRE)

**Problème actuel :**
- La page Tâches ne supporte pas le tri via `searchParams.sort`
- Le tri doit être géré différemment (probablement côté client uniquement)

**Solution proposée :**
- Ajouter le support du tri dans les `searchParams` comme pour Companies
- Créer/utiliser `TaskSortColumn` et `parseTaskSort` (si n'existent pas déjà)
- Ajouter le paramètre `sort` dans `TasksPageProps`
- Parser et transmettre le tri à `loadInitialTasks`

**Impact :**
- ✅ URLs partageables avec état de tri
- ✅ Cohérence avec la page Entreprises
- ✅ Amélioration UX (historique navigateur, partage)

---

### 2. **Hook useCompaniesInfiniteLoad - Pattern plus sophistiqué** ⭐⭐ (RECOMMANDÉ)

**Différences observées :**

#### useTasksInfiniteLoad (plus sophistiqué) :
- ✅ Utilise `useStableSearchParams` et reçoit `searchParams` en prop (évite les re-renders)
- ✅ Gère `filterKey` pour détecter les changements de filtres efficacement
- ✅ Utilise `flushSync` pour les mises à jour synchrones (meilleure UX)
- ✅ Fusion intelligente sans doublons avec `mergeTasksWithoutDuplicates`
- ✅ Utilise des `refs` pour éviter les dépendances dans `useEffect`
- ✅ Réinitialisation automatique lors des changements de filtres

#### useCompaniesInfiniteLoad (plus simple, mais moins optimisé) :
- ⚠️ Utilise directement `useSearchParams()` dans le hook (peut causer plus de re-renders)
- ⚠️ Pas de `filterKey` pour détecter les changements
- ⚠️ Pas de `flushSync` pour les mises à jour synchrones
- ⚠️ Pas de vérification de doublons lors de la fusion
- ⚠️ `refresh()` appelle toujours l'API même si les filtres n'ont pas changé

**Recommandation :**
- Migrer `useCompaniesInfiniteLoad` vers le pattern de `useTasksInfiniteLoad`
- Ou créer un hook générique réutilisable pour les deux

---

### 3. **Gestion de l'Initial Total** ⭐ (MINEUR)

**Différence :**
- `useTasksInfiniteLoad` ne retourne pas `total`, seulement `hasMore`
- `useCompaniesInfiniteLoad` retourne `total`
- La page Tasks utilise `initialTotal` passé directement au composant

**Recommandation :**
- Ajouter `total` au retour de `useTasksInfiniteLoad` pour cohérence

---

### 4. **Optimisation des Requêtes en Parallèle** ⭐ (MINEUR)

**Page Tasks actuelle :**
```typescript
const [currentProfileId, profiles] = await Promise.all([
  getCachedCurrentUserProfileId(),
  listBasicProfiles(),
]);

const [initialTasksData, kpis] = await Promise.all([
  loadInitialTasks(...),
  getTaskKPIs(currentProfileId)
]);
```

**Note :** C'est déjà bien optimisé, mais `getTaskKPIs` dépend de `currentProfileId`, donc il faut attendre la première Promise.all.

**Optimisation possible :**
- Si `getTaskKPIs` peut être appelé sans `currentProfileId` (ou avec null), on pourrait tout mettre en parallèle
- Sinon, c'est déjà optimal

---

### 5. **Gestion d'Erreur dans le Hook** ⭐⭐ (RECOMMANDÉ)

**Différence :**
- `useTasksInfiniteLoad` : Gestion d'erreur très détaillée avec retry automatique via `useRetryFetch`
- `useCompaniesInfiniteLoad` : Gestion d'erreur basique, mais utilise aussi `useRetryFetch`

**Recommandation :**
- Les deux utilisent `useRetryFetch`, donc c'est cohérent ✅
- Mais `useTasksInfiniteLoad` a une gestion plus fine des erreurs réseau

---

### 6. **Réinitialisation lors des Changements de Filtres** ⭐⭐⭐ (PRIORITAIRE)

**useTasksInfiniteLoad :**
```typescript
// Réinitialiser les tâches quand les filtres changent OU quand initialTasks/initialHasMore changent
const prevFilterKeyRef = useRef<string | null>(null);
// ... logique sophistiquée avec comparaison de filterKey
```

**useCompaniesInfiniteLoad :**
```typescript
// Recharger quand les paramètres de recherche changent
useEffect(() => {
  refresh();
}, [search, quickFilter, sort.column, sort.direction]);
```

**Problème :**
- `useCompaniesInfiniteLoad` appelle `refresh()` à chaque changement de filtre, même si on vient de changer de page et que les données initiales sont déjà à jour
- Cela peut causer un double chargement (initial + refresh)

**Recommandation :**
- Implémenter le pattern `filterKey` dans `useCompaniesInfiniteLoad` comme dans `useTasksInfiniteLoad`
- Réinitialiser uniquement si les filtres ont réellement changé depuis le dernier chargement

---

### 7. **Fusion sans Doublons** ⭐⭐ (RECOMMANDÉ)

**useTasksInfiniteLoad :**
- Utilise `mergeTasksWithoutDuplicates` pour éviter les doublons lors du chargement

**useCompaniesInfiniteLoad :**
- Pas de vérification de doublons
- Si l'API retourne des doublons (problème réseau, etc.), ils seront ajoutés

**Recommandation :**
- Ajouter la fusion sans doublons dans `useCompaniesInfiniteLoad`

---

### 8. **Support du Tri dans l'API Tasks** ⭐⭐ (RECOMMANDÉ)

**Différence :**
- `/api/tasks/list` : Pas de paramètre `sort` dans la route
- `/api/companies/list` : Supporte le paramètre `sort`

**Recommandation :**
- Ajouter le support du tri dans `/api/tasks/list` si besoin
- Créer `TaskSortColumn` et `parseTaskSort` si n'existent pas

---

## 📋 Checklist d'Optimisations Prioritaires

### Priorité Haute ⭐⭐⭐

- [ ] **1. Ajouter le support du tri via URL dans la page Tâches**
  - Ajouter `sort?: string` dans `TasksPageProps`
  - Parser le tri avec `parseTaskSort` (à créer si n'existe pas)
  - Transmettre le tri à `loadInitialTasks` et `listTasksPaginated`

- [ ] **2. Améliorer useCompaniesInfiniteLoad avec le pattern filterKey**
  - Implémenter `filterKey` pour détecter les changements
  - Éviter le double chargement (initial + refresh inutile)
  - Utiliser des refs pour stabiliser les fonctions

### Priorité Moyenne ⭐⭐

- [ ] **3. Ajouter fusion sans doublons dans useCompaniesInfiniteLoad**
  - Créer `mergeCompaniesWithoutDuplicates`
  - Utiliser dans `loadMore`

- [ ] **4. Utiliser flushSync dans useCompaniesInfiniteLoad**
  - Pour de meilleures performances de mise à jour UI

- [ ] **5. Ajouter support du tri dans /api/tasks/list**
  - Si le tri côté serveur est nécessaire

### Priorité Basse ⭐

- [ ] **6. Ajouter total au retour de useTasksInfiniteLoad**
  - Pour cohérence avec useCompaniesInfiniteLoad

- [ ] **7. Optimiser encore plus les requêtes parallèles**
  - Si possible, mettre tout en parallèle

---

## 🎯 Recommandation Principale

**Prioriser l'amélioration de `useCompaniesInfiniteLoad`** pour utiliser le même pattern sophistiqué que `useTasksInfiniteLoad` :

1. Pattern `filterKey` pour éviter les rechargements inutiles
2. Fusion sans doublons
3. Utilisation de `flushSync` pour meilleures performances
4. Refs pour stabiliser les dépendances

Cela garantira une cohérence et des performances optimales entre les deux pages.

