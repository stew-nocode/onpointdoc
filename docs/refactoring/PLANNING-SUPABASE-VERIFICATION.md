# Vérification Supabase - Tables et Champs pour Planning

**Date :** 2025-12-15  
**Projet :** ONPOINT CENTRAL (xjcttqaiplnoalolebls)  
**Objectif :** Vérifier la disponibilité des tables et champs nécessaires pour connecter le Planning à Supabase

---

## ✅ Résultat Global

**Statut :** ✅ **La plupart des champs sont disponibles** avec quelques points d'attention

---

## 📊 Table `tasks`

### Champs Disponibles

| Champ | Type DB | Nullable | Description | Utilisation Planning |
|-------|---------|----------|-------------|---------------------|
| `id` | uuid | NO | Identifiant unique | ✅ Requis |
| `title` | text | NO | Titre de la tâche | ✅ Requis |
| `description` | text | YES | Description | ✅ Optionnel |
| `start_date` | timestamp with time zone | YES | Date de début | ✅ **CRITIQUE** - Utilisé pour planning |
| `estimated_duration_hours` | numeric | YES | Durée estimée en heures | ✅ **CRITIQUE** - Pour calcul disponibilité |
| `due_date` | timestamp with time zone | YES | ⚠️ **Existe mais déprécié** | ⚠️ À ne pas utiliser (utiliser start_date + duration) |
| `assigned_to` | uuid (FK → profiles.id) | YES | Personne assignée | ✅ Requis pour disponibilité |
| `status` | task_status_t (ENUM) | YES | Statut | ✅ Requis |
| `report_content` | text | YES | Compte rendu | ✅ Optionnel |
| `created_by` | uuid (FK → profiles.id) | YES | Créateur | ✅ Optionnel |
| `created_at` | timestamp with time zone | YES | Date création | ✅ Optionnel |
| `updated_at` | timestamp with time zone | YES | Date modification | ✅ Optionnel |

### Enum `task_status_t`

Valeurs disponibles :
- `A_faire`
- `En_cours`
- `Termine`
- `Annule`
- `Bloque`

✅ **Correspond aux valeurs mockées**

### ⚠️ Points d'Attention

1. ❌ **Pas de champ `priority`**
   - Le mock utilise `priority: 'Basse' | 'Normale' | 'Haute' | 'Urgente'`
   - La DB n'a **pas ce champ**
   - **Action :** Adapter le code pour ne pas afficher la priorité OU la supprimer de l'affichage

2. ⚠️ **Champ `due_date` existe mais déprécié**
   - Selon l'analyse, remplacé par `start_date` + `estimated_duration_hours`
   - **Action :** Calculer la date d'échéance : `start_date + estimated_duration_hours`

---

## 📅 Table `activities`

### Champs Disponibles

| Champ | Type DB | Nullable | Description | Utilisation Planning |
|-------|---------|----------|-------------|---------------------|
| `id` | uuid | NO | Identifiant unique | ✅ Requis |
| `title` | text | NO | Titre de l'activité | ✅ Requis |
| `activity_type` | activity_type_t (ENUM) | YES | Type d'activité | ✅ Requis |
| `planned_start` | timestamp with time zone | YES | Date/heure début | ✅ **CRITIQUE** - Pour calendrier |
| `planned_end` | timestamp with time zone | YES | Date/heure fin | ✅ **CRITIQUE** - Pour période |
| `status` | activity_status_t (ENUM) | YES | Statut | ✅ Requis |
| `report_content` | text | YES | Compte rendu | ✅ Requis (menu actions) |
| `created_by` | uuid (FK → profiles.id) | YES | Créateur | ✅ Optionnel |
| `location_mode` | activity_location_mode_t (ENUM) | YES | Mode de localisation | ✅ Optionnel |
| `created_at` | timestamp with time zone | YES | Date création | ✅ Optionnel |
| `updated_at` | timestamp with time zone | YES | Date modification | ✅ Optionnel |

### Enum `activity_type_t`

Valeurs disponibles :
- `Revue`
- `Brainstorm`
- `Atelier`
- `Presentation`
- `Demo`
- `Autre`

✅ **Correspond aux valeurs mockées**

### Enum `activity_status_t`

Valeurs disponibles :
- `Brouillon`
- `Planifie`
- `En_cours`
- `Termine`
- `Annule`

✅ **Correspond aux valeurs mockées**

### ⚠️ Points d'Attention

1. ❌ **Pas de champ `estimated_duration_hours` pour activités**
   - Le mock calcule des durées estimées pour les activités (2-6h selon type)
   - La DB n'a **pas ce champ**
   - **Action :** 
     - Option 1 : Calculer depuis `planned_start` et `planned_end` (différence en heures)
     - Option 2 : Utiliser une valeur par défaut selon `activity_type`
     - Option 3 : Ne pas afficher la durée pour les activités dans la disponibilité

---

## 👥 Table `activity_participants`

### Champs Disponibles

