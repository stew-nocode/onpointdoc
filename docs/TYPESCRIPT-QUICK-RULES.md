# Règles TypeScript Essentielles - OnpointDoc

> **RÉFÉRENCE RAPIDE** - À consulter systématiquement avant chaque développement
> 
> ⚠️ **Ces règles DOIVENT être respectées pour éviter les erreurs en phase de déploiement**

---

## 🚨 RÈGLES OBLIGATOIRES

### 1. Relations Supabase : TOUJOURS gérer Array OU Object

**❌ INTERDIT :**
```typescript
const companyName = ticket.company?.name; // ❌ company peut être un array
```

**✅ OBLIGATOIRE :**
```typescript
// Pattern inline
const company = Array.isArray(ticket.company) ? ticket.company[0] : ticket.company;
const companyName = company?.name ?? 'Entreprise';

// Pattern helper (recommandé pour relations imbriquées)
function normalizeRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] || null : relation;
}

const company = normalizeRelation(ticket.company);
```

**📌 À faire :** Vérifier TOUTES les relations Supabase (`.company`, `.contact_user`, `.ticket`, etc.)

---

### 2. Type Predicates : Utiliser flatMap + type local

**❌ INTERDIT :**
```typescript
.map((link) => link.ticket)
.filter((ticket): ticket is Ticket => ticket !== null) // ❌ Erreur avec flatMap
```

**✅ OBLIGATOIRE :**
```typescript
// 1. Définir un type local
type LinkedTicket = { id: string; ticket_type: string; created_at: string };

// 2. Utiliser flatMap (pas map)
const linkedTickets = (ticketLinks || [])
  .flatMap((link) => {
    const ticket = Array.isArray(link.ticket) ? link.ticket[0] : link.ticket;
    return ticket ? [ticket] : [];
  })
  .filter((ticket): ticket is LinkedTicket => {
    if (!ticket || typeof ticket !== 'object') return false;
    const t = ticket as any; // Cast temporaire OK dans predicate
    return t.id !== null && t.ticket_type !== null;
  });
```

**📌 À faire :** Toujours définir un type local avant le filter avec type predicate

---

### 3. Zod Schemas : JAMAIS `.default([])` avec `.optional()`

**❌ INTERDIT :**
```typescript
participantIds: z.array(z.string().uuid()).default([]), // ❌ Conflit avec React Hook Form
linkedTicketIds: z.array(z.string().uuid()).default([]),
```

**✅ OBLIGATOIRE :**
```typescript
// Champ optionnel sans valeur par défaut → .optional() uniquement
participantIds: z.array(z.string().uuid()).optional(),
linkedTicketIds: z.array(z.string().uuid()).optional(),
```

**📌 Règles Zod :**
- Champ optionnel → `.optional()` (PAS `.default([])`)
- Champ requis avec défaut → `.default([])` (PAS `.optional()`)
- Champ nullable → `.nullable()`
- Zod 4 : `z.record(z.string(), z.string())` (2 arguments obligatoires)

---

### 4. Gestion d'Erreurs : TOUJOURS utiliser `createError.method()`

**❌ INTERDIT :**
```typescript
throw createError('UNAUTHORIZED', 'Non authentifié'); // ❌ createError n'est pas une fonction
```

**✅ OBLIGATOIRE :**
```typescript
// Utiliser les factory methods
throw createError.unauthorized('Non authentifié');
throw createError.notFound('Profil utilisateur');
throw createError.validationError('Données invalides', { field: 'email' });
throw createError.supabaseError('Erreur DB', error, { ticketId: data.id });
```

**📌 Méthodes disponibles :**
- `createError.unauthorized()`, `createError.forbidden()`, `createError.notFound()`
- `createError.validationError()`, `createError.conflict()`
- `createError.supabaseError()`, `createError.jiraError()`, `createError.n8nError()`
- `createError.internalError()`, `createError.configurationError()`

---

### 5. Types Async : Utiliser `Awaited<>` pour unwrap Promise

**❌ INTERDIT :**
```typescript
async function foo(supabase: ReturnType<typeof createSupabaseServerClient>) {
  await supabase.from('tickets')... // ❌ Property 'from' does not exist
}
```

**✅ OBLIGATOIRE :**
```typescript
// Pattern avec Awaited
async function foo(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
) {
  await supabase.from('tickets')... // ✅ OK
}

// Pattern alias réutilisable (recommandé)
type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
async function createTicket(supabase: SupabaseClient, data: Input) { ... }
```

**📌 Règle :** Si fonction retourne `Promise<T>` → utiliser `Awaited<ReturnType<typeof fn>>`

---

### 6. Cast de Types : Justifier chaque `as` avec commentaire

**Hiérarchie (du meilleur au pire) :**
1. Inférence TypeScript (aucun cast)
2. Type annotation (`const x: Type = value`)
3. Type assertion simple (`value as Type`)
4. Double assertion (`value as unknown as Type`)
5. ❌ `any` (INTERDIT sauf dans type predicates)

**✅ Cas autorisés :**
```typescript
// Type mismatch mineur
return validationResult.data as UserDashboardConfig; // ✅ OK avec commentaire

// Types très différents
data: dataPoints as unknown as SupportEvolutionDataPoint[] // ✅ OK avec commentaire

// Dans map/filter callbacks
(activities || []).map((activity) =>
  transformActivity(activity as SupabaseActivityRaw) // ✅ OK
);
```

