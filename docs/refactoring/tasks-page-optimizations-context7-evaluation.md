# Évaluation Context7 - Optimisations Page Tâches

## 📊 Synthèse de l'Évaluation

Évaluation des optimisations proposées avec Context7 (Next.js et React) pour valider leur alignement avec les meilleures pratiques officielles.

---

## ✅ Optimisations Validées par Context7

### 1. **Pattern filterKey avec useRef** ⭐⭐⭐ (VALIDÉ)

**Contexte Context7 :**
- React recommande d'utiliser `useRef` pour stabiliser les valeurs entre les renders
- React : "The `ref` object is intentionally omitted from the dependency array because `useRef` provides a stable identity"
- Pattern standard pour éviter les dépendances instables dans `useEffect`

**Recommandation :**
- ✅ **VALIDÉ** - Le pattern `filterKey` avec `useRef` est une excellente pratique React
- ✅ Permet d'éviter les rechargements inutiles en comparant les valeurs précédentes
- ✅ Réduit les appels API superflus

**Pattern recommandé :**
```typescript
const prevFilterKeyRef = useRef<string | null>(null);

useEffect(() => {
  const filterKeyChanged = prevFilterKeyRef.current !== filterKey;
  if (filterKeyChanged) {
    // Réinitialiser uniquement si nécessaire
    prevFilterKeyRef.current = filterKey;
  }
}, [filterKey]);
```

---

### 2. **Fusion sans Doublons** ⭐⭐⭐ (VALIDÉ)

**Contexte Context7 :**
- React recommande de gérer les doublons lors de la fusion d'états
- Les tableaux doivent être traités avec attention pour éviter les références dupliquées
- Les Set/Map sont optimisés pour les vérifications de doublons

**Recommandation :**
- ✅ **VALIDÉ** - La fonction `mergeTasksWithoutDuplicates` est essentielle
- ✅ Utilise `Set` pour une vérification efficace (O(1) vs O(n))
- ✅ Protège contre les problèmes réseau (retries, timeouts)

**Pattern recommandé :**
```typescript
function mergeWithoutDuplicates<T extends { id: string }>(
  existing: T[],
  newItems: T[]
): T[] {
  const existingIds = new Set(existing.map(item => item.id));
  const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
  return [...existing, ...uniqueNewItems];
}
```

---

### 3. **useStableSearchParams au lieu de useSearchParams direct** ⭐⭐ (VALIDÉ)

**Contexte Context7 :**
- Next.js : "You can listen for page changes by composing other Client Component hooks like `usePathname` and `useSearchParams`. These hooks allow you to detect navigation events."
- Next.js : Recommande d'utiliser `useSearchParams` avec `useEffect` et des dépendances appropriées
- Le hook `useStableSearchParams` personnalisé existe déjà dans le projet et utilise `useMemo` pour optimiser

**Recommandation :**
- ✅ **VALIDÉ** - Utiliser `useStableSearchParams` (déjà implémenté dans le projet)
- ✅ Le hook existant utilise `useMemo` pour stabiliser, ce qui est optimal
- ✅ Alternative valide : passer `searchParams` en prop depuis un composant parent (comme dans `useTasksInfiniteLoad`)
- ✅ Si on utilise `useSearchParams` directement, utiliser `useMemo` pour extraire les valeurs

**Alternatives Context7 :**
```typescript
// Option 1 : Hook personnalisé stabilisé (déjà implémenté)
const searchParams = useStableSearchParams();
const search = useMemo(() => searchParams.get('search'), [searchParams]);

// Option 2 : Passer en prop depuis parent (utilisé dans useTasksInfiniteLoad)
function Component({ searchParams }: { searchParams: ReadonlyURLSearchParams }) {
  const search = useMemo(() => searchParams.get('search'), [searchParams]);
}
```

---

### 4. **flushSync pour Mises à Jour Synchrones** ⭐⭐ (VALIDÉ AVEC PRÉCAUTIONS)

