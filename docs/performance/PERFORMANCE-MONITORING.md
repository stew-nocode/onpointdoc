# 📊 Performance Monitoring - Documentation

**Date**: 2025-01-16  
**Objectif**: Système de monitoring des performances en développement  
**Statut**: ✅ Implémenté

---

## 🎯 Vue d'ensemble

Un système complet de monitoring des performances a été mis en place pour mesurer et diagnostiquer les problèmes de performance dans l'application, **uniquement en mode développement**.

### Ce qui est mesuré

1. **Core Web Vitals** (Google)
   - **LCP** (Largest Contentful Paint) - Temps de chargement du contenu principal
   - **FID/INP** (First Input Delay / Interaction to Next Paint) - Réactivité aux interactions
   - **CLS** (Cumulative Layout Shift) - Stabilité visuelle
   - **FCP** (First Contentful Paint) - Temps jusqu'au premier rendu
   - **TTFB** (Time to First Byte) - Temps jusqu'à la première réponse serveur

2. **Re-renders React**
   - Comptage des re-renders par composant
   - Alertes si seuil dépassé
   - Comparaison des props pour identifier les causes

3. **Temps de chargement custom**
   - Temps de chargement du dashboard
   - Temps de rendu des composants
   - Temps d'exécution des fonctions

---

## 🚀 Utilisation

### 1. Performance Monitor (Overlay)

Un overlay flottant est automatiquement disponible en développement.

**Comment l'utiliser** :
1. Démarrer l'application en mode dev (`npm run dev`)
2. Cliquer sur le bouton **📊** en bas à droite de l'écran
3. Voir les métriques en temps réel dans l'overlay

**Fonctionnalités** :
- ✅ Minimiser/Maximiser l'overlay
- ✅ Fermer l'overlay
- ✅ Affichage des Core Web Vitals avec ratings (✅/⚠️/❌)
- ✅ Compteur de re-renders du monitor lui-même

**Visibilité** : Visible uniquement si `NODE_ENV === 'development'`

---

### 2. Hooks de Performance

#### `useWebVitals()`

Mesure automatiquement les Core Web Vitals.

```typescript
import { useWebVitals } from '@/hooks/performance';

function MyComponent() {
  const { LCP, FID, CLS, FCP, TTFB } = useWebVitals();
  
  // Les métriques sont automatiquement mesurées
  // Disponibles dans l'état du composant
}
```

**Retourne** :
```typescript
{
  LCP: WebVitalMetric | null;
  FID: WebVitalMetric | null;
  INP: WebVitalMetric | null;
  CLS: WebVitalMetric | null;
  FCP: WebVitalMetric | null;
  TTFB: WebVitalMetric | null;
}
```

---

#### `usePerformanceMeasure()`

Mesure le temps d'exécution d'opérations custom.

**Option 1 : Mesure automatique du temps de rendu**
```typescript
import { usePerformanceMeasure } from '@/hooks/performance';

function MyComponent() {
  usePerformanceMeasure({
    name: 'MyComponentRender',
    measureRender: true, // Mesure automatiquement le temps de rendu
    logToConsole: true,  // Log dans la console (dev uniquement)
  });
  
  // ... reste du composant
}
```

**Option 2 : Mesure manuelle**
```typescript
import { usePerformanceMeasure } from '@/hooks/performance';

function MyComponent() {
  const { startMeasure, endMeasure } = usePerformanceMeasure({
    name: 'DataLoad',
    logToConsole: true,
  });
  
  async function loadData() {
    startMeasure();
    await fetchData();
    endMeasure(); // Affiche le temps écoulé dans la console
  }
}
```

**Option 3 : Mesure d'une fonction**
```typescript
import { usePerformanceMeasure } from '@/hooks/performance';

function MyComponent() {
  const { measureFunction } = usePerformanceMeasure({
    name: 'ProcessData',
  });
  
  const result = measureFunction(() => {
    return processComplexData();
  }); // Mesure automatiquement le temps d'exécution
}
```

---

#### `useRenderCount()`

Compte les re-renders d'un composant et affiche des alertes.

```typescript
import { useRenderCount } from '@/hooks/performance';

function MyComponent() {
  const renderCount = useRenderCount({
    componentName: 'MyComponent',
    warningThreshold: 5, // Alerte si > 5 re-renders
    logToConsole: true,
  });
  
  // ... reste du composant
}
```

**Options** :
- `componentName` : Nom affiché dans les logs
- `warningThreshold` : Seuil d'alerte (défaut: 10)
- `logToConsole` : Log dans la console (défaut: true en dev)
- `onRender` : Callback appelé à chaque render

---

#### `usePropsComparison()`

Compare les props entre les renders pour identifier les changements.

```typescript
import { usePropsComparison } from '@/hooks/performance';

function MyComponent(props: MyProps) {
  const { changedProps, hasChanges } = usePropsComparison(props, 'MyComponent');
  
  // Si hasChanges === true, changedProps contient les props qui ont changé
  // Log automatique dans la console (dev uniquement)
}
```

---

### 3. Fonction utilitaire `measureExecution()`

Mesure simple du temps d'exécution d'une fonction (sans hook).

