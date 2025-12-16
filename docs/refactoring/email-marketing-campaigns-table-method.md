# Méthode - Tableau de Listing des Campagnes Email Marketing

**Date :** 2025-12-15  
**Objectif :** Créer un tableau avec infinite scroll pour lister les campagnes email Brevo  
**Pattern de référence :** `/gestion/tickets`, `/gestion/activites`, `/gestion/taches`

---

## 📊 Analyse Context7 et Supabase

### Structure de la Table `brevo_email_campaigns`

**Champs principaux :**
- `id` (uuid) - ID Supabase
- `brevo_campaign_id` (bigint) - ID Brevo unique
- `campaign_name` (text) - Nom de la campagne
- `email_subject` (text) - Sujet de l'email
- `status` (text) - 'draft' | 'sent' | 'scheduled' | 'suspended' | 'queued' | 'archive'
- `campaign_type` (text) - 'classic' | 'trigger' | 'automated'
- `created_at`, `updated_at`, `sent_at`, `scheduled_at` (timestamptz)
- `emails_sent`, `open_rate`, `click_rate` (statistiques)
- Index sur : `status`, `sent_at`, `brevo_campaign_id`, `campaign_type`

### Pattern Next.js (Context7)

**Recommandations validées :**
- ✅ Server Component (page) → fetch données initiales
- ✅ API Route Handler (`/api/campaigns/list`) → pagination côté client
- ✅ Hook personnalisé (`useCampaignsInfiniteLoad`) → gestion état et chargement
- ✅ Client Component (InfiniteScroll) → affichage et interactions
- ✅ Utiliser `Promise.all` pour parallélisme
- ✅ Gestion d'erreur avec `handleApiError`

---

## 🎯 Architecture Proposée

### 1. Service : Liste Paginée
**Fichier :** `src/services/email-marketing/list-campaigns-paginated.ts`

**Fonction :** `listCampaignsPaginated()`

**Signature :**
```typescript
export async function listCampaignsPaginated(
  offset: number,
  limit: number,
  search?: string,
  quickFilter?: CampaignQuickFilter,
  sortColumn?: CampaignSortColumn,
  sortDirection?: SortDirection
): Promise<CampaignsPaginatedResult>
```

**Fonctionnalités :**
- Requête Supabase avec `.select('*', { count: 'estimated' })` (optimisation)
- Recherche textuelle sur `campaign_name` et `email_subject` (ilike avec échappement)
- Quick filters (voir ci-dessous)
- Tri par colonne (sent_at DESC par défaut)
- Pagination avec `.range(offset, offset + limit - 1)`
- Calcul `hasMore = offset + limit < total`
- Retourne `{ campaigns, hasMore, total }`
- Gestion d'erreur avec `handleSupabaseError`

**Quick Filters proposés :**
- `all` - Toutes les campagnes
- `sent` - Campagnes envoyées (status = 'sent')
- `draft` - Brouillons (status = 'draft')
- `scheduled` - Planifiées (status = 'scheduled')

**Tri proposé :**
- `sent_at` (par défaut, DESC) - Date d'envoi
- `created_at` - Date de création
- `campaign_name` - Nom (alphabétique)
- `open_rate` - Taux d'ouverture
- `click_rate` - Taux de clic
- `emails_sent` - Nombre d'emails envoyés

---

### 2. API Route
**Fichier :** `src/app/api/campaigns/list/route.ts`

**Pattern identique à :** `/api/tasks/list` et `/api/activities/list`

**Query params :**
- `offset` (number, défaut: 0)
- `limit` (number, défaut: 25)
- `search` (string) - Recherche textuelle
- `quick` (CampaignQuickFilter) - Filtre rapide
- `sortColumn` (string) - Colonne de tri
- `sortDirection` ('asc' | 'desc') - Direction

**Validation :**
- Valider offset >= 0
- Valider limit entre 1 et 100
- Valider quick filter dans la liste valide
- Utiliser `handleApiError` pour gestion d'erreur

---

### 3. Types
**Fichier :** `src/types/campaign-filters.ts` (nouveau)

**Types à créer :**
```typescript
export type CampaignQuickFilter = 
  | 'all'        // Toutes les campagnes
  | 'sent'       // Campagnes envoyées
  | 'draft'      // Brouillons
  | 'scheduled'; // Planifiées

export type CampaignSortColumn =
  | 'sent_at'
  | 'created_at'
  | 'campaign_name'
  | 'open_rate'
  | 'click_rate'
  | 'emails_sent';
```

**Fichier :** `src/types/campaign-sort.ts` (nouveau)

**Types et fonctions :**
- `CampaignSortColumn`
- `SortDirection`
- `CampaignSort`
- `parseCampaignSort()`
- `isValidCampaignSortColumn()`

**Fichier :** `src/types/campaign-with-relations.ts` (nouveau, optionnel)

**Note :** Pas besoin de relations pour les campagnes (pas de created_by, participants, etc.).  
Créer un type simple si nécessaire pour aligner avec le pattern, sinon utiliser directement `BrevoEmailCampaign`.