**Contexte Context7 :**
- React : "This pattern is useful when integrating with third-party code or browser APIs that expect the DOM to be updated before the next line of code runs. **Excessive use can hurt performance.**"
- React : "This is generally a last resort due to performance implications."
- React recommande `flushSync` pour des cas spécifiques : scroll restoration, intégrations tierces, print handlers

**Recommandation :**
- ⚠️ **VALIDÉ AVEC PRÉCAUTIONS** - `flushSync` est approprié pour la pagination infinie avec scroll restoration
- ✅ Utiliser uniquement dans `loadMore` pour synchroniser les mises à jour avant `scrollIntoView`
- ⚠️ **Ne pas utiliser partout** - seulement pour les cas où la synchronisation DOM est critique
- ✅ Pattern correct : "Synchronize React State Updates with flushSync" pour scroll restoration

**Usage recommandé :**
```typescript
import { flushSync } from 'react-dom';

// ✅ Bon usage : pour scroll restoration
flushSync(() => {
  setTasks(prev => mergeWithoutDuplicates(prev, newTasks));
  setHasMore(data.hasMore);
});
listRef.current.lastChild.scrollIntoView(); // DOM est à jour
```

---

### 5. **Support du Tri via URL** ⭐⭐⭐ (VALIDÉ)

**Contexte Context7 :**
- Next.js App Router recommande de stocker l'état dans l'URL via `searchParams`
- Permet le partage d'URLs, l'historique navigateur, le bookmarking
- Pattern standard pour les filtres et tri dans Next.js

**Recommandation :**
- ✅ **VALIDÉ** - Support du tri via URL est une excellente pratique Next.js
- ✅ URLs partageables avec état complet
- ✅ Cohérence avec les autres pages (Companies)
- ✅ Amélioration UX significative

**Pattern recommandé :**
```typescript
// Dans la page Server Component
const sortParam = searchParams.get('sort');
const sort = parseTaskSort(sortParam); // "column:direction"

// Dans l'URL : /tasks?sort=created_at:desc
```

---

### 6. **Refs pour Stabiliser les Dépendances** ⭐⭐⭐ (VALIDÉ)

**Contexte Context7 :**
- React recommande l'utilisation de `useRef` pour éviter les dépendances instables dans `useEffect`
- React : "The `ref` object is intentionally omitted from the dependency array because `useRef` provides a stable identity"
- Pattern standard pour les callbacks qui ne doivent pas déclencher de re-exécution

**Recommandation :**
- ✅ **VALIDÉ** - Utiliser des refs pour stabiliser les fonctions est une excellente pratique
- ✅ Évite les re-exécutions inutiles de `useEffect`
- ✅ Pattern recommandé par React pour les callbacks

**Pattern recommandé (validé par Context7) :**
```typescript
// Pattern recommandé par React pour stabiliser les fonctions
const filtersRef = useRef({ search, quickFilter });
useEffect(() => {
  filtersRef.current = { search, quickFilter };
}, [search, quickFilter]);

// Utiliser filtersRef.current dans les callbacks (pas besoin de dépendance)
const loadMore = useCallback(async () => {
  const filters = filtersRef.current; // Utilise toujours les dernières valeurs
  // ...
}, [fetchWithRetry]); // Seulement les dépendances vraiment nécessaires
```

---

## ⚠️ Optimisations à Ajuster

### 1. **useEffect avec Dependencies - Double Chargement**

**Contexte Context7 :**
- React : "Writing code resilient to occasional re-running of `useEffect` is a good practice"
- React Strict Mode exécute les effets deux fois en développement (comportement normal)
- Il faut gérer l'idempotence et éviter les effets de bord

**Problème identifié :**
- `useCompaniesInfiniteLoad` appelle `refresh()` dans un `useEffect` qui peut s'exécuter même après un changement de page
- Cela cause un double chargement : données initiales + refresh()

**Solution Context7 :**
- React : Utiliser des refs pour comparer les valeurs précédentes et éviter les exécutions inutiles
- Pattern recommandé : comparer avec `prevFilterKeyRef` avant de réinitialiser

