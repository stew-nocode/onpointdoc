# Diagnostic Dashboard - Améliorations des Widgets

## 📊 Analyse des Patterns Actuels

### 1. **Widgets par Catégorie**

#### **KPIs (5 widgets)**
- `mttr` - MTTRKPICard
- `tickets-ouverts` - TicketsOuvertsKPICard
- `tickets-resolus` - TicketsResolusKPICard
- `workload` - WorkloadKPICard
- `health` - HealthKPICard

**Pattern actuel** : Reçoivent des données via props depuis `UnifiedDashboardData`
**Réactivité** : ✅ Dépendent de `loadData()` qui recharge toutes les données

#### **Charts (3 widgets)**
- `mttrEvolution` - MTTREvolutionChart
- `ticketsDistribution` - TicketsDistributionChart
- `supportEvolutionChart` - SupportEvolutionChartServerV2

**Pattern actuel** :
- `mttrEvolution` et `ticketsDistribution` : Reçoivent des données via props
- `supportEvolutionChart` : **Fetch dans useEffect** via API route `/api/dashboard/support-evolution-v2`

**Réactivité** : ⚠️ Incohérente
- Les 2 premiers dépendent de `loadData()`
- Le 3ème a son propre cycle de chargement indépendant

#### **Tables (2 widgets)**
- `topBugsModules` - TopBugsModulesTable
- `workloadByAgent` - WorkloadByAgentTable

**Pattern actuel** : Reçoivent des données via props
**Réactivité** : ✅ Dépendent de `loadData()`

#### **Full-width (1 widget)**
- `alerts` - OperationalAlertsSection

**Pattern actuel** : Reçoivent des données via props
**Réactivité** : ✅ Dépendent de `loadData()`

---

## 🚨 Problèmes Identifiés

### 1. **Code Mort à Supprimer**

#### **Fichiers obsolètes** :
- ❌ `src/components/dashboard/manager/support-evolution-chart-server.tsx` (remplacé par v2)
- ❌ `src/components/dashboard/manager/support-evolution-chart.tsx` (ancienne version)
- ❌ `src/components/dashboard/manager/support-evolution-filters.tsx` (ancienne version)
- ❌ `src/components/dashboard/unified-dashboard.tsx` (remplacé par `unified-dashboard-with-widgets.tsx`)

#### **Routes API obsolètes** :
- ❌ `/api/dashboard/support-evolution` (remplacée par `/api/dashboard/support-evolution-v2`)

### 2. **Patterns Incohérents**

#### **Problème 1 : Double chargement de données**
- `UnifiedDashboardWithWidgets` charge les données via `/api/dashboard`
- `SupportEvolutionChartServerV2` charge ses propres données via `/api/dashboard/support-evolution-v2`
- **Résultat** : 2 requêtes HTTP séparées, pas de synchronisation

#### **Problème 2 : Pas de Server Actions**
- Tous les widgets utilisent des API routes avec `fetch()`
- Pas d'utilisation de Server Actions (Next.js 16+)
- **Impact** : Moins de type-safety, pas de validation côté serveur automatique

#### **Problème 3 : Réactivité inégale**
- Les KPIs/Tables se mettent à jour via `loadData()`
- `supportEvolutionChart` a son propre cycle de mise à jour
- **Résultat** : Comportement incohérent pour l'utilisateur

### 3. **Performance**

#### **Problèmes identifiés** :
- ❌ Pas de cache côté client pour éviter les re-fetch inutiles
- ❌ Pas de debouncing sur les changements de filtres
- ❌ Pas de streaming avec Suspense pour les widgets indépendants
- ❌ Re-renders inutiles à cause de `React.memo` mal configuré

---

## ✅ Recommandations - Architecture Uniforme

### **Principe : Server Actions + Props Pattern**

Tous les widgets doivent suivre le même pattern :

