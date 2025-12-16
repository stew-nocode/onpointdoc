# Recommandation : Mapping avec Statuts JIRA Dynamiques

## 🎯 Stratégie Recommandée

### ✅ **Option recommandée : Conserver les statuts JIRA tels quels**

**Principe** : Utiliser les statuts JIRA dynamiques directement dans Supabase sans normalisation.

---

## 📊 Analyse de la situation actuelle

### Statuts actuellement utilisés dans Supabase

| Statut | Nombre de tickets | Type |
|--------|-------------------|------|
| `Terminé(e)` | 1703 | JIRA dynamique |
| `Sprint Backlog` | 287 | JIRA dynamique |
| `Nouveau` | 99 | Enum standard |
| `Traitement en Cours` | 19 | JIRA dynamique |
| `Test en Cours` | 3 | JIRA dynamique |
| `En_cours` | 1 | Enum standard |

**Observation** : Le système utilise déjà majoritairement les statuts JIRA dynamiques !

---

## ✅ Recommandation : Approche Hybride avec Mapping Minimal

### Stratégie

1. **Conserver les statuts JIRA dynamiques** pour les tickets provenant de JIRA
2. **Mapper uniquement les statuts standards** du CSV vers les équivalents JIRA
3. **Utiliser un mapping flexible** qui accepte les nouveaux statuts JIRA

### Mapping CSV → Supabase (Statuts)

| Statut CSV | Statut Supabase | Type | Notes |
|------------|-----------------|------|-------|
| `À faire` | `To_Do` | Enum standard | Si workflow JIRA standard |
| `À faire` | `Sprint Backlog` | JIRA dynamique | Si workflow JIRA personnalisé |
| `En cours` | `En_cours` | Enum standard | Pour ASSISTANCE locale |
| `En cours` | `Traitement en Cours` | JIRA dynamique | Pour tickets JIRA |
| `Terminé(e)` | `Terminé(e)` | JIRA dynamique | **Conserver tel quel** ✅ |
| `Terminé(e)` | `Resolue` | Enum standard | Alternative si besoin |

### ⚠️ Décision importante

**Pour le fichier CSV** : Les tickets ont déjà des statuts JIRA (`Terminé(e)`, `En cours`, `À faire`).

**Recommandation** :
- **Conserver les statuts tels quels** du CSV
- **Ne pas normaliser** vers les enums standards
- **Accepter la diversité** des statuts JIRA

---

## 🔄 Mapping Recommandé pour le CSV

### Mapping direct (sans transformation)

```typescript
const statusMapping = {
  // Statuts du CSV → Statuts Supabase (conservation)
  'À faire': 'À faire',  // ou 'To_Do' si workflow standard
  'En cours': 'En cours', // ou 'Traitement en Cours' si JIRA
  'Terminé(e)': 'Terminé(e)', // ✅ Conserver tel quel (déjà utilisé 1703 fois)
};
```

### Mapping avec normalisation optionnelle

```typescript
const statusMapping = {
  // Option 1 : Conserver les statuts JIRA dynamiques
  'À faire': 'Sprint Backlog',      // Statut JIRA courant
  'En cours': 'Traitement en Cours', // Statut JIRA courant
  'Terminé(e)': 'Terminé(e)',        // ✅ Déjà utilisé massivement
  
  // Option 2 : Normaliser vers enums standards
  'À faire': 'To_Do',
  'En cours': 'En_cours',
  'Terminé(e)': 'Resolue',
};
```

---

## 💡 Recommandation Finale

### ✅ **Approche recommandée : Mapping intelligent avec fallback**

```typescript
function mapJiraStatusToSupabase(jiraStatus: string): string {
  // Mapping spécifique pour les statuts courants
  const specificMapping: Record<string, string> = {
    'À faire': 'Sprint Backlog',        // Statut JIRA le plus courant
    'En cours': 'Traitement en Cours',   // Statut JIRA le plus courant
    'Terminé(e)': 'Terminé(e)',          // ✅ Conserver (déjà 1703 tickets)
  };
  
  // Si mapping spécifique existe, l'utiliser
  if (specificMapping[jiraStatus]) {
    return specificMapping[jiraStatus];
  }
  
  // Sinon, conserver le statut tel quel (statut JIRA dynamique)
  return jiraStatus;
}
```

### Avantages

1. ✅ **Cohérence** : Utilise les statuts déjà présents dans Supabase
2. ✅ **Flexibilité** : Accepte les nouveaux statuts JIRA sans modification
3. ✅ **Compatibilité** : S'aligne avec l'usage actuel (1703 tickets avec "Terminé(e)")
4. ✅ **Maintenabilité** : Pas besoin de mettre à jour le mapping à chaque nouveau statut JIRA

---

## 📋 Tableau de Mapping Final Recommandé

| Statut CSV | Statut Supabase | Justification |
|------------|-----------------|---------------|
| `À faire` | `Sprint Backlog` | Statut JIRA le plus courant pour "À faire" (287 tickets) |
| `En cours` | `Traitement en Cours` | Statut JIRA pour "En cours" (19 tickets) |
| `Terminé(e)` | `Terminé(e)` | **Conserver tel quel** - Déjà utilisé 1703 fois ✅ |
| Autres statuts | **Conserver tel quel** | Accepter les statuts JIRA dynamiques |

---

## 🎯 Implémentation

### Code de mapping recommandé

```typescript
// Mapping des statuts CSV → Supabase
const CSV_STATUS_MAPPING: Record<string, string> = {
  'À faire': 'Sprint Backlog',
  'En cours': 'Traitement en Cours',
  'Terminé(e)': 'Terminé(e)', // ✅ Conserver tel quel
};

function mapStatus(csvStatus: string): string {
  // Normaliser les espaces et casse
  const normalized = csvStatus.trim();
  
  // Vérifier le mapping spécifique
  if (CSV_STATUS_MAPPING[normalized]) {
    return CSV_STATUS_MAPPING[normalized];
  }
  
  // Fallback : conserver le statut tel quel (statut JIRA dynamique)
  return normalized;
}
```

---

## ✅ Conclusion

**Recommandation finale** :
1. ✅ **Conserver "Terminé(e)" tel quel** (déjà utilisé massivement)
2. ✅ **Mapper "À faire" → "Sprint Backlog"** (statut JIRA courant)
3. ✅ **Mapper "En cours" → "Traitement en Cours"** (statut JIRA courant)
4. ✅ **Accepter les autres statuts JIRA dynamiques** sans transformation

Cette approche garantit :
- **Cohérence** avec l'existant
- **Flexibilité** pour les nouveaux statuts
- **Simplicité** de maintenance

