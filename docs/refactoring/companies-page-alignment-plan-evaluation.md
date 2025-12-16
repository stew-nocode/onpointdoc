# Plan d'Alignement Page Companies - Évaluation Context7

## 📋 Résumé Exécutif

Évaluation du plan d'alignement de la page `/config/companies` avec les patterns standardisés utilisés dans `/gestion/tickets`, `/gestion/activites`, et `/gestion/taches`, en se basant sur les best practices Next.js et React selon Context7.

---

## ✅ Validations Context7

### 1. **Server Components pour Data Fetching** ✅

**Source Context7 :**
> "Server Components allow you to fetch data using any asynchronous I/O operation... You can also use an ORM or database client to make database queries directly since Server Components are rendered on the server, allowing safe database access."

**Recommandation :**
- ✅ Créer `listCompaniesPaginated` comme fonction serveur (pas de Route Handler)
- ✅ Fetcher directement dans la page Server Component
- ✅ Éviter les waterfalls en utilisant `Promise.all()` pour les requêtes parallèles

**Conformité :** ✅ Le plan prévoit bien un service serveur `listCompaniesPaginated` avec pattern identique à `listTasksPaginated`.

---

### 2. **Gestion des searchParams via URL** ✅

**Source Context7 :**
> "This snippet illustrates how to access and destructure URL query string parameters (e.g., `page`, `sort`, `query`) from the `searchParams` prop in a Next.js Page component. This is useful for implementing functionality like filtering, pagination, or sorting based on URL queries."

**Recommandation :**
- ✅ Utiliser `searchParams` prop dans la page Server Component
- ✅ Synchroniser recherche, filtres et tri avec l'URL
- ✅ Client Components utilisent `useSearchParams` + `router.push` pour mise à jour
- ✅ Pattern recommandé : `window.history.pushState` ou `router.push({ scroll: false })`

**Conformité :** ✅ Le plan prévoit :
- `searchParams` dans la page avec `getCachedSearchParams`
- `CompaniesSearchBar` qui synchronise avec l'URL
- Tri via searchParams (`?sort=name&direction=asc`)

---

### 3. **Séparation Server/Client Components** ✅

**Source Context7 :**
> "Server Components are used for static content, data fetching, and SEO-friendly elements, while Client Components are used for interactive elements that require state, effects, or browser APIs. This separation of concerns through component composition enables a clear distinction between server and client logic."

**Recommandation :**
- ✅ Page = Server Component (data fetching)
- ✅ SearchBar = Client Component (state, interactivité)
- ✅ InfiniteScroll/Table = Client Component (scroll, interactions)
- ✅ Passer données via props (serializable)

**Conformité :** ✅ Le plan prévoit :
- Page Server Component qui fetche les données initiales
- Composants Client pour recherche, filtres, affichage
- Passage de données via props

---

### 4. **Infinite Scroll vs Pagination** ⚠️

**Contexte :**
- Les pages tickets/activités/tâches utilisent **infinite scroll**
- La page companies actuelle utilise **pagination client-side**

**Source Context7 :**
> "Streaming allows you to break up the page's HTML into smaller chunks and progressively send those chunks from the server to the client."

**Recommandation :**
- ✅ **Infinite scroll** est préférable pour :
  - Cohérence avec les autres pages
  - Meilleure UX (pas besoin de cliquer sur "page suivante")
  - Streaming progressif possible
  - Meilleur pour mobile
  
- ⚠️ **Pagination serveur** reste acceptable si :
  - Dataset très grand (1000+ items)
  - Besoin de navigation directe vers une page spécifique
  - Performance critique (éviter trop de DOM)

**Décision recommandée :** **Infinite Scroll** pour cohérence, sauf si spécifications métier exigent pagination.

---

### 5. **Pattern de Layout Standardisé** ✅

**Source Context7 :**
> "The React model allows you to deconstruct a page into a series of reusable components. Many components are often reused between pages, such as navigation bars and footers. You can create a Layout component that wraps shared UI elements around page content."

**Recommandation :**
- ✅ Utiliser `PageLayoutWithFilters` ou `PageContent` pour structure standardisée
- ✅ `PageHeaderConfig` et `PageCardConfig` pour configuration déclarative
- ✅ Réutiliser les composants UI standardisés (SearchBar, QuickFilters)

**Conformité :** ✅ Le plan prévoit :
- Remplacement de `Card` par `PageContent` ou `PageLayoutWithFilters`
- Utilisation de `PageHeaderConfig` et `PageCardConfig`
- Composants standardisés `CompaniesSearchBar` et `CompaniesQuickFilters`

---

### 6. **Optimisation des Performances** ✅

**Source Context7 :**
> "A common cause of poor performance occurs when applications make sequential client-server requests to fetch data... Next.js allows you to move data fetching to the server, which often eliminates client-server waterfalls altogether."

