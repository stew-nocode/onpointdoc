# Documentation - Page Planning

## 📋 Vue d'ensemble

La page `/planning` est une interface de visualisation et de gestion du planning des tâches et activités. Elle permet de :
- Visualiser les tâches et activités planifiées sur un calendrier
- Filtrer par date et mode de vue (Débuts / Échéances)
- Consulter la disponibilité des personnes
- Afficher un diagramme de Gantt
- Accéder rapidement aux détails et actions sur les items
- **Commenter les tâches et activités** directement depuis le planning

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
│       ├── planning/
│       │   ├── items/
│       │   │   └── route.ts                # API: Récupérer items pour une date
│       │   ├── dates/
│       │   │   └── route.ts                # API: Récupérer dates avec événements
│       │   └── availability/
│       │       └── route.ts                 # API: Récupérer disponibilité pour une date
│       ├── tasks/[id]/
│       │   └── comments/
│       │       ├── route.ts                # API: GET/POST commentaires de tâche
│       │       └── [commentId]/
│       │           └── route.ts            # API: DELETE commentaire de tâche
│       └── activities/[id]/
│           └── comments/
│               ├── route.ts                # API: GET/POST commentaires d'activité
│               └── [commentId]/
│                   └── route.ts            # API: DELETE commentaire d'activité
│
├── components/
│   ├── planning/
│   │   ├── planning-page-client.tsx        # Client Component principal (orchestrateur)
│   │   ├── planning-calendar.tsx           # Composant calendrier
│   │   ├── planning-list.tsx               # Liste des items du jour sélectionné
│   │   ├── planning-day-item.tsx           # Item individuel (tâche/activité)
│   │   ├── planning-item-card.tsx          # Carte UI réutilisable
│   │   ├── planning-item-tooltip.tsx       # Tooltip avec détails
│   │   ├── types.ts                        # Types TypeScript pour le planning
│   │   ├── mock-data.ts                    # ⚠️ Données mockées (Gantt uniquement)
│   │   ├── index.ts                        # Exports centralisés
│   └── comments/
│       ├── add-comment-dialog.tsx          # Dialog réutilisable pour ajouter commentaires
│       └── index.ts                        # Exports centralisés
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
    ├── planning/
    │   ├── get-planning-items-for-date.ts  # Service: Items pour une date
    │   ├── get-planning-dates-with-events.ts # Service: Dates avec événements
    │   ├── get-availability-for-date.ts   # Service: Disponibilité pour une date
    │   └── calculate-total-workload.ts     # Service: Calcul charge de travail
    ├── tasks/
    │   └── comments/
    │       ├── crud.ts                     # CRUD commentaires de tâches
    │       ├── types.ts                    # Types commentaires de tâches
    │       └── index.ts                    # Exports centralisés
    └── activities/
        └── comments/
            ├── crud.ts                     # CRUD commentaires d'activités
            ├── types.ts                    # Types commentaires d'activités
            └── index.ts                    # Exports centralisés
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

**Route API `/api/planning/availability`**
- **Paramètres** : `date` (ISO string)
- **Retour** : `{ availability: PersonAvailability[] }`
- **Service** : `getAvailabilityForDate()`

**Route API `/api/tasks/[id]/comments`**
- **GET** : Récupérer les commentaires d'une tâche
- **POST** : Créer un commentaire sur une tâche
- **Service** : `getTaskComments()`, `createTaskComment()`

**Route API `/api/tasks/[id]/comments/[commentId]`**
- **DELETE** : Supprimer un commentaire de tâche
- **Service** : `deleteTaskComment()`

**Route API `/api/activities/[id]/comments`**
- **GET** : Récupérer les commentaires d'une activité
- **POST** : Créer un commentaire sur une activité
- **Service** : `getActivityComments()`, `createActivityComment()`

**Route API `/api/activities/[id]/comments/[commentId]`**
- **DELETE** : Supprimer un commentaire d'activité
- **Service** : `deleteActivityComment()`

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

**Types de commentaires** (génériques)

**`CommentObjectType`**
```typescript
type CommentObjectType = 'task' | 'activity';
```

**`CreateCommentInput`**
```typescript
type CreateCommentInput = {
  content: string;
  comment_type?: 'comment' | 'followup';
};
```