```typescript
import { measureExecution } from '@/hooks/performance';

// Fonction synchrone
const [result, duration] = measureExecution('processData', () => {
  return processData();
});

// Fonction asynchrone
const [resultPromise, durationPromise] = measureExecution('fetchData', async () => {
  return await fetch('/api/data');
});

const result = await resultPromise;
const duration = await durationPromise;
```

---

## 📊 Interprétation des métriques

### Core Web Vitals - Seuils

| Métrique | ✅ Good | ⚠️ Needs Improvement | ❌ Poor |
|----------|---------|----------------------|---------|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** | ≤ 100ms | 100ms - 300ms | > 300ms |
| **INP** | ≤ 200ms | 200ms - 500ms | > 500ms |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **TTFB** | ≤ 800ms | 800ms - 1.8s | > 1.8s |

---

## 🔍 Exemples d'utilisation

### Exemple 1 : Identifier un composant qui se re-rend trop souvent

```typescript
import { useRenderCount } from '@/hooks/performance';

function DashboardWidget({ data }: { data: WidgetData }) {
  const renderCount = useRenderCount({
    componentName: 'DashboardWidget',
    warningThreshold: 3, // Alerte si > 3 re-renders
  });
  
  // Si l'alerte se déclenche, vérifier :
  // 1. Les props qui changent (utiliser usePropsComparison)
  // 2. Si React.memo() peut aider
  // 3. Si useMemo() est nécessaire pour les calculs
  
  return <div>...</div>;
}
```

### Exemple 2 : Mesurer le temps de chargement d'un dashboard

```typescript
import { usePerformanceMeasure } from '@/hooks/performance';

function Dashboard() {
  const { startMeasure, endMeasure } = usePerformanceMeasure({
    name: 'DashboardLoad',
    logToConsole: true,
  });
  
  useEffect(() => {
    startMeasure();
    loadDashboardData().finally(() => {
      endMeasure(); // Affiche le temps de chargement
    });
  }, []);
  
  return <div>...</div>;
}
```

### Exemple 3 : Diagnostiquer des props qui changent

```typescript
import { usePropsComparison } from '@/hooks/performance';

function ExpensiveComponent({ data, config, filters }) {
  const { changedProps } = usePropsComparison(
    { data, config, filters },
    'ExpensiveComponent'
  );
  
  // La console affichera automatiquement quelles props ont changé
  // Ex: "🔄 [Props Change] ExpensiveComponent.data: { old } → { new }"
  
  return <div>...</div>;
}
```

---

## 🎨 Personnalisation

### Désactiver les logs en développement

Par défaut, tous les hooks loggent dans la console en développement. Pour désactiver :

```typescript
useRenderCount({
  componentName: 'MyComponent',
  logToConsole: false, // Désactiver les logs
});
```

### Changer les seuils d'alerte

```typescript
useRenderCount({
  componentName: 'MyComponent',
  warningThreshold: 5, // Alerte si > 5 re-renders
});
```

---

## 🚨 Dépannage

### Le Performance Monitor ne s'affiche pas

**Vérifications** :
1. ✅ L'application est en mode développement (`NODE_ENV === 'development'`)
2. ✅ Le bouton 📊 est visible en bas à droite
3. ✅ Vérifier la console pour d'éventuelles erreurs

### Les métriques ne se remplissent pas

**Causes possibles** :
1. ⚠️ Certaines métriques nécessitent des interactions utilisateur (FID/INP)
2. ⚠️ Certaines métriques nécessitent que la page soit chargée (LCP, FCP)
3. ⚠️ PerformanceObserver peut ne pas être supporté sur certains navigateurs

**Solution** : Les métriques se remplissent progressivement. Attendre quelques secondes après le chargement de la page.

### Trop de logs dans la console

**Solution** : Désactiver les logs pour les composants non critiques :

```typescript
useRenderCount({
  componentName: 'MyComponent',
  logToConsole: false,
});
```

---

## 📁 Structure des fichiers

```
src/
├── hooks/
│   └── performance/
│       ├── index.ts                    # Exports centralisés
│       ├── use-web-vitals.ts          # Hook Core Web Vitals
│       ├── use-performance-measure.ts # Hook mesures custom
│       └── use-render-count.ts        # Hook comptage re-renders
└── components/
    └── performance/
        ├── index.ts                    # Exports centralisés
        └── performance-monitor.tsx    # Overlay de monitoring
```

---

## 🔗 Ressources

- [Web Vitals - Google](https://web.dev/vitals/)
- [React Profiler - React DevTools](https://react.dev/learn/react-developer-tools)
- [Performance API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

---

## ✅ Checklist de performance

Utilisez ces hooks pour vérifier :

- [ ] **Re-renders** : Aucun composant ne se re-rend > 5 fois sans raison
- [ ] **Temps de chargement** : Dashboard < 1s, Pages < 2s
- [ ] **Core Web Vitals** : Toutes les métriques en ✅ Good
- [ ] **Props changes** : Identifier et corriger les props qui changent inutilement
- [ ] **Scroll fluide** : Pas de saccades lors du scroll
- [ ] **Transitions** : Changement light/dark instantané

---

**Note** : Ce système de monitoring est **100% gratuit** et utilise uniquement les APIs natives du navigateur et de React.


