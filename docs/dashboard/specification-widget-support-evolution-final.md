# 📊 Spécification Finale - Widget Évolution Support (Tendances Globales)

## 🎯 Objectif

Widget principal pour suivre les **tendances globales** du département Support par type de dimension (BUG, REQ, ASSISTANCE, Temps d'assistance, puis plus tard Tâches, Activités).

---

## 📈 Structure du Graphique Principal

### Axes
- **Abscisse (X)** : **Périodes** (jours/semaines/mois selon la période)
- **Ordonnées Y Gauche** : **Volumes** (nombre de tickets/tâches/activités)
- **Ordonnées Y Droite** : **Temps d'assistance** (minutes)

### Lignes (Courbes) - Selon Dimension Sélectionnée

**Dimensions disponibles** :
1. 🔴 **BUG** : Volume de tickets BUG créés par période
2. 🔵 **REQ** : Volume de tickets REQ créés par période
3. 🟢 **ASSISTANCE** : Volume de tickets ASSISTANCE créés par période
4. 🟡 **Temps d'assistance** : Temps total en minutes (axe Y droite)
5. 🟣 **Tâches** : Volume de tâches créées (à ajouter plus tard)
6. 🟠 **Activités** : Volume d'activités créées (à ajouter plus tard)

**Principe** : L'utilisateur peut sélectionner une ou plusieurs dimensions à afficher simultanément.

---

## 🔍 Filtres

### 1. **Période** (Obligatoire)
- Semaine (7 derniers jours)
- Mois (mois en cours)
- Trimestre (trimestre en cours)
- Année en cours
- Années précédentes :
  - 2023
  - 2024
  - etc.

### 2. **Agent(s) Support** (Optionnel)
- "Tous" (par défaut) - Vue globale département
- Sélection d'un agent
- Sélection de plusieurs agents
- Multi-checkbox avec recherche

### 3. **Dimension(s)** (Optionnel, Multi-sélection)
- ☑️ BUG
- ☑️ REQ
- ☑️ ASSISTANCE
- ☑️ Temps d'assistance
- ☐ Tâches (à implémenter plus tard)
- ☐ Activités (à implémenter plus tard)

**Par défaut** : Toutes les dimensions disponibles sont sélectionnées (sauf Tâches/Activités non encore implémentées).

---

## 📊 Format des Données

Pour chaque période (date) :

```typescript
{
  date: string; // ISO date: "2025-01-15"
  bugs: number;           // Nombre de tickets BUG créés dans la période
  reqs: number;           // Nombre de tickets REQ créés dans la période
  assistances: number;    // Nombre de tickets ASSISTANCE créés dans la période
  assistanceTime: number; // Temps d'assistance total en minutes (si disponible)
  tasks?: number;         // Nombre de tâches créées (futur)
  activities?: number;    // Nombre d'activités créées (futur)
}
```

---

## 🔄 Logique de Calcul

### Volumes par Type
- Compter les tickets **CRÉÉS** dans la période (`created_at`)
- Pour chaque période, compter :
  - Nombre de tickets BUG créés
  - Nombre de tickets REQ créés
  - Nombre de tickets ASSISTANCE créés
- Si filtre agent : tickets assignés à cet agent (ou créés par si assigné = null)
- Si "tous" : tous les tickets du département Support

### Temps d'Assistance
- Somme de `duration_minutes` pour les tickets ASSISTANCE résolus dans la période
- ⚠️ Note : Pas encore importé par agent, donc peut être 0/null
- Affiché sur axe Y droite (échelle différente des volumes)

### Futur (À implémenter)
- **Tâches** : Compter les tâches créées (`created_at` dans table `tasks`)
- **Activités** : Compter les activités créées (`created_at` dans table `activities`)

---

## 🎨 Affichage

### Graphique
- Type : `LineChart` (Recharts)
- Lignes dynamiques selon dimensions sélectionnées
- Légende interactive (clic pour masquer/afficher une ligne)
- Tooltip au survol avec toutes les valeurs
- 2 axes Y (gauche = volumes, droite = temps)

### Filtres UI
- Popover avec 3 sections :
  1. **Période** : Toggle buttons (Semaine, Mois, Trimestre, Année) + Select pour années précédentes
  2. **Agents** : Multi-checkbox avec recherche (scrollable si beaucoup d'agents)
  3. **Dimensions** : Multi-checkbox (BUG, REQ, ASSISTANCE, Temps, Tâches, Activités)

---

## 🔮 Graphiques Individuels Futurs (À implémenter plus tard)

Ces widgets détaillés seront créés séparément :

### Widget "Suivi des BUG en détail"
- Type : `BarChart` (graphique en barres)
- Filtres :
  - Période
  - Agent(s)
  - **Statut** : Résolu, En cours, Nouveau, etc.
- Métriques : Volume par statut, évolution dans le temps

### Widget "Suivi des REQ en détail"
- Même principe que BUG mais pour REQ

### Widget "Suivi des ASSISTANCE en détail"
- Détails sur les assistances, temps moyen, etc.

---

## 🚀 Étapes d'Implémentation

### Phase 1 : Refonte du Widget Principal (Maintenant)
1. ✅ Simplifier les types TypeScript
2. ✅ Refondre le service de données (volumes par type, pas métriques complexes)
3. ✅ Simplifier les filtres (Période, Agent(s), Dimension(s))
4. ✅ Refaire le composant graphique (lignes par dimension)
5. ✅ Ajouter gestion axe Y droite pour temps d'assistance
6. ✅ Tester avec données réelles

### Phase 2 : Extensions Futures
- Ajouter support pour Tâches (quand données disponibles)
- Ajouter support pour Activités (quand données disponibles)
- Créer widgets individuels détaillés (BUG, REQ, ASSISTANCE)

---

## 📝 Notes Importantes

- **Ce widget = Vue d'ensemble avec tendances**
- **Widgets individuels = Vues détaillées par type**
- Les volumes sont toujours des tickets/dimensions **créés** (charge entrante)
- Le temps d'assistance est une exception (basé sur résolution)


