# Tests de validation - Implémentation Toggle "Planifier" avec Dialog

## ✅ Tests de Validation Zod

### Test 1 : Activité sans dates (non planifiée)
```typescript
const input = {
  title: "Test Activité",
  activityType: "Revue",
  plannedStart: undefined,
  plannedEnd: undefined
};
// ✅ Résultat attendu : VALIDE (activité non planifiée est autorisée)
```

### Test 2 : Activité avec dates valides (planifiée)
```typescript
const input = {
  title: "Test Activité",
  activityType: "Revue",
  plannedStart: "2024-01-15T10:00:00Z",
  plannedEnd: "2024-01-15T12:00:00Z"
};
// ✅ Résultat attendu : VALIDE (dates cohérentes)
```

### Test 3 : Une seule date présente (invalide)
```typescript
const input = {
  title: "Test Activité",
  activityType: "Revue",
  plannedStart: "2024-01-15T10:00:00Z",
  plannedEnd: undefined
};
// ❌ Résultat attendu : INVALIDE - "La date de fin est requise si la date de début est renseignée"
```

### Test 4 : Date de fin avant date de début (invalide)
```typescript
const input = {
  title: "Test Activité",
  activityType: "Revue",
  plannedStart: "2024-01-15T12:00:00Z",
  plannedEnd: "2024-01-15T10:00:00Z"
};
// ❌ Résultat attendu : INVALIDE - "La date de fin doit être postérieure à la date de début"
```

## ✅ Tests de Composant ActivityDatesSection

### Test 5 : Switch désactivé par défaut
- ✅ Switch est désactivé si aucune date dans le formulaire
- ✅ Dialog ne s'affiche pas
- ✅ Aucune date affichée

### Test 6 : Activation du Switch
- ✅ Quand on active le Switch → Dialog s'ouvre
- ✅ Champs de dates sont vides (première fois)
- ✅ Ou pré-remplis avec les dates existantes

### Test 7 : Validation des dates dans le Dialog
- ✅ Bouton "Valider" désactivé si une date manque
- ✅ Quand on valide → Dates enregistrées dans le formulaire
- ✅ Validation Zod déclenchée (`shouldValidate: true`)
- ✅ Dialog se ferme
- ✅ Switch reste activé
- ✅ Dates affichées sous forme lisible

### Test 8 : Annulation dans le Dialog
- ✅ Bouton "Annuler" → Dialog se ferme
- ✅ Dates existantes conservées dans le formulaire
- ✅ Switch reste dans son état actuel

### Test 9 : Désactivation du Switch
- ✅ Quand on désactive le Switch → Dates effacées (`setValue(undefined)`)
- ✅ Validation non déclenchée (`shouldValidate: false`)
- ✅ Erreurs nettoyées (`clearErrors`)
- ✅ Dialog se ferme
- ✅ Aucune date affichée

### Test 10 : Modification des dates existantes
- ✅ Bouton "Modifier les dates" → Dialog s'ouvre
- ✅ Dates pré-remplies dans le Dialog
- ✅ Modification possible
- ✅ Validation après modification

## ✅ Tests d'Intégration Service

### Test 11 : Création activité sans dates
```typescript
const payload = {
  title: "Test",
  activityType: "Revue",
  plannedStart: undefined,
  plannedEnd: undefined
};
// ✅ Résultat : planned_start = null, planned_end = null dans Supabase
```

### Test 12 : Création activité avec dates
```typescript
const payload = {
  title: "Test",
  activityType: "Revue",
  plannedStart: "2024-01-15T10:00:00Z",
  plannedEnd: "2024-01-15T12:00:00Z"
};
// ✅ Résultat : planned_start et planned_end enregistrés dans Supabase
```

## ✅ Vérifications de Sécurité TypeScript

### Test 13 : Vérifications de type
- ✅ `typeof plannedStart === 'string'` avant `.trim()`
- ✅ `typeof plannedEnd === 'string'` avant `.trim()`
- ✅ Vérifications dans le `superRefine` Zod
- ✅ Vérifications dans le `useEffect` de synchronisation
- ✅ Vérifications dans l'affichage conditionnel

## ✅ Points de Vérification Finale

- [x] Aucune erreur de linting
- [x] Aucune erreur TypeScript
- [x] Validation Zod fonctionnelle
- [x] Composant React fonctionnel
- [x] Service backend correct
- [x] Gestion d'erreur appropriée
- [x] Clean Code respecté (composants atomiques)
- [x] Conformité avec recommandations Context7

## 📋 Résultat Final

✅ **L'implémentation est PROPRE et FONCTIONNELLE**

Tous les scénarios sont couverts :
- Activité non planifiée (dates optionnelles)
- Activité planifiée (dates valides)
- Validation conditionnelle (cohérence des dates)
- UX intuitive (Switch + Dialog)
- Gestion d'erreur robuste
- TypeScript strict
