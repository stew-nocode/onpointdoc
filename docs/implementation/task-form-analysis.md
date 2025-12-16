# Analyse - Formulaire de Création de Tâches

## 📋 Vue d'ensemble

Analyse de l'implémentation du formulaire de création de tâches basée sur le pattern des activités, avec adaptation aux spécificités des tâches.

## 🔍 Différences avec le formulaire d'activités

### Champs spécifiques aux tâches :
1. **Date d'échéance** (au lieu de dates planifiées)
   - **Type** : `dueDate` (string ISO optionnel)
   - **Interface** : Date unique (pas de période)
   - **Toggle** : Switch "Planifier" (optionnel)
   - **Composant** : DatePicker simple (date + heure optionnelle)

2. **Assigné à** (au lieu de participants)
   - **Type** : `assignedTo` (UUID optionnel)
   - **Interface** : Sélection unique (Combobox)
   - **Source** : Liste des profils utilisateurs (`BasicProfile[]`)

3. **Champs communs réutilisables** :
   - ✅ Titre (requis)
   - ✅ Description (optionnel, TextEditor simple)
   - ✅ Tickets liés (réutiliser `EntityTypeSelector` + `LinkSearchField`)
   - ✅ Activités liées (réutiliser le même pattern)
   - ✅ Compte-rendu (optionnel, réutiliser `ActivityReportSection`)

4. **Champs absents** (spécifiques aux activités) :
   - ❌ Activity Type (Revue, Atelier, etc.)
   - ❌ Location Mode (Physique, Visio, etc.)
   - ❌ Dates planifiées (début/fin)

## 📐 Architecture proposée

### Structure des fichiers :

```
src/components/forms/task-form/
├── sections/
│   ├── task-title-section.tsx          # Titre (requis) - IDENTIQUE à ActivityTitleSection
│   ├── task-description-section.tsx    # Description (optionnel, TextEditor simple)
│   ├── task-due-date-section.tsx       # Date d'échéance (toggle + DatePicker unique)
│   ├── task-assigned-section.tsx       # Assigné à (Combobox utilisateur unique)
│   ├── task-links-section.tsx          # Tickets + Activités liés (réutiliser pattern activités)
│   └── task-submit-buttons.tsx         # Boutons soumission (réutiliser ActivitySubmitButtons)
├── index.ts                            # Exports
└── task-form.tsx                       # Composant principal (< 100 lignes)
```

### Hook personnalisé :

```
src/hooks/forms/
└── use-task-form.ts                    # Logique du formulaire (React Hook Form + Zod)
```

### Dialog de création :

```
src/components/tasks/
└── create-task-dialog.tsx              # Dialog wrapper (comme CreateActivityDialog)
```

## 🎯 Sections à créer (Clean Code)

### 1. TaskTitleSection ⭐ TRIVIAL
- **Pattern** : Identique à `ActivityTitleSection`
- **Champ** : `title` (requis, 4-180 caractères)
- **Complexité** : ⭐ Très simple (~35 lignes)
- **Réutilisation** : 100% (copier-coller avec renommage)

### 2. TaskDescriptionSection ⭐⭐ NOUVEAU
- **Pattern** : TextEditor simple (sans Switch, sans Dialog)
- **Champ** : `description` (optionnel)
- **Approche** : Input textarea simple OU TextEditor inline
- **Option recommandée** : `<textarea>` simple pour rester léger (vs RichTextEditor pour description)
- **Complexité** : ⭐ Simple (~40 lignes)

### 3. TaskDueDateSection ⚠️ NOUVEAU PATTERN
- **Pattern** : Toggle Switch + DatePicker unique (simplifié depuis `ActivityDatesSection`)
- **Différence avec activités** : Une seule date (pas de période début/fin)
- **Composant** : Réutiliser `DateTimePicker` (une seule instance au lieu de deux)
- **Logique** :
  - Switch "Planifier" pour activer/désactiver
  - Si activé : Dialog avec `DateTimePicker` unique
  - Stocker en ISO string dans `dueDate`
- **Complexité** : ⭐⭐ Simple (~100 lignes, simplifié vs `ActivityDatesSection`)

### 4. TaskAssignedSection ⚠️ NOUVEAU
- **Pattern** : `Combobox` (sélection unique, comme `AgentSelector`)
- **Champ** : `assignedTo` (UUID optionnel)
- **Source** : Liste des `BasicProfile[]`
- **Affichage** : Nom complet (avec entreprise si disponible)
- **Formatage** : Similaire à `ActivityParticipantsSection` mais sélection unique
- **Complexité** : ⭐⭐ Simple (~50 lignes)

### 5. TaskLinksSection ⚠️ ADAPTATION
- **Pattern** : Deux sections séparées (plus clair)
  - **Section 1 : Tickets liés** : Réutiliser `EntityTypeSelector` + `LinkSearchField` avec entityType "bug"|"assistance"|"request"|"followup"
  - **Section 2 : Activités liées** : Créer une fonction `searchActivities` + utiliser `LinkSearchField` adapté
- **Champs** : 
  - `linkedTicketIds` (array UUID) - réutiliser le pattern activités
  - `linkedActivityIds` (array UUID) - nouveau : chercher des activités
- **Action requise** : Étendre `search-links.ts` pour supporter `entityType='activity'`
- **Complexité** : ⭐⭐⭐ Moyenne (~150 lignes, nécessite extension du service)

### 6. TaskReportSection ⭐ RÉUTILISATION
- **Pattern** : Réutiliser `ActivityReportSection` directement (identique)
- **Champ** : `reportContent` (optionnel)
- **Complexité** : ⭐ Très simple (réutilisation 100%)

