# Rapport d'Analyse : Conflits dans les Filtres Support Evolution

**Date** : 2025-01-XX  
**Composant analysé** : Support Evolution Chart V2  
**Objectif** : Identifier les conflits et problèmes dans la gestion des filtres

---

## 🔍 ARCHITECTURE ACTUELLE

### Composants impliqués

1. **`support-evolution-chart-server-v2.tsx`** (Wrapper Client)
   - Gère l'état `localFilters` (period, selectedAgents, selectedDimensions)
   - Reçoit `globalPeriod` en prop du dashboard
   - Charge les données via API quand `localFilters` change
   - Synchronise `localFilters.period` avec `globalPeriod`

2. **`support-evolution-chart-v2.tsx`** (Composant de présentation)
   - Reçoit `data` et `onFiltersChange`
   - Appelle `SupportEvolutionFiltersV2` avec 3 callbacks séparés
   - Chaque callback construit un objet complet pour `handleFiltersChange`

3. **`support-evolution-filters-v2.tsx`** (Composant de filtres)
   - Gère un état draft (draftPeriod, draftAgents, draftDimensions)
   - Au clic "Appliquer", appelle les 3 callbacks séparément

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### 1. **CONFLIT DE SYNCHRONISATION** 🔴 CRITIQUE

**Localisation** : `support-evolution-chart-server-v2.tsx` lignes 168-170

```typescript
useEffect(() => {
  setLocalFilters((prev) => ({ ...prev, period: globalPeriod }));
}, [globalPeriod]);
```

**Problème** :
- Si l'utilisateur change la période via les filtres locaux (ex: "2025"), puis que le dashboard change `globalPeriod` (ex: "month"), la période locale est écrasée
- L'utilisateur perd sa sélection personnalisée
- Conflit entre filtres globaux (dashboard) et filtres locaux (widget)

**Impact** : UX dégradée, perte de configuration utilisateur

---

### 2. **APPELS MULTIPLES AU CHARGEMENT** 🔴 CRITIQUE

**Localisation** : `support-evolution-filters-v2.tsx` lignes 98-105

```typescript
const handleApply = () => {
  onPeriodChange(draftPeriod);      // Appel 1
  onAgentsChange(draftAgents);      // Appel 2
  onDimensionsChange(draftDimensions); // Appel 3
  // ...
};
```

**Problème** :
- Chaque callback déclenche `handleFiltersChange` dans `support-evolution-chart-v2.tsx`
- Chaque `handleFiltersChange` déclenche `setLocalFilters` dans `support-evolution-chart-server-v2.tsx`
- Chaque `setLocalFilters` déclenche le `useEffect` de chargement (ligne 78)
- **Résultat** : 3 appels API au lieu d'1 seul

**Impact** : Performance dégradée, requêtes inutiles, risque de race conditions

---

### 3. **CONSTRUCTION D'OBJETS INCOMPLETS** 🟡 MOYEN

**Localisation** : `support-evolution-chart-v2.tsx` lignes 198-217, 247-266

```typescript
onPeriodChange={(period) =>
  handleFiltersChange({
    period,
    selectedAgents: data.selectedAgents || [],  // ⚠️ Utilise data, pas l'état actuel
    selectedDimensions: data.selectedDimensions,
  })
}
```

**Problème** :
- Chaque callback construit un objet complet mais utilise `data.selectedAgents` et `data.selectedDimensions`
- Si les données ne sont pas encore chargées ou sont obsolètes, les valeurs peuvent être incorrectes
- Pas de source de vérité unique pour l'état des filtres

**Impact** : État incohérent possible, valeurs incorrectes

---

### 4. **DOUBLE GESTION D'ÉTAT** 🟡 MOYEN

**Localisation** : Tous les composants

**Problème** :
- `support-evolution-chart-server-v2.tsx` gère `localFilters`
- `support-evolution-filters-v2.tsx` gère `draftPeriod`, `draftAgents`, `draftDimensions`
- `support-evolution-chart-v2.tsx` utilise `data.period`, `data.selectedAgents`, etc.

**Impact** : Complexité accrue, risque de désynchronisation

---

### 5. **MANQUE DE VALIDATION** 🟢 MINEUR

**Localisation** : `support-evolution-filters-v2.tsx` ligne 155-160

**Problème** :
- La vérification `hasDraftChanges` compare les drafts avec les props
- Mais si les props changent pendant que le popover est ouvert, les drafts ne sont pas mis à jour
- Pas de validation que les dimensions sélectionnées sont valides

