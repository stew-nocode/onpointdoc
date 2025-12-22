# Analyse Détaillée - Page Planning

**Date :** 2025-12-15  
**Objectif :** Analyse minutieuse avant modifications

---

## 📋 Vue d'Ensemble

La page Planning (`/planning`) est une interface de visualisation calendaire des tâches et activités avec **2 vues principales** :
1. **Calendrier** : Vue calendrier mensuel + liste du jour sélectionné + disponibilités
2. **Gantt** : Timeline SVG organisée par personne assignée

**Statut actuel :** Utilise des **données mockées** (pas encore connecté à Supabase)

---

## 🏗️ Architecture Actuelle

### Structure des Fichiers

```
src/app/(main)/planning/
  └── page.tsx                        # Server Component (noStore)

src/components/planning/
  ├── planning-page-client.tsx        # Client Component principal (orchestration)
  ├── planning-calendar.tsx           # Calendrier mensuel avec navigation
  ├── planning-list.tsx               # Liste des items du jour sélectionné
  ├── planning-day-item.tsx           # Item individuel (tâche/activité) dans la liste
  ├── planning-item-tooltip.tsx       # Tooltip détaillé au survol
  ├── mock-data.ts                    # Données mockées (tâches/activités)
  ├── types.ts                        # Types pour données mockées
  │
  ├── availability/
  │   ├── planning-availability.tsx   # Colonne disponibilité (1/4 fixe)
  │   ├── mock-data.ts                # Données mockées disponibilités
  │   └── types.ts                    # Types PersonAvailability
  │
  ├── gantt/
  │   ├── gantt-chart.tsx             # Vue Gantt SVG
  │   ├── mock-data.ts                # Données mockées Gantt
  │   └── types.ts                    # Types GanttItem, GanttRow
  │
  └── index.ts                        # Exports centralisés
```

---

## 🎨 Vue Calendrier - Architecture Détaillée

### Layout (3 colonnes)

