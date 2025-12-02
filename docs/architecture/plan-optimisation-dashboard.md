# Plan d'Optimisation Dashboard - OnpointDoc

**Date**: 30 novembre 2025  
**Objectif**: Optimiser minutieusement le dashboard avec MCP Next.js et Supabase

---

## 🎯 Optimisations Identifiées

### 1. ✅ Cache des Configurations (React.cache)
**Priorité**: Haute  
**Impact**: Performance serveur, réduction requêtes DB

**État actuel**:
- `getUserDashboardConfig()` appelé à chaque render serveur
- Pas de cache entre les requêtes
- Requêtes répétées pour la même config

**Solution**:
```typescript
// Utiliser React.cache() pour mémoriser les configurations
const getCachedDashboardConfig = cache(async (profileId: string, role: DashboardRole) => {
  return await getUserDashboardConfig(profileId, role);
});
```

**Bénéfices**:
- ⚡ Cache automatique par paramètres
- 📉 Réduction requêtes Supabase
- 🚀 Performance améliorée

---

### 2. ✅ Validation Zod pour Configurations
**Priorité**: Moyenne  
**Impact**: Sécurité, robustesse

**État actuel**:
- Pas de validation stricte des configurations
- Risque d'injection ou données corrompues

**Solution**:
```typescript
// Schéma Zod pour UserDashboardConfig
const userDashboardConfigSchema = z.object({
  role: z.enum(['direction', 'manager', 'agent', 'admin']),
  availableWidgets: z.array(z.string()),
  visibleWidgets: z.array(z.string()),
  hiddenWidgets: z.array(z.string()),
});
```

**Bénéfices**:
- 🔒 Type safety strict
- ✅ Validation runtime
- 🛡️ Protection contre données invalides

---

### 3. ✅ Suspense Boundaries pour Streaming
**Priorité**: Haute  
**Impact**: Perception performance, UX

**État actuel**:
- Toutes les données chargées avant affichage
- Pas de streaming progressif

**Solution**:
```tsx
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardWidgetGrid widgets={widgets} dashboardData={data} />
</Suspense>
```

**Bénéfices**:
- ⚡ Affichage progressif
- 🎨 Meilleure UX
- 📊 Time to First Byte amélioré

---

### 4. ✅ Indexation DB (Supabase)
**Priorité**: Haute  
**Impact**: Performance requêtes DB

**État actuel**:
- Tables dashboard sans index explicites
- Requêtes potentiellement lentes

**Solution**:
```sql
-- Index sur dashboard_role_widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_role_widgets_role_enabled 
ON dashboard_role_widgets(role, enabled);

-- Index sur dashboard_user_preferences
CREATE INDEX IF NOT EXISTS idx_dashboard_user_preferences_profile_id 
ON dashboard_user_preferences(profile_id);
```

**Bénéfices**:
- ⚡ Requêtes plus rapides
- 📊 Meilleure scalabilité
- 🔍 Filtres optimisés

---

### 5. ✅ Optimisation Debouncing Realtime
**Priorité**: Basse  
**Impact**: Performance client, réduction re-renders

**État actuel**:
- Debounce de 300ms présent
- Mais peut être optimisé selon le contexte

**Solution**:
- Augmenter à 500ms pour les changements fréquents
- Utiliser throttle pour certains événements

**Bénéfices**:
- ⚡ Moins de re-renders
- 📉 Réduction charge client

---

### 6. ✅ Validation avec MCP Next.js
**Priorité**: Critique  
**Impact**: Qualité code, standards Next.js

**Approche**:
- Utiliser `mcp_next-devtools_nextjs_docs` pour chaque optimisation
- Vérifier les meilleures pratiques Next.js 16+
- Valider avec les outils MCP

---

## 📋 Plan d'Implémentation

### Phase 1: Cache et Validation (Priorité Haute)
1. ✅ Créer cache React.cache() pour configurations
2. ✅ Ajouter validation Zod
3. ✅ Tests et validation

### Phase 2: Streaming (Priorité Haute)
1. ✅ Ajouter Suspense boundaries
2. ✅ Créer composants Skeleton
3. ✅ Tests performance

### Phase 3: Indexation DB (Priorité Haute)
1. ✅ Vérifier structure tables avec MCP Supabase
2. ✅ Créer migration SQL avec index
3. ✅ Appliquer migration

### Phase 4: Optimisations Finales (Priorité Basse)
1. ✅ Ajuster debouncing
2. ✅ Optimisations mineures
3. ✅ Documentation

---

## 🔍 Vérifications MCP Requises

### Avant chaque optimisation:
1. ✅ Consulter MCP Next.js pour meilleures pratiques
2. ✅ Vérifier structure DB avec MCP Supabase
3. ✅ Valider avec outils MCP

---

**État**: 📝 Plan créé - Prêt pour implémentation

