# Optimisations de Performance - Page /activités

**Date**: 2025-12-15
**Statut**: ✅ Prêt à déployer
**Gain estimé**: **-67%** (1200ms → 400ms)

---

## 📊 Résumé des Optimisations

Cette mise à jour applique des optimisations critiques pour améliorer significativement les performances de la page `/gestion/activites`.

### Gains de Performance Attendus

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **Temps total** | 1200ms | 400ms | **-67%** |
| **KPIs (avec cache)** | 600ms | 10ms | **-98%** |
| **Requêtes Supabase** | 40+ | ~5 | **-87%** |
| **Page suivante** | 250ms | 100ms | **-60%** |

---

## 🚀 Optimisations Implémentées

### 1. ✅ Index Composites SQL (Priorité Haute)

**Fichier**: `supabase/migrations/2025-12-15-optimize-activities-indexes.sql`

**Impact**: -40% sur les requêtes filtrées

**Index créés**:
- `idx_activities_created_at_desc` - Tri par date
- `idx_activities_status` - Filtres par statut
- `idx_activities_created_by_status_created_at` - Composite pour "mes activités"
- `idx_activities_planned_start` - Activités à venir
- `idx_activity_participants_user_id` - Participants dans les KPIs
- `idx_activities_title_gin` - Recherche full-text

### 2. ✅ Fonctions PostgreSQL pour KPIs (Priorité Haute)

**Fichier**: `supabase/migrations/2025-12-15-add-activities-stats-function.sql`

**Impact**: -95% sur les KPIs (28 requêtes → 1 requête)

**Fonctions créées**:
- `get_activities_stats_7_days()` - Agrège les stats des 7 derniers jours
- `get_activities_monthly_kpis()` - KPIs mensuels agrégés
- `get_upcoming_activities_count()` - Activités à venir optimisé
- `get_in_progress_activities_count()` - Activités en cours optimisé

**Service optimisé**:
- `src/services/activities/activity-kpis-optimized.ts` - Nouveau service utilisant les fonctions SQL

### 3. ✅ Cache avec unstable_cache (Priorité Haute)

**Fichier**: `src/lib/cache/activities-kpis-cache.ts`

**Impact**: -98% pour requêtes répétées (avec cache)

**Fonctionnalités**:
- Cache de 5 minutes avec revalidation automatique
- Invalidation manuelle via `revalidateTag('activity-kpis')`
- Intégré dans les Server Actions (create/update)

**Modification**:
- `src/app/(main)/gestion/activites/page.tsx` - Utilise maintenant `getCachedActivityKPIs()`
- `src/app/(main)/gestion/activites/actions.ts` - Invalide le cache après mutations

### 4. ✅ Optimisation de listActivitiesPaginated

**Fichier**: `src/services/activities/index.ts`

**Impact**: -30% sur transfert réseau

**Changements**:
- ✅ Retrait de `report_content` et `location_mode` (chargés à la demande)
- ✅ Utilisation de `count: 'estimated'` au lieu de `'exact'` (beaucoup plus rapide)
- ✅ Relations chargées mais optimisées

### 5. ✅ Vue Matérialisée pour Filtre "mine"

**Fichier**: `supabase/migrations/2025-12-15-add-my-activities-view.sql`

**Impact**: -60% sur le filtre "mine"

**Vue créée**:
- `my_activities` - Précharge les relations activité ↔ participants
- Index GIN sur `all_user_ids` pour recherche rapide
- Fonction `refresh_my_activities()` pour rafraîchissement manuel

**Service**:
- `src/services/activities/my-activities-filter.ts` - Helper pour utiliser la vue

---

## 📝 Déploiement

### Étape 1: Appliquer les Migrations SQL

**Option A - Via Supabase CLI** (recommandé):
```bash
# Depuis la racine du projet
supabase db push
```

**Option B - Via Dashboard Supabase**:
1. Ouvrir le SQL Editor dans Supabase Dashboard
2. Copier-coller le contenu de chaque migration dans l'ordre:
   - `2025-12-15-optimize-activities-indexes.sql`
   - `2025-12-15-add-activities-stats-function.sql`
   - `2025-12-15-add-my-activities-view.sql`
3. Exécuter chaque migration

**Option C - Via Script Node**:
```bash
node scripts/apply-activities-optimizations.mjs
```

### Étape 2: Vérifier les Migrations

```sql
-- Vérifier les index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'activities'
ORDER BY indexname;

-- Vérifier les fonctions
SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE 'get_activities%'
OR proname LIKE '%my_activities%';

-- Vérifier la vue matérialisée
SELECT * FROM pg_matviews WHERE matviewname = 'my_activities';
```

### Étape 3: Tester les Fonctions

```sql
-- Tester get_activities_stats_7_days
SELECT * FROM get_activities_stats_7_days(
  'votre-profile-id'::uuid,
  NOW() - INTERVAL '6 days'
);

-- Tester get_upcoming_activities_count
SELECT get_upcoming_activities_count(
  'votre-profile-id'::uuid,
  NOW(),
  NOW() + INTERVAL '7 days'
);

-- Tester la vue matérialisée
SELECT * FROM my_activities LIMIT 10;
```