```
┌─────────────────────────────────────────────────────────────┐
│  Calendrier (flex-shrink-0)  │  Liste (flex-1)  │  Disponibilité (1/4)  │
│  ┌─────────────────────┐     │  ┌──────────────┐│  ┌──────────────────┐│
│  │ Header:             │     │  │ Header:      ││  │ Header:          ││
│  │ - Switch Débuts/    │     │  │ Date formatée││  │ Disponibilité    ││
│  │   Échéances         │     │  │              ││  │                  ││
│  │ - Navigation mois   │     │  │              ││  │                  ││
│  │ - Bouton Aujourd'hui│     │  │ Liste        ││  │ Stats (3 badges) ││
│  │                     │     │  │ scrollable:  ││  │                  ││
│  │ Calendrier:         │     │  │              ││  │ Liste personnes: ││
│  │ - Points verts      │     │  │ - Tâches     ││  │ - Surchargés     ││
│  │   (débuts activités)│     │  │ - Activités  ││  │ - Occupés        ││
│  │ - Points rouges     │     │  │              ││  │ - Disponibles    ││
│  │   (échéances tâches)│     │  │              ││  │                  ││
│  │ - Jour J (bleu)     │     │  │              ││  │                  ││
│  │ - Jour sélectionné  │     │  │              ││  │                  ││
│  │   (vert/rouge)      │     │  │              ││  │                  ││
│  └─────────────────────┘     │  └──────────────┘│  └──────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Hauteur fixe :** `calc(100vh - 280px)` avec `minHeight: 600px`

### Composant Principal : `planning-page-client.tsx`

**Responsabilités :**
- Gestion état `selectedDate` (Date)
- Gestion état `viewMode` ('starts' | 'dueDates')
- Orchestration des 3 colonnes
- Gestion des onglets (Calendrier / Gantt)

**État local :**
```typescript
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [viewMode, setViewMode] = useState<PlanningViewMode>('starts');
```

---

## 📅 Composant PlanningCalendar

### Fonctionnalités

1. **Navigation mois**
   - Boutons ← → pour changer de mois
   - Bouton "Aujourd'hui" pour revenir au mois actuel
   - État `currentMonth` local

2. **Switch Mode de vue**
   - `'starts'` : Affiche les débuts d'activités (points verts)
   - `'dueDates'` : Affiche les échéances de tâches (points rouges)

3. **Affichage calendrier**
   - Utilise composant `Calendar` de ShadCN UI
   - Modifiers pour surbrillance :
     - `hasEvents` : Points colorés selon le mode
     - `today` : Fond bleu + bordure bleue
     - `selected` : Bordure verte (débuts) ou rouge (échéances)

4. **Données mockées**
   - `getMockDatesWithEvents(year, month, viewMode)` retourne les dates avec événements

### Points d'Attention

- ✅ Utilise `date-fns` pour formatage (locale française)
- ✅ Gestion correcte des modifiers avec classes conditionnelles
- ⚠️ **Données mockées** - À remplacer par vraies données Supabase

---

## 📋 Composant PlanningList

### Fonctionnalités

1. **Affichage items du jour**
   - Filtre selon `viewMode` :
     - `'starts'` → Affiche uniquement activités
     - `'dueDates'` → Affiche uniquement tâches

2. **Filtrage des items**
   - Pour tâches : `dueDate === selectedDate`
   - Pour activités : `selectedDate dans [plannedStart, plannedEnd]`

3. **Liste scrollable**
   - Header fixe avec date formatée
   - Liste scrollable avec items (`PlanningDayItem`)

4. **Données mockées**
   - `getMockItemsForDate(date)` retourne les items du jour

### Points d'Attention

- ✅ Logique de filtrage correcte (période pour activités)
- ✅ Formatage date français (ex: "Lundi 15 décembre 2025")
- ⚠️ **Données mockées** - À remplacer par vraies données Supabase
- ⚠️ Filtrage côté client (inefficace pour grandes quantités de données)

---

## 🎯 Composant PlanningDayItem

### Fonctionnalités

1. **Affichage item**
   - Badge type (Tâche/Activité) avec icône
   - Titre
   - Informations contextuelles (assigned, priority, status, participants, etc.)
   - Lien vers détail (→)
   - Menu actions (pour activités uniquement)

2. **Différences Tâches vs Activités**

   **Tâches :**
   - Icône bleue (`ListChecks`)
   - Badge type bleu
   - Affichage : assigné, priorité, statut

   **Activités :**
   - Icône violette (`CalendarDays`)
   - Badge type violet
   - Affichage : type, période, participants, statut
   - Menu Popover avec actions :
     - Voir l'activité
     - Créer une tâche à partir
     - Laisser/modifier compte rendu
     - Laisser un commentaire

3. **Actions disponibles**
   - Navigation vers détail (`/gestion/taches/${id}` ou `/gestion/activites/${id}`)
   - Pour activités : création tâche liée, gestion compte rendu

4. **Tooltip**
   - `PlanningItemTooltip` affiché au survol
   - Informations complètes selon le type

### Points d'Attention

- ✅ Utilise `EditActivityReportDialog` pour compte rendu
- ✅ Actions intégrées avec routing Next.js
- ⚠️ **Données mockées** - Types `MockPlanningItem` à remplacer

---

## 👥 Composant PlanningAvailability

### Fonctionnalités

1. **Calcul disponibilité**
   - Basé sur durée estimée (Option 3)
   - Capacité par défaut : 8h/jour
   - Taux d'utilisation = (totalHours / capacity) * 100

2. **Statuts**
   - `available` : totalHours === 0
   - `busy` : 0 < totalHours <= capacity
   - `overloaded` : totalHours > capacity

3. **Affichage**
   - Stats rapides (3 badges : Disponibles, Occupés, Surchargés)
   - Liste triée : Surchargés → Occupés → Disponibles
   - Pour chaque personne :
     - Nom, département
     - Badge statut
     - Charge (Xh / Yh) avec barre de progression
     - Liste des items (tâches/activités) avec heures estimées

4. **Données mockées**
   - `getMockPeople()` : Liste des personnes
   - `calculateAvailabilityForDate(date, people)` : Calcul pour date

### Points d'Attention

- ✅ Logique de calcul correcte (tâches + activités)
- ✅ Gestion période pour activités (`isWithinInterval`)
- ✅ Tri intelligent par statut puis charge
- ⚠️ **Données mockées** - À remplacer par vraies données Supabase
- ⚠️ Durées estimées mockées (1-4h pour tâches, 2-6h pour activités)

---

## 📊 Composant GanttChart

### Fonctionnalités

1. **Timeline SVG**
   - En-tête avec jours du mois
   - Lignes horizontales par personne assignée
   - Barres horizontales pour chaque item (tâche/activité)
   - Ligne verticale rouge pointillée pour "aujourd'hui"

2. **Filtres**
   - 3 boutons : Tous / Tâches / Activités
   - Filtrage des items selon type

3. **Affichage items**
   - Couleur bleue pour tâches (`#3B82F6`)
   - Couleur violette pour activités (`#8B5CF6`)
   - Barre de progression (opacité 60%)
   - Titre affiché si largeur > 80px

