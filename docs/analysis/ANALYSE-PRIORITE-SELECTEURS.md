# Analyse de la Priorité des Sélecteurs de Période

**Date**: 2025-01-16  
**Statut**: 🔍 **Analyse en cours**

---

## 📊 État Actuel des Sélecteurs

Le dashboard dispose de **3 types de sélecteurs** :

1. **Sélecteur d'Année** (`YearSelector`) : Permet de choisir une année spécifique (ex: "2024")
2. **Sélecteur de Période Personnalisée** (`CustomPeriodSelector`) : Permet de choisir une plage de dates personnalisée
3. **Sélecteur de Période Standard** : Permet de choisir week/month/quarter/year

---

## 🔄 Logique Actuelle

### 1. États Gérés

```typescript
const [selectedYear, setSelectedYear] = useState<string | undefined>(undefined);
const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
const [period, setPeriod] = useState<Period>(initialPeriod);
```

### 2. Handlers

#### `handleYearChange(year: string | undefined)`

```typescript
const handleYearChange = useCallback((year: string | undefined) => {
  setSelectedYear(year);
  setDateRange(undefined); // ✅ Réinitialise la plage personnalisée
  if (year) {
    setPeriod(year as Period);
    loadData(year);
  }
}, [loadData]);
```

**Actions** :
- ✅ Réinitialise `dateRange` → `undefined`
- ✅ Met à jour `selectedYear`
- ✅ Met à jour `period` avec l'année
- ✅ Charge les données avec `loadData(year)`

#### `handleDateRangeChange(range: DateRange | undefined)`

```typescript
const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
  setDateRange(range);
  setSelectedYear(undefined); // ✅ Réinitialise l'année
  if (range?.from && range?.to) {
    setPeriod('year'); // ⚠️ Utilise 'year' comme période par défaut
    loadData('year'); // ⚠️ Charge avec 'year' mais sans passer les dates
  }
}, [loadData]);
```

**Actions** :
- ✅ Réinitialise `selectedYear` → `undefined`
- ✅ Met à jour `dateRange`
- ⚠️ Met à jour `period` avec `'year'` (pas optimal)
- ⚠️ Charge les données avec `loadData('year')` **sans passer les dates personnalisées**

### 3. Priorité dans `dashboardDataWithFilteredAlerts`

```typescript
const activePeriod: Period | string = selectedYear || period || data.period;
```

**Priorité actuelle** :
1. `selectedYear` (si défini)
2. `period` (si `selectedYear` est undefined)
3. `data.period` (fallback)

**⚠️ PROBLÈME** : `dateRange` n'est **PAS pris en compte** dans cette priorité !

---

## 🐛 Problèmes Identifiés

### 1. **Période Personnalisée Non Fonctionnelle**

**Problème** :
- Quand l'utilisateur sélectionne une période personnalisée, `loadData('year')` est appelé
- Mais les dates de `dateRange` ne sont **jamais transmises à l'API**
- L'API reçoit seulement `period='year'` et calcule les dates automatiquement (année précédente)

**Conséquence** :
- La période personnalisée ne fonctionne pas réellement
- Les dates sélectionnées sont ignorées

### 2. **Conflits Potentiels**

**Scénario de conflit** :
1. Utilisateur sélectionne "2024" → `selectedYear = "2024"`, `dateRange = undefined`
2. Utilisateur sélectionne ensuite une période personnalisée → `selectedYear = undefined`, `dateRange = {from, to}`
3. Mais si `selectedYear` n'est pas correctement réinitialisé, les deux peuvent coexister

**Priorité actuelle** :
- Si `selectedYear` existe, il est prioritaire (même si `dateRange` est défini)
- `dateRange` est ignoré dans la détermination de `activePeriod`

### 3. **Incohérence dans la Logique**

**Problème** :
- `handleDateRangeChange` réinitialise bien `selectedYear`
- Mais `dashboardDataWithFilteredAlerts` ne vérifie pas `dateRange`
- Les widgets reçoivent `period` mais pas les dates personnalisées

---

## 🎯 Priorité Recommandée

### Ordre de Priorité Idéal

1. **Période Personnalisée (`dateRange`)** - Priorité la plus élevée
   - Si `dateRange.from` et `dateRange.to` sont définis, utiliser ces dates
   - Les dates doivent être transmises à l'API

