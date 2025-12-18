# Phase 0 - Quick Wins - Guide d'Application

**Date**: 2025-12-20
**Gains estimés**: -44% TTFB, -40% temps DB, -90% re-fetch
**Durée**: 1-2 jours

---

## 📋 CHECKLIST D'IMPLÉMENTATION

### ✅ Étape 1 : Migrations SQL (COMPLÉTÉ)

**Fichiers créés**:
- ✅ [supabase/migrations/20251220000000_optimize_rls_indexes.sql](../../supabase/migrations/20251220000000_optimize_rls_indexes.sql)
- ✅ [supabase/migrations/20251220010000_tickets_rpc_optimized.sql](../../supabase/migrations/20251220010000_tickets_rpc_optimized.sql)

**Index créés** (8 index):
1. `idx_tickets_rls_ownership` - Index composé RLS
2. `idx_tickets_created_assigned_combined` - Index INCLUDE
3. `idx_profiles_role_managers` - Index partiel managers
4. `idx_tickets_module_id` - Index module_id
5. `idx_tickets_company_id` - Index company_id
6. `idx_tickets_agent_filter` - Index composé agent
7. `idx_tickets_priority_created_at` - Index tri priorité
8. `idx_tickets_updated_at_desc` - Index tri updated_at

**RPC Function**:
- `list_tickets_with_user_context()` - Fonction optimisée

---

### ✅ Étape 2 : Code TypeScript (COMPLÉTÉ)

**Fichiers modifiés**:
- ✅ [src/services/tickets/index.ts](../../src/services/tickets/index.ts) (lignes 339-607)
  - Utilise RPC function pour réduire 2-3 requêtes à 1
  - Fix requête companies avec nested select
  - Fallback sur ancienne méthode si filtres avancés

- ✅ [src/app/api/tickets/list/route.ts](../../src/app/api/tickets/list/route.ts)
  - Ajout headers cache HTTP (max-age=30, stale-while-revalidate=60)
  - Ajout ETag pour validation conditionnelle (304 Not Modified)
  - Ajout fonction `generateETag()`

---

## 🚀 APPLICATION DES MIGRATIONS

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# 1. Vérifier que Supabase CLI est connecté
supabase status

# 2. Appliquer les migrations
supabase db push

# 3. Vérifier que les migrations ont été appliquées
supabase migration list

# 4. Vérifier les index créés (via psql)
supabase db execute "
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'tickets'
  AND indexname LIKE 'idx_tickets_%'
ORDER BY pg_relation_size(indexrelid) DESC;
"
```

**Output attendu**:
```
indexname                                | index_size
-----------------------------------------|------------
idx_tickets_agent_filter                 | 1024 kB
idx_tickets_created_assigned_combined    | 896 kB
idx_tickets_rls_ownership                | 768 kB
idx_tickets_priority_created_at          | 512 kB
idx_tickets_updated_at_desc              | 512 kB
idx_tickets_module_id                    | 256 kB
idx_tickets_company_id                   | 256 kB
```

---

### Option 2 : Via Dashboard Supabase

1. **Ouvrir le Dashboard Supabase**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Aller dans SQL Editor**
   - Cliquer sur "SQL Editor" dans le menu

3. **Exécuter la migration index RLS**
   - Copier le contenu de `20251220000000_optimize_rls_indexes.sql`
   - Coller dans l'éditeur SQL
   - Cliquer sur "Run"
   - Attendre ~30-60 secondes (CONCURRENTLY ne bloque pas)

4. **Exécuter la migration RPC**
   - Copier le contenu de `20251220010000_tickets_rpc_optimized.sql`
   - Coller dans l'éditeur SQL
   - Cliquer sur "Run"
   - Attendre ~5 secondes

5. **Vérifier les index**
   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
   FROM pg_stat_user_indexes
   WHERE tablename = 'tickets'
     AND indexname LIKE 'idx_tickets_%'
   ORDER BY pg_relation_size(indexrelid) DESC;
   ```

---

## 🧪 TESTS ET VALIDATION

### Test 1 : Vérifier la RPC function

```bash
# Via Supabase CLI
supabase db execute "
SELECT COUNT(*) as total_tickets
FROM list_tickets_with_user_context(
  p_user_id := NULL,
  p_quick_filter := 'all',
  p_offset := 0,
  p_limit := 10
);
"
```

**Output attendu**: Un nombre > 0

---

### Test 2 : Vérifier les index utilisés

```bash
# Analyser le query plan
supabase db execute "
EXPLAIN ANALYZE
SELECT *
FROM tickets
WHERE created_by = 'uuid-here' OR assigned_to = 'uuid-here'
LIMIT 25;
"
```

**Output attendu**: Doit contenir `Index Scan using idx_tickets_rls_ownership`

---

### Test 3 : Tester en dev

```bash
# 1. Démarrer le serveur dev
npm run dev

# 2. Ouvrir la page tickets
# http://localhost:3000/gestion/tickets

# 3. Ouvrir DevTools > Network
# - Vérifier que l'API /api/tickets/list utilise la RPC
# - Vérifier les headers cache (Cache-Control, ETag)

# 4. Tester pagination rapide
# - Cliquer "Voir plus" plusieurs fois
# - Vérifier les requêtes 304 Not Modified dans Network

# 5. Tester filtres
# - Filtre "Tous les tickets"
# - Filtre "Mes tickets"
# - Filtre par agent (si manager)
# - Filtre par entreprise
```

