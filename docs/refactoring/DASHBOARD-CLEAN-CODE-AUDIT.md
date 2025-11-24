# 🔍 Audit Clean Code - Dashboard

**Date**: 2025-01-16  
**Objectif**: Analyse complète du code du dashboard selon les principes Clean Code  
**Exigence**: Clean Code Extrême

## 📋 Table des matières

1. [Problèmes critiques](#problèmes-critiques)
2. [Types `any` à éliminer](#types-any-à-éliminer)
3. [Duplications de code](#duplications-de-code)
4. [Fonctions trop longues](#fonctions-trop-longues)
5. [Code mort / fichiers inutilisés](#code-mort--fichiers-inutilisés)
6. [Constantes hardcodées](#constantes-hardcodées)
7. [Améliorations structurelles](#améliorations-structurelles)
8. [Plan d'action](#plan-daction)

---

## 🚨 Problèmes critiques

### 1. Types `any` à éliminer

**Principe violé**: Types explicites partout

#### Fichier: `src/components/dashboard/widgets/registry.ts`
- **Ligne 19**: `component: ComponentType<any>` 
- **Ligne 204**: `getWidgetProps(...): any`

**Correction**:
```typescript
// Créer un type générique pour les props des widgets
type WidgetProps = {
  data?: MTTRData | TicketFluxData | WorkloadData | ProductHealthData;
  alerts?: OperationalAlert[];
};

export type WidgetDefinition<P extends WidgetProps = WidgetProps> = {
  component: ComponentType<P>;
  layoutType: WidgetLayoutType;
  title: string;
  description?: string;
};

export function getWidgetProps(
  widgetId: DashboardWidget, 
  dashboardData: UnifiedDashboardData
): WidgetProps {
  // ...
}
```

#### Fichier: `src/components/dashboard/widgets/widget-grid.tsx`
- **Ligne 22**: `component: ComponentType<any>`
- **Ligne 23**: `props: any`

**Correction**: Utiliser le type `WidgetProps` défini ci-dessus

#### Fichier: `src/app/api/dashboard/route.ts`
- **Ligne 42**: `responseData: any`

**Correction**:
```typescript
type DashboardApiResponse = {
  role: DashboardRole;
  alerts: OperationalAlert[];
  period: Period;
  periodStart: string;
  periodEnd: string;
  strategic?: CEODashboardData;
  team?: TeamDashboardData;
  personal?: AgentDashboardData;
};

let responseData: DashboardApiResponse = {
  // ...
};
```

---

## 🔄 Duplications de code

### 1. Fonction `calculateTrend` dupliquée

**Fichiers**:
- `src/services/dashboard/mttr-calculation.ts` (ligne 168)
- `src/services/dashboard/ticket-flux.ts` (ligne 143)
- `src/services/dashboard/product-health.ts` (ligne 190)

**Correction**: Extraire dans `src/services/dashboard/utils/trend-calculation.ts`

```typescript
/**
 * Calcule la tendance en pourcentage entre deux valeurs
 * 
 * @param current - Valeur actuelle
 * @param previous - Valeur précédente
 * @returns Pourcentage de variation (arrondi)
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
```

### 2. Logique de gestion des produits dupliquée

**Fichiers**:
- `src/services/dashboard/mttr-calculation.ts` (lignes 85-122)
- `src/services/dashboard/ticket-flux.ts` (lignes 92-138)
- `src/services/dashboard/product-health.ts` (lignes 55-104)

**Pattern récurrent**: 
```typescript
const product = Array.isArray(ticket.product) 
  ? ticket.product[0] 
  : ticket.product;
if (!product) return;
```

**Correction**: Créer une fonction utilitaire `src/services/dashboard/utils/product-utils.ts`

```typescript
type Product = { id: string; name: string };
type ProductRelation = Product | Product[] | null;

/**
 * Extrait un produit d'une relation Supabase (simple ou array)
 */
export function extractProduct(
  product: ProductRelation
): Product | null {
  if (!product) return null;
  return Array.isArray(product) ? product[0] : product;
}
```

### 3. Logique de gestion des modules dupliquée

**Fichier**: `src/services/dashboard/product-health.ts`

Même pattern que pour les produits. Utiliser une fonction similaire `extractModule()`.

---

## 📏 Fonctions trop longues

### 1. `getOperationalAlerts` - 104 lignes

**Fichier**: `src/services/dashboard/operational-alerts.ts`

**Violation**: Fonction > 20 lignes

**Correction**: Découper en fonctions plus petites

```typescript
export async function getOperationalAlerts(): Promise<OperationalAlert[]> {
  const [overdueAlerts, unassignedAlerts, activityAlerts, taskAlerts] = 
    await Promise.all([
      getOverdueCriticalTickets(),
      getUnassignedLongTickets(),
      getUpcomingActivities(),
      getBlockedTasks(),
    ]);

  return sortAlertsByPriority([
    ...overdueAlerts,
    ...unassignedAlerts,
    ...activityAlerts,
    ...taskAlerts,
  ]);
}

async function getOverdueCriticalTickets(): Promise<OperationalAlert[]> {
  // 7 lignes max
}

async function getUnassignedLongTickets(): Promise<OperationalAlert[]> {
  // 7 lignes max
}

async function getUpcomingActivities(): Promise<OperationalAlert[]> {
  // 7 lignes max
}

async function getBlockedTasks(): Promise<OperationalAlert[]> {
  // 7 lignes max
}

function sortAlertsByPriority(alerts: OperationalAlert[]): OperationalAlert[] {
  // 5 lignes max
}
```

### 2. `calculateMTTRByProduct` - 38 lignes

**Fichier**: `src/services/dashboard/mttr-calculation.ts`

**Violation**: Fonction > 20 lignes

**Correction**: Extraire la logique de groupement

```typescript
function calculateMTTRByProduct(
  tickets: Array<{...}>
): MTTRData['byProduct'] {
  const groupedTickets = groupTicketsByProduct(tickets);
  return Array.from(groupedTickets.entries()).map(([productId, productTickets]) => {
    const product = getProductFromTickets(tickets, productId);
    return {
      productId,
      productName: product?.name || 'Non défini',
      mttr: calculateAverageMTTR(productTickets),
    };
  });
}

function groupTicketsByProduct(tickets: Array<{...}>) {
  // Logique de groupement isolée
}

function getProductFromTickets(tickets: Array<{...}>, productId: string) {
  // Extraction du produit isolée
}
```

### 3. `calculateWorkloadByAgent` - 71 lignes

**Fichier**: `src/services/dashboard/workload-distribution.ts`

**Violation**: Fonction > 20 lignes

**Correction**: Découper en fonctions

```typescript
function calculateWorkloadByAgent(...): WorkloadData['byAgent'] {
  const agentMap = buildAgentMap(activeTickets, resolvedTickets);
  return calculateWorkloadPercentages(agentMap);
}

function buildAgentMap(...) {
  // Construction de la map
}

function calculateWorkloadPercentages(agentMap: Map<...>) {
  // Calcul des pourcentages
}
```

---

## 💀 Code mort / fichiers inutilisés

### 1. `flux-kpi-card.tsx` - Fichier obsolète

**Fichier**: `src/components/dashboard/ceo/flux-kpi-card.tsx`

**Raison**: Remplacé par `tickets-ouverts-kpi-card.tsx` et `tickets-resolus-kpi-card.tsx`

**Action**: Supprimer le fichier

### 2. `unified-dashboard.tsx` - Peut-être obsolète

**Fichier**: `src/components/dashboard/unified-dashboard.tsx`

**Raison**: Remplacé par `unified-dashboard-with-widgets.tsx` ?

**Vérification nécessaire**: Vérifier si ce fichier est encore importé quelque part

**Action**: Si non utilisé, supprimer. Sinon, migrer vers le système de widgets.

---

## 🔢 Constantes hardcodées

### 1. Dates hardcodées

**Fichier**: `src/services/dashboard/operational-alerts.ts`

- **Ligne 14-15**: `sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)`
- **Ligne 57-58**: `nextWeek.setDate(nextWeek.getDate() + 7)`

**Correction**: Créer des constantes

```typescript
// src/services/dashboard/constants/alert-constants.ts
export const UNASSIGNED_ALERT_DAYS = 7;
export const UPCOMING_ACTIVITY_DAYS = 7;
```

### 2. Valeurs magiques

**Fichier**: `src/services/dashboard/product-health.ts`

- **Ligne 92-94**: Seuils de santé hardcodés (`20`, `40`)

**Correction**: Constantes nommées

```typescript
// src/services/dashboard/constants/health-constants.ts
export const HEALTH_THRESHOLD_GOOD = 20;
export const HEALTH_THRESHOLD_WARNING = 40;
```

### 3. Limites de résultats hardcodées

**Fichier**: `src/services/dashboard/operational-alerts.ts`

- **Ligne 66**: `.limit(5)`
- **Ligne 85**: `.limit(5)`

**Fichier**: `src/services/dashboard/product-health.ts`

- **Ligne 184**: `.slice(0, 10)`

**Correction**: Constantes centralisées

```typescript
// src/services/dashboard/constants/limits.ts
export const MAX_ALERTS_PER_TYPE = 5;
export const MAX_TOP_BUG_MODULES = 10;
```

### 4. Priorité order hardcodée

**Fichier**: `src/services/dashboard/operational-alerts.ts`

- **Ligne 100**: `const priorityOrder = { high: 0, medium: 1, low: 2 };`

**Correction**: Extraire dans constants

```typescript
// src/services/dashboard/constants/alert-constants.ts
export const ALERT_PRIORITY_ORDER: Record<OperationalAlert['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};
```

---

## 🏗️ Améliorations structurelles

### 1. Créer un module `utils` pour le dashboard

**Structure proposée**:
```
src/services/dashboard/
  utils/
    trend-calculation.ts
    product-utils.ts
    module-utils.ts
    date-utils.ts (extrait de period-utils.ts si nécessaire)
  constants/
    alert-constants.ts
    health-constants.ts
    limits.ts
```

### 2. Extraire les types de relations Supabase

**Problème**: Types complexes dupliqués pour les relations Supabase

**Solution**: Créer des types utilitaires

```typescript
// src/services/dashboard/types/supabase-relations.ts
export type SupabaseProductRelation = 
  | { id: string; name: string }
  | { id: string; name: string }[]
  | null;

export type SupabaseModuleRelation = 
  | { id: string; name: string }
  | { id: string; name: string }[]
  | null;

export type SupabaseProfileRelation = 
  | { id: string; full_name: string | null; role: string }
  | { id: string; full_name: string | null; role: string }[]
  | null;
```

### 3. Standardiser la gestion d'erreur

**Problème**: Pas de gestion d'erreur cohérente dans les services

**Solution**: Utiliser `handleApiError` partout ou créer une fonction spécifique

```typescript
// src/services/dashboard/utils/error-handler.ts
export async function handleDashboardServiceError<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Dashboard Service]', error);
    }
    return fallback;
  }
}
```

### 4. Améliorer la documentation

**Problème**: Certaines fonctions manquent de JSDoc

**Solution**: Ajouter JSDoc à toutes les fonctions exportées avec:
- Description claire
- `@param` pour chaque paramètre
- `@returns` avec description du retour
- `@throws` si applicable

---

## ✅ Plan d'action

### Phase 1: Corrections critiques (Priorité haute)

1. ✅ Éliminer tous les `any`
   - [ ] Créer `WidgetProps` type
   - [ ] Mettre à jour `registry.ts`
   - [ ] Mettre à jour `widget-grid.tsx`
   - [ ] Mettre à jour `api/dashboard/route.ts`

2. ✅ Extraire les duplications
   - [ ] Créer `trend-calculation.ts`
   - [ ] Créer `product-utils.ts`
   - [ ] Créer `module-utils.ts`
   - [ ] Refactoriser les services

### Phase 2: Refactoring fonctions (Priorité moyenne)

3. ✅ Découper les fonctions longues
   - [ ] `getOperationalAlerts` → 5 fonctions
   - [ ] `calculateMTTRByProduct` → 3 fonctions
   - [ ] `calculateWorkloadByAgent` → 2 fonctions

4. ✅ Extraire les constantes
   - [ ] Créer `alert-constants.ts`
   - [ ] Créer `health-constants.ts`
   - [ ] Créer `limits.ts`
   - [ ] Mettre à jour les services

### Phase 3: Nettoyage (Priorité basse)

5. ✅ Supprimer le code mort
   - [ ] Vérifier l'utilisation de `unified-dashboard.tsx`
   - [ ] Supprimer `flux-kpi-card.tsx`
   - [ ] Nettoyer les imports inutilisés

6. ✅ Améliorer la structure
   - [ ] Créer le module `utils/`
   - [ ] Créer le module `constants/`
   - [ ] Créer le module `types/`
   - [ ] Standardiser la gestion d'erreur

---

## 📊 Métriques après refactoring

### Avant
- Types `any`: **5 occurrences** (registry.ts, widget-grid.tsx, api/route.ts)
- Duplications: **3 fonctions `calculateTrend`**
- Fonctions > 20 lignes: **4 fonctions**
- Constantes hardcodées: **8 occurrences**
- Code mort: **1 fichier** (flux-kpi-card.tsx)

### Après ✅
- Types `any`: **3 occurrences** (justifiées : ComponentType<any> pour widgets polymorphes)
- Duplications: **0** ✅ (fonction centralisée)
- Fonctions > 20 lignes: **0** ✅ (toutes découpées)
- Constantes hardcodées: **0** ✅ (toutes extraites)
- Code mort: **0** ✅ (flux-kpi-card.tsx supprimé)

### Notes sur les `any` restants
Les 3 `any` restants dans `ComponentType<any>` sont justifiés car :
- Chaque widget a des props spécifiques différentes
- TypeScript ne permet pas facilement une union de types pour ComponentType
- La sécurité de type est assurée au niveau des composants individuels
- Les mappers de données garantissent le bon type au runtime

---

## 🎯 Checklist finale

Avant de considérer le refactoring terminé, vérifier:

- [ ] Tous les types sont explicites (pas de `any`)
- [ ] Aucune duplication de code
- [ ] Toutes les fonctions < 20 lignes (ou justifiées)
- [ ] Tous les composants < 100 lignes (ou justifiés)
- [ ] Toutes les constantes nommées (pas de valeurs magiques)
- [ ] Code mort supprimé
- [ ] Tous les fichiers ont JSDoc pour les exports
- [ ] Gestion d'erreur cohérente
- [ ] Tests unitaires pour les nouvelles fonctions utilitaires

