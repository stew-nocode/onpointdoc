# Correction : Tendance non calculée si module absent de prevModuleMap

**Date**: 2025-01-16

---

## 🐛 Problème

### Symptôme
La tendance "Ouvert" pour certains modules (comme Projets) n'apparaissait pas, alors qu'elle devrait être affichée.

**Exemple** : Projets avait 0 bugs ouverts dans la période actuelle et 1 bug ouvert dans la période précédente. La tendance devrait être **-100%** (diminution), mais elle n'était pas affichée.

### Cause

Le `prevModuleMap` était construit uniquement à partir des bugs qui étaient dans `prevBugs`. Si un module n'avait pas de bugs dans la période précédente, il n'était pas dans `prevModuleMap`.

Lors du calcul de la tendance :

```typescript
const prev = prevModuleMap.get(moduleId) || {
  bugsOuverts: 0,  // ← Valeur par défaut
  // ...
};

bugsOuverts: calculateTrend(data.bugsOuverts, prev.bugsOuverts)
```

Si `prevModuleMap` n'avait pas d'entrée pour un module, alors `prev.bugsOuverts` était **0** (valeur par défaut), et `calculateTrend(0, 0)` = **0**, donc pas de tendance affichée.

---

## ✅ Solution

Initialiser `prevModuleMap` avec **tous les modules de `moduleMap`** avant de remplir les données. Ainsi, chaque module aura une entrée dans `prevModuleMap`, même s'il n'a pas de bugs dans la période précédente.

### Code Avant

```typescript
const prevModuleMap = new Map<string, {...}>();

prevBugs.forEach((bug) => {
  if (!bug.module_id) return;
  const key = bug.module_id;
  if (!prevModuleMap.has(key)) {
    prevModuleMap.set(key, {...});
  }
  // ...
});
```

### Code Après

```typescript
const prevModuleMap = new Map<string, {...}>();

// Initialiser prevModuleMap avec tous les modules de moduleMap
moduleMap.forEach((data, moduleId) => {
  prevModuleMap.set(moduleId, {
    bugsSignales: 0,
    bugsCritiques: 0,
    bugsOuverts: 0,
    bugsResolus: 0
  });
});

prevBugs.forEach((bug) => {
  // Remplir avec les bugs de la période précédente
  // ...
});
```

---

## 📊 Impact

- **Modules affectés** : Tous les modules qui ont des bugs dans la période actuelle
- **Métriques corrigées** : Toutes les tendances (bugs signalés, % critique, ouvert, résolu, taux de résolution)
- **Exemple** : Projets affiche maintenant correctement la tendance -100% pour "Ouvert"

---

## ✅ Résultat

Maintenant, tous les modules ont une entrée dans `prevModuleMap`, même s'ils n'ont pas de bugs dans la période précédente. Les tendances sont calculées correctement :

- **Projets** : 0 bugs ouverts (actuel) vs 1 bug ouvert (précédent) = **-100%** ✅
- **Finance** : 0 bugs ouverts (actuel) vs 0 bugs ouverts (précédent) = **0%** (pas d'affichage, normal)

---

**Statut** : ✅ **Corrigé**

