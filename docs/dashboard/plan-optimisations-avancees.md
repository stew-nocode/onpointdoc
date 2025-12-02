# Plan d'Optimisations Avancées - Dashboard

## 🎯 Objectif

Optimiser les performances du dashboard avec des techniques avancées de Next.js 16+ et Supabase.

---

## 📊 Analyse Actuelle

### **Points d'Amélioration Identifiés** :

1. **❌ Pas de cache côté serveur** : `noStore()` désactive complètement le cache
2. **⚠️ Pas de React.cache()** dans tous les services dashboard
3. **⚠️ Pas de streaming optimisé** : Tous les widgets chargent en même temps
4. **⚠️ Pas de lazy loading** : Tous les composants chargent au démarrage
5. **⚠️ Requêtes Supabase non optimisées** : Pas de vérification des index

---

## 🚀 Optimisations Proposées

### **Phase 1 : Caching avec React.cache() - ✅ TERMINÉ**

**Problème** : Les fonctions dashboard font des appels redondants dans le même render tree.

**Solution** : Utiliser `React.cache()` pour éviter les appels redondants dans le même render tree.

**⚠️ LIMITATION** : On ne peut PAS utiliser `unstable_cache()` car les fonctions dashboard utilisent `cookies()` via `createSupabaseServerClient()`, et Next.js ne permet pas d'utiliser des sources dynamiques (`cookies()`) dans les fonctions mises en cache avec `unstable_cache()`.

**Bénéfices** :
- ✅ Évite les appels redondants dans le même render tree
- ✅ Meilleure performance lors des re-renders
- ✅ Cohérence avec les best practices React

**Fichiers modifiés** :
- ✅ `src/services/dashboard/mttr-calculation.ts`
- ✅ `src/services/dashboard/ticket-flux.ts`
- ✅ `src/services/dashboard/workload-distribution.ts`
- ✅ `src/services/dashboard/product-health.ts`
- ✅ `src/services/dashboard/operational-alerts.ts`

---

### **Phase 2 : React.cache() pour Mémoïsation - ✅ TERMINÉ**

**Note** : Cette phase est fusionnée avec la Phase 1 car `React.cache()` est la seule option viable pour les fonctions dashboard qui utilisent `cookies()`.

**Fichiers modifiés** :
- ✅ Tous les services dashboard utilisent maintenant `React.cache()`

---

### **Phase 3 : Streaming avec Suspense Granulaire**

**Problème** : Tous les widgets chargent en même temps, pas de progressive loading.

**Solution** : Wrapper chaque widget dans son propre `Suspense` avec skeleton.

**Bénéfices** :
- ✅ Meilleure UX (affichage progressif)
- ✅ Time to First Contentful Paint amélioré
- ✅ Pas de blocage sur un widget lent

**Fichiers à modifier** :
- `src/components/dashboard/widgets/widget-grid.tsx`
- Créer des skeletons individuels pour chaque widget

---

### **Phase 4 : Lazy Loading des Composants Lourds**

**Problème** : Tous les composants Charts chargent au démarrage.

**Solution** : Utiliser `next/dynamic` avec `loading` pour les composants lourds.

**Bénéfices** :
- ✅ Réduction du bundle initial
- ✅ Meilleur Time to Interactive
- ✅ Chargement à la demande

**Composants à lazy load** :
- `MTTREvolutionChart`
- `TicketsDistributionChart`
- `SupportEvolutionChartV2`
- `TopBugsModulesTable`
- `WorkloadByAgentTable`

---

### **Phase 5 : Optimisation des Requêtes Supabase**

**Problème** : Pas de vérification des index sur les requêtes critiques.

**Solution** : Analyser les requêtes et créer des index si nécessaire.

**Bénéfices** :
- ✅ Requêtes plus rapides
- ✅ Moins de charge sur la base
- ✅ Meilleure scalabilité

**Actions** :
1. Analyser les requêtes dans les services dashboard
2. Identifier les colonnes utilisées dans WHERE, ORDER BY, JOIN
3. Créer des index composites si nécessaire
4. Utiliser `explain` pour vérifier les plans d'exécution

---

### **Phase 6 : Debouncing des Filtres Globaux**

**Problème** : Les changements de période déclenchent immédiatement un fetch.

**Solution** : Ajouter un debouncing (300ms) sur les changements de période.

