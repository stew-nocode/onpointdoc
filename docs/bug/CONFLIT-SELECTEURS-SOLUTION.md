# Solution au Conflit entre les Sélecteurs

**Date**: 2025-01-16  
**Statut**: 🔧 **Solution Proposée**

---

## 🔍 Problème Identifié

Le composant `Select` de Radix UI (utilisé par shadcn) peut garder une valeur en interne même si on lui passe `undefined`. Cela crée un conflit visuel où les deux sélecteurs peuvent sembler actifs simultanément.

---

## 🔧 Solutions à Implémenter

### Solution 1 : Utiliser une valeur vide au lieu de `undefined`

Pour le `YearSelector`, au lieu de passer `undefined`, utiliser une chaîne vide `""` qui sera gérée correctement par le Select.

### Solution 2 : Forcer la réinitialisation explicite

Ajouter une clé (`key`) aux composants pour forcer leur réinitialisation complète quand l'état change.

### Solution 3 : Améliorer la logique de réinitialisation

S'assurer que les réinitialisations sont atomiques et que les deux états ne peuvent jamais être définis simultanément.

---

## 📝 Modifications à Apporter

### 1. Modifier `handleYearChange` pour accepter une chaîne vide

```typescript
const handleYearChange = useCallback(
  (year: string | undefined) => {
    // Si year est une chaîne vide, traiter comme undefined
    const normalizedYear = year === '' ? undefined : year;
    
    setSelectedYear(normalizedYear);
    
    // Réinitialiser la période personnalisée SI on utilise l'année
    if (normalizedYear) {
      setDateRange(undefined);
      setPeriod(normalizedYear as Period);
      loadData(normalizedYear as Period);
    } else {
      // Si on désélectionne l'année, réinitialiser aussi
      setDateRange(undefined);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Année sélectionnée:', normalizedYear);
    }
  },
  [loadData]
);
```

### 2. Modifier `handleDateRangeChange` pour réinitialiser complètement

```typescript
const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
  // Réinitialiser l'année AVANT de définir la période personnalisée
  setSelectedYear(undefined);
  setDateRange(range);
  
  if (range?.from && range?.to) {
    // Ne pas mettre period à 'year' - laisser la logique de priorité gérer
    // Charger les données avec les dates personnalisées (à implémenter)
    loadData('year'); // Temporaire - à remplacer
  } else {
    // Si on efface la période personnalisée, réinitialiser period aussi
    setPeriod('month'); // Ou la période par défaut
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Période personnalisée:', {
      hasRange: !!range?.from && !!range?.to,
      from: range?.from?.toISOString(),
      to: range?.to?.toISOString(),
    });
  }
}, [loadData]);
```

### 3. Ajouter une clé pour forcer la réinitialisation

```typescript
<YearSelector 
  key={`year-${selectedYear || 'none'}`} // Force la réinitialisation
  value={selectedYear || ''} // Utiliser '' au lieu de undefined
  onValueChange={handleYearChange} 
  className="w-[120px]"
  isActive={activeFilterType === 'year'}
/>
<CustomPeriodSelector 
  key={`custom-${dateRange?.from?.toISOString() || 'none'}-${dateRange?.to?.toISOString() || 'none'}`}
  date={dateRange} 
  onSelect={handleDateRangeChange}
  isActive={activeFilterType === 'custom-period'}
/>
```

### 4. Modifier `YearSelector` pour gérer les chaînes vides

```typescript
<Select value={value || ''} onValueChange={onValueChange}>
  <SelectTrigger className={...}>
    <SelectValue placeholder="Année" />
  </SelectTrigger>
  ...
</Select>
```

### 5. Améliorer la logique de priorité

```typescript
const activeFilterType = useMemo(() => {
  // Priorité 1 : Période personnalisée
  if (dateRange?.from && dateRange?.to) {
    return 'custom-period';
  }
  // Priorité 2 : Année spécifique
  if (selectedYear) {
    return 'year';
  }
  // Priorité 3 : Aucun filtre actif
  return 'none';
}, [dateRange, selectedYear]);

// S'assurer que les deux ne sont jamais définis simultanément
useEffect(() => {
  if (dateRange?.from && dateRange?.to && selectedYear) {
    console.warn('[Dashboard] Conflit détecté : dateRange et selectedYear sont tous deux définis. Réinitialisation de selectedYear.');
    setSelectedYear(undefined);
  }
}, [dateRange, selectedYear]);
```

---

## ✅ Résultat Attendu

Après ces modifications :
- ✅ Quand on sélectionne une année, la période personnalisée est complètement effacée
- ✅ Quand on sélectionne une période personnalisée, l'année est complètement effacée
- ✅ Les deux sélecteurs ne peuvent jamais être actifs simultanément
- ✅ Le badge "Actif" s'affiche uniquement sur le bon sélecteur

---

**Prochaine étape** : Implémenter ces corrections.