**`TaskComment`** / **`ActivityComment`**
```typescript
type TaskComment = {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  comment_type: 'comment' | 'followup' | null;
  origin: 'app' | 'jira_comment' | null;
  jira_comment_id: string | null;
  created_at: string;
  user: {
    id: string | null;
    full_name: string | null;
    email: string | null;
  } | null;
};
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

### `getAvailabilityForDate(supabase, date)`

**Localisation** : `src/services/planning/get-availability-for-date.ts`

**Logique** :
- Récupère tous les utilisateurs avec leurs tâches et activités pour la date donnée
- Calcule la charge de travail totale par personne
- Détermine le statut de disponibilité (available, busy, overloaded) selon la capacité
- Retourne une liste de `PersonAvailability` triée par statut

**Points d'attention** :
- Utilise le client service_role pour contourner les RLS (accès à toutes les données)
- Calcule la capacité par défaut à 8h/jour
- Exclut les items annulés

### `calculateTotalWorkload(supabase, date, userId?, excludeTaskId?, excludeActivityId?)`

**Localisation** : `src/services/planning/calculate-total-workload.ts`

**Usage** : Utilisé en interne par `getAvailabilityForDate()` pour calculer la charge de travail

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

**✅ CONNECTÉ** : Utilise l'API `/api/planning/dates` avec `getPlanningDatesWithEvents()`
- Utilise `AbortController` pour annuler les requêtes obsolètes lors des changements rapides de mois
- Gestion d'erreur avec affichage d'un état vide en cas d'échec

### `PlanningList`

**Rôle** : Affiche la liste des items (tâches/activités) pour la date sélectionnée.

**Props** :
- `selectedDate: Date`
- `viewMode: PlanningViewMode`

**Fonctionnalités** :
- Filtre les items selon le mode de vue
- Affiche le nombre d'événements
- Liste scrollable

**✅ CONNECTÉ** : Utilise l'API `/api/planning/items` avec `getPlanningItemsForDate()`
- Utilise `AbortController` pour annuler les requêtes obsolètes lors des changements rapides de date
- États de chargement et d'erreur gérés avec affichage approprié

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
- **`AddCommentDialog`** - Dialog pour ajouter des commentaires (tâches et activités)

**⚠️ IMPORTANT** : 
- Les dialogs utilisent des Server Actions depuis `@/app/(main)/gestion/taches/actions` et `@/app/(main)/gestion/activites/actions`
- Le dialog de commentaire utilise les API routes `/api/tasks/[id]/comments` et `/api/activities/[id]/comments`

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

**✅ CONNECTÉ** : Utilise l'API `/api/planning/availability` avec `getAvailabilityForDate()`
- Utilise `AbortController` pour annuler les requêtes obsolètes lors des changements rapides de date
- États de chargement et d'erreur gérés avec affichage approprié
- Tri automatique par statut (surchargés → occupés → disponibles)

### `GanttChart`

**Rôle** : Affiche un diagramme de Gantt pour visualiser les tâches et activités sur une timeline.

**Fonctionnalités** :
- Navigation mois
- Filtres : Tous / Tâches / Activités
- Organisation par personne assignée
- Barres de progression
- Ligne verticale pour "Aujourd'hui"

**⚠️ ÉTAT ACTUEL** : Utilise `generateMockGanttItems()` - **À REMPLACER** par des données réelles

### `AddCommentDialog`

**Rôle** : Dialog réutilisable pour ajouter des commentaires sur les tâches et activités.

**Props** :
- `objectType: 'task' | 'activity'` - Type d'objet à commenter
- `objectId: string` - ID de la tâche ou activité
- `objectTitle: string` - Titre de l'objet (affiché dans le dialog)
- `open: boolean` - État d'ouverture du dialog
- `onOpenChange: (open: boolean) => void` - Callback pour changer l'état
- `onSuccess?: () => void` - Callback optionnel après succès

**Fonctionnalités** :
- Zone de texte pour le commentaire (max 5000 caractères)
- Switch "Marquer comme relance" pour créer un commentaire de type `'followup'`
- Validation avec Zod
- Gestion d'erreur avec toast notifications (Sonner)
- Appel API automatique selon le type d'objet :
  - Tâches : `POST /api/tasks/[id]/comments`
  - Activités : `POST /api/activities/[id]/comments`

**Types de commentaires** :
- `'comment'` : Commentaire classique (par défaut)
- `'followup'` : Relance (si le switch est activé)

**⚠️ IMPORTANT** :
- Le dialog se ferme automatiquement après succès
- Les erreurs sont affichées via toast notifications
- Le contenu est validé côté client (min 1 caractère, max 5000)

---

## ⚠️ Points d'attention critiques

### 1. Données mockées vs réelles

**État actuel** :
- ✅ `PlanningCalendar` → Connecté à `/api/planning/dates`
- ✅ `PlanningList` → Connecté à `/api/planning/items`
- ✅ `PlanningAvailability` → Connecté à `/api/planning/availability`
- ⚠️ `GanttChart` → Utilise encore `generateMockGanttItems()` - **À REMPLACER**

**⚠️ À FAIRE** : Remplacer les données mockées du Gantt par des appels API réels.

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

### 9. Optimisations AbortController

**Tous les composants client utilisent `AbortController`** pour éviter les race conditions lors des changements rapides :

```typescript
useEffect(() => {
  const abortController = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch(url, { signal: abortController.signal });
      // ...
    } catch (error) {
      // Ignorer les erreurs d'annulation
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      // Gérer les autres erreurs
    }
  };

  fetchData();

  return () => {
    abortController.abort(); // Annuler la requête si le composant se démonte ou les dépendances changent
  };
}, [dependencies]);
```

**⚠️ IMPORTANT** :
- Toujours annuler les requêtes dans le cleanup du `useEffect`
- Ignorer les erreurs `AbortError` (ce sont des annulations normales)
- Vérifier `abortController.signal.aborted` avant de mettre à jour l'état

**Composants concernés** :
- `PlanningCalendar` : Annule lors du changement de mois ou de `viewMode`
- `PlanningList` : Annule lors du changement de date ou de `viewMode`
- `PlanningAvailability` : Annule lors du changement de date

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

### Système de commentaires

**Tables Supabase** :
- `task_comments` - Commentaires sur les tâches
- `activity_comments` - Commentaires sur les activités

**Services** :
- `getTaskComments()`, `createTaskComment()`, `deleteTaskComment()` - `@/services/tasks/comments`
- `getActivityComments()`, `createActivityComment()`, `deleteActivityComment()` - `@/services/activities/comments`

**Composant** :
- `AddCommentDialog` - Dialog réutilisable pour ajouter des commentaires (tâches et activités)
  - Support des types `'comment'` et `'followup'` (relance)
  - Validation avec Zod
  - Gestion d'erreur avec toast notifications

**Policies RLS** :
- **SELECT/INSERT** : Accessible par créateur, assigné/participant, managers, admin, director, daf
- **UPDATE** : Accessible par auteur du commentaire ou managers
- **DELETE** : Accessible uniquement par managers

**Migrations** :
- `supabase/migrations/20251222000001_create_task_comments_table.sql`
- `supabase/migrations/20251222000002_create_activity_comments_table.sql`

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

1. ✅ **PlanningCalendar** : Connecté à `/api/planning/dates`
2. ✅ **PlanningList** : Connecté à `/api/planning/items`
3. ✅ **PlanningAvailability** : Connecté à `/api/planning/availability`
4. ⚠️ **GanttChart** : Implémenter les appels API pour les données Gantt

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
- [ ] `AbortController` utilisé pour toutes les requêtes fetch dans les composants client
- [ ] Gestion d'erreur `AbortError` ignorée (annulations normales)

---

## 🔗 Références

- **Services** : `src/services/planning/`
- **Composants** : `src/components/planning/`
- **API Routes** : `src/app/api/planning/`
- **Types** : `src/components/planning/types.ts`
- **Commentaires** : `src/services/tasks/comments/`, `src/services/activities/comments/`
- **Documentation Clean Code** : `docs/refactoring/CLEAN-CODE-METHODOLOGIE.md`

---

**Dernière mise à jour** : 2025-12-22  
**Auteur** : Documentation générée pour la branche `feature/planning-continue`  
**Modifications récentes** :
- ✅ Ajout système de commentaires pour tâches et activités
- ✅ Connexion complète des données au backend Supabase (calendrier, liste, disponibilité)
- ✅ Optimisation des requêtes avec AbortController pour éviter les race conditions

