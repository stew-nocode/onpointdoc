# Vérification du Date Picker

## Configuration actuelle

Les modifications suivantes ont été appliquées au composant `DateTimePicker` :

### Limites de dates configurées :
- **Date minimale** : 1er janvier 2025 (année en cours)
- **Date maximale** : 31 décembre 2030 (dans 5 ans)
- **Années disponibles** : 2025, 2026, 2027, 2028, 2029, 2030

## Fichiers modifiés

1. **src/components/forms/activity-form/sections/date-time-picker.tsx**
   - Lignes 55-58 : Calcul des limites de dates
   - Lignes 86-90 : Props `fromDate`, `toDate` et fonction `disabled`

2. **src/ui/calendar.tsx**
   - Configuration complète pour react-day-picker v9
   - Styles pour les dropdowns mois/année
   - Classes pour les jours désactivés

## Comment vérifier

1. **Ouvrir la page Activités** : http://localhost:3000/gestion/activites
2. **Cliquer sur "Créer une activité"**
3. **Activer le toggle "Planifier l'activité"**
4. **Dans le modal qui s'ouvre, cliquer sur "Sélectionner une date"**
5. **Vérifier le dropdown des années** :
   - ✅ Devrait afficher uniquement : 2025, 2026, 2027, 2028, 2029, 2030
   - ❌ Ne devrait PAS afficher : 2024, 2023, 2031, 2032, etc.

## Si les limites ne s'appliquent pas

### Solution 1 : Vider le cache du navigateur
```bash
# Dans le navigateur :
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet Network
3. Cocher "Disable cache"
4. Rafraîchir la page (Ctrl+R ou Cmd+R)
```

### Solution 2 : Redémarrer le serveur de développement
```bash
# Dans le terminal :
Ctrl+C pour arrêter
npm run dev pour redémarrer
```

### Solution 3 : Vérifier que le fichier est bien modifié
```bash
# Vérifier les lignes 55-58 du date-time-picker.tsx
grep -A 4 "Calculer la plage" src/components/forms/activity-form/sections/date-time-picker.tsx
```

## Code source des limites

```typescript
// Lignes 55-58 dans date-time-picker.tsx
const currentYear = new Date().getFullYear();
const fromDate = new Date(currentYear, 0, 1); // 1er janvier de l'année en cours
const toDate = new Date(currentYear + 5, 11, 31); // 31 décembre dans 5 ans
```

```tsx
// Lignes 82-95 dans date-time-picker.tsx
<Calendar
  mode="single"
  selected={date}
  captionLayout="dropdown"
  fromDate={fromDate}
  toDate={toDate}
  disabled={(date) => {
    return date < fromDate || date > toDate;
  }}
  onSelect={(selectedDate) => {
    onDateChange(selectedDate);
    setOpen(false);
  }}
/>
```