2. **Année Spécifique (`selectedYear`)** - Priorité moyenne
   - Si `selectedYear` est défini (ex: "2024"), utiliser cette année
   - Calculer les dates du 1er janvier au 31 décembre de cette année

3. **Période Standard (`period`)** - Priorité faible
   - Utiliser week/month/quarter/year standard
   - Calculer les dates selon la période

4. **Période par Défaut (`data.period`)** - Fallback
   - Utiliser la période des données initiales

---

## 🔧 Corrections Nécessaires

### 1. **Modifier `loadData` pour Accepter des Dates Personnalisées**

```typescript
const loadData = useCallback(async (
  selectedPeriod: Period | string,
  customStartDate?: string,
  customEndDate?: string
) => {
  // ... construction de l'URL avec les dates personnalisées si fournies
}, []);
```

### 2. **Modifier `handleDateRangeChange` pour Transmettre les Dates**

```typescript
const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
  setDateRange(range);
  setSelectedYear(undefined);
  if (range?.from && range?.to) {
    loadData('year', range.from.toISOString(), range.to.toISOString());
  }
}, [loadData]);
```

### 3. **Mettre à Jour la Priorité dans `dashboardDataWithFilteredAlerts`**

```typescript
const dashboardDataWithFilteredAlerts = useMemo(() => {
  // Priorité : dateRange > selectedYear > period > data.period
  let activePeriod: Period | string;
  let customDates: { startDate?: string; endDate?: string } | undefined;
  
  if (dateRange?.from && dateRange?.to) {
    // Priorité 1 : Période personnalisée
    activePeriod = 'year'; // Ou un nouveau type 'custom'
    customDates = {
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
    };
  } else if (selectedYear) {
    // Priorité 2 : Année spécifique
    activePeriod = selectedYear;
  } else {
    // Priorité 3 : Période standard ou fallback
    activePeriod = period || data.period;
  }
  
  return {
    ...data,
    alerts: filteredAlerts,
    period: activePeriod as Period,
    // Ajouter les dates personnalisées si disponibles
    ...(customDates && {
      periodStart: customDates.startDate,
      periodEnd: customDates.endDate,
    }),
  };
}, [/* dépendances */]);
```

### 4. **Modifier l'API pour Accepter des Dates Personnalisées**

```typescript
// Dans src/app/api/dashboard/route.ts
const searchParams = request.nextUrl.searchParams;
const customStart = searchParams.get('startDate');
const customEnd = searchParams.get('endDate');

if (customStart && customEnd) {
  // Utiliser les dates personnalisées
  startDate = customStart;
  endDate = customEnd;
} else {
  // Calculer selon la période
  const { startDate, endDate } = getPeriodDates(period);
}
```

---

## 📝 Scénarios de Test

### Scénario 1 : Sélection d'Année
1. Utilisateur sélectionne "2024"
   - ✅ `selectedYear = "2024"`
   - ✅ `dateRange = undefined`
   - ✅ Données chargées pour 2024

### Scénario 2 : Sélection de Période Personnalisée
1. Utilisateur sélectionne "02 sept. 2025 - 02 déc. 2025"
   - ✅ `dateRange = {from: Date, to: Date}`
   - ✅ `selectedYear = undefined`
   - ⚠️ Données chargées pour... **année précédente** (bug actuel)

### Scénario 3 : Conflit Résolu
1. Utilisateur sélectionne "2024"
2. Utilisateur sélectionne ensuite "02 sept. 2025 - 02 déc. 2025"
   - ✅ `selectedYear = undefined` (réinitialisé)
   - ✅ `dateRange = {from, to}` (prioritaire)
   - ⚠️ Mais `dateRange` n'est pas utilisé dans la requête API (bug)

---

## ✅ Recommandations

1. **Priorité claire et documentée** : `dateRange > selectedYear > period`
2. **Support complet des périodes personnalisées** : Transmettre les dates à l'API
3. **Réinitialisation mutuelle** : ✅ Déjà implémentée correctement
4. **Logs de debug** : Ajouter des logs pour tracer la priorité appliquée

---

**Prochaine étape** : Implémenter les corrections pour supporter les périodes personnalisées.