1. **Server Components** pour le chargement initial (SSR)
2. **Server Actions** pour les mises à jour (au lieu d'API routes)
3. **Client Components** uniquement pour l'interactivité
4. **Props uniformes** : `{ data, period, isLoading?, error? }`

### **Architecture Proposée**

```
┌─────────────────────────────────────────────────┐
│  DashboardPage (Server Component)               │
│  - Charge données initiales via services        │
│  - Passe period + data aux widgets              │
└─────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  UnifiedDashboardWithWidgets (Client Component) │
│  - Gère les filtres globaux                     │
│  - Utilise Server Actions pour recharger        │
│  - Passe period + data aux widgets              │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  KPIs    │ │ Charts   │ │ Tables   │
│ (Props)  │ │ (Props)  │ │ (Props)  │
└──────────┘ └──────────┘ └──────────┘
```

### **Pattern Uniforme par Catégorie**

#### **1. KPIs - Pattern Simple (Props uniquement)**
```typescript
// ✅ Pattern recommandé
type KPIWidgetProps = {
  data: KPIData;
  period: Period;
};

export function KPIWidget({ data, period }: KPIWidgetProps) {
  // Affichage uniquement, pas de fetch
  return <Card>...</Card>;
}
```

#### **2. Charts - Pattern avec Server Actions**
```typescript
// ✅ Pattern recommandé
'use server';

export async function getChartData(period: Period, filters?: ChartFilters) {
  // Validation Zod
  // Fetch depuis Supabase
  // Retourne données typées
}

// Client Component
'use client';

export function ChartWidget({ 
  initialData, 
  period 
}: ChartWidgetProps) {
  const [data, setData] = useState(initialData);
  
  useEffect(() => {
    getChartData(period).then(setData);
  }, [period]);
  
  return <Chart data={data} />;
}
```

#### **3. Tables - Pattern Simple (Props uniquement)**
```typescript
// ✅ Pattern recommandé (identique aux KPIs)
type TableWidgetProps = {
  data: TableData;
  period: Period;
};

export function TableWidget({ data, period }: TableWidgetProps) {
  return <Table data={data} />;
}
```

---

## 🔧 Plan d'Action - Migration

### **Phase 1 : Nettoyage (Code Mort)** ✅ TERMINÉ

1. ✅ Supprimer `support-evolution-chart-server.tsx`
2. ✅ Supprimer `support-evolution-chart.tsx` (ancienne version)
3. ✅ Supprimer `support-evolution-filters.tsx` (ancienne version)
4. ✅ Supprimer `unified-dashboard.tsx`
5. ✅ Supprimer route API `/api/dashboard/support-evolution`
6. ✅ Supprimer route API `/api/dashboard/support-evolution-v2`

### **Phase 2 : Uniformisation - Support Evolution Chart** ✅ TERMINÉ

1. ✅ Créer Server Action `getSupportEvolutionDataAction(period, filters)` avec validation Zod
2. ✅ Modifier `SupportEvolutionChartServerV2` pour utiliser Server Action
3. ✅ Supprimer route API `/api/dashboard/support-evolution-v2`
4. ✅ Ajouter `useTransition` pour les mises à jour non-bloquantes
5. ✅ Ajouter debouncing (300ms) sur les changements de filtres

### **Phase 3 : Optimisation Performance**

1. ✅ Ajouter `React.cache()` dans les Server Actions
2. ✅ Implémenter debouncing sur les changements de filtres
3. ✅ Utiliser `useTransition` pour les mises à jour non-bloquantes
4. ✅ Optimiser `React.memo` avec comparaison shallow correcte

### **Phase 4 : Réactivité Uniforme**

1. ✅ Tous les widgets reçoivent `period` via props
2. ✅ Tous les widgets se mettent à jour quand `period` change
3. ✅ Utiliser `useMemo` pour éviter les recalculs inutiles
4. ✅ Streaming avec Suspense pour les widgets lourds

---

## 📋 Checklist d'Uniformisation

### **Pour chaque widget :**

- [ ] Reçoit `period` via props
- [ ] Reçoit `data` via props (pas de fetch interne)
- [ ] Utilise Server Action si besoin de recharger
- [ ] Pas de `useEffect` avec `fetch()` (sauf cas exceptionnel)
- [ ] Type-safe avec TypeScript strict
- [ ] Validation Zod dans Server Actions
- [ ] Gestion d'erreur uniforme
- [ ] Loading state uniforme (skeleton)
- [ ] Accessible (ARIA labels)
- [ ] Responsive (mobile-first)

---

## 🎯 Métriques de Performance Cibles

- **Time to First Byte (TTFB)** : < 200ms
- **First Contentful Paint (FCP)** : < 1.5s
- **Largest Contentful Paint (LCP)** : < 2.5s
- **Time to Interactive (TTI)** : < 3.5s
- **Re-renders** : < 3 par interaction utilisateur
- **Bundle size** : < 200KB par widget (gzipped)

---

## 🔍 Points d'Amélioration par Widget

### **MTTREvolutionChart**
- ✅ Déjà bon pattern (props uniquement)
- ⚠️ Ajouter `period` dans props pour cohérence
- ⚠️ Optimiser `React.memo` si nécessaire

### **TicketsDistributionChart**
- ✅ Déjà bon pattern (props uniquement)
- ⚠️ Ajouter `period` dans props pour cohérence
- ⚠️ Optimiser `React.memo` si nécessaire

### **SupportEvolutionChartServerV2**
- ❌ **CRITIQUE** : Fetch dans useEffect (à migrer vers Server Action)
- ❌ **CRITIQUE** : Cycle de chargement indépendant (à synchroniser)
- ⚠️ Ajouter debouncing sur les filtres locaux
- ⚠️ Utiliser `useTransition` pour les mises à jour

### **Tous les KPIs**
- ✅ Pattern correct (props uniquement)
- ⚠️ Ajouter `period` dans props pour cohérence
- ⚠️ Vérifier `React.memo` si nécessaire

---

## 📝 Notes Techniques

### **Server Actions vs API Routes**

**Utiliser Server Actions quand** :
- ✅ Action côté serveur (lecture/écriture)
- ✅ Besoin de type-safety end-to-end
- ✅ Validation automatique avec Zod
- ✅ Pas besoin de CORS
- ✅ Pas besoin de middleware HTTP

**Utiliser API Routes quand** :
- ✅ Webhooks externes
- ✅ Intégration avec services tiers
- ✅ Besoin de middleware HTTP spécifique
- ✅ Streaming de données volumineuses

### **Réactivité Uniforme**

Tous les widgets doivent réagir aux changements de `period` de la même manière :

```typescript
// Pattern uniforme
useEffect(() => {
  // Recharger les données si nécessaire
  if (needsRefresh) {
    refreshData(period);
  }
}, [period]);
```

---

## 🚀 Prochaines Étapes

1. **Immédiat** : Supprimer le code mort
2. **Court terme** : Migrer Support Evolution vers Server Action
3. **Moyen terme** : Uniformiser tous les widgets
4. **Long terme** : Optimiser les performances globales