**❌ INTERDIT :**
```typescript
const tickets = data as any; // ❌ JAMAIS
const result = getResult() as Result; // ❌ Utiliser type annotation à la place
```

---

### 7. Exports : JAMAIS d'exports dupliqués

**❌ INTERDIT :**
```typescript
export type TicketNotificationEvent = 'ticket_created' | ...;
// ... plus tard dans le fichier
export { type TicketNotificationEvent, ... }; // ❌ Déjà exporté
```

**✅ OBLIGATOIRE :** Choisir UNE stratégie par fichier
- **Fichiers < 100 lignes** → Exports inline uniquement
- **Fichiers > 100 lignes** → Export groupé à la fin (PAS d'export inline)

```typescript
// Option 1 : Exports inline uniquement
export type TicketNotificationEvent = 'ticket_created' | ...;
export const NOTIFICATION_CONFIGS = { ... };

// Option 2 : Export groupé à la fin (pas d'export inline)
type TicketNotificationEvent = 'ticket_created' | ...;
const NOTIFICATION_CONFIGS = { ... };

export { NOTIFICATION_CONFIGS, type TicketNotificationEvent };
```

---

### 8. Type Narrowing : Utiliser `?? null` ou conditional rendering

**❌ INTERDIT :**
```typescript
<TicketDescription description={ticket.description} /> // ❌ undefined not assignable
```

**✅ OBLIGATOIRE :**
```typescript
// Conversion undefined → null
<TicketDescription description={ticket.description ?? null} />

// Conditional rendering
{ticket.id && (
  <LazyTooltipWrapper content={<TicketStats ticketId={ticket.id} />} />
)}

// Guard clause
if (!profileId) return;
fetchUserStats(profileId); // ✅ profileId est string

// Optional chaining + nullish coalescing
const country = user?.company?.country ?? 'Unknown';
```

---

### 9. Nullable Values : Convention null vs undefined

**📌 Convention du projet :**

| Cas | Utiliser | Exemple |
|-----|----------|---------|
| Champ optionnel (props) | `undefined` | `email?: string` |
| Absence de valeur (DB) | `null` | `company_id: string \| null` |
| Valeur par défaut | `null` | `const user = data ?? null` |
| Props React optionnels | `undefined` | `onClick?: () => void` |

**✅ Patterns :**
```typescript
// Props React
interface Props {
  title: string;           // Requis
  subtitle?: string;       // Optionnel (undefined)
  companyId: string | null; // Nullable (null)
}

// Conversion undefined → null
function getCompanyName(company?: Company): string | null {
  return company?.name ?? null;
}

// Zod
z.string().optional()              // string | undefined
z.string().nullable()              // string | null
z.string().optional().nullable()   // string | null | undefined
```

---

## ✅ CHECKLIST AVANT CHAQUE BUILD

### Vérifications automatiques
```bash
# 1. Type check (rapide)
npx tsc --noEmit

# 2. Build complet
npm run build

# 3. Linter
npm run lint
```

### Checklist manuelle
- [ ] **Relations Supabase** : Toutes gèrent arrays ET objects
- [ ] **Type predicates** : Utilisent pattern flatMap + type local
- [ ] **Zod schemas** : Pas de `.default([])` avec `.optional()`
- [ ] **Error handling** : Toutes utilisent `createError.method()`
- [ ] **Async types** : Utilisent `Awaited<>` si nécessaire
- [ ] **Exports** : Pas de duplicates (inline OU groupé, pas les deux)
- [ ] **Nullables** : Utilisent `?? null` pour undefined → null
- [ ] **Casts** : Chaque `as` est justifié avec commentaire
- [ ] **Aucun `any`** sauf dans type predicates (avec justification)

---

## 🚫 À NE JAMAIS FAIRE

```typescript
// ❌ Désactiver TypeScript
// @ts-ignore
// @ts-nocheck

// ❌ any sans justification
const data: any = fetchData();

// ❌ Désactiver erreurs dans next.config.mjs
typescript: { ignoreBuildErrors: true } // ❌ NON !

// ❌ Relations Supabase sans gestion array
const name = ticket.company?.name;

// ❌ Zod .default([]) avec .optional()
participantIds: z.array(z.string()).default([]).optional(); // ❌

// ❌ createError() comme fonction
throw createError('UNAUTHORIZED', 'message'); // ❌

// ❌ ReturnType sans Awaited pour Promise
supabase: ReturnType<typeof createSupabaseServerClient> // ❌ si async
```

---

## 📚 RÉFÉRENCE RAPIDE

### Relations Supabase
```typescript
const relation = Array.isArray(data.relation) ? data.relation[0] : data.relation;
```

### Type Predicates
```typescript
type LocalType = { id: string; ... };
const filtered = array.flatMap(...).filter((item): item is LocalType => ...);
```

### Zod
```typescript
// Optionnel
field: z.array(z.string()).optional()

// Requis avec défaut
field: z.array(z.string()).default([])

// Zod 4
params: z.record(z.string(), z.string())
```

### Erreurs
```typescript
throw createError.unauthorized('Message');
throw createError.notFound('Ressource');
throw createError.supabaseError('Message', error, { context });
```

### Async Types
```typescript
type Client = Awaited<ReturnType<typeof createClient>>;
```

### Nullable
```typescript
const value = data?.field ?? null; // undefined → null
```

---

**📖 Documentation complète :** `docs/TYPESCRIPT-PATTERNS-GUIDE.md`

**Dernière mise à jour :** 2025-12-19

