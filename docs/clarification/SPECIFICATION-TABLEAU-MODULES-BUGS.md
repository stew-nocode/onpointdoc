# Spécification : Nouveau Tableau "Modules par Période"

**Date**: 2025-01-16

---

## 📊 Structure du Tableau

### Colonnes
1. **Module** (nom du module)
2. **Bug signalé** (nombre de bugs créés dans la période filtrée)
3. **% Critique** (pourcentage de bugs avec priorité "Critical" parmi les bugs signalés)
4. **Ouvert** (nombre de bugs ouverts = créés mais pas encore résolus)
5. **Résolu** (nombre de bugs résolus dans la période filtrée)
6. **Taux de résolution** (résolu / signalé * 100)
7. **Tendances** (comparaison avec période précédente pour chaque indicateur)

---

## ❓ Questions de Clarification Avant Codage

### 1. "Bug signalé"
✅ **Confirmé** : Tickets BUG **créés** dans la période filtrée

### 2. "% Critique"
✅ **Confirmé** : Pourcentage de bugs avec `priority = 'Critical'` parmi les bugs signalés
- Formule : `(Bugs Critical / Bugs signalés) * 100`
- Exemple : 6 bugs signalés, 2 Critical → 33%

### 3. "Ouvert"
⚠️ **À clarifier** :
- **A)** Bugs créés dans la période mais pas encore résolus à la fin de la période ?
- **B)** Tous les bugs ouverts (non résolus) créés avant/dans la période ?
- **C)** Bugs créés dans la période ET toujours ouverts (non résolus) ?

### 4. "Résolu"
⚠️ **À clarifier** :
- **A)** Bugs résolus dans la période (peu importe quand créés) ?
- **B)** Bugs créés ET résolus dans la période ?

### 5. "Taux de résolution"
✅ **Confirmé** : `(Bugs résolus / Bugs signalés) * 100`

### 6. "Tendances"
⚠️ **À clarifier** : Comparaison avec période précédente pour :
- Nombre de bugs signalés ?
- % Critique ?
- Nombre de bugs ouverts ?
- Nombre de bugs résolus ?
- Taux de résolution ?
- **Tous les indicateurs** avec une icône de tendance à côté de chaque valeur ?

### 7. Modules
✅ **Confirmé** :
- Afficher tous les modules (pas de limite)
- Pas de tri spécifique
- Pas de colonne Produit (filtrage possible par produit dans le dashboard)
- Table soumise au filtre global (période, produits, équipes, types)

---

## 📝 Proposition de Structure

```
| Module | Bug signalé ↑+10% | % Critique ↓-5% | Ouvert ↓-2% | Résolu ↑+15% | Taux résolution ↑+3% |
|--------|-------------------|-----------------|-------------|--------------|----------------------|
| CRM    | 6                 | 33%             | 2           | 4            | 67%                  |
| RH     | 3                 | 0%              | 1           | 2            | 67%                  |
```

Chaque valeur numérique aurait une icône de tendance (↑↓) avec le pourcentage de variation.

---

## ✅ En attente de vos réponses

Merci de confirmer les points ⚠️ avant que je commence à coder.

---

**Statut** : 🟡 **En attente de clarification**

