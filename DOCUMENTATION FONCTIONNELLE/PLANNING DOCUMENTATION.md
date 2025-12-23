# Documentation - Page Planning

## 📋 Vue d'ensemble

La page `/planning` est une interface de visualisation et de gestion du planning des tâches et activités. Elle permet de :
- Visualiser les tâches et activités planifiées sur un calendrier
- Filtrer par date et mode de vue (Débuts / Échéances)
- Consulter la disponibilité des personnes
- Afficher un diagramme de Gantt
- Accéder rapidement aux détails et actions sur les items

**Route** : `/planning`  
**Fichier principal** : `src/app/(main)/planning/page.tsx`

---

## 🏗️ Architecture

### Structure des fichiers

```
src/
├── app/
│   ├── (main)/
│   │   └── planning/
│   │       └── page.tsx                    # Server Component (point d'entrée)
│   └── api/
│       └── planning/
│           ├── items/
│           │   └── route.ts                # API: Récupérer items pour une date
│           └── dates/
│               └── route.ts                # API: Récupérer dates avec événements
│
├── components/
│   └── planning/
│       ├── planning-page-client.tsx        # Client Component principal (orchestrateur)
│       ├── planning-calendar.tsx           # Composant calendrier
│       ├── planning-list.tsx               # Liste des items du jour sélectionné
│       ├── planning-day-item.tsx           # Item individuel (tâche/activité)
│       ├── planning-item-card.tsx          # Carte UI réutilisable
│       ├── planning-item-tooltip.tsx       # Tooltip avec détails
│       ├── types.ts                        # Types TypeScript pour le planning
│       ├── mock-data.ts                    # ⚠️ Données mockées (à remplacer)
│       ├── index.ts                        # Exports centralisés
│       │
│       ├── gantt/
│       │   ├── gantt-chart.tsx             # Diagramme de Gantt
│       │   ├── types.ts                    # Types pour Gantt
│       │   └── mock-data.ts                # ⚠️ Données mockées Gantt
│       │
│       └── availability/
│           ├── planning-availability.tsx    # Colonne disponibilité
│           ├── types.ts                    # Types pour disponibilité
│           └── mock-data.ts                # ⚠️ Données mockées disponibilité
│
└── services/
    └── planning/
        ├── get-planning-items-for-date.ts  # Service: Items pour une date
        ├── get-planning-dates-with-events.ts # Service: Dates avec événements
        └── calculate-total-workload.ts     # Service: Calcul charge de travail
```

---

## 🔄 Flux de données

### 1. Chargement initial

```
page.tsx (Server Component)
  ↓
PlanningPageClient (Client Component)
  ↓
  ├─→ PlanningCalendar (charge dates avec événements)
  ├─→ PlanningList (charge items pour date sélectionnée)
  └─→ PlanningAvailability (charge disponibilité)
```

### 2. Appels API

**Route API `/api/planning/items`**
- **Paramètres** : `date` (ISO string), `viewMode` ('starts' | 'dueDates')
- **Retour** : `{ items: PlanningItem[] }`
- **Service** : `getPlanningItemsForDate()`

**Route API `/api/planning/dates`**
- **Paramètres** : `year`, `month`, `viewMode`
- **Retour** : `{ dates: string[] }` (ISO strings)
- **Service** : `getPlanningDatesWithEvents()`

---

## 📊 Types et interfaces

### Types principaux

**`PlanningItem`** (union type)
```typescript
type PlanningItem = PlanningTaskItem | PlanningActivityItem;
```

**`PlanningTaskItem`**
```typescript
{
  id: string;
  type: 'task';
  title: string;
  status: 'A_faire' | 'En_cours' | 'Termine' | 'Annule' | 'Bloque';
  priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente' | null;
  startDate: string; // ISO date string
  assignedTo?: { id: string; fullName: string } | null;
}
```

**`PlanningActivityItem`**
```typescript
{
  id: string;
  type: 'activity';
  title: string;
  activityType: string | null;
  status: string | null;
  plannedStart: string; // ISO date string
  plannedEnd: string | null; // ISO date string
  reportContent?: string | null;
  createdBy?: { id: string; fullName: string } | null;
  participants?: Array<{ id: string; fullName: string }>;
}
```

**`PlanningViewMode`**
```typescript
type PlanningViewMode = 'starts' | 'dueDates';
```

---

## 🎯 Modes de vue

### Mode "Débuts" (`starts`)
- **Calendrier** : Affiche les dates de début des activités (`planned_start`)
- **Liste** : Affiche uniquement les **activités** qui commencent le jour sélectionné
- **Points sur calendrier** : Verts