**Type de retour paginé :**
Créer dans le même fichier ou dans `src/types/brevo.ts` :
```typescript
export type CampaignsPaginatedResult = {
  campaigns: BrevoEmailCampaign[];
  hasMore: boolean;
  total: number;
};
```

**Pattern aligné avec :**
- `TasksPaginatedResult` : `{ tasks, hasMore, total }`
- `ActivitiesPaginatedResult` : `{ activities, hasMore, total }`

---

### 4. Hook Infinite Load
**Fichier :** `src/hooks/campaigns/use-campaigns-infinite-load.ts`

**Pattern identique à :** `useTasksInfiniteLoad` et `useActivitiesInfiniteLoad`

**Fonctionnalités :**
- Gestion d'état (campaigns, hasMore, isLoading, error)
- `filterKey` pattern pour détecter changements de filtres
- Fusion sans doublons (`mergeCampaignsWithoutDuplicates`)
- `flushSync` pour scroll restoration
- Retry avec `useRetryFetch`
- Réinitialisation automatique lors de changements de filtres

**Props :**
- `initialCampaigns`, `initialHasMore`, `initialTotal`
- `search`, `quickFilter`, `sort` (objet)
- `searchParams` (stabilisés)

---

### 5. Composants

#### 5.1. InfiniteScroll
**Fichier :** `src/components/email-marketing/campaigns-infinite-scroll/campaigns-infinite-scroll.tsx`

**Pattern identique à :** `TasksInfiniteScroll` et `ActivitiesInfiniteScroll`

**Fonctionnalités :**
- Utilise `useCampaignsInfiniteLoad`
- Affiche `CampaignsTableHeader`
- Affiche `CampaignRow` pour chaque campagne
- Bouton "Charger plus" (`LoadMoreButton`)
- Gestion du scroll restoration
- États vides (aucune campagne, erreur)

#### 5.2. TableHeader
**Fichier :** `src/components/email-marketing/campaigns-infinite-scroll/campaigns-table-header.tsx`

**Colonnes proposées :**
1. **Nom de la campagne** (campaign_name) - Triable
2. **Sujet** (email_subject) - Truncate si trop long
3. **Statut** (status) - Badge coloré
4. **Type** (campaign_type) - Badge
5. **Date d'envoi** (sent_at) - Format date
6. **Taux d'ouverture** (open_rate) - Format pourcentage
7. **Taux de clic** (click_rate) - Format pourcentage
8. **Emails envoyés** (emails_sent) - Format nombre
9. **Actions** - Menu contextuel (voir détails, synchroniser, etc.)

#### 5.3. CampaignRow
**Fichier :** `src/components/email-marketing/campaigns-infinite-scroll/campaign-row.tsx`

**Fonctionnalités :**
- Affiche toutes les colonnes
- Badges pour statut et type
- Formatage des valeurs (dates, pourcentages, nombres)
- Menu contextuel pour actions
- Actions possibles :
  - Voir détails
  - Synchroniser depuis Brevo
  - (Futur) Dupliquer
  - (Futur) Supprimer

#### 5.4. QuickFilters
**Fichier :** `src/components/email-marketing/campaigns-quick-filters.tsx`

**Pattern identique à :** `TasksQuickFilters` et `ActivitiesQuickFilters`

**Filtres :**
- Toutes (all)
- Envoyées (sent)
- Brouillons (draft)
- Planifiées (scheduled)

#### 5.5. SearchBar
**Fichier :** `src/components/email-marketing/campaigns-search-bar.tsx`

**Pattern identique à :** `TasksSearchBar`

**Fonctionnalités :**
- Input de recherche avec debounce
- URL params (search)
- Icône de recherche et clear

---

### 6. Page Email Marketing
**Fichier :** `src/app/(main)/marketing/email/page.tsx`

**Mise à jour :**
- Ajouter `loadInitialCampaigns()` (fonction async, pattern identique à `loadInitialTasks`)
  - Parse searchParams (search, quick, sort)
  - Appelle `listCampaignsPaginated()` avec params
  - Utilise `noStore()` si nécessaire (données temps réel)
- Passer les campagnes initiales à `CampaignsInfiniteScroll`
- Ajouter `search` dans `card.search` prop de `PageLayoutWithFilters` (CampaignsSearchBar)
- Ajouter `quickFilters` dans `card.quickFilters` prop (CampaignsQuickFilters)
- Remplacer le contenu placeholder `<Suspense>` par `CampaignsInfiniteScroll`

---

## 📋 Checklist d'Implémentation

### Phase 1 : Types et Filtres
- [ ] Créer `src/types/campaign-filters.ts`
  - Type `CampaignQuickFilter`
  - Fonctions de validation
- [ ] Créer `src/types/campaign-sort.ts`
  - Types `CampaignSortColumn`, `CampaignSort`
  - Fonctions `parseCampaignSort()`, validation

