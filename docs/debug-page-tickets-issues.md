# 🔍 Pourquoi uniquement la page Tickets a des problèmes ?

## Analyse des différences avec les autres pages

### ✅ Autres pages (fonctionnent bien)

1. **Page Activités** (`/gestion/activites/page.tsx`)
   - Composant Server simple
   - Pas de `noStore()`
   - Pas de `searchParams` dynamiques
   - Pas de `router.refresh()`
   - Pas de composant Client complexe

2. **Page Dashboard** (`/dashboard/page.tsx`)
   - Utilise `noStore()` mais seulement une fois
   - Pas de Server Action inline dans le composant
   - Moins de `searchParams` dynamiques
   - Pas de composant d'infinite scroll

### ❌ Page Tickets (problèmes identifiés)

#### 1. **`noStore()` dans loadInitialTickets()**
```typescript
async function loadInitialTickets(...) {
  noStore(); // ❌ Force une recompilation à CHAQUE changement
  // ...
}
```
- **Impact** : Empêche le cache Next.js, force une recompilation complète du Server Component à chaque changement de `searchParams`
- **Solution** : Le `noStore()` est nécessaire pour les données temps réel (tickets), mais c'est ce qui cause les recompilations

#### 2. **Server Action inline dans le Server Component**
```typescript
export default async function TicketsPage({ searchParams }) {
  // ...
  
  async function handleTicketSubmit(values: CreateTicketInput) {
    'use server';
    const created = await createTicket(values);
    return created?.id as string;
  } // ❌ Server Action définie DANS le composant Server
  
  return (
    <CreateTicketDialogLazy onSubmit={handleTicketSubmit} />
  );
}
```
- **Impact** : Chaque recompilation du Server Component recrée cette fonction, ce qui peut déclencher des re-renders côté client
- **Solution** : Déplacer la Server Action dans un fichier séparé

#### 3. **Multiple `router.refresh()` dans les composants enfants**
```typescript
// create-ticket-dialog.tsx
router.refresh(); // ❌ Après création

// add-comment-dialog.tsx  
router.refresh(); // ❌ Après commentaire

// validate-ticket-button.tsx
router.refresh(); // ❌ Après validation

// transfer-ticket-button.tsx
router.refresh(); // ❌ Après transfert
```
- **Impact** : Chaque `router.refresh()` force une recompilation du Server Component, qui à son tour cause un re-render complet
- **Solution** : Optimiser ou remplacer par des mises à jour côté client quand possible

#### 4. **Composant Client très complexe : TicketsInfiniteScroll**
- Plus de 1000 lignes de code
- Beaucoup d'état (useState, useRef)
- Multiple `useEffect`, `useLayoutEffect`, `useMemo`, `useCallback`
- Logique de scroll complexe
- Interactions avec `searchParams` via `router.push()`

#### 5. **Beaucoup de `searchParams` dynamiques**
```typescript
searchParams?: Promise<{
  type?: string;
  status?: string;
  search?: string;
  quick?: QuickFilter;
  sortColumn?: string;
  sortDirection?: string;
}>
```
- **Impact** : Chaque changement d'un paramètre force une recompilation du Server Component
- Les composants Client synchronisent avec ces params, causant des re-renders en cascade

#### 6. **Interactions multiples avec l'URL**
- `TicketsSearchBar` : Change `search` param
- `TicketsQuickFilters` : Change `quick` param
- `TicketsInfiniteScroll` : Change `sortColumn`, `sortDirection` params
- `FiltersSidebarClient` : Change plusieurs params

Chaque changement déclenche :
1. Recompilation Server Component (à cause de `noStore()`)
2. Re-render des composants Client
3. Possibles problèmes de scroll

## 🔧 Solutions recommandées

### Solution 1 : Déplacer la Server Action
```typescript
// ❌ Actuel (inline)
async function handleTicketSubmit(...) { 'use server'; ... }

// ✅ Mieux (fichier séparé)
// src/app/(main)/gestion/tickets/actions.ts
'use server';
export async function createTicketAction(...) { ... }
```

### Solution 2 : Réduire les `router.refresh()`
- Utiliser des mises à jour optimistes côté client
- Mettre à jour l'état local au lieu de recompiler le Server Component

### Solution 3 : Stabiliser les `searchParams`
- Utiliser `useStableSearchParams` (déjà fait ✅)
- Éviter les changements inutiles de params

### Solution 4 : Optimiser le `noStore()`
- Utiliser `noStore()` seulement pour les données critiques
- Mettre en cache les autres données (produits, modules, etc.)

## 📊 Comparaison

| Aspect | Page Tickets | Autres Pages |
|--------|-------------|--------------|
| `noStore()` | ✅ Oui (données temps réel) | ❌ Non ou minimal |
| Server Action inline | ❌ Oui | ❌ Non |
| `router.refresh()` | ❌ 5+ appels | ❌ 0-1 appel |
| Composant Client complexe | ❌ 1000+ lignes | ✅ Simple |
| `searchParams` dynamiques | ❌ 6 params | ✅ 0-2 params |
| Infinite scroll | ❌ Oui | ❌ Non |

## 💡 Conclusion

La page Tickets est **beaucoup plus complexe** que les autres pages :
- Plus de fonctionnalités interactives
- Plus de composants Client
- Plus d'interactions avec l'URL
- Plus de `router.refresh()`

C'est cette **complexité combinée** qui cause les problèmes de recompilation et de scroll, pas un seul facteur.