```typescript
// ❌ Pattern actuel (problématique)
useEffect(() => {
  refresh(); // S'exécute même si données déjà à jour
}, [search, quickFilter]);

// ✅ Pattern recommandé (avec filterKey - validé par Context7)
const prevFilterKeyRef = useRef<string | null>(null);
useEffect(() => {
  // Comparer avant de réinitialiser
  if (prevFilterKeyRef.current !== filterKey) {
    prevFilterKeyRef.current = filterKey;
    setTasks(initialTasks); // Utiliser données initiales du Server Component
    setHasMore(initialHasMore);
  }
}, [filterKey, initialTasks, initialHasMore]);
```

---

### 2. **React Compiler et Optimisations Automatiques**

**Contexte Context7 :**
- Next.js 16+ inclut le React Compiler qui optimise automatiquement la mémorisation
- `useMemo` et `useCallback` peuvent être moins nécessaires avec le compiler
- Mais le pattern avec refs reste valide même avec le compiler

**Recommandation :**
- ✅ Les optimisations manuelles (refs, filterKey) restent valides
- ✅ Le React Compiler ne remplace pas la logique métier (détection de changements)
- ✅ Continuer à utiliser les patterns recommandés même avec le compiler activé

---

## 📋 Recommandations Finales Validées par Context7

### Priorité Haute ⭐⭐⭐

1. ✅ **Implémenter pattern filterKey dans useCompaniesInfiniteLoad**
   - Utiliser `useRef` pour tracker `prevFilterKeyRef` (validé par React)
   - Comparer avant de réinitialiser (best practice React)
   - Éviter le double chargement

2. ✅ **Ajouter fusion sans doublons**
   - Créer `mergeCompaniesWithoutDuplicates`
   - Utiliser `Set` pour performance optimale (O(1))
   - Protéger contre les doublons réseau

3. ✅ **Ajouter support du tri via URL**
   - Créer `TaskSortColumn` et `parseTaskSort`
   - Ajouter dans `searchParams` (standard Next.js)
   - Transmettre au service serveur

### Priorité Moyenne ⭐⭐

4. ✅ **Utiliser flushSync pour loadMore (avec modération)**
   - Seulement dans la fonction `loadMore`
   - Pour scroll restoration (cas d'usage validé par React)
   - ⚠️ Ne pas utiliser partout (performance)

5. ✅ **Utiliser useStableSearchParams (déjà implémenté)**
   - Le hook existe déjà dans le projet
   - Sinon, passer `searchParams` en prop depuis le parent (comme dans `useTasksInfiniteLoad`)
   - Alternative : utiliser `useMemo` pour extraire les valeurs depuis `useSearchParams`

### Priorité Basse ⭐

6. ✅ **Ajouter total au retour de useTasksInfiniteLoad**
   - Pour cohérence avec useCompaniesInfiniteLoad
   - Améliore l'UX (affichage du total)

---

## 🎯 Conclusion de l'Évaluation Context7

**Toutes les optimisations proposées sont VALIDÉES par Context7** et alignées avec les meilleures pratiques Next.js/React :

✅ **Pattern filterKey** : Excellente pratique React avec useRef (validé)  
✅ **Fusion sans doublons** : Nécessaire pour la robustesse (Set optimisé)  
✅ **Support tri via URL** : Standard Next.js App Router (validé)  
✅ **flushSync** : Approprié pour scroll restoration, à utiliser avec modération  
✅ **Refs pour stabilité** : Recommandé par React pour éviter dépendances instables  

**Points d'attention Context7 :**
- ⚠️ `flushSync` : Utiliser avec modération (seulement pour scroll restoration)
- ✅ `useRef` pour filterKey : Pattern validé par React
- ✅ `useStableSearchParams` : Hook déjà implémenté, optimal

**Recommandation principale :**  
Implémenter les optimisations prioritaires (1, 2, 3) dans `useCompaniesInfiniteLoad` pour aligner avec `useTasksInfiniteLoad` et garantir des performances optimales et cohérentes, conformes aux meilleures pratiques React/Next.js.

