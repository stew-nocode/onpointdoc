# 📊 Guide de Lecture - Tableau "Modules par Période"

**Date**: 2025-01-16  
**Objectif**: Expliquer simplement comment lire une ligne du tableau

---

## 📋 Structure d'une Ligne

Le tableau affiche **6 colonnes** pour chaque module (ex: Finance) :

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **1. Module** | Nom du module | Finance |
| **2. Bug signalé** | Nombre total de bugs signalés dans la période | 3 (badge rouge) |
| **3. % Critique** | Pourcentage de bugs critiques parmi les bugs signalés | 73% |
| **4. Ouvert** | Nombre de bugs actuellement ouverts | 0 |
| **5. Résolu** | Nombre de bugs résolus dans la période | 3 |
| **6. Taux résolution** | Pourcentage de bugs résolus sur le total | 67% |

---

## 🎨 Légende des Couleurs et Symboles

### Badge Rouge
- **Rouge** = Nombre de bugs signalés
- Plus le nombre est élevé, plus c'est préoccupant

### Flèches et Pourcentages

#### 🟢 Flèche Verte vers le haut (↑)
- **Bonne nouvelle** : La métrique s'améliore
- Exemple : `↑ 73%` = Augmentation de 73% par rapport à la période précédente
- Pour "Taux résolution" : Plus c'est haut, mieux c'est

#### 🔴 Flèche Rouge vers le bas (↓)
- **Attention** : La métrique se dégrade
- Exemple : `↓ 10%` = Diminution de 10% par rapport à la période précédente
- Pour "% Critique" ou "Bugs signalés" : Plus c'est bas, mieux c'est

#### ⚪ Texte Blanc
- **Neutre** : Valeur actuelle sans tendance significative
- Ou pas de changement par rapport à la période précédente

---

## 📖 Exemple de Lecture Complète : Module "Finance"

Prenons une ligne typique :

```
Finance | [3] | 73% ↑ | 100% | 10% ↓ | 0 | 100% ↑ | 3 | 67% ↑ | 100% | 22% ↓
```

### Lecture Colonne par Colonne :

#### 1️⃣ **Module** : Finance
- C'est le nom du module analysé

#### 2️⃣ **Bug signalé** : `[3]` (badge rouge)
- **3 bugs** ont été signalés dans cette période
- Le badge rouge indique que c'est un nombre de bugs

#### 3️⃣ **% Critique** : `73% ↑` (vert)
- **73%** des bugs sont critiques (problèmes graves)
- **Flèche verte ↑** : Augmentation de 73% par rapport à la période précédente
- ⚠️ **Attention** : C'est une mauvaise tendance (plus de bugs critiques)

#### 4️⃣ **Ouvert** : `100%`
- **100%** des bugs sont actuellement ouverts
- Ou **100 bugs ouverts** selon le contexte
- Texte blanc = pas de tendance affichée

#### 5️⃣ **Résolu** : `10% ↓` (rouge)
- **10%** de diminution du nombre de bugs résolus
- Ou **10 bugs résolus** en moins qu'avant
- ⚠️ **Mauvaise tendance** : Moins de bugs résolus

#### 6️⃣ **Taux résolution** : `67% ↑` (vert)
- **67%** des bugs ont été résolus
- **Flèche verte ↑** : Augmentation de 67% du taux de résolution
- ✅ **Bonne nouvelle** : Le taux de résolution s'améliore

---

## 🎯 Signification des Tendance selon la Colonne

### Bonne Tendance (Vert ↑) :
- ✅ **Taux résolution** : Augmente = mieux
- ✅ **Bugs résolus** : Augmente = mieux

### Mauvaise Tendance (Rouge ↓) :
- ⚠️ **Bugs signalés** : Augmente = pire
- ⚠️ **% Critique** : Augmente = pire
- ⚠️ **Bugs ouverts** : Augmente = pire

---

## 💡 Exemple Concret : Module "Finance"

**Ligne affichée** :
```
Finance | 3 | 73% ↑ | 100% | 10% ↓ | 0 | 100% ↑ | 3 | 67% ↑ | 100% | 22% ↓
```

**Interprétation simple** :

1. **Finance** : Module analysé
2. **3 bugs signalés** : 3 nouveaux bugs cette période
3. **73% critiques ↑** : 73% sont critiques (et c'est en augmentation)
4. **100% ouverts** : Tous les bugs sont encore ouverts
5. **10% moins résolus ↓** : 10% de bugs en moins résolus qu'avant
6. **0 bugs résolus actuellement**
7. **100% taux résolution ↑** : Tous les bugs sont résolus (amélioration)
8. **3 bugs résolus au total**
9. **67% taux résolution ↑** : 67% des bugs sont résolus (amélioration)
10. **100% taux actuel**
11. **22% moins ↓** : 22% de diminution (mauvaise tendance)

---

## 🔍 Astuce de Lecture Rapide

1. **Regardez les badges rouges** = Nombre de bugs (plus c'est haut, plus c'est préoccupant)
2. **Cherchez les flèches vertes ↑** = Bonnes nouvelles (améliorations)
3. **Faites attention aux flèches rouges ↓** = Alertes (dégradation)
4. **Comparez les pourcentages** = Comprendre l'évolution

---

## 📊 Récapitulatif Visuel

```
┌─────────┬──────────────┬────────────┬──────────┬──────────┬──────────────┐
│ Module  │ Bug signalé  │ % Critique │  Ouvert  │  Résolu  │ Taux résol.  │
├─────────┼──────────────┼────────────┼──────────┼──────────┼──────────────┤
│ Finance │    [3] 🔴    │  73% ↑ 🟢  │   100%   │  10% ↓ 🔴│   67% ↑ 🟢   │
└─────────┴──────────────┴────────────┴──────────┴──────────┴──────────────┘
```

---

**Résumé** : Chaque ligne montre l'état actuel du module (valeurs) et l'évolution (flèches) par rapport à la période précédente. Les verts sont des bonnes nouvelles, les rouges des alertes.














