# Plan d'Uniformisation de la Réactivité des Widgets

## 🎯 Objectif

Uniformiser la réactivité de tous les widgets du dashboard pour qu'ils réagissent de manière cohérente et performante aux changements de période globale.

## 📊 État Actuel - Analyse

### **Catégorie 1 : Widgets Passifs (KPIs, Tables)**
**Pattern actuel** : Reçoivent des données via props, se mettent à jour automatiquement quand `dashboardData` change.

**Widgets concernés** :
- `mttr` (MTTRKPICard)
- `tickets-ouverts` (TicketsOuvertsKPICard)
- `tickets-resolus` (TicketsResolusKPICard)
- `workload` (WorkloadKPICard)
- `health` (HealthKPICard)
- `topBugsModules` (TopBugsModulesTable)
- `workloadByAgent` (WorkloadByAgentTable)
- `alerts` (OperationalAlertsSection)

**Réactivité actuelle** : ✅ **Bonne**
- Dépendent de `loadData()` dans `UnifiedDashboardWithWidgets`
- Se mettent à jour automatiquement quand la période change
- Pas de fetch interne

**Action requise** : ✅ **Aucune** (déjà optimal)

---

### **Catégorie 2 : Widgets Charts avec Props**
**Pattern actuel** : Reçoivent des données via props, mais n'ont pas explicitement `period` dans leurs props.

**Widgets concernés** :
- `mttrEvolution` (MTTREvolutionChart)
- `ticketsDistribution` (TicketsDistributionChart)

**Réactivité actuelle** : ⚠️ **Partielle**
- Reçoivent `period` dans les props (ajouté récemment)
- Se mettent à jour via `loadData()` mais ne sont pas conscients de `period`
- Pas de fetch interne

**Action requise** : 
- ✅ Vérifier que `period` est bien passé dans les props (déjà fait)
- ⚠️ Ajouter `React.memo` avec comparaison shallow si nécessaire
- ⚠️ S'assurer que les props incluent `period` pour la cohérence

---

### **Catégorie 3 : Widget avec Fetch Interne (Support Evolution)**
**Pattern actuel** : Charge ses propres données via Server Action, a son propre cycle de chargement.

**Widgets concernés** :
- `supportEvolutionChart` (SupportEvolutionChartServerV2)

**Réactivité actuelle** : ⚠️ **Indépendante**
- Reçoit `period` via props
- Charge ses données via Server Action dans `useEffect`
- Utilise `useTransition` et debouncing (déjà optimisé)
- **Problème** : Cycle de chargement indépendant de `loadData()`

**Action requise** :
- ✅ Server Action créée (fait)
- ✅ `useTransition` et debouncing ajoutés (fait)
- ⚠️ **Uniformiser** : S'assurer que le widget réagit bien aux changements de `period` de manière cohérente avec les autres

---

## 🔄 Plan d'Uniformisation

### **Principe Fondamental**

**Tous les widgets doivent suivre le même pattern de réactivité** :

1. **Reçoivent `period` via props** (déjà fait pour tous)
2. **Se mettent à jour quand `period` change** (à uniformiser)
3. **Pas de fetch interne** sauf cas exceptionnel (Support Evolution est le seul cas légitime)
4. **Utilisent `React.memo` avec comparaison shallow** pour éviter les re-renders inutiles

### **Architecture Cible**

```
┌─────────────────────────────────────────────────────────┐
│  UnifiedDashboardWithWidgets                            │
│  - État : period, selectedYear, dateRange              │
│  - loadData(period) → met à jour dashboardData         │
└─────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│  dashboardDataWithFilteredAlerts                        │
│  - Contient : data + period (toujours à jour)          │
└─────────────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  KPIs    │ │ Charts   │ │ Tables   │
│ (Props)  │ │ (Props)  │ │ (Props)  │
│          │ │          │ │          │
│ ✅ OK    │ │ ⚠️ Vérif │ │ ✅ OK    │
└──────────┘ └──────────┘ └──────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Support Evolution     │
        │ (Server Action)       │
        │                       │
        │ ⚠️ Uniformiser        │
        └───────────────────────┘
```

---

## 📋 Actions Détaillées

### **Action 1 : Vérifier et Uniformiser les Props**

**Objectif** : Tous les widgets reçoivent `period` dans leurs props de manière cohérente.

**Étapes** :
1. ✅ Vérifier que tous les mappers dans `registry.ts` passent `period`
2. ✅ Vérifier que tous les types de props incluent `period`
3. ⚠️ Ajouter `period` aux widgets qui ne l'ont pas encore (KPIs, Tables)

