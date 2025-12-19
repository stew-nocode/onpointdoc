# Migration vers Next.js 16

## Date de migration
27 novembre 2025

## Versions installées
- **Next.js** : 16.0.5
- **React** : 19.2.0
- **React DOM** : 19.2.0

## Changements effectués

### 1. Mise à jour des dépendances
- ✅ Next.js mis à jour de 15.5.6 vers 16.0.5
- ✅ React mis à jour de 18.3.1 vers 19.2.0
- ✅ React DOM mis à jour de 18.3.1 vers 19.2.0

### 2. Configuration (`next.config.mjs`)
- ✅ `serverActions` et `optimizePackageImports` conservés dans `experimental` (pas encore stables dans 16.0.5)
- ✅ Configuration adaptée pour Next.js 16

### 3. Migration `middleware.ts` → `proxy.ts`
- ✅ Fichier `middleware.ts` renommé en `proxy.ts`
- ✅ Fonction `middleware()` renommée en `proxy()`
- ⚠️ **Note** : Le runtime de `proxy` est `nodejs` (non configurable). Si vous avez besoin du runtime `edge`, conservez `middleware.ts`.

### 4. Remplacement de `unstable_noStore`
- ✅ Tous les `unstable_noStore` remplacés par `unstable_noStore as noStore` (car `noStore` n'est pas encore disponible dans Next.js 16.0.5)
- ✅ Fichiers modifiés :
  - `src/app/(main)/gestion/tickets/page.tsx`
  - `src/app/(main)/gestion/tickets/[id]/page.tsx`
  - `src/app/(main)/dashboard/page.tsx`
  - `src/app/(main)/config/dashboard/widgets/page.tsx`
  - `src/app/(main)/config/dashboard/page.tsx`
  - `src/app/(main)/gestion/contacts/page.tsx`
  - `src/app/(main)/config/users/page.tsx`
  - `src/app/(main)/config/submodules/page.tsx`
  - `src/app/(main)/config/modules/page.tsx`
  - `src/app/(main)/config/features/page.tsx`
  - `src/app/(main)/config/departments/page.tsx`
  - `src/app/(main)/config/companies/page.tsx`

### 5. Séparation des fonctions serveur/client
- ✅ Création de `src/services/companies/server.ts` pour les fonctions serveur
- ✅ `listCompanies()` déplacée dans `server.ts` pour éviter l'import de `next/headers` dans les composants clients
- ✅ Imports mis à jour dans les fichiers serveur pour utiliser `@/services/companies/server`

### 6. Corrections TypeScript
- ✅ Correction de `ZodError.errors` → `ZodError.issues` dans `src/app/api/auth/login/route.ts`
- ✅ Correction de `useRef<() => Promise<void>>()` → `useRef<() => Promise<void>>(() => Promise.resolve())` dans `tickets-infinite-scroll.tsx`
- ✅ Ajout de `as string` pour l'import CSS de `react-quill` dans `quill-editor-client.tsx`

### 7. `params` et `searchParams`
- ✅ Déjà correctement typés comme `Promise` et awaités dans les pages (pas de changement nécessaire)

### 8. `cookies()`, `headers()`, `draftMode()`
- ✅ Déjà correctement awaités dans le code (pas de changement nécessaire)

## Notes importantes

### `noStore` vs `unstable_noStore`
Dans Next.js 16.0.5, `noStore` n'est pas encore exporté depuis `next/cache`. Il faut utiliser `unstable_noStore` pour l'instant. Lors d'une mise à jour future de Next.js 16, remplacer par `noStore` quand il sera disponible.

### `react-quill` et React 19
⚠️ **Attention** : `react-quill@2.0.0` n'est pas officiellement compatible avec React 19. Des warnings de peer dependencies apparaissent, mais cela ne bloque pas le build. Surveiller les mises à jour de `react-quill` pour une compatibilité complète.

### Turbopack
Next.js 16 utilise Turbopack par défaut pour le build. Le build a réussi avec Turbopack sans configuration supplémentaire.

## Tests effectués
- ✅ Build réussi sans erreurs
- ✅ TypeScript compile sans erreurs
- ✅ Toutes les pages générées correctement

## Prochaines étapes recommandées
1. Tester l'application en développement (`npm run dev`)
2. Tester toutes les fonctionnalités critiques
3. Surveiller les performances et les erreurs potentielles
4. Mettre à jour vers une version plus récente de Next.js 16 quand `noStore` sera disponible
5. Surveiller les mises à jour de `react-quill` pour la compatibilité React 19

## Fichiers modifiés
- `next.config.mjs`
- `middleware.ts` → `proxy.ts` (renommé)
- `src/services/companies/index.ts` (séparation serveur/client)
- `src/services/companies/server.ts` (nouveau fichier)
- 12 fichiers avec `unstable_noStore`
- `src/app/api/auth/login/route.ts`
- `src/components/tickets/tickets-infinite-scroll.tsx`
- `src/components/editors/quill-editor-client.tsx`
- `src/app/(main)/gestion/tickets/page.tsx` (import)
- `src/app/(main)/gestion/tickets/[id]/page.tsx` (import)

