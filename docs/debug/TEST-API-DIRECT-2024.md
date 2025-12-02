# 🔍 Test API Direct pour 2024

**Date**: 2025-01-16  
**Objectif**: Vérifier si l'API retourne bien les données pour 2024

---

## 📝 Test à Effectuer

### 1. Test Direct de l'API

Ouvrir dans le navigateur ou avec curl :

```
GET http://localhost:3000/api/dashboard?period=2024
```

### 2. Vérifications

- ✅ La période est bien "2024" dans la réponse
- ✅ `periodStart` est `2024-01-01T00:00:00.000Z`
- ✅ `periodEnd` est `2024-12-31T23:59:59.999Z`
- ✅ `strategic.flux.opened` contient un nombre > 0 (devrait être 1038)
- ✅ `strategic.mttr.global` contient un nombre > 0

### 3. Logs Serveur

Vérifier les logs dans le terminal où `npm run dev` est lancé :
- `[API Dashboard] Loading strategic data:` doit montrer period: '2024'
- `[getCEODashboardData] Loading data for period:` doit montrer period: '2024'
- `[getTicketFlux] Loading flux for period:` doit montrer les dates correctes

---

## 🐛 Si les Données sont 0

Si l'API retourne des 0, vérifier :

1. **Dates calculées** : Vérifier que `getPeriodDates("2024")` retourne les bonnes dates
2. **Requêtes Supabase** : Vérifier les logs Supabase dans la console
3. **Cache React** : Vérifier si `React.cache()` bloque

---

## 📊 Résultats Attendus

```json
{
  "role": "direction",
  "period": "2024",
  "periodStart": "2024-01-01T00:00:00.000Z",
  "periodEnd": "2024-12-31T23:59:59.999Z",
  "strategic": {
    "flux": {
      "opened": 1038,
      "resolved": 853,
      "resolutionRate": 34
    },
    "mttr": {
      "global": 24.0
    }
  }
}
```

