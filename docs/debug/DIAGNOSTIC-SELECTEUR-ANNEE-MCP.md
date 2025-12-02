# 🔍 Diagnostic MCP - Problème Sélecteur d'Année 2024

**Date**: 2025-01-16  
**Problème**: Les widgets affichent 0 quand on sélectionne 2024 (sauf Support Evolution)  
**Méthode**: Utilisation des MCP Supabase et Next.js

---

## 📊 Diagnostic avec MCP Supabase

### Test 1: Données disponibles pour 2024

```sql
-- Résultat: 1038 tickets avec JOIN products
SELECT COUNT(*) 
FROM tickets t
INNER JOIN products p ON t.product_id = p.id
WHERE t.created_at >= '2024-01-01T00:00:00.000Z'::timestamp
  AND t.created_at <= '2024-12-31T23:59:59.999Z'::timestamp;
```

**✅ RÉSULTAT**: 1038 tickets trouvés

### Test 2: Dates générées par getPeriodDates("2024")

**Dates attendues**:
- `startDate`: 2024-01-01T00:00:00.000Z
- `endDate`: 2024-12-31T23:59:59.999Z

**✅ VÉRIFIÉ**: Les dates sont correctes

---

## 🔍 Constatations

### 1. Support Evolution fonctionne ✅

Le graphique "Support Evolution" **fonctionne** avec 2024 car :
- Il a sa propre fonction `getPeriodDates()` dans `support-evolution-data-v2.ts`
- Il charge ses données via une Server Action séparée
- Les logs montrent : `period: '2024'`, `hasData: true`, `dataPointsCount: 12`

### 2. Les KPIs n'affichent rien ❌

Les KPIs (MTTR, Tickets Ouverts, etc.) utilisent :
- L'API `/api/dashboard` qui appelle `getCEODashboardData()`
- Les données de `data.strategic` qui viennent de cette API
- Le problème : les données ne sont pas rechargées ou ne sont pas filtrées correctement

---

## 🐛 Causes Possibles

### 1. Le cache React.cache()

Les services utilisent `React.cache()` qui peut cacher les résultats :
- `getTicketFlux` utilise `cache(getTicketFluxInternal)`
- Si la période est la même, les données peuvent être servies depuis le cache

### 2. Les dates ne sont pas correctement passées

- Vérifier que `getPeriodDates("2024")` est bien appelé
- Vérifier que les dates ISO sont correctes
- Vérifier que Supabase reçoit les bonnes dates

### 3. Le JOIN products exclut des tickets

- 1039 tickets en 2024
- 1038 avec le JOIN products
- 1 ticket sans produit (normal)

---

## 🔧 Actions à Vérifier

1. ✅ Vérifier que `getPeriodDates("2024")` génère les bonnes dates
2. ⏳ Vérifier que l'API `/api/dashboard?period=2024` retourne les bonnes données
3. ⏳ Vérifier que les widgets reçoivent les données mises à jour
4. ⏳ Vérifier si le cache React bloque les mises à jour

---

## 📝 Prochaines Étapes

1. Ajouter des logs dans `getCEODashboardData()` pour voir les dates calculées
2. Vérifier la réponse de l'API `/api/dashboard?period=2024`
3. Vérifier que les widgets reçoivent bien les nouvelles données