**Code à modifier** :
- `src/components/dashboard/widgets/registry.ts` - Mappers
- `src/types/dashboard-widget-props.ts` - Types de props

---

### **Action 2 : Optimiser React.memo pour Tous les Widgets**

**Objectif** : Éviter les re-renders inutiles avec une comparaison shallow optimale.

**Étapes** :
1. Vérifier que tous les widgets utilisent `React.memo`
2. S'assurer que la comparaison shallow détecte bien les changements de `period`
3. Optimiser les dépendances pour éviter les re-renders inutiles

**Code à modifier** :
- `src/components/dashboard/widgets/widget-grid.tsx` - `MemoizedWidget`
- Chaque composant widget individuel si nécessaire

---

### **Action 3 : Uniformiser Support Evolution avec le Pattern Global**

**Objectif** : Le widget Support Evolution doit réagir aux changements de `period` de la même manière que les autres widgets.

**Problème actuel** :
- Le widget a son propre cycle de chargement via `useEffect`
- Il ne dépend pas directement de `loadData()` comme les autres

**Solution proposée** :
1. ✅ Le widget reçoit déjà `period` via props
2. ✅ Le widget charge ses données via Server Action (fait)
3. ⚠️ **Uniformiser** : S'assurer que le `useEffect` réagit bien aux changements de `period` de manière cohérente
4. ⚠️ **Optimiser** : Utiliser `useMemo` pour éviter les recalculs inutiles

**Code à modifier** :
- `src/components/dashboard/manager/support-evolution-chart-server-v2.tsx`

---

### **Action 4 : Ajouter useMemo pour les Calculs Coûteux**

**Objectif** : Éviter les recalculs inutiles dans les widgets.

**Étapes** :
1. Identifier les calculs coûteux dans chaque widget
2. Wrapper avec `useMemo` avec les bonnes dépendances
3. S'assurer que les dépendances incluent `period` si nécessaire

**Widgets concernés** :
- `MTTREvolutionChart` - `transformMTTRData`
- `TicketsDistributionChart` - `transformPieData`, `createChartConfig`
- `SupportEvolutionChartV2` - `transformChartData`, `createChartConfig`

---

### **Action 5 : Uniformiser la Gestion d'Erreur**

**Objectif** : Tous les widgets gèrent les erreurs de la même manière.

**Étapes** :
1. Vérifier que tous les widgets affichent des messages d'erreur cohérents
2. Utiliser le même composant `Alert` pour les erreurs
3. Uniformiser les messages d'erreur

---

## 🎯 Résultat Attendu

Après uniformisation, **tous les widgets** :

1. ✅ Reçoivent `period` via props
2. ✅ Se mettent à jour automatiquement quand `period` change
3. ✅ Utilisent `React.memo` avec comparaison shallow optimale
4. ✅ Utilisent `useMemo` pour les calculs coûteux
5. ✅ Gèrent les erreurs de manière cohérente
6. ✅ Ont des performances optimales (pas de re-renders inutiles)

---

## 📊 Métriques de Succès

- **Réactivité** : Tous les widgets se mettent à jour en < 500ms après changement de période
- **Performance** : < 3 re-renders par interaction utilisateur
- **Cohérence** : Tous les widgets suivent le même pattern de réactivité
- **Maintenabilité** : Code uniforme, facile à comprendre et maintenir

---

## 🔍 Points d'Attention

### **Support Evolution - Cas Spécial**

Le widget Support Evolution est le **seul widget** qui charge ses propres données car :
- Il a des filtres locaux (agents, dimensions)
- Il ne peut pas utiliser les données du dashboard global
- Il doit rester indépendant pour ses filtres locaux

**Solution** : Garder son fetch interne mais uniformiser sa réactivité à `period` :
- Le widget doit réagir immédiatement aux changements de `period`
- Les filtres locaux doivent être indépendants mais ne pas bloquer la réactivité à `period`

---

## ✅ Checklist d'Uniformisation

Pour chaque widget :

- [ ] Reçoit `period` via props
- [ ] Se met à jour quand `period` change
- [ ] Utilise `React.memo` avec comparaison shallow
- [ ] Utilise `useMemo` pour les calculs coûteux
- [ ] Gère les erreurs de manière cohérente
- [ ] A des performances optimales

---

## 🚀 Ordre d'Exécution

1. **Étape 1** : Uniformiser les props (ajouter `period` partout)
2. **Étape 2** : Optimiser `React.memo` dans `widget-grid.tsx`
3. **Étape 3** : Ajouter `useMemo` dans les widgets Charts
4. **Étape 4** : Uniformiser Support Evolution (vérifier la réactivité à `period`)
5. **Étape 5** : Tests et validation

