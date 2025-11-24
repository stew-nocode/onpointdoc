# 🐌 Audit Performance - Dashboard

**Date**: 2025-01-16  
**Problèmes signalés**:
- ❌ Application qui **sacade** lors des clics ou scroll
- ❌ Transitions **light/dark mode non fluides** et progressives

---

## 🔍 Problèmes identifiés

### 1. **Re-renders excessifs**

#### ❌ Problème 1.1: Création d'objet à chaque render

**Fichier**: `src/components/dashboard/unified-dashboard-with-widgets.tsx`

**Lignes 121-127**: Création d'un nouvel objet à chaque render
```typescript
// ❌ PROBLÈME : Nouvel objet créé à chaque render
const filteredAlerts = filterAlertsByRole(data.alerts, role);
const dashboardDataWithFilteredAlerts = {
  ...data,
  alerts: filteredAlerts,
};
```

**Impact**: 
- Tous les widgets reçoivent un nouvel objet `dashboardData` même si les données n'ont pas changé
- Tous les widgets se re-rendent inutilement
- Performance dégradée lors du scroll/clic

**Solution**: Utiliser `useMemo` pour mémoriser l'objet

---

#### ❌ Problème 1.2: Callbacks non stables dans les hooks realtime

**Fichiers**: 
- `src/hooks/dashboard/use-realtime-dashboard-data.ts` (ligne 41)
- `src/hooks/dashboard/use-realtime-widget-config.ts` (ligne 62)

**Problème**: Les callbacks `onDataChange` et `onConfigChange` sont recréés à chaque render
```typescript
// ❌ PROBLÈME : Nouvelle fonction à chaque render
useRealtimeDashboardData({
  period,
  onDataChange: () => loadData(period), // Nouvelle référence à chaque render
});
```

**Impact**:
- Le `useEffect` se déclenche à chaque render car `onDataChange` change
- Les channels Supabase sont désabonnés puis réabonnés en continu
- Perte de connexion/reconnexion = saccades

**Solution**: Utiliser `useRef` pour stabiliser les callbacks

---

#### ❌ Problème 1.3: Absence de memoization des widgets

**Fichier**: `src/components/dashboard/widgets/widget-grid.tsx`

**Problème**: Aucun `React.memo` sur les widgets individuels
```typescript
// ❌ PROBLÈME : Tous les widgets se re-rendent même si props identiques
{widgets.map(({ id, component: WidgetComponent, props }) => (
  <WidgetComponent {...props} />
))}
```

**Impact**: 
- Chaque widget se re-rend même si ses props n'ont pas changé
- Avec 10+ widgets, cela multiplie les re-renders

**Solution**: Mémoïser les widgets ou utiliser `useMemo` pour les props

---

### 2. **Transitions CSS problématiques**

#### ❌ Problème 2.1: Transition globale sur `body`

**Fichier**: `src/app/globals.css` - Ligne 192
```css
/* ❌ PROBLÈME : Transition globale qui affecte TOUS les éléments */
body {
  transition: background-color 0.2s ease, color 0.2s ease;
}
```

**Impact**:
- **Tous les éléments** héritent de cette transition via l'héritage CSS
- Lors du scroll/clic, le navigateur doit calculer les transitions pour tous les éléments
- Causent des **saccades** lors des interactions

**Solution**: Supprimer la transition globale, appliquer uniquement aux éléments spécifiques

---

#### ❌ Problème 2.2: Transition sur scrollbar

**Fichier**: `src/app/globals.css` - Lignes 142, 164
```css
/* ❌ PROBLÈME : Transitions sur scrollbar peuvent causer des saccades */
::-webkit-scrollbar-thumb {
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
```

**Impact**: 
- Transitions déclenchées lors du scroll
- Peuvent causer des saccades

**Solution**: Supprimer ou optimiser les transitions scrollbar

---

#### ❌ Problème 2.3: Conflit entre `disableTransitionOnChange` et transitions CSS

**Fichier**: `src/components/providers/theme-provider.tsx` - Ligne 15
```typescript
disableTransitionOnChange // ✅ Activé
```

**Mais**: Les transitions CSS dans `globals.css` restent actives

**Impact**: 
- next-themes tente de désactiver les transitions
- Mais les transitions CSS restent actives
- Résultat : **transitions progressives** au lieu d'un changement instantané
- Les éléments changent progressivement au lieu de tous en même temps

**Solution**: Vérifier que la classe `no-transition` est bien appliquée ou désactiver les transitions CSS

---

#### ❌ Problème 2.4: Trop de classes `dark:` dans le DOM

**Impact observé**: 
- Chaque élément avec `dark:` doit être re-rendu lors du changement de thème
- Avec 100+ éléments `dark:` sur la page, cela cause une transition progressive

**Solution**: Utiliser CSS variables pour les couleurs au lieu de classes Tailwind `dark:`

---

### 3. **Hooks realtime non optimisés**

#### ❌ Problème 3.1: Pas de debouncing

**Fichiers**: 
- `src/hooks/dashboard/use-realtime-dashboard-data.ts`
- `src/hooks/dashboard/use-realtime-widget-config.ts`

**Problème**: Chaque changement en DB déclenche immédiatement un re-render complet

**Impact**: 
- Si plusieurs changements arrivent rapidement, plusieurs re-renders s'enchaînent
- Causent des saccades

**Solution**: Ajouter un debouncing (300-500ms)

---

#### ❌ Problème 3.2: Réabonnement fréquent

