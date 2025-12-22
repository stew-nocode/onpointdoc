# User Flow - Page Planning

**Date :** 2025-12-15  
**Contexte :** Description du parcours utilisateur dans la page Planning

---

## 🎯 Vue d'Ensemble

La page Planning permet de visualiser et gérer les tâches et activités dans une vue calendaire et timeline (Gantt).

**Utilisateurs cibles :** Tous les utilisateurs internes (agents, managers, IT, marketing, direction)

---

## 📍 Point d'Entrée

**Navigation :** Menu latéral → "Planning" (ou `/planning`)

**Arrivée sur la page :**
- Server Component charge les données (actuellement mockées)
- Client Component (`PlanningPageClient`) s'initialise avec :
  - Date sélectionnée = **Aujourd'hui**
  - Mode de vue = **"Débuts"** (par défaut)
  - Onglet actif = **"Calendrier"**

---

## 🗓️ User Flow - Vue Calendrier

### Étape 1 : Affichage Initial

L'utilisateur voit **3 colonnes** :

```
┌──────────────┬──────────────────────┬──────────────┐
│  Calendrier  │      Liste           │ Disponibilité│
│              │                      │              │
│ [Mois actuel]│  [Jour sélectionné]  │  [Personnes] │
│              │                      │              │
│ - Points     │  - Items du jour     │  - Stats     │
│   verts      │  - Tâches/Activités  │  - Liste     │
│   (activités)│                      │    triée     │
│ - Points     │                      │              │
│   rouges     │                      │              │
│   (tâches)   │                      │              │
│ - Jour J     │                      │              │
│   (bleu)     │                      │              │
└──────────────┴──────────────────────┴──────────────┘
```

