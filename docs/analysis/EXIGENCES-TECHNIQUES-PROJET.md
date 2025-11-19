# Exigences Techniques du Projet OnpointDoc

**Date** : 2025-01-19  
**Objectif** : Documenter toutes les exigences techniques spécifiques des outils et technologies utilisés pour éviter les erreurs futures

---

## 📋 Table des Matières

1. [Next.js 15](#nextjs-15)
2. [TypeScript Strict Mode](#typescript-strict-mode)
3. [Supabase SSR](#supabase-ssr)
4. [React Hooks](#react-hooks)
5. [Architecture du Projet](#architecture-du-projet)
6. [Validation Zod](#validation-zod)
7. [ESLint Rules](#eslint-rules)

---

## 🚀 Next.js 15

### Exigence 1 : `searchParams` est une Promise

#### ❌ INCORRECT
```typescript
type PageProps = {
  searchParams?: {
    type?: string;
  };
};

export default function Page({ searchParams }: PageProps) {
  const type = searchParams?.type; // ❌ ERREUR
}
```

#### ✅ CORRECT
```typescript
type PageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams; // ✅ Résoudre la Promise
  const type = params?.type;
}
```

**Impact** : Toutes les pages avec `searchParams` doivent être mises à jour.

---

### Exigence 2 : Gestion des Cookies

#### Règle Fondamentale
Les cookies ne peuvent être **modifiés** que dans :
- ✅ **Server Actions** (`'use server'`)
- ✅ **Route Handlers** (`route.ts`)

Les cookies ne peuvent **PAS** être modifiés dans :
- ❌ **Server Components** (pages, layouts)

#### ✅ CORRECT - Server Component
```typescript
// src/lib/supabase/server.ts
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value; // ✅ Lecture OK
      },
      set(name: string, value: string, options: any) {
        // ✅ No-op dans Server Components
        // Les cookies seront gérés par les Server Actions
      },
      remove(name: string, options: any) {
        // ✅ No-op dans Server Components
      }
    }
  });
};
```

#### ✅ CORRECT - Server Action
```typescript
// src/app/auth/actions.ts
'use server';

export async function loginAction(email: string, password: string) {
  const supabase = await createSupabaseServerClient();
  // ✅ Ici, les cookies peuvent être modifiés car c'est une Server Action
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}
```

**Impact** : Client Supabase SSR doit gérer les cookies différemment selon le contexte.

---

### Exigence 3 : `useSearchParams()` nécessite Suspense

#### ❌ INCORRECT
```typescript
'use client';
export default function Page() {
  const searchParams = useSearchParams(); // ❌ ERREUR
  return <div>{searchParams.get('type')}</div>;
}
```

#### ✅ CORRECT
```typescript
'use client';
import { Suspense } from 'react';

function PageContent() {
  const searchParams = useSearchParams();
  return <div>{searchParams.get('type')}</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PageContent />
    </Suspense>
  );
}
```

**Impact** : Tous les composants utilisant `useSearchParams()` doivent être enveloppés dans Suspense.

---

## 🔷 TypeScript Strict Mode

### Exigence 1 : Toutes les Promises doivent être awaitées

#### ❌ INCORRECT
```typescript
const supabase = createSupabaseServerClient(); // Promise non awaitée
const { data } = await supabase.from('tickets').select('*');
// Error: Property 'from' does not exist on type 'Promise<SupabaseClient>'
```

#### ✅ CORRECT
```typescript
const supabase = await createSupabaseServerClient();
const { data } = await supabase.from('tickets').select('*');
```

**Règle** : Si une fonction est `async` ou retourne une `Promise`, elle DOIT être awaitée.

**Impact** : Tous les appels à `createSupabaseServerClient()` doivent utiliser `await`.

---

### Exigence 2 : Typage strict des enums

#### ❌ INCORRECT
```typescript
const STATUSES = ['Nouveau', 'En_cours'] as const;
z.enum(STATUSES); // ❌ Erreur : readonly array
```

#### ✅ CORRECT
```typescript
z.enum(['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as [string, ...string[]]);
```

**Règle** : Les enums Zod nécessitent un tuple mutable `[string, ...string[]]`.

---

## 🔐 Supabase SSR (@supabase/ssr)

### Exigence 1 : `createSupabaseServerClient()` est async

#### Raison
La fonction utilise `await cookies()` de Next.js, donc elle doit être `async`.

#### ✅ CORRECT
```typescript
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(url, key, { cookies: { ... } });
};

// Utilisation
const supabase = await createSupabaseServerClient();
```

**Impact** : Tous les appels doivent utiliser `await`.

---

### Exigence 2 : Gestion des cookies selon le contexte

#### Server Components (lecture seule)
```typescript
cookies: {
  get(name: string) {
    return cookieStore.get(name)?.value; // ✅ OK
  },
  set(name: string, value: string, options: any) {
    // ✅ No-op - ne rien faire
  },
  remove(name: string, options: any) {
    // ✅ No-op - ne rien faire
  }
}
```

#### Server Actions / Route Handlers (modification autorisée)
```typescript
cookies: {
  get(name: string) {
    return cookieStore.get(name)?.value;
  },
  set(name: string, value: string, options: any) {
    cookieStore.set(name, value, options); // ✅ OK dans Server Actions
  },
  remove(name: string, options: any) {
    cookieStore.delete(name); // ✅ OK dans Server Actions
  }
}
```

**Impact** : Créer deux fonctions distinctes si nécessaire, ou utiliser des no-ops dans Server Components.

---

## ⚛️ React Hooks

### Exigence 1 : Pas de setState direct dans useEffect

#### ❌ INCORRECT
```typescript
useEffect(() => {
  setCurrentPage(1); // ❌ Peut causer des cascades de renders
}, [filters]);
```

#### ✅ CORRECT - Option 1 : useRef
```typescript
const prevFilters = useRef(filters);
useEffect(() => {
  if (prevFilters.current !== filters) {
    setCurrentPage(1);
    prevFilters.current = filters;
  }
}, [filters]);
```

#### ✅ CORRECT - Option 2 : eslint-disable (si intentionnel)
```typescript
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setCurrentPage(1);
}, [filters]);
```

**Règle** : Éviter les setState synchrones dans useEffect qui peuvent causer des cascades.

---

### Exigence 2 : useCallback pour les dépendances useEffect

#### ❌ INCORRECT
```typescript
async function loadData() {
  // ...
}

useEffect(() => {
  loadData();
}, [departmentId]); // ❌ Warning : loadData manque dans les dépendances
```

#### ✅ CORRECT
```typescript
const loadData = useCallback(async () => {
  // ...
}, [departmentId]);

useEffect(() => {
  loadData();
}, [loadData]);
```

**Règle** : Si une fonction est utilisée dans useEffect, elle doit être mémorisée avec useCallback.

---

### Exigence 3 : Échapper les caractères spéciaux dans JSX

#### ❌ INCORRECT
```typescript
<p>Durée de l'assistance</p> // ❌ Apostrophe non échappée
<p>Supprimer "{name}" ?</p> // ❌ Guillemets non échappés
```

#### ✅ CORRECT
```typescript
<p>Durée de l&apos;assistance</p>
<p>Supprimer &quot;{name}&quot; ?</p>
```

**Règle** : Apostrophes (`'`) → `&apos;`, Guillemets (`"`) → `&quot;`

---

## 🏗️ Architecture du Projet

### Exigence 1 : Séparation des responsabilités

#### Structure Requise
```
src/
├── services/          # Logique métier uniquement
│   └── tickets/
│       ├── index.ts           # Services de base
│       └── bulk-actions.ts     # Services bulk actions
├── app/api/           # Routes API (utilisent les services)
│   └── tickets/bulk/
│       └── status/route.ts    # Utilise bulk-actions.ts
└── components/        # UI uniquement
```

#### ❌ INCORRECT - Duplication
```typescript
// src/app/api/tickets/bulk/status/route.ts
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  // ❌ Logique métier dupliquée ici
  const batchSize = 50;
  for (let i = 0; i < ticketIds.length; i += batchSize) {
    // ...
  }
}
```

#### ✅ CORRECT - Utilisation des services
```typescript
// src/app/api/tickets/bulk/status/route.ts
import { bulkUpdateStatus } from '@/services/tickets/bulk-actions';

export async function POST(request: NextRequest) {
  const validated = bulkUpdateStatusSchema.parse(body);
  const result = await bulkUpdateStatus(validated); // ✅ Utilise le service
  return NextResponse.json(result);
}
```

**Règle** : Les routes API doivent utiliser les services, pas dupliquer la logique.

---

### Exigence 2 : Validation Zod pour toutes les routes API

#### ❌ INCORRECT
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!Array.isArray(body.ticketIds)) { // ❌ Validation manuelle
    return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  }
}
```

#### ✅ CORRECT
```typescript
import { bulkUpdateStatusSchema } from '@/lib/validators/bulk-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = bulkUpdateStatusSchema.parse(body); // ✅ Validation Zod
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
  }
}
```

**Règle** : Toutes les routes API doivent valider les inputs avec Zod.

---

## 📦 Validation Zod

### Exigence 1 : Schémas centralisés

#### Structure
```
src/lib/validators/
├── ticket.ts              # Schémas pour tickets
├── bulk-actions.ts        # Schémas pour bulk actions
└── ...
```

#### ✅ CORRECT
```typescript
// src/lib/validators/bulk-actions.ts
export const bulkUpdateStatusSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1),
  status: z.enum(['Nouveau', 'En_cours', 'Transfere', 'Resolue'] as [string, ...string[]])
});