| Champ | Type DB | Nullable | Description | Utilisation Planning |
|-------|---------|----------|-------------|---------------------|
| `activity_id` | uuid (FK → activities.id) | NO | ID activité | ✅ Requis |
| `user_id` | uuid (FK → profiles.id) | YES | ⚠️ **Nommé `user_id` pas `profile_id`** | ✅ Requis |
| `role` | text | YES | Rôle du participant | ✅ Optionnel |
| `is_invited_external` | boolean | YES | Invité externe | ✅ Optionnel |

### ⚠️ Point d'Attention

1. ⚠️ **Nom de colonne : `user_id` et non `profile_id`**
   - L'analyse mentionnait `profile_id` mais la DB utilise `user_id`
   - **Action :** Utiliser `user_id` dans les requêtes

---

## 👤 Table `profiles`

### Champs Disponibles (Pertinents pour Planning)

| Champ | Type DB | Nullable | Description | Utilisation Planning |
|-------|---------|----------|-------------|---------------------|
| `id` | uuid | NO | Identifiant unique | ✅ Requis (FK) |
| `full_name` | text | YES | Nom complet | ✅ Requis (affichage) |
| `email` | text | YES | Email | ✅ Optionnel |
| `department` | user_department_t (ENUM) | YES | Département | ✅ Requis (disponibilité) |
| `role` | user_role_t (ENUM) | YES | Rôle | ✅ Optionnel |
| `is_active` | boolean | YES | Actif | ✅ Requis (filtrer inactifs) |

✅ **Tous les champs nécessaires sont disponibles**

---

## 🔗 Relations Disponibles

### Clés Étrangères Vérifiées

1. ✅ `tasks.assigned_to` → `profiles.id`
2. ✅ `tasks.created_by` → `profiles.id`
3. ✅ `activities.created_by` → `profiles.id`
4. ✅ `activity_participants.activity_id` → `activities.id`
5. ✅ `activity_participants.user_id` → `profiles.id`

✅ **Toutes les relations nécessaires existent**

---

## 📝 Mapping Champs Mock → DB

### Tâches (MockPlanningTask → tasks)

| Champ Mock | Champ DB | Statut | Notes |
|------------|----------|--------|-------|
| `id` | `id` | ✅ Identique | - |
| `type` | - | ✅ Constante `'task'` | Pas en DB, valeur fixe |
| `title` | `title` | ✅ Identique | - |
| `status` | `status` | ✅ Identique | Enum correspond |
| `priority` | ❌ **N'existe pas** | ⚠️ À supprimer | Pas de priorité en DB |
| `dueDate` | `start_date` + `estimated_duration_hours` | ⚠️ Calcul requis | Calculer: start_date + duration |
| `assignedTo` | `assigned_to` (FK) + join `profiles` | ✅ Disponible | Relation 1:1 |

### Activités (MockPlanningActivity → activities)

| Champ Mock | Champ DB | Statut | Notes |
|------------|----------|--------|-------|
| `id` | `id` | ✅ Identique | - |
| `type` | - | ✅ Constante `'activity'` | Pas en DB, valeur fixe |
| `title` | `title` | ✅ Identique | - |
| `activityType` | `activity_type` | ✅ Identique | Enum correspond |
| `status` | `status` | ✅ Identique | Enum correspond |
| `plannedStart` | `planned_start` | ✅ Identique | - |
| `plannedEnd` | `planned_end` | ✅ Identique | - |
| `reportContent` | `report_content` | ✅ Identique | - |
| `participants` | `activity_participants` (FK) + join `profiles` | ✅ Disponible | Relation N:M via table de liaison |

---

## ⚠️ Problèmes Identifiés

### 1. ❌ Champ `priority` manquant pour tâches

**Impact :**
- Le mock affiche la priorité dans `PlanningDayItem`
- La DB n'a pas ce champ

**Solutions possibles :**
1. **Supprimer l'affichage de la priorité** (recommandé)
2. Ajouter un champ `priority` dans la DB (migration nécessaire)
3. Calculer une priorité artificielle (non recommandé)

**Recommandation :** Supprimer l'affichage de la priorité dans le planning

---

### 2. ⚠️ Durée estimée pour activités manquante

**Impact :**
- Le calcul de disponibilité utilise `estimated_duration_hours` pour activités
- La DB n'a pas ce champ pour les activités

**Solutions possibles :**
1. **Calculer depuis `planned_start` et `planned_end`** (recommandé)
   ```typescript
   const durationHours = differenceInHours(planned_end, planned_start);
   ```
2. Utiliser une valeur par défaut selon `activity_type`
3. Ne pas inclure les activités dans le calcul de disponibilité

**Recommandation :** Calculer depuis la période planifiée

---

### 3. ⚠️ Nom de colonne `user_id` vs `profile_id`

**Impact :**
- L'analyse mentionnait `profile_id` dans `activity_participants`
- La DB utilise `user_id`

**Solution :** Utiliser `user_id` dans toutes les requêtes

---

### 4. ⚠️ Date d'échéance des tâches à calculer

**Impact :**
- Le mode "Échéances" affiche les tâches qui se terminent
- La DB n'a pas `due_date` utilisable (déprécié)
- Il faut calculer : `start_date + estimated_duration_hours`

