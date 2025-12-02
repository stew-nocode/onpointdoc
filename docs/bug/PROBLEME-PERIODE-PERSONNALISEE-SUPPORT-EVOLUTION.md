# Bug : Graphique Support Evolution affiche tous les mois au lieu de la période personnalisée

**Date**: 2025-01-16  
**Statut**: 🐛 **Bug Identifié**

---

## 🐛 Problème

Quand une **période personnalisée** est sélectionnée (ex: "02 sept. 2025 - 02 déc. 2025"), le graphique **Évolution Performance Support** affiche **TOUS les mois de février à décembre** au lieu d'afficher uniquement la période sélectionnée (septembre à décembre).

---

## 🔍 Analyse

### Cause Racine

1. **Le widget Support Evolution ne reçoit pas les dates personnalisées**
   - Il reçoit seulement `period: Period` (ex: "year" ou "2025")
   - Il ne reçoit pas `periodStart` ni `periodEnd` quand une période personnalisée est sélectionnée

2. **Le service génère tous les mois de l'année**
   - Dans `support-evolution-data-v2.ts`, ligne 82-89 :
   ```typescript
   // Si c'est une année, générer par mois
   if (typeof period === 'string' && /^\d{4}$/.test(period)) {
     while (current <= end) {
       dates.push(new Date(current.getFullYear(), current.getMonth(), 1).toISOString().split('T')[0]);
       current.setMonth(current.getMonth() + 1);
     }
     return dates;
   }
   ```
   - Quand `period = "2025"`, il génère TOUS les mois de l'année (janvier à décembre)

3. **La logique de priorité ne transmet pas les dates personnalisées**
   - Dans `unified-dashboard-with-widgets.tsx`, ligne 281 :
   ```typescript
   const activePeriod: Period | string = selectedYear || period || data.period;
   ```
   - Il ne prend **PAS en compte** `dateRange` pour déterminer la période active
   - Donc même si une période personnalisée est sélectionnée, le widget reçoit toujours une période standard

---

## 📊 Flux Actuel (Problématique)

```
1. Utilisateur sélectionne : "02 sept. 2025 - 02 déc. 2025"
   ↓
2. dateRange = {from: Date, to: Date}
   ↓
3. dashboardDataWithFilteredAlerts calcule :
   activePeriod = selectedYear || period || data.period
   // dateRange n'est PAS pris en compte !
   ↓
4. Widget Support Evolution reçoit :
   { period: "year" ou "2025" }
   // periodStart/periodEnd ne sont PAS transmis
   ↓
5. Service generateDateRange() génère :
   TOUS les mois de 2025 (janvier à décembre)
   ↓
6. Graphique affiche : février à décembre
```

---

## ✅ Solution Proposée

### 1. Transmettre les dates personnalisées aux widgets

**Fichier**: `src/components/dashboard/unified-dashboard-with-widgets.tsx`

Modifier `dashboardDataWithFilteredAlerts` pour inclure `periodStart` et `periodEnd` quand une période personnalisée est active :

```typescript
const dashboardDataWithFilteredAlerts = useMemo(() => {
  let activePeriod: Period | string;
  let customPeriodStart: string | undefined;
  let customPeriodEnd: string | undefined;
  
  // Priorité : dateRange > selectedYear > period
  if (dateRange?.from && dateRange?.to) {
    // Période personnalisée active
    activePeriod = 'year'; // Ou un nouveau type 'custom'
    customPeriodStart = dateRange.from.toISOString();
    customPeriodEnd = dateRange.to.toISOString();
  } else if (selectedYear) {
    activePeriod = selectedYear;
  } else {
    activePeriod = period || data.period;
  }
  
  return {
    ...data,
    alerts: filteredAlerts,
    period: activePeriod as Period,
    // Transmettre les dates personnalisées si disponibles
    ...(customPeriodStart && customPeriodEnd && {
      periodStart: customPeriodStart,
      periodEnd: customPeriodEnd,
    }),
  };
}, [/* dépendances */]);
```

### 2. Modifier le type WidgetProps pour accepter periodStart/periodEnd

**Fichier**: `src/types/dashboard-widget-props.ts`

