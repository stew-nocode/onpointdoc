# 🔧 Résolution : Rate Limit Supabase Auth (429)

## 📊 Problème

Erreur `AuthApiError` avec code `over_request_rate_limit` (statut 429) :
```
Error [AuthApiError]: Request rate limit reached
status: 429
code: 'over_request_rate_limit'
```

## 🎯 Causes Possibles

### 1. Appels Auth Répétés

- **`useAuth()` dans `AppShell`** : Appelé à chaque render
- **`getCurrentUserProfileId()`** : Appelé dans chaque page Server Component sans cache
- **Multiple `createSupabaseServerClient()`** : Créé plusieurs fois sans cache

### 2. Re-renders Continue

- Les recompilations continuelles peuvent déclencher plusieurs appels auth
- Chaque recompilation = nouveau render = nouveaux appels auth

### 3. Tooltips (Résolu)

- Les tooltips chargeaient les données au montage (maintenant corrigé avec lazy loading)

## ✅ Solutions Appliquées

### Solution 1 : Cache des Appels Server avec React.cache() ✅

Utiliser `cache()` de React pour mémoriser `getCurrentUserProfileId()` dans les Server Components.

**Fichier créé** : `src/lib/auth/cached-auth.ts`

```typescript
export const getCachedCurrentUserProfileId = cache(async () => {
  // ... logique avec cache automatique
});
```

### Solution 2 : Lazy Loading des Tooltips ✅

Les tooltips chargent maintenant les données seulement à l'ouverture (voir `docs/refactoring/tooltips-lazy-loading-implementation.md`).

## 📋 Actions Immédiates

1. ✅ **FAIT** : Mise en cache `getCurrentUserProfileId()` avec `cache()` → `getCachedCurrentUserProfileId()`
2. ✅ **FAIT** : Création d'un utilitaire partagé `src/lib/auth/cached-auth.ts`
3. ✅ **FAIT** : Application dans `TicketsPage`
4. ✅ **FAIT** : Lazy loading des tooltips
5. 🔄 **À FAIRE** : Appliquer à d'autres pages Server Components
6. 🔄 **À FAIRE** : Ajouter un retry mechanism pour les erreurs 429
7. 🔄 **À FAIRE** : Documenter les limites Supabase

## ✅ Solution Appliquée

### Fichier créé : `src/lib/auth/cached-auth.ts`

Fonction utilitaire partagée qui utilise `React.cache()` pour mémoriser les appels `getUser()` dans le render tree :

```typescript
export const getCachedCurrentUserProfileId = cache(async () => {
  // ... logique avec cache automatique
});
```

### Utilisation

Dans les Server Components, remplacer :
```typescript
// ❌ AVANT
const profileId = await getCurrentUserProfileId();

// ✅ APRÈS
const profileId = await getCachedCurrentUserProfileId();
```

### Pages à mettre à jour

- ✅ `src/app/(main)/gestion/tickets/page.tsx` (FAIT)
- 🔄 `src/app/(main)/gestion/tickets/[id]/page.tsx` (À FAIRE)
- 🔄 Autres pages utilisant `getUser()` (À FAIRE)

---

**Statut** : 🟡 EN COURS - Solution partiellement appliquée
**Impact** : Élevé - Réduit drastiquement les appels auth répétés