**Solution :**
```typescript
// Calculer la date d'échéance
const endDate = start_date 
  ? addHours(start_date, estimated_duration_hours || 0)
  : null;
```

---

## ✅ Champs Disponibles pour Calcul Disponibilité

### Tâches
- ✅ `start_date` : Date de début
- ✅ `estimated_duration_hours` : Durée en heures
- ✅ `assigned_to` : Personne assignée (1:1)

### Activités
- ✅ `planned_start` : Début de la période
- ✅ `planned_end` : Fin de la période
- ⚠️ Durée : À calculer depuis `planned_start` et `planned_end`
- ✅ `activity_participants.user_id` : Participants (N:M)

### Personnes
- ✅ `profiles.id` : Identifiant
- ✅ `profiles.full_name` : Nom complet
- ✅ `profiles.department` : Département

---

## 📋 Requêtes SQL Nécessaires

### 1. Tâches pour une date (mode Échéances)

```sql
SELECT t.*, p.full_name as assigned_user_full_name
FROM tasks t
LEFT JOIN profiles p ON t.assigned_to = p.id
WHERE t.start_date IS NOT NULL
  AND t.estimated_duration_hours IS NOT NULL
  AND DATE(t.start_date + (t.estimated_duration_hours || ' hours')::interval) = DATE(:selected_date)
  AND t.status NOT IN ('Termine', 'Annule');
```

### 2. Activités pour une date (mode Débuts)

```sql
SELECT a.*
FROM activities a
WHERE a.planned_start IS NOT NULL
  AND DATE(a.planned_start) = DATE(:selected_date)
  AND a.status NOT IN ('Termine', 'Annule');
```

### 3. Activités pour une période (mode Débuts - période)

```sql
SELECT a.*
FROM activities a
WHERE a.planned_start IS NOT NULL
  AND DATE(:selected_date) BETWEEN DATE(a.planned_start) AND COALESCE(DATE(a.planned_end), DATE(a.planned_start))
  AND a.status NOT IN ('Termine', 'Annule');
```

### 4. Participants d'une activité

```sql
SELECT p.id, p.full_name
FROM activity_participants ap
JOIN profiles p ON ap.user_id = p.id
WHERE ap.activity_id = :activity_id;
```

### 5. Disponibilité pour une date (tâches + activités)

```sql
-- Tâches
SELECT 
  t.assigned_to as person_id,
  SUM(t.estimated_duration_hours) as total_hours
FROM tasks t
WHERE t.start_date::date = DATE(:selected_date)
  AND t.assigned_to IS NOT NULL
  AND t.estimated_duration_hours IS NOT NULL
  AND t.status NOT IN ('Termine', 'Annule')
GROUP BY t.assigned_to;

-- Activités (durée calculée)
SELECT 
  ap.user_id as person_id,
  SUM(EXTRACT(EPOCH FROM (a.planned_end - a.planned_start)) / 3600) as total_hours
FROM activities a
JOIN activity_participants ap ON a.id = ap.activity_id
WHERE DATE(:selected_date) BETWEEN DATE(a.planned_start) AND COALESCE(DATE(a.planned_end), DATE(a.planned_start))
  AND a.status NOT IN ('Termine', 'Annule')
GROUP BY ap.user_id;
```

---

## ✅ Résumé des Actions Requises

### 1. Adapter les Types
- ✅ Utiliser `TaskWithRelations` et `ActivityWithRelations` (déjà existants)
- ⚠️ Supprimer `priority` de l'affichage des tâches
- ✅ Créer types Planning unifiés qui mappent depuis les types Supabase

### 2. Créer les Services
- ✅ `listTasksForDate()` : Tâches avec échéance = date
- ✅ `listActivitiesForDate()` : Activités où date in [planned_start, planned_end]
- ✅ `listItemsForMonth()` : Toutes tâches/activités du mois
- ✅ `calculateAvailability()` : Calcul avec durée calculée pour activités

### 3. Adapter la Logique
- ✅ Utiliser `start_date` + `estimated_duration_hours` pour échéances tâches
- ✅ Calculer durée activités depuis `planned_start` et `planned_end`
- ✅ Utiliser `user_id` (pas `profile_id`) pour `activity_participants`
- ❌ Supprimer affichage `priority` pour tâches

### 4. Points d'Attention
- ⚠️ Filtrer les statuts terminés/annulés dans les requêtes
- ⚠️ Gérer les valeurs NULL (`start_date`, `estimated_duration_hours`, etc.)
- ⚠️ Calculer la durée des activités correctement (différence en heures)

---

## 🎯 Conclusion

✅ **Les tables et champs nécessaires sont disponibles dans Supabase**

**Points à adapter :**
1. ❌ Supprimer `priority` de l'affichage (pas en DB)
2. ⚠️ Calculer durée activités depuis période
3. ⚠️ Calculer échéance tâches depuis `start_date` + `estimated_duration_hours`
4. ⚠️ Utiliser `user_id` (pas `profile_id`) pour participants

**Statut :** ✅ **Prêt pour implémentation** avec les adaptations ci-dessus



