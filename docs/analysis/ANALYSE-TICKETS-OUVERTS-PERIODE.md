# Analyse : Tickets Ouverts sur la Période

**Date**: 2025-01-16  
**Période analysée**: 02 juin 2025 - 02 décembre 2025

---

## 📊 Données de Référence (MCP Supabase)

### Tous les tickets créés dans la période
- ✅ **326 tickets** (sans filtre)

### Tickets avec product_id valide (INNER JOIN)
- ✅ **325 tickets** (1 ticket sans product_id exclu)

### Code actuel dans `ticket-flux.ts`
```typescript
.select('id, product_id, product:products!inner(id, name)')
```
Le `!inner` effectue un INNER JOIN qui exclut les tickets sans `product_id` valide.

---

## ✅ Définition : "Tickets Ouverts"

**Définition actuelle** : Les tickets **créés** dans la période sélectionnée.

**Code dans `ticket-flux.ts`** (lignes 48-56) :
```typescript
// Tickets ouverts dans la période
let openedQuery = supabase
  .from('tickets')
  .select('id, product_id, product:products!inner(id, name)')
  .gte('created_at', startDate)
  .lte('created_at', endDate);
```

**Logique** :
- ✅ Filtre par `created_at >= startDate` et `created_at <= endDate`
- ✅ INNER JOIN avec `products` (exclut les tickets sans product_id valide)
- ✅ Résultat attendu : **325 tickets** pour la période 02 juin - 02 déc 2025

---

## ❓ Question : Pourquoi le dashboard affiche 668 ?

### Hypothèses à vérifier :

1. **Les dates personnalisées ne sont pas transmises** ❌
   - Si la période par défaut est utilisée, on pourrait avoir plus de tickets
   - À vérifier : les dates dans l'URL de l'API

2. **Une autre période est utilisée** ❓
   - 668 ne correspond à aucune période testée :
     - Année 2025 complète : 623 tickets
     - Période 02 juin - 02 déc : 326 tickets
   - Peut-être une période cumulative différente ?

3. **Des filtres supplémentaires sont appliqués** ❓
   - Filtres par produits, types, équipes
   - RLS (Row Level Security) qui change les résultats
   - Filtres applicatifs après la requête

4. **Problème de cache ou de données obsolètes** ❓
   - Cache Next.js qui retourne d'anciennes données
   - Données non actualisées dans le dashboard

---

## 🔍 Vérifications Nécessaires

### 1. Vérifier les dates transmises à l'API

**URL attendue** :
```
/api/dashboard?period=year&startDate=2025-06-02T00:00:00.000Z&endDate=2025-12-02T23:59:59.999Z
```

**À vérifier** :
- Les paramètres `startDate` et `endDate` sont-ils bien dans l'URL ?
- L'API les utilise-t-elle correctement ?
- Les services reçoivent-ils les bonnes dates ?

### 2. Vérifier les logs de développement

Les logs dans `ticket-flux.ts` devraient afficher :
```typescript
console.log('[getTicketFlux] Query results:', {
  period,
  openedCount: opened,
  // ...
});
```

**À vérifier** : Les valeurs affichées dans la console du navigateur.

### 3. Vérifier les filtres appliqués

**Filtres possibles** :
- Produits (via `applyDashboardFilters`)
- Types de tickets (BUG, REQ, ASSISTANCE)
- Équipes (via RLS ou filtres applicatifs)
- RLS (Row Level Security) selon le rôle de l'utilisateur

---

## ✅ Conclusion

**Définition confirmée** : "Tickets ouverts" = tickets **créés** dans la période.

**Résultat attendu pour la période 02 juin - 02 déc 2025** : **325 tickets** (avec INNER JOIN)

**Résultat affiché** : **668 tickets** ❌

**Prochaine étape** : Vérifier pourquoi il y a une différence de 343 tickets (668 - 325 = 343).

---

**Statut** : 🟡 **En attente de vérification des dates et filtres**

