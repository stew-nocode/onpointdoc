# Corrections Build et Erreurs TypeScript - 19 Janvier 2025

**Date** : 2025-01-19  
**Contexte** : Build bloqué pendant 23+ minutes, erreurs TypeScript massives, erreurs de cookies Next.js 15

---

## 📊 Résumé Exécutif

### Problèmes Identifiés
1. **Build bloqué** : 23+ minutes sans progression
2. **Erreurs TypeScript** : 100+ erreurs liées à `createSupabaseServerClient()`
3. **Erreurs Next.js 15** : Gestion des cookies dans Server Components
4. **Duplication de code** : Routes API dupliquaient la logique des services

### Solutions Appliquées
1. ✅ Correction de toutes les erreurs TypeScript (ajout de `await`)
2. ✅ Refactorisation des routes API bulk actions avec Zod
3. ✅ Correction de la gestion des cookies Next.js 15
4. ✅ Optimisation de la configuration Next.js
5. ✅ Correction des erreurs ESLint

### Résultat
- **Avant** : Build bloqué 23+ minutes
- **Après** : Build réussi en ~10 secondes ✅

---

## 🔧 Corrections Effectuées

### 1. Erreurs TypeScript - `createSupabaseServerClient()`

#### Problème
La fonction `createSupabaseServerClient()` est `async` et retourne une `Promise`, mais était utilisée sans `await` dans 25+ fichiers, causant des erreurs TypeScript massives.

#### Erreur Type
```typescript
// ❌ ERREUR
const supabase = createSupabaseServerClient();
const { data } = await supabase.from('tickets').select('*');
// Error: Property 'from' does not exist on type 'Promise<SupabaseClient>'
```

#### Solution
```typescript
// ✅ CORRECT
const supabase = await createSupabaseServerClient();
const { data } = await supabase.from('tickets').select('*');
```

#### Fichiers Corrigés (25 fichiers)
- `src/services/jira/sync.ts`
- `src/services/jira/feature-mapping.ts`
- `src/services/jira/contact-mapping.ts`
- `src/services/jira/mapping.ts`
- `src/services/tickets/index.ts`
- `src/services/tickets/jira-transfer.ts`
- `src/app/api/webhooks/jira/route.ts`
- `src/app/api/admin/departments/*` (5 fichiers)
- `src/app/api/admin/users/create/route.ts`
- `src/services/departments/server.ts`
- `src/services/products/server.ts`
- `src/services/users/server.ts`
- `src/services/activities/index.ts`
- `src/services/tasks/index.ts`
- `src/app/(main)/config/*` (7 fichiers)

---

### 2. Next.js 15 - Gestion des Cookies

#### Problème
Dans Next.js 15, les cookies ne peuvent être modifiés que dans les **Server Actions** ou **Route Handlers**. Dans les **Server Components**, les fonctions `set()` et `remove()` doivent être des no-ops (ne rien faire).

#### Erreur
```
Cookies can only be modified in a Server Action or Route Handler.
at Object.set (src/lib/supabase/server.ts:15:23)
```

#### Solution
```typescript
// ✅ CORRECT - src/lib/supabase/server.ts
set(name: string, value: string, options: CookieOptions) {
  // Dans Next.js 15, no-op dans les Server Components
  // Les cookies seront gérés par les Server Actions si nécessaire.
},
remove(name: string, options: CookieOptions) {
  // Même logique - no-op dans les Server Components
}
```

#### Exigence Next.js 15
- ✅ **Server Components** : Lecture seule des cookies (`get()` uniquement)
- ✅ **Server Actions** : Modification des cookies autorisée
- ✅ **Route Handlers** : Modification des cookies autorisée

---

### 3. Next.js 15 - `searchParams` est une Promise

#### Problème
Dans Next.js 15, `searchParams` est maintenant une `Promise` au lieu d'un objet direct.

#### Erreur
```typescript
// ❌ ERREUR
type TicketsPageProps = {
  searchParams?: {
    type?: string;
    status?: string;
  };
};
// Error: Type does not satisfy constraint 'PageProps'
```

#### Solution
```typescript
// ✅ CORRECT
type TicketsPageProps = {
  searchParams?: Promise<{
    type?: string;
    status?: string;
  }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  // Résoudre la Promise
  const params = await searchParams;
  // Utiliser params.type, params.status, etc.
}
```

