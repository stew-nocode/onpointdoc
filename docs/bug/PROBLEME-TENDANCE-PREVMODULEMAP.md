# Bug : Tendance non calculée si module absent de prevModuleMap

**Date**: 2025-01-16

---

## 🐛 Problème Identifié

### Symptôme
La tendance "Ouvert" pour le module Projets n'apparaît pas, alors qu'elle devrait être **-100%** (de 1 à 0).

### Cause Racine

Le `prevModuleMap` est construit uniquement à partir des bugs qui sont dans `prevBugs`. Si un module n'a pas de bugs dans la période précédente, il ne sera pas dans `prevModuleMap`.

Ensuite, lors du calcul de la tendance :

```typescript
const prev = prevModuleMap.get(moduleId) || {
  bugsSignales: 0,
  bugsCritiques: 0,
  bugsOuverts: 0,  // ← Valeur par défaut
  bugsResolus: 0
};

bugsOuverts: calculateTrend(data.bugsOuverts, prev.bugsOuverts)
```

Si `prevModuleMap` n'a pas d'entrée pour Projets, alors `prev.bugsOuverts` sera **0** (valeur par défaut), et `calculateTrend(0, 0)` = **0**, donc pas de tendance affichée.

---

## ✅ Solution

Initialiser `prevModuleMap` avec **tous les modules** (comme pour `moduleMap`), avant de remplir les données. Ainsi, chaque module aura une entrée dans `prevModuleMap`, même s'il n'a pas de bugs dans la période précédente.

### Code Actuel

```typescript
// prevModuleMap est construit uniquement à partir de prevBugs
prevBugs.forEach((bug) => {
  if (!bug.module_id) return;
  const key = bug.module_id;
  if (!prevModuleMap.has(key)) {
    prevModuleMap.set(key, { ... });
  }
  // ...
});
```

### Code Corrigé

```typescript
// Initialiser prevModuleMap avec tous les modules d'abord
allModules.forEach(mod => {
  prevModuleMap.set(mod.id, {
    bugsSignales: 0,
    bugsCritiques: 0,
    bugsOuverts: 0,
    bugsResolus: 0
  });
});

// Ensuite remplir avec les bugs de la période précédente
prevBugs.forEach((bug) => {
  // ...
});
```

---

## 📊 Impact

- **Modules affectés** : Tous les modules qui ont des bugs dans la période actuelle mais pas dans la période précédente
- **Métriques affectées** : Toutes les tendances (bugs signalés, % critique, ouvert, résolu, taux de résolution)

---

**Statut** : 🔴 **Bug identifié - Correction nécessaire**