**Bénéfices** :
- ✅ Moins de requêtes inutiles
- ✅ Meilleure performance
- ✅ UX plus fluide

**Fichiers à modifier** :
- `src/components/dashboard/unified-dashboard-with-widgets.tsx`

---

## 📋 Ordre d'Exécution Recommandé

1. ✅ **Phase 1** : React.cache() (TERMINÉ - évite les appels redondants)
2. ✅ **Phase 2** : React.cache() (TERMINÉ - fusionné avec Phase 1)
3. **Phase 3** : Streaming granulaire (améliore l'UX)
4. **Phase 4** : Lazy loading (réduction du bundle)
5. **Phase 5** : Optimisation Supabase (long terme)
6. **Phase 6** : Debouncing (polish final)

---

## 🎯 Métriques de Succès

### **Avant** :
- ❌ Pas de cache (toutes les requêtes à chaque chargement)
- ❌ Bundle initial : ~XXX KB
- ❌ Time to First Contentful Paint : ~XXX ms
- ❌ Time to Interactive : ~XXX ms

### **Après** :
- ✅ Cache intelligent (30s-1min) avec tags
- ✅ Bundle initial : -XX% (lazy loading)
- ✅ Time to First Contentful Paint : -XX%
- ✅ Time to Interactive : -XX%
- ✅ Requêtes Supabase : -XX% (cache + React.cache)

---

## 🔍 Points d'Attention

### **Cache Invalidation**

Les tags doivent être invalidés lors de :
- Création/modification de ticket → `revalidateTag('tickets')`
- Changement de statut → `revalidateTag('tickets')`
- Création/modification d'activité → `revalidateTag('activities')`
- Création/modification de tâche → `revalidateTag('tasks')`

### **Streaming et Suspense**

⚠️ **Important** : Chaque widget doit avoir son propre `Suspense` pour un streaming optimal.

### **Lazy Loading**

⚠️ **Important** : Ne pas lazy load les KPIs (ils sont critiques pour l'UX).

---

## 📝 Checklist d'Implémentation

### **Phase 1 - Caching Intelligent**
- [ ] Créer fonction utilitaire `cachedDashboardService()`
- [ ] Ajouter `unstable_cache` avec tags dans `ceo-kpis.ts`
- [ ] Ajouter `unstable_cache` dans `mttr-calculation.ts`
- [ ] Ajouter `unstable_cache` dans `ticket-flux.ts`
- [ ] Ajouter `unstable_cache` dans `workload-distribution.ts`
- [ ] Ajouter `unstable_cache` dans `product-health.ts`
- [ ] Tester l'invalidation avec `revalidateTag()`

### **Phase 2 - React.cache()**
- [ ] Ajouter `React.cache()` dans `ceo-kpis.ts`
- [ ] Ajouter `React.cache()` dans `mttr-calculation.ts`
- [ ] Ajouter `React.cache()` dans `ticket-flux.ts`
- [ ] Ajouter `React.cache()` dans `workload-distribution.ts`
- [ ] Ajouter `React.cache()` dans `product-health.ts`
- [ ] Ajouter `React.cache()` dans `operational-alerts.ts`

### **Phase 3 - Streaming Granulaire**
- [ ] Wrapper chaque widget dans `Suspense` individuel
- [ ] Créer des skeletons spécifiques pour chaque widget
- [ ] Tester le streaming progressif

### **Phase 4 - Lazy Loading**
- [ ] Lazy load `MTTREvolutionChart`
- [ ] Lazy load `TicketsDistributionChart`
- [ ] Lazy load `SupportEvolutionChartV2`
- [ ] Lazy load `TopBugsModulesTable`
- [ ] Lazy load `WorkloadByAgentTable`
- [ ] Mesurer la réduction du bundle

### **Phase 5 - Optimisation Supabase**
- [ ] Analyser les requêtes dans les services
- [ ] Identifier les index manquants
- [ ] Créer les index via migration Supabase
- [ ] Vérifier les plans d'exécution avec `explain`

### **Phase 6 - Debouncing**
- [ ] Ajouter debouncing (300ms) sur `handlePeriodChange`
- [ ] Ajouter debouncing sur `handleDateRangeChange`
- [ ] Ajouter debouncing sur `handleYearChange`
- [ ] Tester la fluidité de l'UX

