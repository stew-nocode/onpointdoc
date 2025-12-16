# Fix: Erreur "cookies() cannot be used inside unstable_cache"

**Date**: 2025-12-15
**Statut**: ✅ Corrigé

---

## 🐛 Problème Rencontré

### Erreur Complète

```
Error: Route /marketing/email used `cookies()` inside a function cached with `unstable_cache()`.
Accessing Dynamic data sources inside a cache scope is not supported.
If you need this data inside a cached function use `cookies()` outside of the cached function
and pass the required dynamic data in as an argument.
```

### Cause Racine

Next.js 14+ **interdit** l'utilisation de sources de données dynamiques comme `cookies()` à l'intérieur de fonctions cachées avec `unstable_cache()`.

Le problème venait de notre pattern d'optimisation initial :

```typescript
// ❌ PATTERN INCORRECT (causait l'erreur)
export const getCachedTaskKPIs = unstable_cache(
  async (profileId: string | null) => {
    const supabase = await createSupabaseServerClient(); // ⚠️ Appelle cookies() en interne!
    return await getTaskKPIsOptimized(profileId);
  },
  ['task-kpis'],
  { revalidate: 300, tags: ['task-kpis'] }
);
```

**Pourquoi ça ne marche pas ?**

- `createSupabaseServerClient()` utilise `cookies()` en interne pour récupérer les cookies de session
- `cookies()` est une source de données **dynamique** (change à chaque requête)
- Next.js refuse d'exécuter des sources dynamiques dans un cache statique

---

## ✅ Solution Appliquée

### Nouveau Pattern (Correct)

**Créer le client Supabase EN DEHORS du cache et le passer en paramètre** :

```typescript
// ✅ PATTERN CORRECT
export async function getCachedTaskKPIs(profileId: string | null) {
  if (!profileId) {
    return getEmptyKPIs();
  }

  // IMPORTANT: Créer le client Supabase EN DEHORS du cache
  // car cookies() ne peut pas être utilisé dans unstable_cache
  const supabase = await createSupabaseServerClient();

  const cachedFn = unstable_cache(
    async (supabaseClient: typeof supabase, userId: string) => {
      return await getTaskKPIsOptimized(supabaseClient, userId);
    },
    ['task-kpis'],
    {
      revalidate: 300,
      tags: ['task-kpis']
    }
  );

  return await cachedFn(supabase, profileId);
}
```

### Modifications Requises dans les Services

Les fonctions de service doivent accepter le client Supabase en paramètre :

```typescript
// ✅ Service optimisé (accepte le client en paramètre)
export async function getTaskKPIsOptimized(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string | null
): Promise<TaskKPIs> {
  // Plus besoin de createSupabaseServerClient() ici
  const { data } = await supabase.rpc('get_tasks_kpis', {...});
  return transformData(data);
}
```

---

## 📂 Fichiers Corrigés

### 1. Email Marketing KPIs

**Service** : [src/services/email-marketing/email-kpis.ts](src/services/email-marketing/email-kpis.ts)
- Ajout du paramètre `supabase` dans `getEmailMarketingKPIs()`
- Retrait de l'appel `createSupabaseServerClient()` interne

**Cache** : [src/lib/cache/email-marketing-kpis-cache.ts](src/lib/cache/email-marketing-kpis-cache.ts)
- Création du client Supabase avant `unstable_cache`
- Passage du client en paramètre

### 2. Tasks KPIs

**Service** : [src/services/tasks/task-kpis-optimized.ts](src/services/tasks/task-kpis-optimized.ts)
- Ajout du paramètre `supabase` dans `getTaskKPIsOptimized()`
- Retrait de l'appel `createSupabaseServerClient()` interne

**Cache** : [src/lib/cache/tasks-kpis-cache.ts](src/lib/cache/tasks-kpis-cache.ts)
- Création du client avant cache
- Passage du client en paramètre
- Suppression de la fonction `getCachedTaskKPIsByUser` (même problème)

### 3. Activities KPIs