4. **Organisation**
   - Groupé par personne assignée
   - Sidebar gauche : "Assigné à" (200px)
   - Timeline : largeur = `totalDays * 40px`

5. **Navigation**
   - Navigation mois (← →)
   - Bouton "Aujourd'hui"

### Points d'Attention

- ✅ SVG custom bien structuré
- ✅ Responsive avec scroll horizontal
- ⚠️ **Données mockées** - `generateMockGanttItems()` et `organizeGanttByPerson()`
- ⚠️ Dimensions fixes (rowHeight=50, dayWidth=40) - pourrait être configurable

---

## 🔄 Types et Données Mockées

### Types Principaux

```typescript
// src/components/planning/types.ts
type PlanningItemType = 'task' | 'activity';

type MockPlanningTask = {
  id: string;
  type: 'task';
  title: string;
  status: 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente' | null;
  dueDate: string; // ISO date string
  assignedTo?: { id: string; fullName: string } | null;
};

type MockPlanningActivity = {
  id: string;
  type: 'activity';
  title: string;
  activityType: string | null;
  status: string | null;
  plannedStart: string; // ISO date string
  plannedEnd: string | null; // ISO date string
  reportContent?: string | null;
  participants?: Array<{ id: string; fullName: string }>;
};

type MockPlanningItem = MockPlanningTask | MockPlanningActivity;
```

### Fonctions Mockées

1. **`getMockItemsForMonth(year, month)`**
   - Génère tâches et activités pour un mois
   - Algorithme simple : 2-3 tâches/semaine, 1-2 activités/semaine

2. **`getMockItemsForDate(date)`**
   - Filtre items du mois pour date spécifique
   - Logique : `dueDate === date` pour tâches, `date in [plannedStart, plannedEnd]` pour activités

3. **`getMockDatesWithEvents(year, month, viewMode)`**
   - Retourne dates avec événements pour surbrillance calendrier
   - Selon mode : débuts activités ou échéances tâches

---

## 🔗 Intégration avec Services Existants

### Services Disponibles

1. **Activities Service** (`src/services/activities/index.ts`)
   - `listActivitiesPaginated()` : Liste paginée avec filtres
   - `createActivity()`, `updateActivity()`, `deleteActivity()`
   - Types : `ActivityWithRelations`, `SupabaseActivityRaw`

2. **Tasks Service** (`src/services/tasks/index.ts`)
   - `listTasksPaginated()` : Liste paginée avec filtres
   - `createTask()`, `updateTask()`, `deleteTask()`
   - Types : `TaskWithRelations`

3. **Users Service** (`src/services/users/index.ts`)
   - `listBasicProfiles()` : Liste des profils
   - Type : `BasicProfile`

### Champs DB Pertinents

**Tâches (`tasks`) :**
- `start_date` (DATE) - Date de début
- `estimated_duration_hours` (NUMERIC) - Durée estimée en heures
- `due_date` → **PAS UTILISÉ** (remplacé par `start_date` + `estimated_duration_hours`)
- `assigned_to` (UUID) - FK vers profiles
- `status` (ENUM)

**Activités (`activities`) :**
- `planned_start` (TIMESTAMPTZ) - Date/heure de début
- `planned_end` (TIMESTAMPTZ) - Date/heure de fin
- `activity_type` (ENUM)
- `status` (ENUM)
- `report_content` (TEXT) - Compte rendu

**Participants (`activity_participants`) :**
- `activity_id` (UUID) - FK vers activities
- `profile_id` (UUID) - FK vers profiles

---

## ⚠️ Points Critiques Identifiés

### 1. **Données Mockées Partout**
- ❌ Aucune connexion Supabase
- ❌ Types `MockPlanningItem` différents des vrais types
- ⚠️ **Action requise** : Remplacer toutes les fonctions mockées par appels Supabase

### 2. **Incohérence Champs Tâches**
- ❌ Code utilise `dueDate` mais DB a `start_date` + `estimated_duration_hours`
- ⚠️ **Action requise** : Adapter la logique pour utiliser `start_date` et calculer l'échéance si nécessaire

### 3. **Performance Potentielle**
- ⚠️ Filtrage côté client (`getMockItemsForDate`)
- ⚠️ Pas de pagination pour le planning
- ⚠️ Gantt charge tout le mois en une fois

