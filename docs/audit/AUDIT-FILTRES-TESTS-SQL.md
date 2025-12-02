# 🧪 Tests SQL - Vérification des Filtres Année & Période

**Date**: 2025-01-16  
**Objectif**: Vérifier avec des requêtes SQL réelles que les filtres fonctionnent correctement

---

## 📊 Données de Référence

### Statistiques Globales

```
Total tickets: 2112
Tickets 2024: 1039
Tickets 2025: 623
Tickets 30 derniers jours: 53
Tickets 7 derniers jours: 7

Premier ticket: 2023-11-10
Dernier ticket: 2025-11-25
```

---

## 🧪 Tests SQL

### Test 1: Filtre Année 2024

**Période**: 2024-01-01 00:00:00 → 2025-01-01 00:00:00 (exclus)

**Résultat attendu**: ~1039 tickets selon les statistiques globales

**Query**:
```sql
SELECT 
  COUNT(*) as total_2024,
  COUNT(CASE WHEN ticket_type = 'BUG' THEN 1 END) as bugs_2024,
  COUNT(CASE WHEN ticket_type = 'REQ' THEN 1 END) as reqs_2024,
  COUNT(CASE WHEN ticket_type = 'ASSISTANCE' THEN 1 END) as assistances_2024,
  COUNT(CASE WHEN status IN ('Resolue', 'Résolu', 'Terminé', 'Terminé(e)', 'Termine', 'Done', 'Closed') THEN 1 END) as resolus_2024
FROM tickets
WHERE created_at >= '2024-01-01 00:00:00.000+00'
  AND created_at < '2025-01-01 00:00:00.000+00';
```

---

### Test 2: Période Personnalisée

**Période**: 2025-06-02 00:00:00 → 2025-12-02 23:59:59

**Résultat attendu**: Nombre de tickets créés dans cette période spécifique

**Query**:
```sql
SELECT 
  COUNT(*) as total_periode,
  COUNT(CASE WHEN ticket_type = 'BUG' THEN 1 END) as bugs_periode,
  COUNT(CASE WHEN ticket_type = 'REQ' THEN 1 END) as reqs_periode,
  COUNT(CASE WHEN ticket_type = 'ASSISTANCE' THEN 1 END) as assistances_periode,
  COUNT(CASE WHEN status IN ('Resolue', 'Résolu', 'Terminé', 'Terminé(e)', 'Termine', 'Done', 'Closed') THEN 1 END) as resolus_periode
FROM tickets
WHERE created_at >= '2025-06-02 00:00:00.000+00'
  AND created_at <= '2025-12-02 23:59:59.999+00';
```

---

### Test 3: Comparaison Année vs Période

**Objectif**: Vérifier que les filtres sont mutuellement exclusifs

**Logique attendue**:
- Si Année sélectionnée → Période personnalisée désactivée
- Si Période personnalisée sélectionnée → Année désactivée

**Vérification code**:
- `handleYearChange()` réinitialise `dateRange`
- `handleDateRangeChange()` réinitialise `selectedYear`

---

## ✅ Vérifications à Effectuer

### 1. Vérification Architecture

- ✅ **Transmission des paramètres**: Les dates sont bien transmises de `unified-dashboard` → API → Services
- ✅ **Priorité des dates**: Les dates personnalisées ont priorité sur la période
- ✅ **Services utilisent les dates**: Tous les services appellent `getPeriodDates()` avec les paramètres

### 2. Vérification Widgets

- ✅ **KPIs utilisent les données filtrées**: Les KPIs reçoivent les données déjà filtrées
- ✅ **Graphiques respectent la période**: Les graphiques utilisent les mêmes données filtrées
- ✅ **Tableaux filtrés correctement**: Les tableaux affichent les données de la période sélectionnée

### 3. Vérification Base de Données

- ⏳ **Requêtes SQL appliquent les filtres**: À vérifier avec les résultats des tests SQL
- ⏳ **Indexes utilisés**: Vérifier que les indexes sur `created_at` sont utilisés
- ⏳ **Performance des requêtes**: Vérifier que les requêtes sont performantes

---

## 📋 Checklist de Validation

- [ ] Test 1: Année 2024 retourne ~1039 tickets
- [ ] Test 2: Période personnalisée retourne les bons tickets
- [ ] Test 3: Conflit Année/Période géré correctement
- [ ] Vérification: Tous les widgets utilisent les mêmes dates
- [ ] Performance: Requêtes < 500ms

---

**Statut**: ⏳ **Tests en cours**