**Colonne 1 - Calendrier :**
- Mois en cours affiché (ex: "décembre 2025")
- Points verts sur les dates avec débuts d'activités
- Points rouges sur les dates avec échéances de tâches (si mode "Échéances")
- Jour J (aujourd'hui) : fond bleu + bordure bleue
- Jour sélectionné : bordure verte (mode Débuts) ou rouge (mode Échéances)
- Switch "Débuts / Échéances" en haut
- Navigation mois (← →) et bouton "Aujourd'hui"

**Colonne 2 - Liste :**
- Date formatée en français (ex: "Lundi 15 décembre 2025")
- Sous-titre : nombre d'événements planifiés
- Liste scrollable des items du jour :
  - Tâches (badge bleu) OU Activités (badge violet) selon le mode
  - Chaque item affiche : titre, assigné, priorité, statut, période, etc.

**Colonne 3 - Disponibilité :**
- Date formatée
- 3 badges de statistiques :
  - Disponibles (vert)
  - Occupés (bleu)
  - Surchargés (rouge)
- Liste des personnes triée :
  - Surchargés en premier (fond rouge)
  - Puis Occupés (fond bleu)
  - Puis Disponibles (fond vert)
- Pour chaque personne :
  - Nom, département
  - Badge statut
  - Charge (ex: "6.5h / 8h") avec barre de progression
  - Liste détaillée des items (tâches/activités) avec heures estimées

---

### Étape 2 : Changer de Mode de Vue

**Action :** Cliquer sur le Switch "Débuts / Échéances"

**Résultat :**
- **Mode "Débuts"** (par défaut) :
  - Points **verts** sur calendrier = dates avec débuts d'activités
  - Liste affiche uniquement les **activités** qui commencent le jour sélectionné
  - Bordure sélectionnée = **verte**

- **Mode "Échéances"** :
  - Points **rouges** sur calendrier = dates avec échéances de tâches
  - Liste affiche uniquement les **tâches** qui se terminent le jour sélectionné
  - Bordure sélectionnée = **rouge**

**Impact :**
- Calendrier se met à jour immédiatement (nouveaux points colorés)
- Liste se filtre automatiquement
- Disponibilité reste identique (tous les items du jour)

---

### Étape 3 : Naviguer dans le Calendrier

**Action 1 : Changer de mois**
- Cliquer sur ← ou → pour naviguer mois précédent/suivant
- Calendrier affiche le nouveau mois
- Points colorés se mettent à jour selon le mode
- Jour sélectionné reste le même (si dans le nouveau mois, sinon 1er jour)

**Action 2 : Sélectionner une date**
- Cliquer sur un jour dans le calendrier
- La date sélectionnée change
- La liste se met à jour avec les items de cette date
- La colonne disponibilité se met à jour pour cette date

**Action 3 : Revenir à aujourd'hui**
- Cliquer sur bouton "Aujourd'hui"
- Mois revient au mois actuel
- Date sélectionnée = aujourd'hui
- Liste et disponibilité se mettent à jour

---

### Étape 4 : Interagir avec un Item

**Hover sur un item :**
- Tooltip apparaît avec informations complètes :
  - Pour tâches : assigné, échéance, priorité, statut, description
  - Pour activités : type, période (début/fin), participants, statut, description

**Cliquer sur l'item :**
- Navigation vers la page de détail :
  - `/gestion/taches/${id}` pour une tâche
  - `/gestion/activites/${id}` pour une activité

**Pour les activités uniquement - Menu actions (⚙️) :**
- Cliquer sur l'icône Settings ouvre un Popover avec :
  1. **Voir l'activité** → Navigation vers détail
  2. **Créer une tâche à partir** → Redirection vers `/gestion/taches?linkedActivityId=${id}`
  3. **Laisser/modifier compte rendu** → Ouvre `EditActivityReportDialog`
  4. **Laisser un commentaire** → Navigation vers détail (section commentaires)

---

### Étape 5 : Consulter la Disponibilité

**Action :** Regarder la colonne de droite (ou scroller si liste longue)

**Informations affichées :**
- Statistiques globales (3 badges)
- Liste triée par statut :
  1. **Surchargés** (rouge) : charge > 8h/jour
     - Affiche : charge exacte, barre de progression, liste des items
  2. **Occupés** (bleu) : 0 < charge ≤ 8h/jour
     - Affiche : charge exacte, barre de progression
  3. **Disponibles** (vert) : charge = 0h
     - Affiche uniquement : nom, département, badge

**Détails par personne :**
- Nom complet
- Département (si disponible)
- Badge statut (Disponible/Occupé/Surchargé)
- Charge : "X.Xh / 8h" avec couleur (vert/bleu/rouge)
- Barre de progression visuelle
- Liste des items :
  - Tâches : • [Titre] (Xh) en bleu
  - Activités : • [Titre] (Xh) en violet

---

## 📊 User Flow - Vue Gantt

### Étape 1 : Basculer vers Gantt

**Action :** Cliquer sur l'onglet "Gantt"

**Résultat :**
- Vue Calendrier disparaît
- Timeline Gantt apparaît
- Filtres en haut : "Tous" / "Tâches" / "Activités"

---

### Étape 2 : Explorer la Timeline

**Structure affichée :**
- En-tête avec jours du mois (numéros)
- Ligne verticale rouge pointillée = aujourd'hui
- Lignes horizontales par personne assignée
- Barres horizontales colorées :
  - **Bleu** = Tâches
  - **Violet** = Activités
  - Barre de progression (opacité) si statut "En cours"

**Sidebar gauche :**
- Liste des personnes assignées (200px)
- Titre : "Assigné à"

---

### Étape 3 : Filtrer le Gantt

**Action :** Cliquer sur un filtre

**Résultats :**
- **"Tous"** : Affiche toutes les tâches ET activités
- **"Tâches"** : Affiche uniquement les tâches (barres bleues)
- **"Activités"** : Affiche uniquement les activités (barres violettes)

**Impact :**
- Timeline se met à jour immédiatement
- Personnes sans items filtrés peuvent disparaître

---

### Étape 4 : Naviguer dans le Gantt

**Navigation mois :**
- Boutons ← → pour changer de mois
- Timeline se met à jour avec nouvelles dates
- Bouton "Aujourd'hui" pour revenir au mois actuel

**Scroll horizontal :**
- Si timeline dépasse la largeur de l'écran
- Scroll horizontal pour voir tous les jours

**Hover sur une barre :**
- Tooltip pourrait afficher informations (non implémenté actuellement ?)

---

## 🔄 Parcours Typiques

### Parcours 1 : Voir mes tâches du jour

1. Arrive sur Planning (onglet Calendrier, mode Débuts)
2. Switch vers mode **"Échéances"**
3. Calendrier affiche points rouges (échéances tâches)
4. Liste affiche uniquement tâches du jour sélectionné
5. Consulte disponibilité pour voir sa charge

---

### Parcours 2 : Planifier une activité

1. Arrive sur Planning
2. Navigue vers le mois cible
3. Sélectionne une date disponible
4. Consulte disponibilité pour voir qui est libre
5. Clique sur "Créer une activité" (si bouton existe) ou va vers page création

---

### Parcours 3 : Suivre le planning de l'équipe

1. Arrive sur Planning
2. Passe en vue **Gantt**
3. Filtre sur "Tous" pour voir tâches + activités
4. Navigue mois par mois pour vue globale
5. Identifie surcharges (barres longues, plusieurs barres par personne)

---

### Parcours 4 : Laisser un compte rendu d'activité

1. Arrive sur Planning
2. Mode "Débuts" (activités)
3. Trouve l'activité dans la liste
4. Clique sur ⚙️ (menu actions)
5. Sélectionne "Laisser un compte rendu"
6. Dialog s'ouvre avec éditeur WYSIWYG
7. Rédige et sauvegarde
8. Dialog se ferme, item se met à jour

---

### Parcours 5 : Créer une tâche depuis une activité

1. Arrive sur Planning
2. Mode "Débuts"
3. Trouve l'activité concernée
4. Clique sur ⚙️ (menu actions)
5. Sélectionne "Créer une tâche à partir"
6. Redirection vers `/gestion/taches?linkedActivityId=${id}`
7. Formulaire de création pré-rempli avec lien vers l'activité

---

## 🎨 Détails Visuels et UX

### Codes Couleurs

**Calendrier :**
- 🟢 Vert = Débuts d'activités (mode "Débuts")
- 🔴 Rouge = Échéances de tâches (mode "Échéances")
- 🔵 Bleu = Jour J (aujourd'hui)

**Liste :**
- 🔵 Bleu = Tâches (badge, icône)
- 🟣 Violet = Activités (badge, icône)

**Disponibilité :**
- 🟢 Vert = Disponible (0h)
- 🔵 Bleu = Occupé (0 < charge ≤ 8h)
- 🔴 Rouge = Surchargé (charge > 8h)

**Gantt :**
- 🔵 Bleu = Tâches
- 🟣 Violet = Activités
- 🔴 Rouge pointillé = Ligne "Aujourd'hui"

---

### États et Feedback

**Chargement :**
- Pas d'indicateur de chargement actuellement (données mockées instantanées)

**Vide :**
- Liste vide : Message "Aucune activité débutant ce jour" ou "Aucune tâche à échéance ce jour"
- Disponibilité vide : "Aucune personne trouvée"

**Erreurs :**
- Pas de gestion d'erreur visible actuellement (données mockées)

**Interactions :**
- Hover : Tooltip sur items, changement de couleur sur boutons/liens
- Click : Navigation, ouverture de dialogs/menus
- Scroll : Listes scrollables, timeline Gantt scrollable horizontalement

---

## 📱 Responsive

**Desktop :**
- 3 colonnes côte à côte (Calendrier | Liste | Disponibilité)
- Gantt pleine largeur

**Tablet :**
- Layout peut s'adapter (à vérifier dans le code)

**Mobile :**
- Probablement colonnes empilées (à vérifier)

---

## ⚠️ Limitations Actuelles (Données Mockées)

1. **Pas de synchronisation temps réel**
   - Les données affichées ne reflètent pas la base Supabase
   - Changements dans autres pages ne sont pas visibles immédiatement

2. **Pas de filtrage avancé**
   - Pas de filtre par personne, département, statut, etc.
   - Filtrage basique uniquement (Débuts vs Échéances)

3. **Pas de création rapide**
   - Pas de bouton "Créer" visible sur la page
   - Doit naviguer vers pages dédiées

4. **Pas d'édition inline**
   - Impossible de modifier directement depuis le planning
   - Doit aller sur page de détail

---

## ✅ Points Forts UX

1. ✅ **Vue d'ensemble claire** : Calendrier + Liste + Disponibilité en un coup d'œil
2. ✅ **Navigation intuitive** : Boutons mois, "Aujourd'hui", sélection directe
3. ✅ **Codes couleur cohérents** : Facile d'identifier types et statuts
4. ✅ **Tooltips informatifs** : Informations complètes au survol
5. ✅ **Actions contextuelles** : Menu actions directement sur items
6. ✅ **Vue alternative** : Gantt pour vue timeline globale
7. ✅ **Feedback visuel** : Surbrillances, bordures, badges statut

---

**Statut :** ✅ User Flow documenté - Prêt pour améliorations