### 7. TaskSubmitButtons ⭐ RÉUTILISATION
- **Pattern** : Réutiliser `ActivitySubmitButtons` (renommer labels seulement)
- **Complexité** : ⭐ Très simple (réutilisation 100%)

## 🔧 Hook useTaskForm

### Structure proposée :

```typescript
export function useTaskForm(options: {
  profiles: BasicProfile[];
  onSubmit: (values: CreateTaskInput) => Promise<void | string>;
  initialValues?: Partial<CreateTaskInput>;
}): UseTaskFormResult {
  const defaultValues: CreateTaskInput = {
    title: '',
    description: undefined,
    dueDate: undefined,
    assignedTo: undefined,
    linkedTicketIds: [],
    linkedActivityIds: [],
    reportContent: undefined,
    isPlanned: false
  };

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues
  });

  return { form };
}
```

## 🎨 Composant principal TaskForm

### Structure (< 100 lignes) :

```typescript
export const TaskForm = ({
  onSubmit,
  onSubmitAndContinue,
  isSubmitting = false,
  profiles,
  initialValues
}: TaskFormProps) => {
  const taskForm = useTaskForm({
    profiles,
    initialValues,
    onSubmit
  });

  // Handlers (similaires à ActivityForm)
  
  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <TaskTitleSection form={taskForm.form} />
      <TaskDescriptionSection form={taskForm.form} />
      <TaskDueDateSection form={taskForm.form} />
      <TaskAssignedSection form={taskForm.form} profiles={profiles} />
      <TaskLinksSection form={taskForm.form} />
      <TaskReportSection form={taskForm.form} />
      <TaskSubmitButtons isSubmitting={isSubmitting} onSubmitAndContinue={...} />
    </form>
  );
};
```

## 📝 Composant CreateTaskDialog

### Pattern identique à `CreateActivityDialog` :

- Dialog avec Trigger Button
- Gestion d'état (open, isSubmitting, error)
- Toast notifications
- Réinitialisation après création
- Support "Créer et continuer"

## ✅ Principes Clean Code appliqués

1. **SRP** : Chaque section a une responsabilité unique
2. **DRY** : Réutilisation maximale des composants existants
3. **Composants < 100 lignes** : Sections atomiques
4. **Fonctions < 20 lignes** : Helpers extraits
5. **Typage explicite** : TypeScript strict partout
6. **Validation Zod** : Schéma déjà créé (`createTaskSchema`)

## 🚀 Plan d'implémentation (step by step)

### Étape 1 : Hook useTaskForm ⭐
- Créer `src/hooks/forms/use-task-form.ts`
- Pattern identique à `useActivityForm`

### Étape 2 : Sections simples (réutilisation) ⭐
- TaskTitleSection (copier ActivityTitleSection)
- TaskReportSection (réutiliser ActivityReportSection)
- TaskSubmitButtons (réutiliser avec labels adaptés)

### Étape 3 : Section Description ⭐⭐
- TaskDescriptionSection (nouveau, simple textarea)

### Étape 4 : Section Date d'échéance ⭐⭐
- TaskDueDateSection (nouveau, simplifié depuis ActivityDatesSection)

### Étape 5 : Section Assigné ⭐⭐
- TaskAssignedSection (nouveau, Combobox utilisateur)

### Étape 6 : Extension service recherche ⚠️
- Étendre `src/types/activity-links.ts` : Ajouter 'activity' à `LinkableEntityType`
- Étendre `src/services/activities/search-links.ts` : Ajouter fonction `searchActivities()`
- Étendre `searchLinkableEntities()` : Ajouter le case 'activity'
- Créer route API si nécessaire (probablement déjà géré)

### Étape 7 : Section Liens ⭐⭐⭐
- TaskLinksSection (deux sous-sections : tickets + activités)
- Réutiliser `EntityTypeSelector` + `LinkSearchField` pour tickets
- Utiliser `LinkSearchField` avec entityType='activity' pour activités

### Étape 8 : Composant principal ⭐
- TaskForm (orchestrateur < 100 lignes)

### Étape 9 : Dialog ⭐
- CreateTaskDialog (wrapper, pattern identique à CreateActivityDialog)

### Étape 10 : Intégration ⭐
- Intégrer `CreateTaskDialog` dans `/gestion/taches/page.tsx`
- Réactiver l'import `createTaskAction`

## ⚠️ Points d'attention

1. **Date d'échéance** : Une seule date (simplifié vs activités)
2. **Assigné à** : Un seul utilisateur (vs participants array) - utiliser `Combobox` au lieu de `MultiSelect`
3. **Description** : Input simple (textarea) plutôt que RichTextEditor pour rester léger
4. **Liens** : Deux sections séparées (tickets + activités) pour plus de clarté
5. **Recherche activités** : ⚠️ Nécessite extension de `search-links.ts` pour supporter `entityType='activity'`
6. **Validation** : Le schéma Zod existe déjà, vérifier la cohérence avec `createTaskSchema`
7. **Réutilisation** : Maximiser la réutilisation des composants existants
8. **Consistance** : Suivre le même pattern UX que les activités

## 📊 Estimation

- **Complexité globale** : ⭐⭐⭐ Moyenne (beaucoup de réutilisation)
- **Sections nouvelles** : 4 (Description, DueDate, Assigned, Links)
- **Sections réutilisées** : 3 (Title, Report, SubmitButtons)
- **Lignes de code** : ~600-700 lignes (dont ~40% réutilisation)

## ✨ Résultat attendu

Un formulaire de création de tâches :
- ✅ Cohérent avec le formulaire d'activités
- ✅ Respectant les principes Clean Code
- ✅ Typé strictement
- ✅ Validé avec Zod
- ✅ Réutilisant au maximum les composants existants
- ✅ UX fluide et intuitive
