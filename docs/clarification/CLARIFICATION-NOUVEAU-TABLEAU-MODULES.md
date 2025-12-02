# Clarification : Nouveau Tableau "Modules par Période"

**Date**: 2025-01-16

---

## 📊 Tableau Actuel

Le tableau actuel "Top Modules avec BUGs" affiche :
- Module
- Produit
- BUGs (nombre total de bugs)
- Taux (% de bugs par rapport au total de tickets du module)
- Tendance (évolution du nombre de bugs vs période précédente)

---

## 🎯 Nouveau Tableau Demandé

Pour chaque module sur la période filtrée, afficher :
1. **Nom du module**
2. **Bug signalé** 
3. **Bug corrigé**
4. **Taux de résolution**
5. **Tendance d'évolution sur la période précédente**

---

## ❓ Questions de Clarification

### 1. "Bug signalé"
- ✅ **Confirmation attendue** : Tickets BUG **créés** dans la période filtrée ?
- Exemple : Si période = 02 juin - 02 déc 2025, on compte les bugs créés dans cette période ?

### 2. "Bug corrigé"
- ✅ **Confirmation attendue** : Tickets BUG **résolus** dans la période filtrée ?
- ⚠️ **Question importante** : Faut-il compter uniquement les bugs qui ont été :
  - **A)** Résolus dans la période (peu importe quand ils ont été créés) ?
  - **B)** Ouverts ET résolus dans la période (comme pour le taux de résolution) ?

### 3. "Taux de résolution"
- ✅ **Confirmation attendue** : `(Bug corrigé / Bug signalé) * 100` ?
- Exemple : 6 bugs signalés, 4 bugs corrigés → 66.7% ?
- ⚠️ **Question** : Si 0 bugs signalés, afficher "N/A" ou "0%" ?

### 4. "Tendance d'évolution"
- ✅ **Confirmation attendue** : Comparaison avec la période précédente ?
- ⚠️ **Question** : Que comparer exactement ?
  - **A)** Nombre de bugs signalés (période actuelle vs précédente) ?
  - **B)** Taux de résolution (taux actuel vs taux précédent) ?
  - **C)** Nombre de bugs corrigés (actuel vs précédent) ?
  - **D)** Autre ?

### 5. Filtrage des modules
- ✅ **Confirmation attendue** : Afficher tous les modules qui ont des bugs dans la période, ou tous les modules ?
- ⚠️ **Question** : Y a-t-il une limite (Top 10, Top 20, ou tous) ?

### 6. Regroupement
- ✅ **Confirmation attendue** : On affiche par module uniquement (pas de regroupement par produit) ?
- Ou faut-il garder une colonne "Produit" pour information ?

### 7. Ordre de tri
- ✅ **Confirmation attendue** : Par quel critère trier ?
  - Nombre de bugs signalés (décroissant) ?
  - Taux de résolution (croissant = pire) ?
  - Autre ?

---

## 📝 Proposition de Structure

### Colonnes du tableau
1. **Module** (nom)
2. **Produit** (optionnel, pour contexte)
3. **Bug signalé** (nombre, badge)
4. **Bug corrigé** (nombre, badge vert)
5. **Taux de résolution** (pourcentage)
6. **Tendance** (icône + pourcentage, comparaison période précédente)

### Exemple de données
| Module | Produit | Bug signalé | Bug corrigé | Taux résolution | Tendance |
|--------|---------|-------------|-------------|-----------------|----------|
| CRM    | OBC     | 6           | 4           | 67%             | ↓ -33%   |
| RH     | OBC     | 3           | 2           | 67%             | ↑ +50%   |

---

## ✅ En attente de vos réponses

Merci de confirmer les points ci-dessus avant que je commence à coder.

---

**Statut** : 🟡 **En attente de clarification**

