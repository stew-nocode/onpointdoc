# 📋 Résumé : Priorité des Sélecteurs - État Actuel

**Date**: 2025-01-16  
**Question**: Qu'est-ce qui est priorisé quand il y a des sélections contradictoires ?

---

## 🎯 Réponse Courte

### Priorité Actuelle Appliquée

```
1. selectedYear (si défini) → Utilisé en priorité
2. period (si selectedYear undefined) → Utilisé en second
3. data.period (fallback) → Utilisé par défaut
```

**⚠️ Important** : `dateRange` (période personnalisée) **n'est PAS pris en compte** dans la priorité !

---

## 🔍 Détail de la Logique

### Code Actuel (ligne 270 de `unified-dashboard-with-widgets.tsx`)

```typescript
const activePeriod: Period | string = selectedYear || period || data.period;
```

**Explication** :
- Si `selectedYear` est défini (ex: "2024"), il est utilisé
- Sinon, si `period` est défini (ex: "month"), il est utilisé
- Sinon, `data.period` est utilisé comme fallback

### Protection contre les Conflits

Les handlers **réinitialisent mutuellement** les états :

#### Quand on sélectionne une année :
```typescript
handleYearChange(year) {
  setSelectedYear(year);
  setDateRange(undefined); // ✅ Réinitialise la période personnalisée
  // ...
}
```

#### Quand on sélectionne une période personnalisée :
```typescript
handleDateRangeChange(range) {
  setDateRange(range);
  setSelectedYear(undefined); // ✅ Réinitialise l'année
  // ...
}
```

---

## ⚠️ Problème Identifié

### Période Personnalisée Non Fonctionnelle

**Situation** :
- L'utilisateur sélectionne une période personnalisée : "02 sept. 2025 - 02 déc. 2025"
- `dateRange` est bien défini
- **MAIS** `loadData('year')` est appelé sans transmettre les dates personnalisées
- L'API reçoit seulement `period='year'` et calcule automatiquement les dates (année précédente)
- **Résultat** : Les dates personnalisées sont ignorées !

**Code problématique** :
```typescript
handleDateRangeChange(range) {
  setDateRange(range);
  setSelectedYear(undefined);
  setPeriod('year');
  loadData('year'); // ⚠️ Les dates personnalisées ne sont pas transmises !
}
```

---

## 📊 Scénarios Concrets

### Scénario 1 : Année Sélectionnée

**Action** : Utilisateur sélectionne "2024"

**État résultant** :
- `selectedYear = "2024"` ✅
- `dateRange = undefined` ✅ (réinitialisé)
- `period = "2024"` ✅

**Résultat** :
- ✅ `activePeriod = "2024"` (priorité 1)
- ✅ Données chargées pour l'année 2024
- ✅ Fonctionne correctement

---

### Scénario 2 : Période Personnalisée Sélectionnée

**Action** : Utilisateur sélectionne "02 sept. 2025 - 02 déc. 2025"

**État résultant** :
- `selectedYear = undefined` ✅ (réinitialisé)
- `dateRange = {from: Date, to: Date}` ✅
- `period = "year"` ⚠️ (pas optimal)

**Résultat** :
- ⚠️ `activePeriod = "year"` (car `selectedYear` est undefined)
- ⚠️ Les dates personnalisées **ne sont pas utilisées** dans l'API
- ❌ L'API charge les données pour l'année précédente (par défaut de `period='year'`)
- ❌ **Ne fonctionne pas comme attendu**

---

### Scénario 3 : Conflit (Hypothétique)

**Action** : 
1. Utilisateur sélectionne "2024"
2. Utilisateur sélectionne ensuite "02 sept. 2025 - 02 déc. 2025"

**État résultant** :
- `selectedYear = undefined` ✅ (réinitialisé par `handleDateRangeChange`)
- `dateRange = {from, to}` ✅
- `period = "year"` ✅

**Résultat** :
- ✅ Pas de conflit car `selectedYear` est réinitialisé
- ⚠️ Mais `dateRange` n'est toujours pas utilisé dans la requête API
- ❌ **Période personnalisée toujours ignorée**

---

## 🎯 Conclusion

### Ce qui Fonctionne

✅ **Année spécifique** : Fonctionne correctement
- Priorité claire
- Réinitialisation des autres sélecteurs
- Données correctement chargées

✅ **Réinitialisation mutuelle** : Fonctionne correctement
- Sélection d'année → réinitialise `dateRange`
- Sélection de période personnalisée → réinitialise `selectedYear`
- Pas de conflits entre les sélecteurs

### Ce qui ne Fonctionne Pas

❌ **Période personnalisée** : Non fonctionnelle
- Les dates sélectionnées ne sont pas transmises à l'API
- L'API utilise toujours les dates calculées selon `period`
- Les widgets ne reçoivent pas les dates personnalisées

---

## 🔧 Solution Recommandée

### Priorité Idéale

```
1. dateRange (période personnalisée) → Priorité la plus élevée
2. selectedYear (année spécifique) → Priorité moyenne
3. period (période standard) → Priorité faible
4. data.period (fallback) → Dernière option
```

### Corrections Nécessaires

1. ✅ Modifier `loadData` pour accepter des dates personnalisées
2. ✅ Modifier `handleDateRangeChange` pour transmettre les dates à l'API
3. ✅ Mettre à jour la logique de priorité dans `dashboardDataWithFilteredAlerts`
4. ✅ Modifier l'API pour accepter des paramètres `startDate` et `endDate`

---

**Réponse finale** : Actuellement, `selectedYear` est toujours prioritaire sur tout, et `dateRange` n'est pas du tout pris en compte dans les requêtes API. La période personnalisée ne fonctionne donc pas.