**Impact** : État incohérent possible

---

## 📊 FLUX DE DONNÉES ACTUEL

```
Dashboard (globalPeriod)
    ↓
support-evolution-chart-server-v2.tsx
    ├─ localFilters (état)
    ├─ useEffect [globalPeriod] → synchronise period
    └─ useEffect [localFilters] → charge données
         ↓
    support-evolution-chart-v2.tsx
         ├─ data (props)
         └─ SupportEvolutionFiltersV2
              ├─ draftPeriod, draftAgents, draftDimensions (état draft)
              └─ handleApply() → 3 callbacks séparés
                   ↓
              support-evolution-chart-v2.tsx
                   └─ handleFiltersChange() → 3 fois
                        ↓
                   support-evolution-chart-server-v2.tsx
                        └─ setLocalFilters() → 3 fois
                             ↓
                        useEffect [localFilters] → 3 chargements API
```

**Problème** : Le flux crée une cascade de 3 appels API au lieu d'1 seul.

---

## 🎯 RECOMMANDATIONS

### Option 1 : **Unifier les callbacks** (Recommandé) ✅

**Changement** : Modifier `SupportEvolutionFiltersV2` pour accepter un seul callback `onFiltersApply`

```typescript
type SupportEvolutionFiltersV2Props = {
  // ... autres props
  onFiltersApply: (filters: {
    period: Period | string;
    selectedAgents: string[];
    selectedDimensions: SupportDimension[];
  }) => void;
};
```

**Avantages** :
- Un seul appel API au lieu de 3
- État atomique (tous les filtres changent ensemble)
- Plus simple à maintenir

**Inconvénients** :
- Refactoring nécessaire dans `support-evolution-chart-v2.tsx`

---

### Option 2 : **Débouncer les appels** 🟡

**Changement** : Utiliser `useDebouncedCallback` pour regrouper les 3 appels

**Avantages** :
- Changement minimal
- Évite les appels multiples

**Inconvénients** :
- Complexité ajoutée
- Délai artificiel

---

### Option 3 : **Séparer filtres globaux et locaux** 🟡

**Changement** : Ne pas synchroniser `globalPeriod` avec les filtres locaux

**Avantages** :
- Pas de conflit entre globaux et locaux
- Utilisateur garde sa configuration

**Inconvénients** :
- Perte de cohérence avec le dashboard
- UX potentiellement confuse

---

## 📝 PLAN D'ACTION RECOMMANDÉ

### Phase 1 : Corriger les appels multiples (Priorité 1)
1. Modifier `SupportEvolutionFiltersV2` pour accepter `onFiltersApply` au lieu de 3 callbacks
2. Modifier `support-evolution-chart-v2.tsx` pour passer un seul callback
3. Tester que le chargement ne se fait qu'une fois

### Phase 2 : Résoudre le conflit de synchronisation (Priorité 2)
1. Décider si les filtres locaux doivent être indépendants des filtres globaux
2. Si indépendants : supprimer le `useEffect` de synchronisation
3. Si dépendants : Ajouter une logique pour ne synchroniser que si l'utilisateur n'a pas modifié la période localement

### Phase 3 : Simplifier la gestion d'état (Priorité 3)
1. Centraliser l'état des filtres dans un seul composant
2. Utiliser un contexte React si nécessaire
3. Éliminer les duplications d'état

---

## 🔧 FICHIERS À MODIFIER

1. `src/components/dashboard/manager/support-evolution-filters-v2.tsx`
   - Changer l'interface pour accepter `onFiltersApply`
   - Modifier `handleApply` pour appeler un seul callback

2. `src/components/dashboard/manager/support-evolution-chart-v2.tsx`
   - Créer un callback unique `handleFiltersApply`
   - Passer ce callback à `SupportEvolutionFiltersV2`

3. `src/components/dashboard/manager/support-evolution-chart-server-v2.tsx`
   - Revoir la logique de synchronisation avec `globalPeriod`
   - Ajouter une logique pour éviter les conflits

---

## ✅ VALIDATION

Après corrections, vérifier :
- [ ] Un seul appel API lors du clic "Appliquer"
- [ ] Pas de conflit entre filtres globaux et locaux
- [ ] État cohérent entre tous les composants
- [ ] Performance acceptable (pas de rechargements inutiles)

---

**Conclusion** : Les conflits identifiés sont principalement dus à une architecture avec trop de couches et des callbacks multiples. La solution recommandée est d'unifier les callbacks pour simplifier le flux et éviter les appels multiples.