### Mode "Échéances" (`dueDates`)
- **Calendrier** : Affiche les dates d'échéance des tâches (calculées : `start_date + estimated_duration_hours`) et les dates de fin des activités (`planned_end`)
- **Liste** : Affiche uniquement les **tâches** qui se terminent le jour sélectionné
- **Points sur calendrier** : Rouges

**⚠️ IMPORTANT** : Le mode de vue affecte à la fois le calendrier ET la liste. Ne pas oublier de passer le `viewMode` à tous les composants enfants.

---

## 🔧 Services

### `getPlanningItemsForDate(date, viewMode)`

**Localisation** : `src/services/planning/get-planning-items-for-date.ts`

**Logique** :
- **Mode "starts"** : Récupère les tâches avec `start_date = date` ET les activités avec `planned_start = date`
- **Mode "dueDates"** : Récupère les tâches dont la date d'échéance calculée (`start_date + estimated_duration_hours`) tombe dans la journée ET les activités avec `planned_end = date`

**Points d'attention** :
- Les tâches annulées (`status = 'Annule'`) sont **exclues**
- Les activités annulées (`status = 'Annule'`) sont **exclues**
- Pour les tâches en mode "dueDates", la date d'échéance est **calculée côté application** (pas de champ `due_date` en DB)
- Normalisation des dates : début de journée (00:00:00) à fin de journée (23:59:59)

### `getPlanningDatesWithEvents(year, month, viewMode)`

**Localisation** : `src/services/planning/get-planning-dates-with-events.ts`

**Logique** :
- Récupère uniquement les **dates** (pas les détails complets) pour optimiser les performances
- Retourne un tableau de `Date` uniques

**Points d'attention** :
- Utilise un `Set` pour dédupliquer les dates
- Pour le mode "dueDates", calcule les dates d'échéance des tâches côté application

### `calculateTotalWorkload(supabase, date, userId?, excludeTaskId?, excludeActivityId?)`

**Localisation** : `src/services/planning/calculate-total-workload.ts`