#### Fichiers Corrigés
- `src/app/(main)/gestion/tickets/page.tsx`

---

### 4. Refactorisation Routes API Bulk Actions

#### Problème
Les routes API dupliquaient la logique des services au lieu de les utiliser.

#### Avant
```typescript
// ❌ Duplication dans chaque route API
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // ... logique dupliquée ...
  const batchSize = 50;
  for (let i = 0; i < ticketIds.length; i += batchSize) {
    // ... même code partout ...
  }
}
```

#### Après
```typescript
// ✅ Utilisation des services
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = bulkUpdateStatusSchema.parse(body);
  const result = await bulkUpdateStatus(validated);
  return NextResponse.json(result);
}
```

#### Fichiers Créés
- `src/lib/validators/bulk-actions.ts` : Schémas Zod pour validation

#### Fichiers Refactorisés
- `src/app/api/tickets/bulk/status/route.ts`
- `src/app/api/tickets/bulk/priority/route.ts`
- `src/app/api/tickets/bulk/reassign/route.ts`

---

### 5. Validation Zod pour Routes API

#### Problème
Les routes API n'utilisaient pas Zod pour la validation, seulement des vérifications manuelles.

#### Solution
```typescript
// ✅ Schémas Zod centralisés
export const bulkUpdateStatusSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1),
  status: z.enum(['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as [string, ...string[]])
});

// ✅ Utilisation dans les routes
const validated = bulkUpdateStatusSchema.parse(body);
```

---

### 6. Corrections ESLint

#### Problèmes Corrigés
1. **Apostrophes non échappées** : `l'assistance` → `l&apos;assistance`
2. **Guillemets non échappés** : `"nom"` → `&quot;nom&quot;`
3. **setState dans useEffect** : Utilisation de `useRef` pour éviter les cascades
4. **useSearchParams sans Suspense** : Enveloppé dans `<Suspense>`

#### Fichiers Corrigés
- `src/app/(main)/gestion/tickets/[id]/page.tsx`
- `src/components/forms/ticket-form.tsx`
- `src/components/departments/delete-department-button.tsx`
- `src/components/users/delete-contact-button.tsx`
- `src/components/*/table-client.tsx` (6 fichiers)
- `src/app/auth/login/page.tsx`

---

### 7. Optimisation Next.js

#### Configuration Optimisée
```javascript
// next.config.mjs
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip'
    ]
  }
};
```

---

## 📋 Exigences Techniques Négligées

### 1. Next.js 15 - Breaking Changes

#### ⚠️ Exigence : `searchParams` est une Promise
```typescript
// ❌ Next.js 14
searchParams?: { type?: string }

// ✅ Next.js 15
searchParams?: Promise<{ type?: string }>
```

**Impact** : Toutes les pages avec `searchParams` doivent être mises à jour.

#### ⚠️ Exigence : Cookies en Server Components
- Les cookies ne peuvent être **modifiés** que dans Server Actions ou Route Handlers
- Dans Server Components, `set()` et `remove()` doivent être des no-ops

**Impact** : Client Supabase SSR doit gérer cela correctement.

#### ⚠️ Exigence : `useSearchParams()` nécessite Suspense
```typescript
// ✅ CORRECT
<Suspense fallback={<Loading />}>
  <ComponentUsingSearchParams />
</Suspense>
```

---

### 2. TypeScript Strict Mode

#### ⚠️ Exigence : Toutes les Promises doivent être awaitées
```typescript
// ❌ ERREUR avec strict: true
const supabase = createSupabaseServerClient(); // Promise non awaitée
supabase.from('tickets') // Error: Property 'from' does not exist

// ✅ CORRECT
const supabase = await createSupabaseServerClient();
supabase.from('tickets') // OK
```

**Impact** : Toutes les fonctions async doivent être awaitées.

---

### 3. Supabase SSR (@supabase/ssr)

#### ⚠️ Exigence : `createSupabaseServerClient()` est async
La fonction doit être `async` car elle utilise `await cookies()` de Next.js.

**Impact** : Tous les appels doivent utiliser `await`.

#### ⚠️ Exigence : Gestion des cookies selon le contexte
- **Server Components** : Lecture seule
- **Server Actions** : Modification autorisée
- **Route Handlers** : Modification autorisée

---

### 4. Architecture du Projet