export type BulkUpdateStatusInput = z.infer<typeof bulkUpdateStatusSchema>;
```

---

### Exigence 2 : Gestion des erreurs Zod

#### ✅ CORRECT
```typescript
try {
  const validated = schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Données invalides', details: error.issues },
      { status: 400 }
    );
  }
}
```

**Note** : Utiliser `error.issues` (pas `error.errors`) pour Zod.

---

## 🔍 ESLint Rules

### Règles Critiques

#### 1. `react-hooks/set-state-in-effect`
- **Règle** : Éviter setState direct dans useEffect
- **Solution** : Utiliser `useRef` ou `eslint-disable-next-line`

#### 2. `react-hooks/exhaustive-deps`
- **Règle** : Toutes les dépendances doivent être dans le tableau
- **Solution** : Utiliser `useCallback` pour les fonctions

#### 3. `react/no-unescaped-entities`
- **Règle** : Échapper les apostrophes et guillemets
- **Solution** : `&apos;` et `&quot;`

#### 4. `@next/next/no-img-element`
- **Règle** : Utiliser `<Image />` de Next.js
- **Solution** : Remplacer `<img>` par `<Image />` (ou warning accepté)

---

## ✅ Checklist de Développement

### Avant de créer/modifier du code

#### Next.js 15
- [ ] `searchParams` est-il une Promise ?
- [ ] Les cookies sont-ils modifiés uniquement dans Server Actions/Route Handlers ?
- [ ] `useSearchParams()` est-il enveloppé dans Suspense ?

#### TypeScript
- [ ] Toutes les Promises sont-elles awaitées ?
- [ ] Les types sont-ils corrects (pas de `any` inutile) ?
- [ ] Les enums Zod utilisent-ils `[string, ...string[]]` ?

#### Supabase
- [ ] `createSupabaseServerClient()` est-il awaité ?
- [ ] Les cookies sont-ils gérés selon le contexte ?

#### Architecture
- [ ] La logique métier est-elle dans les services ?
- [ ] Les routes API utilisent-elles les services ?
- [ ] La validation Zod est-elle présente ?

#### React
- [ ] Pas de setState direct dans useEffect ?
- [ ] useCallback utilisé pour les dépendances useEffect ?
- [ ] Apostrophes et guillemets échappés dans JSX ?

---

## 🚨 Erreurs Courantes à Éviter

### 1. Oublier `await` sur `createSupabaseServerClient()`
```typescript
// ❌ ERREUR
const supabase = createSupabaseServerClient();
```

### 2. Modifier les cookies dans un Server Component
```typescript
// ❌ ERREUR
cookieStore.set(name, value, options); // Dans un Server Component
```

### 3. Utiliser `searchParams` sans await
```typescript
// ❌ ERREUR
const type = searchParams?.type; // searchParams est une Promise
```

### 4. Dupliquer la logique entre routes API et services
```typescript
// ❌ ERREUR - Duplication
// Route API et service font la même chose
```

### 5. Oublier la validation Zod
```typescript
// ❌ ERREUR
const body = await request.json();
// Pas de validation
```

---

## 📚 Références

### Documentation Officielle
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Next.js 15 Cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Zod Documentation](https://zod.dev/)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)

### Breaking Changes Next.js 15
- `searchParams` est maintenant une Promise
- Cookies modifiables uniquement dans Server Actions/Route Handlers
- `useSearchParams()` nécessite Suspense

---

**Document créé le** : 2025-01-19  
**Dernière mise à jour** : 2025-01-19  
**Version** : 1.0