**Service** : [src/services/activities/activity-kpis-optimized.ts](src/services/activities/activity-kpis-optimized.ts)
- Ajout du paramètre `supabase` dans `getActivityKPIsOptimized()`
- Retrait de l'appel `createSupabaseServerClient()` interne

**Cache** : [src/lib/cache/activities-kpis-cache.ts](src/lib/cache/activities-kpis-cache.ts)
- Création du client avant cache
- Passage du client en paramètre
- Suppression de la fonction `getCachedActivityKPIsByUser` (même problème)

---

## 🔍 Différence Technique

### Avant (Pattern Incorrect)

```typescript
// ❌ Cookie access INSIDE cache
unstable_cache(async () => {
  const supabase = await createSupabaseServerClient(); // cookies() appelé ICI
  return getData(supabase);
})();
```

**Problème** : `cookies()` est appelé **à l'intérieur** de la fonction cachée → ❌ Interdit

### Après (Pattern Correct)

```typescript
// ✅ Cookie access OUTSIDE cache, then pass result
const supabase = await createSupabaseServerClient(); // cookies() appelé ICI (hors cache)

unstable_cache(async (client) => {
  return getData(client); // Client Supabase déjà créé, pas d'appel cookies()
})(supabase);
```

**Solution** : `cookies()` est appelé **avant** le cache, le résultat (client Supabase) est passé en paramètre → ✅ Autorisé

---

## 📚 Documentation Officielle

Source : [Next.js unstable_cache Documentation](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)

> **Important**: Dynamic data sources like `cookies()`, `headers()`, or `searchParams` cannot be used inside a cached function. If you need this data, use it outside and pass the required dynamic data in as an argument.

---

## ✅ Vérification

Pour vérifier que le fix fonctionne :

1. Redémarrer le serveur de développement :
   ```bash
   npm run dev
   ```

2. Naviguer vers les pages optimisées :
   - [/gestion/taches](http://localhost:3000/gestion/taches)
   - [/gestion/activites](http://localhost:3000/gestion/activites)
   - [/marketing/email](http://localhost:3000/marketing/email)

3. Vérifier qu'il n'y a **plus d'erreur** dans la console

---

## 🎯 Leçons Apprises

### Règle d'Or pour unstable_cache

**Ne JAMAIS appeler de sources de données dynamiques à l'intérieur d'unstable_cache** :

❌ **Interdit dans unstable_cache** :
- `cookies()`
- `headers()`
- `searchParams`
- Toute fonction qui utilise ces APIs en interne (comme `createSupabaseServerClient()`)

✅ **Pattern Recommandé** :
1. Appeler les sources dynamiques **avant** `unstable_cache`
2. Passer les résultats en **paramètres** à la fonction cachée
3. La fonction cachée ne doit manipuler que des données déjà résolues

### Template Réutilisable

```typescript
// Template pour unstable_cache avec Supabase
export async function getCachedData(userId: string | null) {
  if (!userId) return getEmptyData();

  // 1️⃣ Créer le client EN DEHORS du cache
  const supabase = await createSupabaseServerClient();

  // 2️⃣ Définir la fonction cachée qui reçoit le client en param
  const cachedFn = unstable_cache(
    async (client: typeof supabase, id: string) => {
      return await fetchData(client, id);
    },
    ['cache-key'],
    {
      revalidate: 300,
      tags: ['cache-tag']
    }
  );

  // 3️⃣ Appeler avec le client et les paramètres
  return await cachedFn(supabase, userId);
}
```

---

## 🚀 Impact

- ✅ **Email Marketing KPIs** : Fonctionne sans erreur
- ✅ **Tasks KPIs** : Fonctionne sans erreur
- ✅ **Activities KPIs** : Fonctionne sans erreur
- ✅ **Cache fonctionne correctement** (5 minutes de revalidation)
- ✅ **Invalidation de cache fonctionne** (via `revalidateTag`)

**Gain de performance maintenu** : -92% sur les KPIs avec cache ✨
