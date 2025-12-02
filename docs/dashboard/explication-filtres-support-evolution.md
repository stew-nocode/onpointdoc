# 📊 Explication Simple des Filtres - Évolution Performance Support

## ⚠️ Important

**Ce widget est spécifique au département Support uniquement.**

Les autres départements (IT, Marketing, etc.) auront leurs propres widgets car chaque département suit des indicateurs différents.

---

## 🎯 À quoi sert ce widget ?

Ce graphique permet de suivre la performance de **l'équipe Support** dans le temps :
- ⏱️ **Temps d'assistance** (en minutes)
- ✅ **Tickets résolus** (nombre)
- 📊 **Tickets ouverts** (charge active)
- 📈 **MTTR** (temps moyen de résolution en jours)

---

## 🔍 Les 3 Filtres Principaux

### 1️⃣ **Période** (Semaine / Mois / Trimestre / Année)

**À quoi ça sert ?** Choisir la période d'analyse.

**Comment ça fonctionne ?**
- **Semaine** : Affiche les 7 derniers jours (jour par jour)
- **Mois** : Affiche le mois en cours (jour par jour, limité à ~7-8 dates pour performance)
- **Trimestre** : Affiche les 3 derniers mois (semaine par semaine)
- **Année** : Affiche l'année en cours (mois par mois : janv., févr., mars, etc.) ⭐

**Ce que vous voyez :**
- En "Année" : 12 points de données (un par mois)
- En "Mois" : ~7-8 points de données (jours représentatifs)
- En "Semaine" : 7 points de données (un par jour)

---

### 2️⃣ **Type de ticket** (Tous / ASSISTANCE / BUG / REQ)

**À quoi ça sert ?** Filtrer les tickets par type.

**Comment ça fonctionne ?**
- **Tous** : Affiche tous les types de tickets (par défaut)
- **ASSISTANCE** : Uniquement les tickets d'assistance
- **BUG** : Uniquement les bugs
- **REQ** : Uniquement les requêtes

**Ce que vous voyez :**
- Si vous sélectionnez "ASSISTANCE" : Le graphique montre seulement les métriques des tickets ASSISTANCE (temps d'assistance, résolus, etc.)

---

### 3️⃣ **Vue** (Par équipe / Par agent)

**À quoi ça sert ?** Choisir entre vue globale ou vue individuelle.

**Comment ça fonctionne ?**
- **Par équipe** (par défaut) : Affiche les métriques globales de toute l'équipe
- **Par agent** : Affiche les métriques de chaque agent individuellement (nécessite de sélectionner des agents)

**Ce que vous voyez :**
- **Par équipe** : 4 lignes (Tickets Résolus, Tickets Ouverts, Temps d'Assistance, MTTR)
- **Par agent** : Plusieurs lignes (une par agent sélectionné) avec leurs métriques

---

## 📈 Ce que vous devriez voir dans le graphique

### En vue "Année" (ce que vous avez sélectionné)

**Abscisse (X - horizontal)** :
- 12 mois : `janv.`, `févr.`, `mars`, `avr.`, `mai`, `juin`, `juil.`, `août`, `sept.`, `oct.`, `nov.`, `déc.`

**Ordonnées (Y - vertical)** :
- **Gauche** : Nombre de tickets (résolus, ouverts)
- **Droite** : Temps (minutes d'assistance, jours MTTR)

**Lignes du graphique** (en vue "Par équipe") :
1. 🟢 **Ligne verte** : Tickets Résolus (nombre par mois)
2. 🔴 **Ligne rouge** : Tickets Ouverts (nombre par mois)
3. 🟡 **Ligne jaune** : Temps d'Assistance total (minutes par mois)
4. 🔵 **Ligne bleue** : MTTR Moyen (jours par mois)

---

## ⚠️ Pourquoi le graphique est vide ?

Si vous voyez seulement une ligne pointillée et les mois en bas, cela signifie :

1. **Aucune donnée disponible** pour cette période
   - Vérifiez qu'il y a des tickets résolus/ouverts dans la base de données
   - Vérifiez que la période sélectionnée contient des données

2. **Problème de récupération des données**
   - Les requêtes Supabase peuvent échouer silencieusement
   - Vérifiez la console du navigateur (F12) pour les erreurs

3. **Filtres trop restrictifs**
   - Essayez "Tous" pour le type de ticket
   - Essayez une période plus récente (Mois au lieu d'Année)

---

## 🔧 Vérifications à faire

1. **Console du navigateur** (F12 → Console) :
   - Recherchez les logs `[SupportEvolution]`
   - Recherchez les erreurs en rouge

2. **Vérifier les données dans Supabase** :
   - Y a-t-il des tickets avec `status = 'Resolue'` ou `'Terminé'` ?
   - Y a-t-il des tickets avec `resolved_at` renseigné ?

3. **Tester avec une période plus courte** :
   - Passez de "Année" à "Mois" ou "Semaine"
   - Cela réduit le nombre de requêtes et peut révéler le problème

---

## 📝 Résumé

**Filtres actuels (d'après votre image)** :
- ✅ Période : **Année** (devrait afficher 12 mois)
- ✅ Type : **Tous** (tous les types de tickets)
- ✅ Vue : **Par équipe** (métriques globales)

**Ce qui devrait s'afficher** :
- Graphique avec 12 points (un par mois)
- 4 lignes (Résolus, Ouverts, Temps, MTTR)
- Abscisse : janv., févr., mars, etc.

**Si vide** : Vérifiez la console et les données dans Supabase.