### 4. **Manque de Services Dédiés**
- ❌ Pas de service `planning` dédié
- ❌ Logique de filtrage dispersée dans les composants
- ⚠️ **Action requise** : Créer services dédiés pour planning

### 5. **Types Incohérents**
- ⚠️ `MockPlanningTask.dueDate` vs `TaskWithRelations.start_date`
- ⚠️ `MockPlanningActivity` vs `ActivityWithRelations` (champs similaires mais structure différente)

---

## 📝 Recommandations pour Modifications

### Phase 1 : Créer Services Planning

1. **`src/services/planning/list-tasks-for-date.ts`**
   - Récupère tâches avec `start_date === date`
   - Transforme en format Planning

2. **`src/services/planning/list-activities-for-date.ts`**
   - Récupère activités où `date in [planned_start, planned_end]`
   - Transforme en format Planning

3. **`src/services/planning/list-items-for-month.ts`**
   - Récupère toutes les tâches/activités du mois
   - Optimisé pour calendrier (dates avec événements)

4. **`src/services/planning/calculate-availability.ts`**
   - Utilise `estimated_duration_hours` des tâches
   - Calcule pour chaque personne

### Phase 2 : Adapter Types

1. **Créer types Planning unifiés**
   ```typescript
   type PlanningItem = PlanningTaskItem | PlanningActivityItem;
   
   type PlanningTaskItem = {
     id: string;
     type: 'task';
     title: string;
     startDate: Date; // start_date
     endDate: Date; // start_date + estimated_duration_hours
     // ...
   };
   ```

2. **Transformer depuis types Supabase**
   - `TaskWithRelations` → `PlanningTaskItem`
   - `ActivityWithRelations` → `PlanningActivityItem`

### Phase 3 : Adapter Composants

1. **Remplacer appels mock par services**
   - `getMockItemsForDate` → Service Supabase
   - `getMockDatesWithEvents` → Service Supabase
   - `calculateAvailabilityForDate` → Service Supabase

2. **Optimiser chargement**
   - Server Component pour chargement initial
   - Client Component pour interactivité
   - Cache React si possible

---

## 🎯 Points d'Attention Spécifiques

### 1. **Mode de Vue "Débuts" vs "Échéances"**

**Débuts (`starts`) :**
- Affiche activités avec `planned_start`
- Points verts sur calendrier

**Échéances (`dueDates`) :**
- Devrait afficher tâches avec `start_date + estimated_duration_hours`
- Points rouges sur calendrier
- ⚠️ **Problème** : Pas de champ `due_date` dans DB, doit être calculé

### 2. **Période des Activités**

- Activités peuvent s'étaler sur plusieurs jours
- Filtrage : `selectedDate in [plannedStart, plannedEnd]`
- Affichage dans liste : Période complète affichée

### 3. **Disponibilité**

- Basée sur `estimated_duration_hours` (pas encore dans DB pour activités)
- Capacité : 8h/jour par défaut (configurable ?)
- Calcul : Somme des heures pour toutes les tâches/activités du jour

### 4. **Gantt**

- Organisé par personne assignée
- Pour activités : Qui est assigné ? (participants ? créateur ?)
- ⚠️ **Problème** : Activités n'ont pas d'assigné unique, ont des participants

---

## ✅ Points Positifs

1. ✅ Architecture modulaire (composants séparés)
2. ✅ Types bien définis (même si mockés)
3. ✅ UX soignée (tooltips, actions contextuelles)
4. ✅ Responsive (layout flex avec breakpoints)
5. ✅ Accessibilité (aria-labels, navigation clavier)
6. ✅ Code organisé (séparation mock-data, types, composants)

---

## 📊 Résumé des Dépendances

```
PlanningPage (Server)
  └── PlanningPageClient (Client)
      ├── Tabs (Calendrier / Gantt)
      │
      ├── PlanningCalendar
      │   └── getMockDatesWithEvents() ❌ Mock
      │
      ├── PlanningList
      │   ├── getMockItemsForDate() ❌ Mock
      │   └── PlanningDayItem
      │       └── PlanningItemTooltip
      │
      ├── PlanningAvailability
      │   ├── getMockPeople() ❌ Mock
      │   └── calculateAvailabilityForDate() ❌ Mock
      │
      └── GanttChart
          ├── generateMockGanttItems() ❌ Mock
          └── organizeGanttByPerson() ❌ Mock
```

---

**Statut :** ✅ Analyse complète - Prêt pour modifications



