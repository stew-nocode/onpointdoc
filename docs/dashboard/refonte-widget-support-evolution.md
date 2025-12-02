# 📊 Refonte Widget Support Evolution - Spécifications

## 🎯 Objectif Simplifié

Widget de **tendances de volume par type de tickets** avec courbes simples.

---

## 📈 Structure du Graphique

### Axes
- **Abscisse (X)** : **Périodes** (jours/semaines/mois selon la période sélectionnée)
- **Ordonnées (Y)** : **Volumes** (nombre de tickets)

### Lignes (Courbes)
1. 🔴 **Ligne ROUGE** : Volume de tickets **BUG** par période
2. 🔵 **Ligne BLEUE** : Volume de tickets **REQ** par période  
3. 🟢 **Ligne VERTE** : Volume de tickets **ASSISTANCE** par période
4. 🟡 **Ligne JAUNE** : **Temps d'assistance** (minutes) par période
   - ⚠️ Note : Pas encore importé les assistances par agent

### Futur (Ultérieurement)
- Volume d'activités par période
- Volume de tâches par période

---

## 🔍 Filtres Simplifiés

### 1. **Période** (Obligatoire)
- Semaine
- Mois
- Trimestre
- Année

### 2. **Agent(s) Support** (Optionnel)
- "Tous" (par défaut)
- Sélection d'un ou plusieurs agents Support
- Multi-checkbox

**❌ Supprimer :**
- Filtre "Type de ticket" (on affiche tous les types sur le graphique)
- Filtre "Vue équipe/agent" (inutile selon l'utilisateur)

---

## 📊 Format des Données

Pour chaque période (date) :

```typescript
{
  date: string; // ISO date
  bugs: number;      // Nombre de tickets BUG (résolus ou créés selon contexte)
  reqs: number;      // Nombre de tickets REQ
  assistances: number; // Nombre de tickets ASSISTANCE
  assistanceTime: number; // Temps d'assistance en minutes (si disponible)
}
```

---

## 🔄 Logique de Calcul

### Volumes par Type
- Compter les tickets **créés** dans la période (pour suivre la charge de travail)
- Pour chaque période, compter :
  - Nombre de tickets BUG créés
  - Nombre de tickets REQ créés
  - Nombre de tickets ASSISTANCE créés
- Si filtre agent : tickets assignés à cet agent
- Si "tous" : tous les tickets Support

### Temps d'Assistance
- Somme de `duration_minutes` pour les tickets ASSISTANCE résolus dans la période
- ⚠️ Attention : Pas encore importé par agent, donc peut être 0/null

### Temps d'Assistance
- Somme de `duration_minutes` pour les tickets ASSISTANCE résolus
- ⚠️ Attention : Pas encore importé par agent, donc peut être vide/null

---

## 🎨 Affichage

### Graphique Simple
- Type : `LineChart` (Recharts)
- 4 lignes colorées (BUG, REQ, ASSISTANCE, Temps)
- Légende en haut ou à droite
- Tooltip au survol avec toutes les valeurs

### Filtres
- Popover avec 2 sections :
  1. Période (toggle buttons)
  2. Agents (checkboxes, avec "Tous" par défaut)

---

## 🚀 Étapes de Refonte

1. ✅ Simplifier le type de données (`SupportEvolutionData`)
2. ✅ Supprimer la logique "vue équipe/agent"
3. ✅ Modifier les requêtes pour grouper par type de ticket
4. ✅ Simplifier les filtres (supprimer type + vue)
5. ✅ Modifier le composant graphique (4 lignes par type)
6. ✅ Ajouter le temps d'assistance (avec gestion du cas vide)

---

## ✅ Réponses aux Questions

1. **Volumes** : Tickets **créés** dans la période (pour suivre la charge de travail entrante)
2. **Temps d'assistance** : Afficher même si 0 (gérer le cas "pas encore importé")
3. **Agents** : Filtrer sur les tickets **assignés à** l'agent (ou créés par si assigné = null)