**Recommandation :**
- ✅ Data fetching serveur (évite waterfalls)
- ✅ `Promise.all()` pour requêtes parallèles
- ✅ Debounce sur recherche (déjà fait dans `TicketsSearchBar`)
- ✅ `getCachedSearchParams` pour éviter recompilations

**Conformité :** ✅ Le plan prévoit :
- Fetch serveur avec `listCompaniesPaginated`
- Parallélisme pour countries/profiles
- Debounce dans `CompaniesSearchBar` (pattern `TicketsSearchBar`)

---

## 📊 Plan d'Action Final Validé

### ✅ **ÉTAPE 1 : Structure et Layout**
- Remplacer `Card`/`CardHeader` par `PageContent` (pas besoin de sidebar)
- Utiliser `PageHeaderConfig` et `PageCardConfig`
- Standardiser l'en-tête

### ✅ **ÉTAPE 2 : Service Serveur Pagination**
- Créer `src/services/companies/list-companies-paginated.ts`
- Pattern identique à `listTasksPaginated` :
  - Paramètres : `offset`, `limit`, `search`, `quickFilter`, `sort`, `direction`
  - Retour : `{ companies, hasMore, total }`
- Support recherche (ilike sur `name`)
- Support tri (name, country, created_at)

### ✅ **ÉTAPE 3 : Types et Validators**
- Créer `src/types/company-filters.ts` :
  - `CompanyQuickFilter = 'all' | 'with_country' | 'without_country' | ...`
  - `CompanySortColumn = 'name' | 'country' | 'created_at'`
  - `SortDirection = 'asc' | 'desc'`
- Créer `src/types/company-with-relations.ts` :
  - `CompanyWithRelations` (avec country, focal_user, sectors)
  - `CompaniesPaginatedResult`

### ✅ **ÉTAPE 4 : Composants Standardisés**
- **`CompaniesSearchBar`** :
  - Pattern `TicketsSearchBar`
  - Debounce 500ms
  - Synchronisation URL via `router.push`
  - Éviter boucles infinies avec `useRef`
  
- **`CompaniesQuickFilters`** (optionnel mais recommandé) :
  - Tous / Avec pays / Sans pays / Par secteur (si besoin)
  - Synchronisation URL
  
- **`CompaniesInfiniteScroll`** :
  - Pattern `TasksInfiniteScroll`
  - Hook `useCompaniesInfiniteLoad` (pattern `useTasksInfiniteLoad`)
  - Composant `CompanyRow` pour chaque ligne
  - `LoadMoreButton` réutilisé

### ✅ **ÉTAPE 5 : Refactor Page**
- `page.tsx` Server Component :
  - `searchParams` avec `getCachedSearchParams`
  - `loadInitialCompanies` avec gestion d'erreur
  - `Promise.all` pour countries/profiles
  - Utiliser `PageContent` au lieu de `Card`
  - Passer données initiales à `CompaniesInfiniteScroll`

### ✅ **ÉTAPE 6 : Nettoyage Code Mort**
- Supprimer `CompaniesTableClient` (remplacé par `CompaniesInfiniteScroll`)
- Supprimer logique pagination client-side
- Vérifier usage `Pagination` ailleurs avant suppression totale
- Supprimer `sortable-company-table-header.tsx` si plus utilisé

---

## 🎯 Points d'Attention

### 1. **Tri Serveur vs Client**
**Recommandation Context7 :** Tri serveur via searchParams est préférable pour :
- Cohérence avec autres pages
- Performance (éviter charger toutes les données)
- Partagabilité URL

### 2. **QuickFilters pour Companies**
**Suggestion :**
- `all` : Toutes les compagnies
- `with_country` : Avec pays assigné
- `without_country` : Sans pays assigné
- `with_focal` : Avec point focal
- `without_focal` : Sans point focal

### 3. **KPIs Section**
**Optionnel mais recommandé pour cohérence :**
- Total compagnies
- Par pays (top 5)
- Sans point focal (alerte)

---

## 📝 Conformité Clean Code

### ✅ Principes Respectés
- **SRP** : Séparation recherche/filtres/affichage en composants distincts
- **DRY** : Réutilisation patterns existants (SearchBar, InfiniteScroll)
- **Types explicites** : Zod pour validation searchParams
- **Gestion d'erreurs** : `handleApiError` et `createError`
- **Modules < 100 lignes** : Composants atomiques
- **Fonctions < 20 lignes** : Logique découpée

---

## ✅ Validation Finale

**Le plan proposé est ✅ VALIDÉ** selon les best practices Next.js/React documentées dans Context7.

**Prochaines étapes :**
1. Valider avec utilisateur les décisions (infinite scroll vs pagination, quick filters)
2. Commencer implémentation étape par étape
3. Tester chaque étape avant de passer à la suivante

---

**Date :** 2025-12-15  
**Évalué avec :** Context7 MCP (Next.js documentation)  
**Patterns de référence :** `/gestion/tickets`, `/gestion/activites`, `/gestion/taches`
