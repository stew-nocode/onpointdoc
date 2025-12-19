# Analyse du Conflit entre les Sélecteurs

**Date**: 2025-01-16  
**Statut**: 🔍 **Analyse en cours**

---

## 🐛 Problème Signalé

Il semble y avoir un **conflit entre les deux sélecteurs** :
- Le sélecteur d'**année** (YearSelector)
- Le sélecteur de **période personnalisée** (CustomPeriodSelector)

Le dernier sélectionné ne désactive pas correctement le précédent.

---

## 🔍 Analyse du Code Actuel

### 1. Handlers de Réinitialisation

#### `handleDateRangeChange` (ligne 175-195)

```typescript
const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
  setDateRange(range);
  setSelectedYear(undefined); // ✅ Réinitialise l'année
  
  if (range?.from && range?.to) {
    setPeriod('year'); // ⚠️ Problème potentiel
    loadData('year');  // ⚠️ Charge avec 'year' au lieu des dates personnalisées
  }
}, [loadData]);
```

**Actions** :
- ✅ Réinitialise `selectedYear` à `undefined`
- ⚠️ Met `period` à `'year'` même si c'est une période personnalisée
- ⚠️ Charge les données avec `'year'` au lieu des dates personnalisées

#### `handleYearChange` (ligne 197-213)

```typescript
const handleYearChange = useCallback(
  (year: string | undefined) => {
    setSelectedYear(year);
    setDateRange(undefined); // ✅ Réinitialise la période personnalisée
    
    if (year) {
      setPeriod(year as Period);
      loadData(year as Period);
    }
  },
  [loadData]
);
```

**Actions** :
- ✅ Réinitialise `dateRange` à `undefined`
- ✅ Met à jour `period` avec l'année

### 2. Problèmes Identifiés

#### Problème 1 : Le `Select` de shadcn peut ne pas gérer `undefined`

Le composant `YearSelector` utilise un `Select` avec `value={selectedYear}`. Si `selectedYear` est `undefined`, le `Select` peut :
- Soit afficher le placeholder
- Soit garder l'ancienne valeur en interne

**Vérification nécessaire** : Comment le composant `Select` de shadcn gère les valeurs `undefined` ?

#### Problème 2 : Réinitialisation Asynchrone

Quand on change de sélecteur :
1. `handleDateRangeChange` est appelé
2. `setSelectedYear(undefined)` est appelé (asynchrone)
3. Le composant se re-rend
4. `YearSelector` reçoit `value={selectedYear}` qui peut être encore défini si le re-render n'a pas encore eu lieu

**Solution** : Les réinitialisations sont synchrones dans React, mais il peut y avoir un problème de timing.

#### Problème 3 : Le `CustomPeriodSelector` peut garder une valeur interne

Le `CustomPeriodSelector` a un état interne `tempDate` qui peut ne pas être réinitialisé correctement :

```typescript
const [tempDate, setTempDate] = React.useState<{ from?: Date; to?: Date } | undefined>(date)

React.useEffect(() => {
  setTempDate(date)  // Met à jour tempDate quand date change
  if (date?.from) setMonthFrom(date.from)
  if (date?.to) setMonthTo(date.to)
}, [date])
```

Si `date` devient `undefined`, `tempDate` devrait être réinitialisé, mais il faut vérifier.

#### Problème 4 : Conflit entre `period` et la période personnalisée

Quand une période personnalisée est sélectionnée :
- `setPeriod('year')` est appelé
- Mais `dateRange` est défini
- Le calcul de `activePeriod` peut être confus

**Ligne 281** :
```typescript
const activePeriod: Period | string = selectedYear || period || data.period;
```

Cette logique **ne prend pas en compte** `dateRange` pour déterminer la période active !

---

## 🔧 Corrections Nécessaires

### 1. Améliorer la Réinitialisation

Il faut s'assurer que :
- Quand `dateRange` est défini, `selectedYear` est vraiment `undefined`
- Quand `selectedYear` est défini, `dateRange` est vraiment `undefined`
- Les composants reçoivent bien les bonnes valeurs

### 2. Corriger la Logique de Priorité

La logique de `activePeriod` doit prendre en compte `dateRange` :

```typescript
const activePeriod: Period | string = 
  (dateRange?.from && dateRange?.to) ? 'custom' : 
  selectedYear || period || data.period;
```

### 3. Forcer la Réinitialisation des Composants

Pour `YearSelector`, s'assurer que quand `value={undefined}`, le Select affiche bien le placeholder et n'a pas de valeur sélectionnée.

Pour `CustomPeriodSelector`, s'assurer que quand `date={undefined}`, le composant affiche bien "Période personnalisée" sans dates.

---

## 📋 Plan de Correction

1. ✅ Vérifier comment `Select` gère les valeurs `undefined`
2. ✅ Ajouter des logs pour tracer les réinitialisations
3. ✅ Forcer la réinitialisation explicite dans les handlers
4. ✅ Corriger la logique de priorité pour inclure `dateRange`
5. ✅ Tester les scénarios de conflit

---

**Prochaine étape** : Implémenter les corrections pour éliminer les conflits.