**Problème**: Les callbacks changent à chaque render, provoquant des désabonnements/réabonnements

**Impact**: Perte de connexion/reconnexion = saccades

---

### 4. **Calculs redondants**

#### ❌ Problème 4.1: Filtrage des alertes à chaque render

**Fichier**: `src/components/dashboard/unified-dashboard-with-widgets.tsx` - Ligne 121

**Problème**: `filterAlertsByRole` appelé à chaque render même si les alertes n'ont pas changé

**Solution**: Utiliser `useMemo`

---

## ✅ Solutions proposées

### Solution 1: Optimiser les re-renders

**Fichier**: `src/components/dashboard/unified-dashboard-with-widgets.tsx`

```typescript
import { useMemo } from 'react';

// ✅ Mémoriser le filtrage des alertes
const filteredAlerts = useMemo(
  () => filterAlertsByRole(data.alerts, role),
  [data.alerts, role]
);

// ✅ Mémoriser l'objet dashboardData
const dashboardDataWithFilteredAlerts = useMemo(
  () => ({
    ...data,
    alerts: filteredAlerts,
  }),
  [data, filteredAlerts]
);
```

---

### Solution 2: Stabiliser les callbacks avec `useRef`

**Fichier**: `src/components/dashboard/unified-dashboard-with-widgets.tsx`

```typescript
import { useRef, useCallback } from 'react';

// ✅ Référence stable pour le callback
const loadDataRef = useRef<(period: Period) => void>();
loadDataRef.current = loadData;

// ✅ Wrapper stable pour le hook realtime
const stableOnDataChange = useCallback(() => {
  loadDataRef.current?.(period);
}, [period]);

useRealtimeDashboardData({
  period,
  onDataChange: stableOnDataChange,
});
```

---

### Solution 3: Optimiser les transitions CSS

**Fichier**: `src/app/globals.css`

```css
/* ✅ SUPPRIMER : Transition globale sur body */
body {
  /* transition: background-color 0.2s ease, color 0.2s ease; ❌ SUPPRIMÉ */
  min-height: 100vh;
  background-color: #f9fafb;
  color: #1f2937;
}

/* ✅ OPTIONNEL : Transition uniquement sur les éléments spécifiques */
.kpi-card,
.chart-card,
.table-card {
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

/* ✅ OPTIMISER : Supprimer transitions scrollbar ou les réduire */
::-webkit-scrollbar-thumb {
  /* transition: background-color 0.2s ease, border-color 0.2s ease; ❌ SUPPRIMÉ */
  background: #94a3b8;
  border-radius: 6px;
  border: 2px solid #E2ECFE;
}

/* ✅ OU : Transition plus rapide et uniquement au hover */
::-webkit-scrollbar-thumb {
  transition: background-color 0.1s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #3B82F6 !important;
  transition: background-color 0.15s ease;
}
```

---

### Solution 4: Utiliser CSS variables pour le dark mode

**Alternative** : Utiliser CSS variables au lieu de classes `dark:` pour réduire les re-renders

---

### Solution 5: Ajouter React.memo sur les widgets

**Fichier**: `src/components/dashboard/widgets/widget-grid.tsx`

```typescript
import { memo } from 'react';

// ✅ Mémoïser chaque widget
const MemoizedWidget = memo(({ id, component: WidgetComponent, props }) => (
  <WidgetComponent {...props} />
));
```

---

### Solution 6: Debouncing pour les hooks realtime

**Fichier**: `src/hooks/dashboard/use-realtime-dashboard-data.ts`

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash'; // ou implémenter une fonction debounce

const debouncedOnChange = useMemo(
  () => debounce(onDataChange, 300),
  [onDataChange]
);
```

---

## 📊 Impact estimé

### Problèmes actuels
- ❌ **Re-renders** : Tous les widgets à chaque changement
- ❌ **Transitions** : Globales, causant des saccades sur tout
- ❌ **Callbacks** : Recréés à chaque render → réabonnements fréquents
- ❌ **Calculs** : Redondants (filtrage alertes, création objets)

### Après optimisations
- ✅ **Re-renders** : Uniquement les widgets concernés (≈90% de réduction)
- ✅ **Transitions** : Ciblées uniquement → fluides
- ✅ **Callbacks** : Stables → pas de réabonnement
- ✅ **Calculs** : Mémorisés → pas de recalcul inutile

---

## 🎯 Plan d'action (priorité)

### Phase 1: Corrections critiques (impact immédiat) ⚡

1. ✅ Supprimer transition globale sur `body`
2. ✅ Utiliser `useMemo` pour `dashboardDataWithFilteredAlerts`
3. ✅ Utiliser `useMemo` pour `filteredAlerts`
4. ✅ Optimiser/Supprimer transitions scrollbar

### Phase 2: Optimisations callbacks (impact moyen) 🔧

5. ✅ Stabiliser callbacks avec `useRef` dans les hooks realtime
6. ✅ Ajouter debouncing (300ms) aux hooks realtime

### Phase 3: Optimisations avancées (impact faible) 🚀

7. ✅ Ajouter `React.memo` sur les widgets individuels
8. ✅ Optimiser transitions avec `will-change` si nécessaire

---

## 🔍 Vérifications à faire

- [ ] Tester la fluidité du scroll avant/après
- [ ] Tester les transitions light/dark avant/après
- [ ] Utiliser React DevTools Profiler pour mesurer les re-renders
- [ ] Vérifier Lighthouse Performance score
- [ ] Tester sur Chrome, Firefox, Safari
