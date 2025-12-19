# 🔍 Instructions pour Déboguer le Problème 2024

**Date**: 2025-01-16  
**Problème**: Les widgets affichent 0 quand "2024" est sélectionné

---

## 📝 Étapes de Diagnostic

### 1. Vérifier les Logs Serveur

Dans le terminal où `npm run dev` est lancé, chercher :

```
[API Dashboard] Loading strategic data: { period: '2024', ... }
[getCEODashboardData] Loading data for period: { period: '2024', ... }
[getTicketFlux] Loading flux for period: { period: '2024', ... }
```

**Si ces logs n'apparaissent pas** :
- L'API n'est pas appelée
- Le cache bloque les requêtes

**Si ces logs apparaissent avec des données à 0** :
- Les requêtes Supabase ne retournent pas de données
- Vérifier les dates calculées

### 2. Vérifier les Logs Navigateur

Dans la console du navigateur (F12), chercher :

```
[Dashboard] Data loaded from API: { period: '2024', strategicFluxOpened: ..., ... }
```

**Si ce log montre `strategicFluxOpened: 0`** :
- L'API retourne bien 0
- Le problème vient des requêtes Supabase

**Si ce log montre `strategicFluxOpened: 1038` mais les widgets affichent 0** :
- Les widgets ne reçoivent pas les nouvelles données
- Problème de mise à jour des props

### 3. Vérifier les Dates

Dans les logs, vérifier que :
- `periodStart: "2024-01-01T00:00:00.000Z"`
- `periodEnd: "2024-12-31T23:59:59.999Z"`

Si les dates sont incorrectes, c'est le problème.

---

## 🔧 Actions Correctives

1. ✅ Logs ajoutés dans l'API et les services
2. ✅ Log ajouté dans `loadData` pour voir la réponse de l'API
3. ✅ Type corrigé pour accepter `Period | string`

---

## 📊 Résultat Attendu

Quand "2024" est sélectionné :
- Logs serveur montrent les requêtes avec period='2024'
- Logs navigateur montrent `strategicFluxOpened: 1038`
- Widgets affichent les données

---

**Statut** : ⏳ **EN ATTENTE DE TEST**