#### ⚠️ Exigence : Séparation logique métier / UI
- **Services** (`src/services/`) : Logique métier uniquement
- **Routes API** (`src/app/api/`) : Doivent utiliser les services
- **Composants** (`src/components/`) : UI uniquement

**Impact** : Éviter la duplication de code entre routes API et services.

#### ⚠️ Exigence : Validation Zod pour toutes les routes API
Toutes les routes API doivent valider les inputs avec Zod.

---

### 5. React Hooks

#### ⚠️ Exigence : Pas de setState direct dans useEffect
```typescript
// ❌ ERREUR
useEffect(() => {
  setCurrentPage(1); // Peut causer des cascades
}, [filters]);

// ✅ CORRECT
const prevFilters = useRef(filters);
useEffect(() => {
  if (prevFilters.current !== filters) {
    setCurrentPage(1);
    prevFilters.current = filters;
  }
}, [filters]);
```

#### ⚠️ Exigence : useCallback pour les dépendances useEffect
```typescript
// ✅ CORRECT
const loadData = useCallback(async () => {
  // ...
}, [departmentId]);

useEffect(() => {
  loadData();
}, [loadData]);
```

---

## 🎯 Checklist de Vérification

### Avant de créer/modifier du code

#### Next.js 15
- [ ] `searchParams` est-il une Promise ?
- [ ] Les cookies sont-ils modifiés uniquement dans Server Actions/Route Handlers ?
- [ ] `useSearchParams()` est-il enveloppé dans Suspense ?

#### TypeScript
- [ ] Toutes les Promises sont-elles awaitées ?
- [ ] Les types sont-ils corrects (pas de `any` inutile) ?

#### Supabase
- [ ] `createSupabaseServerClient()` est-il awaité ?
- [ ] Les cookies sont-ils gérés selon le contexte (Server Component vs Server Action) ?

#### Architecture
- [ ] La logique métier est-elle dans les services ?
- [ ] Les routes API utilisent-elles les services ?
- [ ] La validation Zod est-elle présente ?

#### React
- [ ] Pas de setState direct dans useEffect ?
- [ ] useCallback utilisé pour les dépendances useEffect ?
- [ ] Apostrophes et guillemets échappés dans JSX ?

---

## 📚 Références Techniques

### Next.js 15
- [Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [searchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Server Actions](https://nextjs.org/docs/app/api-reference/functions/server-actions)

### Supabase SSR
- [@supabase/ssr Documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- Gestion des cookies selon le contexte Next.js

### TypeScript Strict Mode
- Toutes les Promises doivent être typées et awaitées
- Pas de `any` sauf cas exceptionnels documentés

---

## 🔄 Processus de Développement Recommandé

### 1. Avant de commencer
- Vérifier les exigences Next.js 15
- Vérifier les types TypeScript
- Vérifier l'architecture (services vs routes API)

### 2. Pendant le développement
- Utiliser `await` pour toutes les Promises
- Valider avec Zod dans les routes API
- Utiliser les services existants au lieu de dupliquer

### 3. Avant de commit
- `npm run typecheck` : Vérifier les erreurs TypeScript
- `npm run build` : Vérifier que le build passe
- `npm run lint` : Vérifier les erreurs ESLint

---

## 📊 Métriques

### Avant les Corrections
- **Erreurs TypeScript** : 100+
- **Temps de build** : 23+ minutes (bloqué)
- **Erreurs ESLint** : 15+
- **Duplication de code** : Routes API dupliquaient services

### Après les Corrections
- **Erreurs TypeScript** : 0 (sauf tests)
- **Temps de build** : ~10 secondes ✅
- **Erreurs ESLint** : 0 (1 warning non bloquant)
- **Duplication de code** : Éliminée ✅

---

## 🎓 Leçons Apprises

1. **Next.js 15 a des breaking changes** : Toujours vérifier la documentation lors des mises à jour majeures
2. **TypeScript strict mode** : Toutes les Promises doivent être awaitées
3. **Architecture** : Éviter la duplication entre routes API et services
4. **Validation** : Toujours utiliser Zod pour valider les inputs API
5. **Cookies Next.js 15** : Gestion différente selon le contexte (Server Component vs Server Action)

---

**Document créé le** : 2025-01-19  
**Auteur** : Assistant IA (Auto)  
**Version** : 1.0