### Phase 2 : Service
- [ ] Créer `src/services/email-marketing/list-campaigns-paginated.ts`
  - Fonction `listCampaignsPaginated()`
  - Recherche textuelle (ilike sur campaign_name, email_subject avec échappement)
  - Quick filters (all, sent, draft, scheduled)
  - Tri (sent_at DESC par défaut, ou selon sortColumn/sortDirection)
  - Pagination avec offset/limit et `.range()`
  - Utiliser `count: 'estimated'` pour performance
  - Retourne `{ campaigns, hasMore, total }`
  - Gestion d'erreur avec `handleSupabaseError`

### Phase 3 : API Route
- [ ] Créer `src/app/api/campaigns/list/route.ts`
  - GET handler
  - Parse query params
  - Validation
  - Appelle `listCampaignsPaginated()`
  - Retourne JSON

### Phase 4 : Hook Infinite Load
- [ ] Créer `src/hooks/campaigns/use-campaigns-infinite-load.ts`
  - Pattern `filterKey` pour détecter changements
  - Fusion sans doublons
  - `flushSync` pour scroll restoration
  - Retry avec `useRetryFetch`
  - Réinitialisation automatique

### Phase 5 : Composants UI
- [ ] Créer `src/components/email-marketing/campaigns-search-bar.tsx`
- [ ] Créer `src/components/email-marketing/campaigns-quick-filters.tsx`
- [ ] Créer `src/components/email-marketing/campaigns-infinite-scroll/campaigns-table-header.tsx`
- [ ] Créer `src/components/email-marketing/campaigns-infinite-scroll/campaign-row.tsx`
- [ ] Créer `src/components/email-marketing/campaigns-infinite-scroll/campaigns-infinite-scroll.tsx`

### Phase 6 : Intégration Page
- [ ] Mettre à jour `src/app/(main)/marketing/email/page.tsx`
  - Fonction `loadInitialCampaigns()`
  - Passer campagnes à `CampaignsInfiniteScroll`
  - Ajouter search et quickFilters dans `card` prop
  - Remplacer placeholder par `CampaignsInfiniteScroll`

### Phase 7 : Exports
- [ ] Mettre à jour `src/components/email-marketing/index.ts`
- [ ] Vérifier tous les exports nécessaires

---

## 🔍 Détails Techniques

### Formatage des Valeurs

**Dates :**
- `sent_at` : Format "DD/MM/YYYY HH:mm" ou "Il y a X jours"
- `created_at` : Format relatif

**Pourcentages :**
- `open_rate`, `click_rate` : Format "XX.X%" (1 décimale)

**Nombres :**
- `emails_sent` : Format avec séparateurs (ex: "1 234") ou format k/M

**Statuts :**
- `draft` → Badge gris/jaune (Brouillon)
- `sent` → Badge vert (Envoyée)
- `scheduled` → Badge bleu (Planifiée)
- `suspended` → Badge orange (Suspendue)
- `archive` → Badge gris (Archivée)

**Types :**
- `classic` → Badge info (Classique)
- `trigger` → Badge warning (Déclencheur)
- `automated` → Badge success (Automatisée)

---

## 🎨 UI/UX

### Colonnes du Tableau

1. **Nom** (campaign_name) - Col large, texte gras
2. **Sujet** (email_subject) - Col moyenne, truncate avec tooltip
3. **Statut** (status) - Col petite, badge
4. **Type** (campaign_type) - Col petite, badge
5. **Date d'envoi** (sent_at) - Col moyenne, format date
6. **Ouverture** (open_rate) - Col petite, format "%"
7. **Clics** (click_rate) - Col petite, format "%"
8. **Envoyés** (emails_sent) - Col petite, format nombre
9. **Actions** - Col fixe, menu contextuel

### Responsive

- Desktop : Toutes les colonnes visibles
- Tablette : Masquer colonnes moins importantes (type, certaines stats)
- Mobile : Vue simplifiée (nom, statut, stats principales)

---

## 🔄 Gestion d'État

### URL SearchParams

**Paramètres :**
- `search` - Recherche textuelle
- `quick` - Quick filter (all, sent, draft, scheduled)
- `sortColumn` - Colonne de tri
- `sortDirection` - Direction (asc, desc)

**Pattern :**
- Utiliser `useStableSearchParams` pour stabiliser
- Utiliser `router.push({ scroll: false })` pour éviter scroll

---

## ✅ Validation Context7

**Patterns validés :**
- ✅ Server Component → fetch initial
- ✅ API Route → pagination client
- ✅ Hook personnalisé → état et logique
- ✅ Client Component → affichage et interactions
- ✅ Gestion d'erreur centralisée
- ✅ URL params pour filtres
- ✅ Infinite scroll avec "Charger plus"

---

## 📝 Notes Importantes

### Différences avec Tasks/Activities

1. **Pas de relations** : Les campagnes n'ont pas de relations (pas de created_by, etc.)
2. **Pas de profileId** : Les filtres ne dépendent pas de l'utilisateur
3. **Statuts différents** : Statuts spécifiques à Brevo
4. **Données synchronisées** : Données viennent de Brevo (synchro externe)

### Optimisations

- Utiliser `count: 'estimated'` pour meilleures performances (comme Activities)
- Index Supabase déjà en place sur status, sent_at
- Pas besoin de relations (requête simple)

---

**Prochaine étape :** Validation de cette méthode avant implémentation