**Usage** : Utilisé pour la colonne de disponibilité (pas encore intégré dans l'UI actuelle)

---

## 🧩 Composants

### `PlanningPageClient`

**Rôle** : Orchestrateur principal, gère l'état de la date sélectionnée et du mode de vue.

**État** :
- `selectedDate: Date` - Date sélectionnée dans le calendrier
- `viewMode: PlanningViewMode` - Mode de vue actuel

**Layout** :
- **Onglet "Calendrier"** : 3 colonnes
  - Colonne gauche : Calendrier (largeur auto)
  - Colonne milieu : Liste des items (flex-1)
  - Colonne droite : Disponibilité (1/4 fixe)
- **Onglet "Gantt"** : Diagramme de Gantt full-width

**⚠️ IMPORTANT** : 
- Le `viewMode` doit être passé à `PlanningCalendar` ET `PlanningList`
- La hauteur est fixée à `calc(100vh - 280px)` pour un affichage cohérent

### `PlanningCalendar`

**Rôle** : Affiche le calendrier mensuel avec navigation et surbrillance des dates avec événements.

**Props** :
- `selectedDate: Date`
- `onDateSelect: (date: Date) => void`
- `viewMode: PlanningViewMode`
- `onViewModeChange?: (mode: PlanningViewMode) => void`

**Fonctionnalités** :
- Navigation mois (← →)
- Bouton "Aujourd'hui"
- Switch pour basculer entre "Débuts" et "Échéances"
- Surbrillance du jour J (cercle bleu)
- Surbrillance des jours avec événements (points verts/rouges selon mode)
- Surbrillance du jour sélectionné (cercle vert/rouge selon mode)

**⚠️ ÉTAT ACTUEL** : Utilise `getMockDatesWithEvents()` - **À REMPLACER** par un appel API

### `PlanningList`

**Rôle** : Affiche la liste des items (tâches/activités) pour la date sélectionnée.

**Props** :
- `selectedDate: Date`
- `viewMode: PlanningViewMode`

**Fonctionnalités** :
- Filtre les items selon le mode de vue
- Affiche le nombre d'événements
- Liste scrollable

**⚠️ ÉTAT ACTUEL** : Utilise `getMockItemsForDate()` - **À REMPLACER** par un appel API

**Logique de filtrage** :
```typescript
// Mode "starts" : uniquement activités
if (viewMode === 'starts') {
  return item.type === 'activity';
}
// Mode "dueDates" : uniquement tâches
else {
  return item.type === 'task';
}
```

### `PlanningDayItem`

**Rôle** : Affiche un item individuel (tâche ou activité) avec actions.

**Props** :
- `item: PlanningItem`

**Fonctionnalités** :
- Icône distinctive (bleu pour tâches, violet pour activités)
- Badge de statut
- Personne en charge / Créateur / Participants
- Menu contextuel (roue) avec actions :
  - **Tâches** : Voir détails, Compte rendu, Commenter, Changer statut
  - **Activités** : Voir activité, Créer tâche à partir, Compte rendu, Commenter
- Lien vers détail (→)

**Actions disponibles** :
- `handleViewTask()` / `handleViewActivity()` - Navigation vers détail
- `handleCreateTaskFromActivity()` - Créer tâche depuis activité
- Dialogs pour compte rendu et changement de statut

**⚠️ IMPORTANT** : Les dialogs utilisent des Server Actions depuis `@/app/(main)/gestion/taches/actions` et `@/app/(main)/gestion/activites/actions`

### `PlanningItemCard`

**Rôle** : Composant UI réutilisable pour les cartes d'items.

**Layout standardisé** :
```
[Icône] | [Titre]                    | [Menu]
        | [Statut + Personne]        |
```

**Props** :
- `icon: ReactNode`
- `title: string`
- `bottomContent: ReactNode`
- `menu?: ReactNode`
- `actions?: ReactNode`
- `className?: string`
- `onClick?: () => void`

### `PlanningAvailability`

**Rôle** : Affiche la disponibilité des personnes pour la date sélectionnée.

**Props** :
- `selectedDate: Date`

**Fonctionnalités** :
- Statistiques rapides (Disponibles / Occupés / Surchargés)
- Liste des personnes avec :
  - Nom et département
  - Badge de statut
  - Charge (heures / capacité)
  - Barre de progression
  - Liste des items (tâches/activités)

**⚠️ ÉTAT ACTUEL** : Utilise `getMockPeople()` et `calculateAvailabilityForDate()` - **À REMPLACER** par des appels API

### `GanttChart`

**Rôle** : Affiche un diagramme de Gantt pour visualiser les tâches et activités sur une timeline.

**Fonctionnalités** :
- Navigation mois
- Filtres : Tous / Tâches / Activités
- Organisation par personne assignée
- Barres de progression
- Ligne verticale pour "Aujourd'hui"

**⚠️ ÉTAT ACTUEL** : Utilise `generateMockGanttItems()` - **À REMPLACER** par des données réelles

---

## ⚠️ Points d'attention critiques

### 1. Données mockées vs réelles

**État actuel** : Plusieurs composants utilisent encore des données mockées :
- `PlanningCalendar` → `getMockDatesWithEvents()`
- `PlanningList` → `getMockItemsForDate()`
- `PlanningAvailability` → `getMockPeople()`, `calculateAvailabilityForDate()`
- `GanttChart` → `generateMockGanttItems()`

**⚠️ À FAIRE** : Remplacer tous les appels mockés par des appels API réels.

**Exemple de migration** :
```typescript
// ❌ AVANT (mock)
const datesWithEvents = getMockDatesWithEvents(year, month, viewMode);

// ✅ APRÈS (API)
const response = await fetch(`/api/planning/dates?year=${year}&month=${month}&viewMode=${viewMode}`);
const { dates } = await response.json();
const datesWithEvents = dates.map((d: string) => new Date(d));
```

### 2. Synchronisation du viewMode

Le `viewMode` doit être **cohérent** entre :
- `PlanningCalendar` (affichage des points sur le calendrier)
- `PlanningList` (filtrage des items)
- Les appels API (paramètre `viewMode`)

**⚠️ VÉRIFIER** : Que le `viewMode` est bien passé partout où nécessaire.

### 3. Calcul des dates d'échéance

Pour les tâches en mode "dueDates", la date d'échéance est calculée comme :
```typescript
const dueDate = new Date(startDate.getTime() + (estimated_duration_hours * 60 * 60 * 1000));
```

**⚠️ ATTENTION** : 
- Si `estimated_duration_hours` est `null`, la tâche n'apparaît pas en mode "dueDates"
- Le calcul se fait côté application (pas de champ `due_date` en DB)

### 4. Exclusion des items annulés

Les services excluent automatiquement les items avec `status = 'Annule'` :
- Tâches : `.not('status', 'eq', 'Annule')`
- Activités : `.not('status', 'eq', 'Annule')`

**⚠️ NE PAS OUBLIER** : Cette exclusion dans tous les nouveaux services.

### 5. Normalisation des dates

Toujours normaliser les dates pour les comparaisons :
```typescript
const startOfDay = new Date(date);
startOfDay.setHours(0, 0, 0, 0);
const endOfDay = new Date(startOfDay);
endOfDay.setHours(23, 59, 59, 999);
```

### 6. Gestion des relations Supabase

Les services utilisent des relations Supabase complexes :
- `assigned_user:profiles!tasks_assigned_to_fkey(id, full_name)`
- `created_user:profiles!activities_created_by_fkey(id, full_name)`
- `activity_participants(...)` avec sous-relations

**⚠️ ATTENTION** : 
- Les relations peuvent retourner un objet OU un tableau (normaliser)
- Vérifier que les clés étrangères existent dans le schéma

### 7. Types et validation

**Toujours utiliser Zod** pour valider les paramètres API :
```typescript
const QuerySchema = z.object({
  date: z.string().datetime(),
  viewMode: z.enum(['starts', 'dueDates']).optional().default('starts')
});
```

**⚠️ NE JAMAIS** utiliser `as` pour caster sans validation.

### 8. Gestion d'erreur

**Toujours utiliser** `handleApiError()` dans les routes API :
```typescript
try {
  // ...
} catch (error) {
  return handleApiError(error);
}
```

**Toujours utiliser** `handleSupabaseError()` dans les services :
```typescript
if (error) {
  throw handleSupabaseError(error, 'Message d\'erreur');
}
```

---

## 🔌 Intégration avec autres modules

### Navigation vers détails

Les items du planning redirigent vers :
- **Tâches** : `/gestion/taches/{id}`
- **Activités** : `/gestion/activites/{id}`

### Server Actions

Les dialogs utilisent des Server Actions :
- `updateActivityReportAction()` - `@/app/(main)/gestion/activites/actions`
- `updateActivityStatusAction()` - `@/app/(main)/gestion/activites/actions`
- `updateTaskReportAction()` - `@/app/(main)/gestion/taches/actions`
- `updateTaskStatusAction()` - `@/app/(main)/gestion/taches/actions`

**⚠️ VÉRIFIER** : Que ces actions existent et sont à jour.

### Services partagés

Les services de planning réutilisent :
- `transformActivity()` - `@/services/activities/utils/activity-transformer`
- `getWorkloadForDate()` - `@/services/tasks/get-workload-for-date`
- `getActivityWorkloadForDate()` - `@/services/activities/get-workload-for-date`

---

## 🎨 UI/UX

### Design System

- **Composants ShadCN** : `Card`, `Button`, `Badge`, `Tabs`, `Calendar`, `Popover`, `Tooltip`
- **Couleurs** :
  - Tâches : Bleu (`blue-600`, `blue-400`)
  - Activités : Violet (`purple-600`, `purple-400`)
  - Débuts : Vert (`green-500`)
  - Échéances : Rouge (`red-500`)
  - Aujourd'hui : Bleu (`blue-500`)

### Responsive

- Layout 3 colonnes sur desktop (`lg:flex-row`)
- Layout empilé sur mobile (`flex-col`)
- Textes tronqués avec `truncate` pour éviter les débordements

### Accessibilité

- Labels ARIA sur les boutons (`aria-label`)
- Navigation clavier supportée (composants ShadCN)
- Contraste des couleurs respecté (dark mode)

---

## 🚀 Prochaines étapes

### Phase 1 : Migration des données mockées

1. **PlanningCalendar** : Remplacer `getMockDatesWithEvents()` par appel API `/api/planning/dates`
2. **PlanningList** : Remplacer `getMockItemsForDate()` par appel API `/api/planning/items`
3. **PlanningAvailability** : Implémenter les appels API pour la disponibilité
4. **GanttChart** : Implémenter les appels API pour les données Gantt

### Phase 2 : Optimisations

1. **Cache** : Mettre en cache les dates avec événements (peuvent être mises en cache par mois)
2. **Pagination** : Pour les listes longues d'items
3. **Real-time** : Utiliser Supabase Realtime pour les mises à jour en direct

### Phase 3 : Fonctionnalités avancées

1. **Filtres** : Par personne, par type, par statut
2. **Recherche** : Recherche textuelle dans les items
3. **Export** : Export PDF/Excel du planning
4. **Notifications** : Alertes pour les échéances proches

---

## 📝 Checklist avant commit

- [ ] Code suit les principes SOLID
- [ ] Pas de duplication de code
- [ ] Types explicites partout
- [ ] Validation Zod avec `safeParse()`
- [ ] Gestion d'erreur avec `handleApiError` / `handleSupabaseError`
- [ ] Pas de `console.log` en production
- [ ] Pas de `as any` ou `as unknown`
- [ ] `viewMode` synchronisé entre tous les composants
- [ ] Dates normalisées pour comparaisons
- [ ] Items annulés exclus
- [ ] Relations Supabase normalisées (objet vs tableau)

---

## 🔗 Références

- **Services** : `src/services/planning/`
- **Composants** : `src/components/planning/`
- **API Routes** : `src/app/api/planning/`
- **Types** : `src/components/planning/types.ts`
- **Documentation Clean Code** : `docs/refactoring/CLEAN-CODE-METHODOLOGIE.md`

---

**Dernière mise à jour** : 2025-01-XX  
**Auteur** : Documentation générée pour la branche `feature/planning`

