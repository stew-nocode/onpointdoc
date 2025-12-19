# Configuration des scripts d'import

## Fichier `excluded-companies.mjs`

Ce fichier contient la liste des entreprises à exclure lors de l'import depuis Google Sheets.

### Utilisation

Les entreprises listées dans `EXCLUDED_COMPANIES` sont automatiquement exclues lors de :
- L'import des entreprises depuis Google Sheets (`import-companies-from-sheet.mjs`)
- La comparaison des entreprises (`compare-companies-sheet-supabase.mjs`)

### Mise à jour

Si vous modifiez les filtres dans Google Sheets et que vous souhaitez exclure d'autres entreprises :

1. Ouvrez `scripts/config/excluded-companies.mjs`
2. Ajoutez le nom de l'entreprise dans le tableau `EXCLUDED_COMPANIES`
3. Les scripts respecteront automatiquement cette exclusion lors des prochains imports

### Exemple

```javascript
export const EXCLUDED_COMPANIES = [
  'ROADMAP',
  'CHURN/TEST',
  'TEAM SUPPORT',
  'NOUVELLE ENTREPRISE À EXCLURE', // Ajouter ici
];
```

### Notes

- Les entreprises sont comparées en majuscules (insensible à la casse)
- Les valeurs vides, "Non enregistré", "Non renseigné" et "ALL" sont automatiquement exclues
- La fonction `shouldExcludeCompany()` gère automatiquement ces exclusions