```typescript
export type SupportEvolutionChartWidgetProps = {
  period: Period | string;
  periodStart?: string; // Date de début personnalisée
  periodEnd?: string;   // Date de fin personnalisée
};
```

### 3. Transmettre periodStart/periodEnd au widget

**Fichier**: `src/components/dashboard/widgets/registry.ts`

```typescript
supportEvolutionChart: (data) => {
  return {
    period: data.period,
    ...(data.periodStart && data.periodEnd && {
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    }),
  };
},
```

### 4. Utiliser les dates personnalisées dans le widget

**Fichier**: `src/components/dashboard/manager/support-evolution-chart-server-v2.tsx`

```typescript
type SupportEvolutionChartServerV2Props = {
  period: Period | string;
  periodStart?: string; // Nouveau
  periodEnd?: string;   // Nouveau
};

// Dans loadData :
const result = await getSupportEvolutionDataAction({
  period: globalPeriod.toString(),
  periodStart: periodStart, // Nouveau
  periodEnd: periodEnd,     // Nouveau
  dimensions: localFilters.selectedDimensions,
  agents: localFilters.selectedAgents.length > 0 ? localFilters.selectedAgents : undefined,
});
```

### 5. Modifier le service pour utiliser les dates personnalisées

**Fichier**: `src/services/dashboard/support-evolution-data-v2.ts`

```typescript
export async function getSupportEvolutionDataV2(
  period: Period | string,
  dimensions?: SupportDimension[],
  agents?: string[],
  customStart?: string,  // Nouveau
  customEnd?: string     // Nouveau
): Promise<SupportEvolutionData> {
  let start: Date;
  let end: Date;
  
  // Utiliser les dates personnalisées si fournies
  if (customStart && customEnd) {
    start = new Date(customStart);
    end = new Date(customEnd);
  } else {
    // Sinon, calculer selon la période
    const dates = getPeriodDates(period);
    start = dates.start;
    end = dates.end;
  }
  
  // Générer les dates pour le graphique
  const dateRange = generateDateRange(period, start, end);
  // ...
}
```

### 6. Modifier generateDateRange pour respecter les dates personnalisées

**Fichier**: `src/services/dashboard/support-evolution-data-v2.ts`

Modifier la fonction pour générer les dates uniquement dans la plage `start` à `end`, même pour les années :

```typescript
function generateDateRange(period: Period | string, start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  
  // Pour les périodes personnalisées ou années, générer par mois entre start et end
  if (typeof period === 'string' && /^\d{4}$/.test(period)) {
    // Pour une année, mais avec dates personnalisées, générer uniquement les mois dans la plage
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const year = start.getFullYear();
    
    // Générer uniquement les mois entre start et end
    let month = startMonth;
    while (month <= endMonth) {
      dates.push(new Date(year, month, 1).toISOString().split('T')[0]);
      month++;
    }
    return dates;
  }
  
  // ... reste du code
}
```

---

## 🎯 Résultat Attendu

Quand l'utilisateur sélectionne "02 sept. 2025 - 02 déc. 2025" :
- ✅ Le graphique affiche uniquement les mois : **septembre, octobre, novembre, décembre**
- ✅ Les données sont filtrées pour cette période
- ✅ L'axe X (abscisse) n'affiche que ces 4 mois

---

## 📝 Fichiers à Modifier

1. ✅ `src/components/dashboard/unified-dashboard-with-widgets.tsx` - Transmettre periodStart/periodEnd
2. ✅ `src/types/dashboard-widget-props.ts` - Ajouter periodStart/periodEnd aux props
3. ✅ `src/components/dashboard/widgets/registry.ts` - Mapper periodStart/periodEnd
4. ✅ `src/components/dashboard/manager/support-evolution-chart-server-v2.tsx` - Recevoir et utiliser periodStart/periodEnd
5. ✅ `src/app/actions/dashboard.ts` - Accepter periodStart/periodEnd dans l'action
6. ✅ `src/services/dashboard/support-evolution-data-v2.ts` - Utiliser les dates personnalisées

---

**Prochaine étape** : Implémenter la solution pour corriger ce bug.

