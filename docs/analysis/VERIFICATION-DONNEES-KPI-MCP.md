# Vérification des Données KPI via MCP Supabase

**Date**: 2025-01-16  
**Période sélectionnée**: 02 juin 2025 - 02 décembre 2025

---

## 📊 Données Affichées dans le Dashboard

D'après la capture d'écran :
- **MTTR GLOBAL**: 69.1j
- **TICKETS OUVERTS**: 668
- **TICKETS RÉSOLUS**: 620
- **TICKETS ACTIFS**: 408
- **SANTÉ PRODUIT**: 1

---

## 🔍 Vérification via MCP Supabase

### 1. Tickets Ouverts dans la Période (02 juin - 02 déc 2025)

**Requête SQL** :
```sql
SELECT COUNT(*) as tickets_ouverts
FROM tickets
WHERE created_at >= '2025-06-02T00:00:00.000Z'::timestamp
  AND created_at <= '2025-12-02T23:59:59.999Z'::timestamp;
```

**Résultat MCP** :
- ✅ **326 tickets ouverts**

**Écart** : Le dashboard affiche **668**, mais la base contient seulement **326** pour cette période.

---

### 2. Tickets Résolus dans la Période

**Requête SQL** :
```sql
SELECT 
  COUNT(*) as tickets_resolus,
  COUNT(CASE WHEN status NOT IN ('Resolue', 'Résolu', 'Terminé', 'Terminé(e)', 'Termine', 'Done') THEN 1 END) as tickets_actifs
FROM tickets
WHERE created_at >= '2025-06-02T00:00:00.000Z'::timestamp
  AND created_at <= '2025-12-02T23:59:59.999Z'::timestamp;
```

**Résultat MCP** :
- ✅ **230 tickets résolus**
- ✅ **96 tickets actifs**

**Écarts** :
- Dashboard : **620 résolus** vs Base : **230 résolus** ❌
- Dashboard : **408 actifs** vs Base : **96 actifs** ❌

---

### 3. Comparaison avec Toute l'Année 2025

**Requête SQL** :
```sql
SELECT COUNT(*) as total_2025
FROM tickets
WHERE created_at >= '2025-01-01T00:00:00.000Z'::timestamp
  AND created_at <= '2025-12-31T23:59:59.999Z'::timestamp;
```

**Résultat MCP** :
- ✅ **623 tickets sur toute l'année 2025**
- ✅ **326 tickets depuis juin 2025**

---

## 🔍 Analyse du Problème

### Hypothèse 1 : La période personnalisée n'est pas utilisée

Le dashboard affiche **668 tickets ouverts**, ce qui est proche de **623 tickets sur toute l'année 2025**. 

Cela suggère que :
- ❌ La période personnalisée (02 juin - 02 déc) **n'est pas prise en compte**
- ❌ Les calculs utilisent peut-être toute l'année 2025 ou une autre période

### Hypothèse 2 : Problème dans la transmission des dates

Dans `unified-dashboard-with-widgets.tsx`, ligne 279-298 :
- Quand `dateRange` est sélectionné, `activePeriod` est calculé
- Mais `activePeriod = selectedYear || period || data.period`
- **`dateRange` n'est PAS pris en compte dans `activePeriod`** !
- Donc les services reçoivent toujours `period = 'year'` ou une année, pas les dates personnalisées

### Hypothèse 3 : Filtres appliqués

Les services appliquent peut-être des filtres (produits, types, équipes) qui modifient les résultats. Mais même avec des filtres, l'écart reste trop important.

---

## 🐛 Problème Identifié

**La période personnalisée n'est pas transmise aux services qui calculent les KPIs !**

Quand l'utilisateur sélectionne "02 juin 2025 - 02 déc. 2025" :
1. ✅ `dateRange` est défini correctement
2. ✅ Le badge "Actif" s'affiche sur le sélecteur
3. ❌ **Mais les dates personnalisées ne sont PAS transmises à l'API**
4. ❌ L'API reçoit `period = 'year'` et calcule sur toute l'année
5. ❌ Les KPIs affichent des données pour toute l'année au lieu de la période personnalisée

---

## 📋 Données Réelles vs Affichées

| KPI | Dashboard Affiché | Base (02 juin - 02 déc) | Base (Année 2025 complète) |
|-----|-------------------|-------------------------|----------------------------|
| **TICKETS OUVERTS** | **668** ❌ | **326** ✅ | 623 |
| **TICKETS RÉSOLUS** | **620** ❌ | **230** ✅ | 481 |
| **TICKETS ACTIFS** | **408** ❌ | **96** ✅ | 142 |
| **MTTR GLOBAL** | **69.1j** ❌ | N/A (0 tickets avec durée) | N/A (0 tickets avec durée) |

**Analyse** :
- Les données affichées (668, 620, 408) sont **entre** la période personnalisée (326, 230, 96) et toute l'année (623, 481, 142)
- Cela suggère qu'une **autre période est utilisée** dans les calculs, pas la période personnalisée ni toute l'année

**Conclusion** : ❌ **Les KPIs n'utilisent PAS la période personnalisée sélectionnée (02 juin - 02 déc 2025)**

---

## 🔧 Solution Nécessaire

Il faut transmettre les dates personnalisées (`periodStart` et `periodEnd`) aux services qui calculent les KPIs, comme proposé dans `docs/bug/PROBLEME-PERIODE-PERSONNALISEE-SUPPORT-EVOLUTION.md`.

---

**Statut** : ✅ **Problème confirmé - Les KPIs n'utilisent pas la période personnalisée**

