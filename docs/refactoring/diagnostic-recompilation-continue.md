# 🔍 Diagnostic : Recompilation et Render Continuels

## 📊 Problème Identifié

Les logs montrent des requêtes API répétées vers :
- `/api/users/{id}/stats?type=reporter`
- `/api/tickets/{id}/stats`

Ces requêtes se déclenchent **immédiatement** au montage des tooltips, même si le tooltip n'est pas ouvert.

## 🎯 Cause Racine

### Tooltips qui chargent les données au montage

Les composants `UserStatsTooltip` et `TicketStatsTooltip` utilisent des `useEffect` qui se déclenchent **dès le montage**, pas seulement quand le tooltip est ouvert :

```typescript
// ❌ PROBLÈME : useEffect se déclenche au montage
useEffect(() => {
  loadStats(); // Appel API immédiat
}, [profileId, type]);
```

### Impact avec 25 tickets visibles

- **25+ tickets** visibles dans le tableau
- Chaque ticket a **2-3 tooltips** (`TicketStatsTooltip`, `UserStatsTooltip` pour reporter, `UserStatsTooltip` pour assigné)
- **50-75 appels API** se déclenchent **immédiatement** au chargement de la page
- Chaque appel API = **compilation + render** (voir logs : 3ms compile + 293ms render)
- **Cumul** : 50-75 × (3ms + 293ms) = **14.8s - 22.2s de traitement**

## 🔧 Solution : Charger les données seulement à l'ouverture

### Option 1 : Utiliser `onOpenChange` du Tooltip (Recommandé)

Radix UI Tooltip expose un callback `onOpenChange` qui se déclenche quand le tooltip s'ouvre. On peut charger les données seulement à ce moment.

### Option 2 : Lazy loading conditionnel

Ne charger les données que si le tooltip est effectivement ouvert (vérifier avec `useState` ou `useTooltipState`).

## 📋 Fichiers à modifier

1. `src/components/tickets/tooltips/user-stats-tooltip.tsx`
   - Charger les stats seulement à l'ouverture du tooltip
   - Utiliser `onOpenChange` ou un état local

2. `src/components/tickets/tooltips/ticket-stats-tooltip.tsx`
   - Même modification

3. `src/components/tickets/tickets-infinite-scroll/ticket-row.tsx`
   - Passer le callback `onOpenChange` au Tooltip si nécessaire

## 🎯 Bénéfices Attendus

- **Réduction drastique** des appels API au chargement initial
- **Amélioration du TTFB** (Time To First Byte)
- **Réduction des recompilations** (pas d'appels API si tooltip pas ouvert)
- **Meilleure UX** : chargement à la demande (lazy loading)

## 📊 Métriques Actuelles (estimées)

| Métrique | Valeur Actuelle | Valeur Cible |
|----------|----------------|--------------|
| Appels API au chargement | 50-75 | 0 |
| Temps de compilation | 150-225ms | 0ms |
| Temps de render | 14.6-22.0s | 0ms |
| **Total impact** | **14.8-22.2s** | **0s** |

---

**Priorité** : 🔴 **CRITIQUE**
**Complexité** : 🟡 **MOYENNE**
**Impact** : 🟢 **ÉLEVÉ**