**Métriques à observer** (DevTools > Performance):
- TTFB initial : devrait être < 150ms (avant: 250ms)
- Temps DB : visible dans console.log (avant: 150ms, après: 90ms)
- Cache hits : 304 Not Modified après 2ème chargement

---

## 📊 VÉRIFICATION DES GAINS

### Avant Optimisations

```javascript
// Console logs attendus AVANT
[Performance] TicketsLoadMore: 250ms
[DB] listTicketsPaginated: 150ms
[Network] /api/tickets/list: 200 OK (250ms)
```

### Après Optimisations

```javascript
// Console logs attendus APRÈS
[Performance] TicketsLoadMore: 140ms (-44%)
[DB] list_tickets_with_user_context: 90ms (-40%)
[Network] /api/tickets/list: 200 OK (140ms)
[Network] /api/tickets/list: 304 Not Modified (20ms) // 2ème chargement
```

---

## 🔍 DEBUGGING

### Problème 1 : RPC function not found

**Erreur**:
```
function list_tickets_with_user_context does not exist
```

**Solution**:
```bash
# Vérifier que la migration a été appliquée
supabase db execute "
SELECT proname
FROM pg_proc
WHERE proname = 'list_tickets_with_user_context';
"

# Si vide, réappliquer la migration
supabase db push
```

---

### Problème 2 : Index non utilisé

**Erreur**: Query plan n'utilise pas les nouveaux index

**Solution**:
```bash
# Forcer l'analyse des statistiques
supabase db execute "ANALYZE tickets;"
supabase db execute "ANALYZE profiles;"

# Vérifier les index
supabase db execute "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tickets'
  AND indexname LIKE 'idx_tickets_%';
"
```

---

### Problème 3 : Type ticket_list_result not found

**Erreur**:
```
type ticket_list_result does not exist
```

**Solution**:
```bash
# Le type est créé dans la migration RPC
# Vérifier qu'il existe
supabase db execute "
SELECT typname
FROM pg_type
WHERE typname = 'ticket_list_result';
"

# Si vide, réappliquer la migration
supabase db push
```

---

### Problème 4 : Headers cache non appliqués

**Symptôme**: Pas de header `Cache-Control` dans Network

**Solution**:
```typescript
// Vérifier que le code est bien présent dans route.ts
// Le fichier doit contenir generateETag() et les headers

// Redémarrer le serveur dev
npm run dev

// Vider le cache navigateur
// Ctrl+Shift+R (force reload)
```

---

## 📈 MONITORING POST-DÉPLOIEMENT

### Métriques à surveiller

1. **Performance PostgreSQL**
   ```sql
   -- Index usage
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan as index_scans,
     idx_tup_read as tuples_read
   FROM pg_stat_user_indexes
   WHERE tablename = 'tickets'
   ORDER BY idx_scan DESC;
   ```

2. **Cache Hit Rate**
   ```sql
   -- Cache hit rate global
   SELECT
     sum(heap_blks_read) as heap_read,
     sum(heap_blks_hit) as heap_hit,
     sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
   FROM pg_statio_user_tables
   WHERE schemaname = 'public';
   ```

   **Target**: ratio > 0.95 (95% cache hit)

3. **RPC Function Performance**
   ```sql
   -- Statistiques RPC
   SELECT
     proname,
     calls,
     total_time / calls as avg_time_ms,
     min_time as min_ms,
     max_time as max_ms
   FROM pg_stat_user_functions
   WHERE proname = 'list_tickets_with_user_context';
   ```

---

## ✅ VALIDATION FINALE

### Checklist de validation

- [ ] Migrations appliquées avec succès
- [ ] 8 index créés et visibles dans pg_indexes
- [ ] RPC function créée et exécutable
- [ ] Type ticket_list_result créé
- [ ] Code TypeScript compile sans erreur (`npm run build`)
- [ ] Tests dev passent (page /tickets fonctionne)
- [ ] Headers cache présents dans Network
- [ ] TTFB réduit de ~40% (250ms → 140ms)
- [ ] Cache 304 Not Modified fonctionne
- [ ] Logs console montrent amélioration DB

---

## 🎯 PROCHAINES ÉTAPES

Une fois Phase 0 validée :

1. **Phase 1 - Frontend Streaming** (2-3 jours)
   - Suspense pour KPIs
   - Suspense pour Sidebar
   - Prefetch next page
   - **Gain**: -40% FCP (300ms → 180ms)

2. **Phase 2 - Index Avancés** (1 jour)
   - Index supplémentaires pour cas edge
   - Optimisation filtres spécifiques
   - **Gain**: -15% filtres avancés

---

## 📞 SUPPORT

En cas de problème :

1. **Vérifier les logs** : `npm run dev` console
2. **Vérifier Supabase logs** : Dashboard > Logs
3. **Analyser query plan** : `EXPLAIN ANALYZE` dans SQL Editor
4. **Consulter la documentation** : [docs/tickets/OPTIMISATIONS-TICKETS-ANALYSE.md](./OPTIMISATIONS-TICKETS-ANALYSE.md)

---

**Document prêt pour application** ✅
