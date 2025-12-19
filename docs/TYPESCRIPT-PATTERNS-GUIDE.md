# Guide des Patterns TypeScript - OnpointDoc

> **Documentation créée le 2025-12-19**
> Guide de référence pour éviter les erreurs TypeScript courantes dans le projet OnpointDoc

## Table des matières

1. [Relations Supabase : Arrays vs Objects](#1-relations-supabase-arrays-vs-objects)
2. [Type Predicates avec flatMap/filter](#2-type-predicates-avec-flatmapfilter)
3. [Zod Schemas & React Hook Form](#3-zod-schemas--react-hook-form)
4. [Gestion des Erreurs (ApplicationError)](#4-gestion-des-erreurs-applicationerror)
5. [Types Async : Awaited<>](#5-types-async-awaited)
6. [Cast de Types : Quand et Comment](#6-cast-de-types-quand-et-comment)
7. [Exports Dupliqués](#7-exports-dupliqués)
8. [Type Narrowing](#8-type-narrowing)
9. [Nullable Values : null vs undefined](#9-nullable-values-null-vs-undefined)
10. [Checklist Avant Build](#10-checklist-avant-build)

---

## 1. Relations Supabase : Arrays vs Objects

### ❌ Problème

Supabase peut retourner des relations **en tant qu'array** même pour des relations one-to-one, ce qui cause des erreurs TypeScript.

```typescript
// ❌ ERREUR : company peut être un array
const companyName = ticket.company?.name;

// ❌ ERREUR : contact_user.company peut être un array
const company = relation?.contact_user?.company;
```

### ✅ Solution

**Toujours gérer le cas array ET object** avec un helper ou inline :

```typescript
// ✅ CORRECT : Gérer array ou object
const company = Array.isArray(ticket.company)
  ? ticket.company[0]
  : ticket.company;
const companyName = company?.name ?? 'Entreprise';

// ✅ CORRECT : Relations imbriquées
const contactUser = Array.isArray(relation?.contact_user)
  ? relation.contact_user[0]
  : relation?.contact_user;
const company = contactUser && Array.isArray(contactUser.company)
  ? contactUser.company[0]
  : contactUser?.company;
```

### 📝 Pattern Recommandé

Créer un helper pour les relations imbriquées :

```typescript
/**
 * Normalise une relation Supabase (array ou object)
 */
function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] || null : relation;
}

// Utilisation
const company = normalizeRelation(ticket.company);
const companyName = company?.name ?? 'Entreprise';
```

### 📍 Fichiers Concernés

- `src/services/companies/stats/company-tickets-by-product-module-stats.ts`
- `src/services/companies/company-history.ts`
- `src/services/dashboard/companies-cards-stats.ts`
- `src/services/tickets/index.ts`

---

## 2. Type Predicates avec flatMap/filter

### ❌ Problème

Type predicate après `flatMap()` cause une erreur car TypeScript infère `any[]` :

```typescript
// ❌ ERREUR : Type predicate incompatible
const linkedTickets = (ticketLinks || [])
  .map((link) => link.ticket)
  .filter((ticket): ticket is { id: string; ticket_type: string } =>
    ticket !== null && ticket.id !== null
  );
```

### ✅ Solution

**Utiliser `flatMap` + type local + vérification d'objet** :

```typescript
// ✅ CORRECT : Pattern recommandé
type LinkedTicket = {
  id: string;
  ticket_type: string;
  created_at: string;
};

const linkedTickets = (ticketLinks || [])
  .flatMap((link) => {
    const ticket = Array.isArray(link.ticket) ? link.ticket[0] : link.ticket;
    return ticket ? [ticket] : [];
  })
  .filter((ticket): ticket is LinkedTicket => {
    if (!ticket || typeof ticket !== 'object') return false;
    const t = ticket as any;
    return (
      t.id !== null &&
      t.ticket_type !== null &&
      ['BUG', 'REQ', 'ASSISTANCE'].includes(t.ticket_type) &&
      t.created_at >= periodStart &&
      t.created_at <= periodEnd
    );
  });
```

### 🔑 Points Clés

1. **Définir un type local** pour le résultat filtré
2. **Utiliser `flatMap`** au lieu de `map` + `filter` pour gérer null/undefined
3. **Vérifier `typeof ticket !== 'object'`** avant d'accéder aux propriétés
4. **Cast en `any`** temporairement pour accéder aux propriétés dans le predicate

### 📍 Fichiers Concernés

- `src/services/companies/stats/company-tickets-by-product-module-stats.ts:113-139`
- `src/services/companies/stats/company-tickets-distribution-stats.ts:111-133`
- `src/services/companies/stats/company-tickets-evolution-stats.ts:242-264`

---

## 3. Zod Schemas & React Hook Form

### ❌ Problème

Utiliser `.default([])` avec `.optional()` cause des conflits de type avec React Hook Form :

```typescript
// ❌ ERREUR : .default() rend le champ non-optionnel
participantIds: z.array(z.string().uuid()).default([]),
linkedTicketIds: z.array(z.string().uuid()).default([]),
```

### ✅ Solution

**Utiliser uniquement `.optional()`** pour les champs optionnels :

```typescript
// ✅ CORRECT : Uniquement .optional()
export const createActivitySchema = z.object({
  title: z.string().min(4).max(180),
  participantIds: z.array(z.string().uuid()).optional(),
  linkedTicketIds: z.array(z.string().uuid()).optional(),
  isPlanned: z.boolean().optional()
});
```

### 🔑 Règles Zod

| Cas | Utiliser | Ne PAS utiliser |
|-----|----------|-----------------|
| Champ optionnel sans valeur par défaut | `.optional()` | `.default([])` |
| Champ requis avec valeur par défaut | `.default([])` | `.optional()` |
| Champ nullable | `.nullable()` | `.optional()` |
| Champ optionnel ET nullable | `.optional().nullable()` | `.default(null)` |

### 📝 Zod 4 : Changements Breaking

```typescript
// ❌ ANCIEN (Zod 3)
params: z.record(z.string()).optional()

// ✅ NOUVEAU (Zod 4)
params: z.record(z.string(), z.string()).optional()
```

**Zod 4 requiert 2 arguments pour `z.record()` :**
1. Type des clés (`z.string()`)
2. Type des valeurs (`z.string()`, `z.any()`, etc.)

### 📍 Fichiers Concernés

- `src/lib/validators/activity.ts:38-40`
- `src/lib/validators/task.ts:109-115`
- `src/lib/validators/brevo.ts:161,195,353`

---

## 4. Gestion des Erreurs (ApplicationError)

### ❌ Problème

Appeler `createError()` comme une fonction au lieu d'utiliser les méthodes factory :

```typescript
// ❌ ERREUR : createError n'est pas une fonction
throw createError('UNAUTHORIZED', 'Non authentifié');
throw createError('NOT_FOUND', 'Profil introuvable');
```

### ✅ Solution

**Utiliser les méthodes factory de `createError`** :

```typescript
// ✅ CORRECT : Utiliser les factory methods
throw createError.unauthorized('Non authentifié');
throw createError.notFound('Profil utilisateur');
throw createError.validationError('Données invalides', { field: 'email' });
throw createError.forbidden('Accès interdit', { resource: 'ticket' });
```

### 📝 Factory Methods Disponibles

```typescript
createError.unauthorized(message?, details?)       // 401
createError.forbidden(message?, details?)          // 403
createError.notFound(resource?, details?)          // 404
createError.validationError(message, details?)     // 400
createError.conflict(message, details?)            // 409
createError.supabaseError(message, error?, details?) // 500
createError.jiraError(message, error?, details?)   // 500
createError.n8nError(message, error?, details?)    // 500
createError.networkError(message, error?, details?) // 500
createError.internalError(message?, error?, details?) // 500
createError.configurationError(message?, details?) // 500
```

### 🔑 Pattern avec Original Error

```typescript
try {
  await supabase.from('tickets').insert(data);
} catch (error) {
  throw createError.supabaseError(
    'Erreur lors de la création du ticket',
    error instanceof Error ? error : undefined,
    { ticketId: data.id }
  );
}
```

### 📍 Fichiers Concernés

- `src/services/tasks/index.ts:21,31`
- `src/lib/errors/types.ts:95-128`

---

## 5. Types Async : Awaited<>

### ❌ Problème

Utiliser `ReturnType<>` pour une fonction async sans unwrap la Promise :

```typescript
// ❌ ERREUR : supabase est une Promise<SupabaseClient>
async function foo(
  supabase: ReturnType<typeof createSupabaseServerClient>
) {
  await supabase.from('tickets')... // ❌ Property 'from' does not exist
}
```

### ✅ Solution

**Utiliser `Awaited<ReturnType<>>`** pour unwrap la Promise :

```typescript
// ✅ CORRECT : Awaited unwrap la Promise
async function foo(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  await supabase.from('tickets')... // ✅ OK
}
```

### 📝 Pattern Recommandé

```typescript
// Créer un type alias réutilisable
type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// Utiliser le type alias
async function createTicket(
  supabase: SupabaseClient,
  data: CreateTicketInput
): Promise<Ticket> {
  // ...
}
```

### 🔑 Règle Générale

- Fonction retourne `Promise<T>` → utiliser `Awaited<ReturnType<typeof fn>>`
- Fonction retourne `T` directement → utiliser `ReturnType<typeof fn>`

### 📍 Fichiers Concernés

- `src/services/tickets/bulk-actions.ts:23`
- `src/lib/supabase/server.ts`

---

## 6. Cast de Types : Quand et Comment

### 🎯 Hiérarchie des Casts

```
Meilleur → Pire
1. Inférence TypeScript (aucun cast)
2. Type annotation sur variable
3. Type assertion simple (as Type)
4. Double assertion (as unknown as Type)
5. any (à éviter absolument)
```

### ✅ Cas d'Usage

#### 1. Type Mismatch Mineur (Assertion Simple)

```typescript
// ✅ CORRECT : Type proche mais incompatible
return validationResult.data as UserDashboardConfig;
```

#### 2. Type Incompatible (Double Assertion)

```typescript
// ✅ CORRECT : Types très différents
data: dataPoints as unknown as SupportEvolutionDataPoint[]
```

#### 3. Narrowing dans Map/Filter

```typescript
// ✅ CORRECT : Cast à l'intérieur du callback
(activities || []).map((activity) =>
  transformActivity(activity as SupabaseActivityRaw)
);

(tasks || []).map((task) =>
  transformTask(task as SupabaseTaskRaw)
);
```

#### 4. Index Access avec Type Guard

```typescript
// ✅ CORRECT : Cast après type guard
const type = ticket.ticket_type;
if (type === 'BUG' || type === 'REQ' || type === 'ASSISTANCE') {
  distribution[type as 'BUG' | 'REQ' | 'ASSISTANCE']++;
}
```

### ❌ Anti-Patterns

```typescript
// ❌ MAUVAIS : Cast global sans justification
const tickets = data as any;

// ❌ MAUVAIS : Cast quand on peut inférer
const result: Result = getResult() as Result; // Type annotation suffit

// ❌ MAUVAIS : Chaîne de casts
const value = (data as any as string as number); // WTF?
```

### 📍 Fichiers Concernés

- `src/services/dashboard/support-evolution-data.ts:416`
- `src/services/activities/index.ts:282`
- `src/services/tasks/index.ts:343`
- `src/services/dashboard/tickets-by-type-distribution.ts:149`

---

## 7. Exports Dupliqués

### ❌ Problème

Exporter un type/variable deux fois cause une erreur :

```typescript
// ❌ ERREUR : Export duplicate
export type TicketNotificationEvent = 'ticket_created' | ...;

// ... plus tard dans le fichier
export {
  NOTIFICATION_CONFIGS,
  type TicketNotificationEvent, // ❌ Déjà exporté ligne 21
};
```

### ✅ Solution

**Option 1 : Export inline uniquement**

```typescript
// ✅ CORRECT : Export inline
export type TicketNotificationEvent = 'ticket_created' | ...;
export const NOTIFICATION_CONFIGS = { ... };
```

**Option 2 : Export groupé à la fin**

```typescript
// ✅ CORRECT : Types sans export
type TicketNotificationEvent = 'ticket_created' | ...;
const NOTIFICATION_CONFIGS = { ... };

// Export groupé à la fin
export {
  NOTIFICATION_CONFIGS,
  type TicketNotificationEvent
};
```

### 🔑 Règle

**Choisir UNE stratégie par fichier** :
- **Petits fichiers** (<100 lignes) → Exports inline
- **Gros fichiers** (>100 lignes) → Export groupé à la fin

### 📍 Fichiers Concernés

- `src/services/support/ticket-notifications.ts:21,384`

---

## 8. Type Narrowing

### ❌ Problème

TypeScript ne narrow pas automatiquement dans certains cas :

```typescript
// ❌ ERREUR : undefined not assignable to string | null
<TicketDescription description={ticket.description} />

// ❌ ERREUR : content peut être null
<LazyTooltipWrapper content={<TicketStats ticketId={ticket.id} />} />
```

### ✅ Solution

**Utiliser nullish coalescing (`??`) ou conditional rendering** :

```typescript
// ✅ CORRECT : ?? pour convertir undefined → null
<TicketDescription description={ticket.description ?? null} />

// ✅ CORRECT : Conditional rendering
{ticket.id && (
  <LazyTooltipWrapper content={<TicketStats ticketId={ticket.id} />} />
)}
```

### 📝 Patterns de Narrowing

```typescript
// 1. Type guard dans fonction
if (!profileId) return; // Guard clause
fetchUserStats(profileId); // ✅ profileId est string

// 2. Non-null assertion (à utiliser prudemment)
const name = user!.name; // ⚠️ Assure que user existe

// 3. Optional chaining + nullish coalescing
const country = user?.company?.country ?? 'Unknown';

// 4. Type predicate custom
function isTicket(obj: unknown): obj is Ticket {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}
```

### 📍 Fichiers Concernés

- `src/components/tickets/ticket-detail-tabs.tsx:88`
- `src/components/tickets/tickets-infinite-scroll/ticket-row.tsx:157-185`
- `src/components/tickets/tooltips/user-stats-tooltip.tsx:171-172`

---

## 9. Nullable Values : null vs undefined

### 🎯 Convention du Projet

| Cas | Utiliser | Exemple |
|-----|----------|---------|
| Champ optionnel | `undefined` | `email?: string` |
| Absence de valeur (DB) | `null` | `company_id: string \| null` |
| Valeur par défaut | `null` | `const user = data ?? null` |
| Props React optionnels | `undefined` | `onClick?: () => void` |

### ✅ Patterns Recommandés

```typescript
// ✅ CORRECT : Props React
interface Props {
  title: string;           // Requis
  subtitle?: string;       // Optionnel (undefined si absent)
  companyId: string | null; // Nullable (null si pas d'entreprise)
}

// ✅ CORRECT : Conversion undefined → null
function getCompanyName(company?: Company): string | null {
  return company?.name ?? null; // undefined devient null
}

// ✅ CORRECT : Type union avec null
type Result =
  | { success: true; data: Ticket }
  | { success: false; error: string }
  | null; // Représente "pas encore chargé"
```

### 📝 Zod & Nullable

```typescript
// Optionnel (peut être absent)
z.string().optional() // string | undefined

// Nullable (peut être null)
z.string().nullable() // string | null

// Les deux
z.string().optional().nullable() // string | null | undefined
```

### 📍 Fichiers Concernés

- `src/components/tickets/ticket-detail-tabs.tsx`
- `src/lib/validators/activity.ts`
- `src/hooks/auth/use-auth.ts:40`

---

## 10. Checklist Avant Build

### ✅ Vérifications TypeScript

```bash
# 1. Build TypeScript complet
npm run build

# 2. Type check uniquement (plus rapide)
npx tsc --noEmit

# 3. Linter
npm run lint
```

### 📋 Checklist Manuelle

- [ ] **Relations Supabase** : Gérer arrays ET objects
- [ ] **Type predicates** : Utiliser pattern flatMap + type local
- [ ] **Zod schemas** : Pas de `.default([])` avec `.optional()`
- [ ] **Error handling** : Utiliser `createError.method()`
- [ ] **Async types** : Utiliser `Awaited<>` si nécessaire
- [ ] **Exports** : Pas de duplicates
- [ ] **Nullables** : `?? null` pour undefined → null
- [ ] **Casts** : Justifier chaque `as` avec commentaire

### 🔧 Configuration Stricte

```json
// tsconfig.json - NE PAS modifier ces options
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 🚫 À NE JAMAIS FAIRE

```typescript
// ❌ JAMAIS : Désactiver TypeScript
// @ts-ignore
// @ts-nocheck

// ❌ JAMAIS : any sans raison valable
const data: any = fetchData();

// ❌ JAMAIS : Désactiver les erreurs dans la config
// next.config.mjs
typescript: {
  ignoreBuildErrors: true // ❌ NON !
}
```

---

## 📚 Références

### Documentation Officielle

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Zod Documentation](https://zod.dev)
- [Supabase TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)

### Fichiers Clés du Projet

- `src/lib/errors/types.ts` - Types d'erreurs
- `src/lib/validators/` - Schémas Zod
- `src/types/` - Types TypeScript globaux
- `docs/TODO-TYPESCRIPT-FIXES.md` - Historique des corrections

---

## 🎓 Formation Rapide

### Pour les Nouveaux Développeurs

1. **Lire cette doc en entier** (20 min)
2. **Étudier les fichiers marqués 📍** dans chaque section
3. **Faire un build** pour voir les erreurs potentielles
4. **Corriger en suivant les patterns ✅** de ce guide

### Pour les Code Reviews

- Vérifier que les patterns ✅ sont suivis
- Rejeter les anti-patterns ❌
- Suggérer les alternatives documentées ici

---

**Dernière mise à jour** : 2025-12-19
**Version** : 1.0.0
**Auteur** : Claude Sonnet 4.5 + Équipe OnpointDoc