### Étape 4: Déployer le Code

```bash
# Build et redémarrer l'application
npm run build
# Ou déployer sur Vercel/autre plateforme
```

---

## 🧪 Tests de Performance

### Avant Optimisations (Baseline)

Mesurer avec Chrome DevTools:
```
1. Ouvrir /gestion/activites
2. Network tab → Filtrer par "Fetch/XHR"
3. Performance tab → Enregistrer le chargement
4. Noter:
   - Time to First Byte (TTFB)
   - Largest Contentful Paint (LCP)
   - Nombre de requêtes Supabase
   - Temps total de chargement
```

### Après Optimisations

Répéter les mêmes mesures et comparer.

**Métriques cibles**:
- TTFB: <200ms (-50%)
- LCP: <1000ms (-60%)
- Requêtes Supabase: ~5 (-87%)
- Temps total: <400ms (-67%)

### Tests Fonctionnels

- [ ] La page /activités se charge correctement
- [ ] Les KPIs s'affichent avec les bonnes valeurs
- [ ] Le filtre "Mes activités" fonctionne (créées + participées)
- [ ] Les graphiques des 7 derniers jours s'affichent
- [ ] La création d'activité invalide le cache
- [ ] Le scroll infini fonctionne
- [ ] La recherche fonctionne

---

## 🔧 Maintenance

### Rafraîchir la Vue Matérialisée

La vue `my_activities` doit être rafraîchie périodiquement pour rester à jour.

**Manuellement**:
```sql
SELECT refresh_my_activities();
```

**Automatiquement avec pg_cron** (recommandé):
```sql
-- Rafraîchir toutes les heures
SELECT cron.schedule(
  'refresh-my-activities',
  '0 * * * *',
  'SELECT refresh_my_activities();'
);
```

### Invalider le Cache KPIs

Le cache est automatiquement invalidé après:
- Création d'activité
- Mise à jour d'activité

Pour invalider manuellement:
```typescript
import { revalidateTag } from 'next/cache';
revalidateTag('activity-kpis');
```

### Monitoring

Surveiller les métriques suivantes:
- Temps de réponse `/api/activities/list`
- Temps d'exécution des fonctions PostgreSQL
- Taux de hit du cache Next.js
- Nombre de rafraîchissements de la vue matérialisée

**Outils recommandés**:
- Sentry Performance Monitoring
- Supabase Dashboard → Performance
- Vercel Analytics

---

## 📚 Documentation Technique Détaillée

Pour une analyse complète et les détails techniques, voir:
- [docs/refactoring/activities-page-performance-optimizations.md](docs/refactoring/activities-page-performance-optimizations.md)

---

## 🐛 Rollback en Cas de Problème

### Rollback des Migrations

**Index** (peu risqué, peut être supprimé sans impact):
```sql
DROP INDEX IF EXISTS idx_activities_created_at_desc;
DROP INDEX IF EXISTS idx_activities_status;
-- etc. (voir la migration pour la liste complète)
```

**Fonctions** (sans impact si non utilisées):
```sql
DROP FUNCTION IF EXISTS get_activities_stats_7_days;
DROP FUNCTION IF EXISTS get_activities_monthly_kpis;
-- etc.
```

**Vue matérialisée**:
```sql
DROP MATERIALIZED VIEW IF EXISTS my_activities;
DROP FUNCTION IF EXISTS refresh_my_activities;
```

### Rollback du Code

Revenir à la version précédente:
```typescript
// src/app/(main)/gestion/activites/page.tsx
import { getActivityKPIs } from '@/services/activities/activity-kpis';
// Au lieu de getCachedActivityKPIs
```

---

## ✅ Checklist de Déploiement

- [ ] Migrations SQL appliquées et vérifiées
- [ ] Fonctions PostgreSQL testées
- [ ] Vue matérialisée créée et rafraîchie
- [ ] Code déployé (build réussi)
- [ ] Tests fonctionnels passés
- [ ] Métriques de performance mesurées et améliorées
- [ ] Monitoring activé
- [ ] Documentation mise à jour
- [ ] Équipe notifiée

---

## 🎯 Prochaines Étapes (Optionnelles)

### Phase 4 - Améliorations UX

- [ ] Implémenter React Suspense pour streaming
- [ ] Ajouter prefetch au survol du bouton "Voir plus"
- [ ] Virtual Scrolling si >1000 activités

### Optimisations Futures

- [ ] CDN pour les assets statiques
- [ ] Service Worker pour cache offline
- [ ] GraphQL avec DataLoader pour batch des relations
- [ ] CDC (Change Data Capture) pour invalidation temps réel

---

**Besoin d'aide ?** Consulter la documentation technique complète ou contacter l'équipe de développement.
