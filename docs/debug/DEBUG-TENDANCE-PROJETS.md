# Debug : Tendance "Ouvert" pour le Module Projets

**Date**: 2025-01-16  
**Période**: 6 derniers mois

---

## 📊 Données de Référence (MCP Supabase)

### Projets - Période Actuelle (6 derniers mois)
- **Bugs signalés** : 3
- **Bugs résolus** : 3
- **Bugs ouverts** : 0 (3 - 3)

### Projets - Période Précédente (6 mois avant)
- **Bugs signalés** : 7
- **Bugs résolus** : 6
- **Bugs ouverts** : 1 (7 - 6)

### Tendance Attendue
- **Tendance calculée** : `calculateTrend(0, 1)` = **-100%** (diminution de 1 à 0)
- **Affichage attendu** : ↓ -100% (vert)

---

## 🔍 Points de Vérification

### 1. Le module Projets est-il dans les résultats ?

Le module Projets a 3 bugs signalés dans la période, donc il devrait être dans `moduleMap` et retourné dans les résultats.

### 2. La période précédente est-elle correctement calculée ?

Vérifier que `getPreviousPeriodDates()` calcule bien la période précédente relative aux 6 derniers mois.

### 3. Les bugs de la période précédente sont-ils bien récupérés ?

Vérifier que `prevBugs` contient bien les bugs du module Projets de la période précédente.

### 4. Le calcul de bugs ouverts est-il correct ?

- **Période actuelle** : bugs_ouverts = bugs_signales - bugs_resolus = 3 - 3 = 0 ✅
- **Période précédente** : bugs_ouverts = bugs_signales - bugs_resolus = 7 - 6 = 1 ✅

---

## 🔧 Vérification du Code

### Dans `calculateModuleBugsMetrics()`

```typescript
// Calcul des bugs ouverts de la période précédente
prevModuleMap.forEach((data) => {
  data.bugsOuverts = data.bugsSignales - data.bugsResolus;
});

// Calcul de la tendance
bugsOuverts: calculateTrend(data.bugsOuverts, prev.bugsOuverts)
```

**Calcul attendu** :
- `data.bugsOuverts` = 0 (période actuelle)
- `prev.bugsOuverts` = 1 (période précédente)
- `calculateTrend(0, 1)` = -100%

---

## ❓ Questions

1. Le module Projets apparaît-il dans le tableau mais sans tendance ?
2. Le module Projets n'apparaît-il pas du tout dans le tableau ?
3. La tendance est-elle calculée mais n'est pas affichée pour une raison autre ?

---

**Statut** : 🟡 **En cours d'investigation**

