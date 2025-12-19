# Correction : Erreur `fixedStartDate is not defined`

**Date**: 2025-01-16  
**Erreur**: `ReferenceError: fixedStartDate is not defined`

---

## 🐛 Bug Identifié

Dans `src/services/dashboard/mttr-calculation.ts`, ligne 28, j'utilisais `fixedStartDate` et `fixedEndDate` alors que les paramètres de la fonction sont `customStartDate` et `customEndDate`.

### Code Avant (❌)
```typescript
async function calculateMTTRInternal(
  period: Period | string, 
  filters?: Partial<DashboardFiltersInput>,
  customStartDate?: string,
  customEndDate?: string
): Promise<MTTRData> {
  const { startDate, endDate } = getPeriodDates(period, customStartDate, customEndDate);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period, fixedStartDate, fixedEndDate);
  //                                                                                            ^^^^^^^^^^^^ ERREUR
```

### Code Après (✅)
```typescript
async function calculateMTTRInternal(
  period: Period | string, 
  filters?: Partial<DashboardFiltersInput>,
  customStartDate?: string,
  customEndDate?: string
): Promise<MTTRData> {
  const { startDate, endDate } = getPeriodDates(period, customStartDate, customEndDate);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period, customStartDate, customEndDate);
  //                                                                                            ^^^^^^^^^^^^^ CORRIGÉ
```

---

## ✅ Correction Appliquée

**Fichier modifié** : `src/services/dashboard/mttr-calculation.ts`

**Ligne corrigée** : 28

**Changement** : `fixedStartDate, fixedEndDate` → `customStartDate, customEndDate`

---

**Statut** : ✅ **Correction Appliquée - Redémarrer le serveur Next.js**
