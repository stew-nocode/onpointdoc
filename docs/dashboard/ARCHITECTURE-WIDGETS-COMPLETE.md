# 📊 Architecture Complète des Widgets du Dashboard

Documentation exhaustive de l'architecture des widgets du dashboard OnpointDoc.

---

## 📑 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Système de Layout Flexbox](#système-de-layout-flexbox)
3. [Registre des Widgets](#registre-des-widgets)
4. [Configuration Rôle-Based (Admin)](#configuration-rôle-based-admin)
5. [Système de Filtres Période](#système-de-filtres-période)
6. [Inventaire Complet des 13 Widgets](#inventaire-complet-des-13-widgets)
7. [Flux de Données](#flux-de-données)
8. [Architecture Technique](#architecture-technique)
9. [Optimisations Performance](#optimisations-performance)

---

## Vue d'ensemble

### Architecture Globale

```
┌──────────────────────────────────────────────────────────────────┐
│                   Unified Dashboard                               │
│  (unified-dashboard-with-widgets.tsx)                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Period Selector (Global Filter)                        │   │
│  │  • Week / Month / Quarter / Year                        │   │
│  │  • Custom Date Range                                     │   │
│  │  • Year Selector                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Data Loading (Server Actions & Services)              │   │
│  │  • getCEODashboardData()                               │   │
│  │  • Real-time Supabase subscriptions                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Widget Grid (widget-grid.tsx)                         │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────┐    │   │
│  │  │  KPI Flexbox (.kpi-grid-responsive)          │    │   │
│  │  │  min-width: 280px, flex-wrap                  │    │   │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │    │   │
│  │  │  │ MTTR │ │Ouvrt │ │Résol │ │Workl │        │    │   │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘        │    │   │
│  │  └───────────────────────────────────────────────┘    │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────┐    │   │
│  │  │  Chart Flexbox (.chart-grid-responsive)       │    │   │
│  │  │  min-width: 400px, flex-wrap                  │    │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │    │   │
│  │  │  │Evolution │ │Distribut │ │Support   │     │    │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘     │    │   │
│  │  └───────────────────────────────────────────────┘    │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────┐    │   │
│  │  │  Table Flexbox (.table-grid-responsive)       │    │   │
│  │  │  min-width: 400px, flex-wrap                  │    │   │
│  │  │  ┌──────────┐ ┌──────────┐                   │    │   │
│  │  │  │TopModuls │ │Workload  │                   │    │   │
│  │  │  └──────────┘ └──────────┘                   │    │   │
│  │  └───────────────────────────────────────────────┘    │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────┐    │   │
│  │  │  Full-Width (no flexbox, 100% width)         │    │   │
│  │  │  ┌──────────────────────────────────────┐    │    │   │
│  │  │  │  Operational Alerts (scrollable)     │    │    │   │
│  │  │  └──────────────────────────────────────┘    │    │   │
│  │  └───────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Statistiques Clés

- **13 widgets** au total
- **4 types de layout** : KPI, Chart, Table, Full-Width
- **4 rôles** : Direction, Manager, Agent, Admin
- **5 filtres période** : Week, Month, Quarter, Year, Custom
- **3 sources de données** : Strategic, Team, Personal

---

## Système de Layout Flexbox

### Classes CSS Responsives

**Fichier** : [`src/app/globals.css`](src/app/globals.css)

#### 1. KPI Grid (Cartes petites)

```css
.kpi-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.kpi-grid-responsive > * {
  flex: 1 1 280px;  /* Largeur minimum 280px */
  min-width: 280px;
}
```

**Widgets utilisant ce layout** :
- MTTR (mttr)
- Tickets Ouverts (tickets-ouverts)
- Tickets Résolus (tickets-resolus)
- Workload (workload)
- Health (health)

#### 2. Chart Grid (Graphiques moyens)

```css
.chart-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-grid-responsive > * {
  flex: 1 1 400px;  /* Largeur minimum 400px */
  min-width: 400px;
}
```

**Widgets utilisant ce layout** :
- Évolution MTTR (mttrEvolution)
- Distribution tickets (ticketsDistribution)
- Évolution Support (supportEvolutionChart)
- Répartition par Type (ticketsByTypePieChart)
- Répartition par Entreprise (ticketsByCompanyPieChart)

#### 3. Table Grid (Tableaux moyens)

```css
.table-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-grid-responsive > * {
  flex: 1 1 400px;  /* Largeur minimum 400px */
  min-width: 400px;
}
```

**Widgets utilisant ce layout** :
- Top Modules Bugs (topBugsModules)
- Workload par Agent (workloadByAgent)

#### 4. Full-Width (Alertes)

```css
/* Pas de flexbox, prend 100% de la largeur */
width: 100%;
```

**Widgets utilisant ce layout** :
- Alertes Opérationnelles (alerts)

### Responsive Behavior (Mobile)

```css
@media (max-width: 639px) {
  .kpi-grid-responsive > *,
  .chart-grid-responsive > *,
  .table-grid-responsive > * {
    flex-basis: 100%;
    min-width: 100%;
  }
}
```

**Comportement** :
- **Desktop** : Widgets alignés en grille avec min-width
- **Mobile** : Chaque widget prend 100% de la largeur (colonne unique)

---

## Registre des Widgets

### Widget Registry Pattern

**Fichier** : [`src/components/dashboard/widgets/registry.ts`](src/components/dashboard/widgets/registry.ts)

Le registre centralise la définition de tous les widgets disponibles.

```typescript
export const WIDGET_REGISTRY: Record<DashboardWidget, WidgetDefinition> = {
  mttr: {
    component: MTTRKPICard,
    layoutType: 'kpi',
    title: 'Temps moyen de résolution (MTTR)',
    description: 'Temps moyen nécessaire pour résoudre un ticket',
  },
  // ... 12 autres widgets
};
```

### Type WidgetDefinition

```typescript
type WidgetDefinition = {
  component: ComponentType<any>;      // Composant React du widget
  layoutType: WidgetLayoutType;       // 'kpi' | 'chart' | 'table' | 'full-width'
  title: string;                      // Titre affiché
  description?: string;               // Description (optionnelle)
};
```

### Data Mappers

Le registre contient également les **mappers de données** qui transforment les données brutes du dashboard en props pour chaque widget.

```typescript
export const WIDGET_DATA_MAPPERS: Record<DashboardWidget, WidgetDataMapper> = {
  mttr: (data) => {
    const mttrData = data.strategic?.mttr || data.team?.mttr || DEFAULT_MTTR_DATA;
    return {
      data: mttrData,
      period: data.period, // Période globale propagée
    };
  },
  // ... autres mappers
};
```

**Avantages** :
- Séparation des préoccupations (data vs présentation)
- Centralisation (facile d'ajouter un nouveau widget)
- Type-safety (TypeScript garantit la cohérence)

---

## Configuration Rôle-Based (Admin)

### Panneau de Configuration Admin

**Fichier** : [`src/components/dashboard/admin/dashboard-widgets-config-client.tsx`](src/components/dashboard/admin/dashboard-widgets-config-client.tsx)

#### Interface Admin

```
┌─────────────────────────────────────────────────────────────┐
│  Configuration des Widgets par Rôle                         │
│                                                              │
│  ┌────┐  ┌────────┐  ┌──────┐  ┌──────┐                   │
│  │Dir │  │Manager │  │Agent │  │Admin │  ← Tabs           │
│  └────┘  └────────┘  └──────┘  └──────┘                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  KPI Widgets                                       │   │
│  │  ☑ MTTR                                           │   │
│  │  ☑ Tickets Ouverts                                │   │
│  │  ☑ Tickets Résolus                                │   │
│  │  ☑ Workload                                        │   │
│  │  ☐ Health                                          │   │
│  │                                                     │   │
│  │  Chart Widgets                                     │   │
│  │  ☑ Évolution MTTR                                 │   │
│  │  ☐ Distribution tickets                            │   │
│  │  ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Réinitialiser]  [Sauvegarder Configuration]              │
└─────────────────────────────────────────────────────────────┘
```

#### Fonctionnement

1. **Sélection du rôle** : Admin clique sur un tab (Direction, Manager, Agent, Admin)
2. **Toggle widgets** : Active/désactive les widgets pour ce rôle
3. **Sauvegarde** : Enregistre la configuration dans la table `dashboard_widgets_role_config`

```typescript
const toggleWidget = (role: DashboardRole, widgetId: DashboardWidget) => {
  setRoleWidgets((prev) =>
    prev.map((rw) => {
      if (rw.role !== role) return rw;
      const hasWidget = rw.widgets.includes(widgetId);
      return {
        ...rw,
        widgets: hasWidget
          ? rw.widgets.filter((w) => w !== widgetId)  // Retirer
          : [...rw.widgets, widgetId],                // Ajouter
      };
    })
  );
};
```

### Configuration par Défaut

**Fichier** : [`src/services/dashboard/widgets/default-widgets.ts`](src/services/dashboard/widgets/default-widgets.ts)

```typescript
export const DEFAULT_ROLE_WIDGETS: Record<DashboardRole, DashboardWidget[]> = {
  direction: [
    'mttr',
    'tickets-ouverts',
    'tickets-resolus',
    'workload',
    'health',
    'mttrEvolution',
    'ticketsDistribution',
    'topBugsModules',
    'workloadByAgent',
    'alerts',
  ],
  manager: [
    'mttr',
    'tickets-ouverts',
    'tickets-resolus',
    'workload',
    'mttrEvolution',
    'ticketsDistribution',
    'supportEvolutionChart',
    'workloadByAgent',
    'alerts',
  ],
  agent: ['alerts'], // Agents : uniquement les alertes
  admin: [
    // Tous les widgets disponibles
    'mttr',
    'tickets-ouverts',
    'tickets-resolus',
    'workload',
    'health',
    'mttrEvolution',
    'ticketsDistribution',
    'supportEvolutionChart',
    'ticketsByTypePieChart',
    'ticketsByCompanyPieChart',
    'topBugsModules',
    'workloadByAgent',
    'alerts',
  ],
};
```

### Stockage en Base de Données

**Table** : `dashboard_widgets_role_config`

```sql
CREATE TABLE dashboard_widgets_role_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL UNIQUE CHECK (role IN ('direction', 'manager', 'agent', 'admin')),
  widgets TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);
```

---

## Système de Filtres Période

### Period Selector (Filtre Global)

**Fichier** : [`src/components/dashboard/ceo/period-selector.tsx`](src/components/dashboard/ceo/period-selector.tsx)

#### Types de Période

```typescript
export type Period = 'week' | 'month' | 'quarter' | 'year';
```

#### Interface Utilisateur

```
┌─────────────────────────────────────────────────────────┐
│  📅 Période                                             │
│                                                          │
│  [Semaine] [Mois] [Trimestre] [Année]  ← Boutons       │
│                                                          │
│  [Plage personnalisée] ← Custom Date Range              │
│  Du: [2025-01-01]  Au: [2025-12-31]                    │
│                                                          │
│  [Sélecteur Année: 2025 ▼] ← Year Selector             │
└─────────────────────────────────────────────────────────┘
```

### Propagation de la Période

**Fichier** : [`src/components/dashboard/unified-dashboard-with-widgets.tsx`](src/components/dashboard/unified-dashboard-with-widgets.tsx)

```typescript
const handlePeriodChange = useCallback((newPeriod: Period) => {
  setPeriod(newPeriod);
  loadData(newPeriod);  // Recharge toutes les données
}, [loadData]);
```

**Flux** :
1. User sélectionne "Mois"
2. `handlePeriodChange('month')` est appelé
3. `loadData('month')` recharge les données
4. Les données sont passées à `widget-grid.tsx`
5. Chaque widget reçoit `period: 'month'` dans ses props
6. Les widgets se mettent à jour automatiquement

### Custom Date Range

```typescript
const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
  setSelectedYear(undefined);
  setDateRange(range);
  if (range?.from && range?.to) {
    setPeriod('year');
    loadData('year', range.from.toISOString(), range.to.toISOString());
  }
}, [loadData]);
```

**Exemple** :
- User sélectionne : Du 01/01/2025 au 30/06/2025
- Les données sont chargées pour cette période spécifique
- Tous les widgets affichent les données de ce semestre personnalisé

---

## Inventaire Complet des 13 Widgets

### 1. MTTR (Mean Time To Resolution)

**ID** : `mttr`
**Type** : `kpi`
**Fichier** : [`src/components/dashboard/ceo/mttr-kpi-card.tsx`](src/components/dashboard/ceo/mttr-kpi-card.tsx)

**Description** : Temps moyen de résolution des tickets en jours

**Données affichées** :
- Valeur globale (ex: 3.5j)
- Tendance vs période précédente (ex: -12%)
- Interprétation : Moins de temps = positif (vert)

**Logique** :
```typescript
const trendIsPositive = data.trend <= 0; // Moins de temps = positif
```

**Source de données** : `data.strategic?.mttr || data.team?.mttr`

**Services** : [`src/services/dashboard/mttr-calculation.ts`](src/services/dashboard/mttr-calculation.ts)

---

### 2. Tickets Ouverts

**ID** : `tickets-ouverts`
**Type** : `kpi`
**Fichier** : [`src/components/dashboard/ceo/tickets-ouverts-kpi-card.tsx`](src/components/dashboard/ceo/tickets-ouverts-kpi-card.tsx)

**Description** : Nombre de tickets créés sur la période

**Données affichées** :
- Nombre de tickets ouverts (ex: 142)
- Tendance vs période précédente (ex: +5%)
- Interprétation : Moins d'ouverts = positif (vert)

**Logique** :
```typescript
const openedTrendIsPositive = data.trend.openedTrend <= 0; // Moins d'ouverts = positif
```

**Source de données** : `data.strategic?.flux || data.team?.flux`

**Services** : [`src/services/dashboard/ticket-flux.ts`](src/services/dashboard/ticket-flux.ts)

---

### 3. Tickets Résolus

**ID** : `tickets-resolus`
**Type** : `kpi`
**Fichier** : [`src/components/dashboard/ceo/tickets-resolus-kpi-card.tsx`](src/components/dashboard/ceo/tickets-resolus-kpi-card.tsx)

**Description** : Nombre de tickets résolus sur la période avec taux de résolution

**Données affichées** :
- Nombre de tickets résolus (ex: 128)
- Taux de résolution (ex: 90.1%)
- Tendance vs période précédente (ex: +8%)
- Interprétation : Plus de résolus = positif (vert)

**Logique** :
```typescript
const resolvedTrendIsPositive = data.trend.resolvedTrend >= 0; // Plus de résolus = positif
```

**Source de données** : `data.strategic?.flux || data.team?.flux`

---

### 4. Workload (Charge de travail)

**ID** : `workload`
**Type** : `kpi`
**Fichier** : [`src/components/dashboard/ceo/workload-kpi-card.tsx`](src/components/dashboard/ceo/workload-kpi-card.tsx)

**Description** : Répartition de la charge par équipe et agent

**Données affichées** :
- Nombre total de tickets actifs (ex: 56)
- Répartition par équipe (Support: 32, IT: 18, Marketing: 6)
- Barre de progression visuelle par équipe

**Source de données** : `data.strategic?.workload || data.team?.workload`

**Services** : [`src/services/dashboard/workload-distribution.ts`](src/services/dashboard/workload-distribution.ts)

---

### 5. Health (Santé des produits)

**ID** : `health`
**Type** : `kpi`
**Fichier** : [`src/components/dashboard/ceo/health-kpi-card.tsx`](src/components/dashboard/ceo/health-kpi-card.tsx)

**Description** : Taux de bugs et modules les plus affectés

**Données affichées** :
- Statut de santé par produit (Good, Warning, Critical)
- Taux de bugs (ex: OBC: 15%, SNI: 8%)
- Nombre de bugs par produit

**Logique** :
```typescript
healthStatus: bugRate >= 30 ? 'critical' : bugRate >= 15 ? 'warning' : 'good'
```

**Source de données** : `data.strategic?.health || data.team?.health`

**Services** : [`src/services/dashboard/product-health.ts`](src/services/dashboard/product-health.ts)

---

### 6. Alertes Opérationnelles

**ID** : `alerts`
**Type** : `full-width`
**Fichier** : [`src/components/dashboard/ceo/operational-alerts-section.tsx`](src/components/dashboard/ceo/operational-alerts-section.tsx)

**Description** : Alertes critiques nécessitant une attention immédiate

**Types d'alertes** :
- `overdue_critical` : Tickets critiques en retard
- `unassigned_long` : Tickets non assignés depuis longtemps
- `upcoming_activity` : Activités à venir
- `blocked_task` : Tâches bloquées

**Données affichées** :
- Liste scrollable (5 items visibles, scroll pour plus)
- Badge de priorité (High, Medium, Low)
- Icônes par type (Clock, UserX, Calendar, Ban)

**Comportement scrollable** :
```typescript
const ALERT_ITEM_HEIGHT = 65;
const ITEMS_VISIBLE = 5;
const SCROLLABLE_HEIGHT = ALERT_ITEM_HEIGHT * ITEMS_VISIBLE + GAP_HEIGHT * (ITEMS_VISIBLE - 1);
```

**Source de données** : `data.alerts`

**Services** : [`src/services/dashboard/operational-alerts.ts`](src/services/dashboard/operational-alerts.ts)

---

### 7. Évolution MTTR

**ID** : `mttrEvolution`
**Type** : `chart`
**Fichier** : [`src/components/dashboard/ceo/mttr-evolution-chart.tsx`](src/components/dashboard/ceo/mttr-evolution-chart.tsx)

**Description** : Tendance du temps moyen de résolution par produit

**Visualisation** : AreaChart (Recharts)

**Données affichées** :
- Courbe d'évolution MTTR par produit
- Tendance globale (flèche + pourcentage)
- Axe Y : Jours
- Axe X : Produits (OBC, SNI, CF)

**Optimisations** :
```typescript
const chartData = useMemo(() => transformMTTRData(data), [data?.byProduct]);
```

**Source de données** : `data.strategic?.mttr.byProduct || data.team?.mttr.byProduct`

---

### 8. Distribution des Tickets

**ID** : `ticketsDistribution`
**Type** : `chart`
**Fichier** : [`src/components/dashboard/ceo/tickets-distribution-chart.tsx`](src/components/dashboard/ceo/tickets-distribution-chart.tsx)

**Description** : Répartition des tickets par type (BUG/REQ/ASSISTANCE)

**Visualisation** : BarChart (Recharts)

**Données affichées** :
- Tickets ouverts par type
- Tickets résolus par type
- Comparaison visuelle (barres côte à côte)

**Source de données** : `data.strategic?.flux || data.team?.flux`

---

### 9. Top Modules avec Bugs

**ID** : `topBugsModules`
**Type** : `table`
**Fichier** : [`src/components/dashboard/ceo/top-bugs-modules-table.tsx`](src/components/dashboard/ceo/top-bugs-modules-table.tsx)

**Description** : Modules les plus affectés par des bugs avec taux et tendances

**Colonnes du tableau** :
1. **Module** : Nom du module (tronqué si trop long)
2. **Bug signalé** : Nombre de bugs signalés (badge rouge)
3. **% Critique** : Pourcentage de bugs critiques
4. **Ouvert** : Bugs ouverts
5. **Résolu** : Bugs résolus
6. **Taux résolution** : Pourcentage de résolution

**Métriques avec tendances** :
- Chaque métrique affiche une flèche (↑/↓) et un pourcentage de variation
- Couleur : Rouge (augmentation), Vert (diminution), Gris (stable)

**Optimisations** :
- React.memo avec comparaison personnalisée `areModulePropsEqual`
- useMemo pour les calculs de couleurs de tendance

**Source de données** : `data.strategic?.health.topBugModules || data.team?.health.topBugModules`

---

### 10. Workload par Agent

**ID** : `workloadByAgent`
**Type** : `table`
**Fichier** : [`src/components/dashboard/ceo/workload-by-agent-table.tsx`](src/components/dashboard/ceo/workload-by-agent-table.tsx)

**Description** : Détails de la charge de travail par agent

**Colonnes du tableau** :
1. **Agent** : Nom de l'agent
2. **Équipe** : Support / IT / Marketing
3. **Tickets actifs** : Nombre de tickets en cours
4. **Résolus période** : Tickets résolus sur la période
5. **Charge** : Barre de progression visuelle (%)

**Logique de couleur** :
```typescript
workloadPercent >= 80 ? 'bg-red-500' :
workloadPercent >= 60 ? 'bg-orange-500' :
'bg-green-500'
```

**Source de données** : `data.strategic?.workload.byAgent || data.team?.workload.byAgent`

---

### 11. Évolution Performance Support

**ID** : `supportEvolutionChart`
**Type** : `chart`
**Fichier** : [`src/components/dashboard/manager/support-evolution-chart-server-v2.tsx`](src/components/dashboard/manager/support-evolution-chart-server-v2.tsx)

**Description** : Tendances globales par dimension (BUG, REQ, ASSISTANCE, Temps d'assistance) avec filtres personnalisables

**Visualisation** : LineChart (Recharts) avec multi-lignes

**Filtres intégrés** :
1. **Filtres agents** : Multi-select pour filtrer par agents Support
2. **Filtres dimensions** : Toggle BUG / REQ / ASSISTANCE / Temps assistance

**Données affichées** :
- Évolution temporelle (par semaine/mois)
- 4 dimensions en parallèle (courbes colorées)
- Légende scrollable

**Chargement des données** :
- Via Server Action : `getSupportEvolutionDataAction()`
- Debouncing 300ms pour éviter trop de requêtes
- useTransition pour mises à jour non-bloquantes

**Source de données** : API route `/api/dashboard/support-evolution-v2`

**Services** : [`src/services/dashboard/support-evolution-data-v2.ts`](src/services/dashboard/support-evolution-data-v2.ts)

---

### 12. Répartition par Type

**ID** : `ticketsByTypePieChart`
**Type** : `chart`
**Fichier** : [`src/components/dashboard/manager/tickets-by-type-pie-chart-server.tsx`](src/components/dashboard/manager/tickets-by-type-pie-chart-server.tsx)

**Description** : Répartition des tickets créés par type (BUG, REQ, ASSISTANCE) avec filtre par agent Support

**Visualisation** : PieChart (Recharts)

**Filtres intégrés** :
- Multi-select agents Support
- Filtre la répartition selon les agents sélectionnés

**Données affichées** :
- Pourcentage par type
- Nombre de tickets par type
- Couleurs distinctes par type

**Chargement des données** :
- Via Server Action : `getTicketsByTypeDistributionAction()`
- useTransition pour mises à jour non-bloquantes

**Source de données** : Server Action

**Services** : [`src/services/dashboard/tickets-by-type-distribution.ts`](src/services/dashboard/tickets-by-type-distribution.ts)

---

### 13. Répartition par Entreprise

**ID** : `ticketsByCompanyPieChart`
**Type** : `chart`
**Fichier** : [`src/components/dashboard/manager/tickets-by-company-pie-chart-server.tsx`](src/components/dashboard/manager/tickets-by-company-pie-chart-server.tsx)

**Description** : Répartition des tickets créés par entreprise avec filtre par type de ticket

**Visualisation** : PieChart (Recharts) avec légende scrollable

**Filtres intégrés** :
- Toggle type de ticket : BUG / REQ / ASSISTANCE
- Filtre la répartition selon le type sélectionné

**Données affichées** :
- Pourcentage par entreprise
- Nombre de tickets par entreprise
- Légende scrollable (limite 5 items visibles)

**Comportement scrollable** :
```typescript
const LEGEND_ITEM_HEIGHT = 32;
const ITEMS_VISIBLE = 5;
const SCROLLABLE_HEIGHT = LEGEND_ITEM_HEIGHT * ITEMS_VISIBLE;
```

**Chargement des données** :
- Via Server Action : `getTicketsByCompanyDistributionAction()`
- useTransition pour mises à jour non-bloquantes

**Source de données** : Server Action

**Services** : [`src/services/dashboard/tickets-by-company-distribution.ts`](src/services/dashboard/tickets-by-company-distribution.ts)

---

## Flux de Données

### Architecture de Chargement

```
┌────────────────────────────────────────────────────────────┐
│  1. User Interaction                                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Period Selector: User clique "Mois"                 │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  2. Event Handler (unified-dashboard-with-widgets.tsx)     │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  handlePeriodChange('month')                         │ │
│  │  ↓                                                    │ │
│  │  loadData('month')                                   │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  3. Data Services (src/services/dashboard/)                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  getCEODashboardData(period, filters)               │ │
│  │  ↓                                                    │ │
│  │  Promise.all([                                       │ │
│  │    calculateMTTR(),                                  │ │
│  │    getTicketFlux(),                                  │ │
│  │    getWorkloadDistribution(),                        │ │
│  │    getProductHealth(),                               │ │
│  │    getOperationalAlerts()                            │ │
│  │  ])                                                  │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  4. Supabase Database Queries                              │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  SELECT ... FROM tickets                             │ │
│  │  WHERE created_at BETWEEN ... AND ...               │ │
│  │  AND status = ...                                    │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  5. Data Processing & Aggregation                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  • Calcul MTTR global et par produit                │ │
│  │  • Calcul taux de résolution                         │ │
│  │  • Calcul tendances (vs période précédente)         │ │
│  │  • Agrégation par module/agent/équipe               │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  6. UnifiedDashboardData                                   │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  {                                                   │ │
│  │    role: 'direction',                               │ │
│  │    strategic: { mttr, flux, workload, health },     │ │
│  │    alerts: [...],                                   │ │
│  │    period: 'month',                                  │ │
│  │    periodStart: '2025-01-01',                       │ │
│  │    periodEnd: '2025-01-31'                          │ │
│  │  }                                                   │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  7. Widget Grid (widget-grid.tsx)                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  const groupedWidgets = useMemo(() => {             │ │
│  │    const groups = { kpi: [], chart: [], ... };      │ │
│  │    widgets.forEach((widgetId) => {                  │ │
│  │      const widgetDef = WIDGET_REGISTRY[widgetId];   │ │
│  │      const props = getWidgetProps(widgetId, data);  │ │
│  │      groups[widgetDef.layoutType].push(...);        │ │
│  │    });                                               │ │
│  │    return groups;                                    │ │
│  │  }, [widgets, dashboardData]);                      │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────┐
│  8. Widget Rendering                                       │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  <div className="kpi-grid-responsive">              │ │
│  │    <MTTRKPICard data={...} period="month" />        │ │
│  │    <TicketsOuvertsKPICard data={...} />             │ │
│  │    ...                                               │ │
│  │  </div>                                              │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Real-time Updates (Supabase Subscriptions)

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('tickets-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tickets' },
      (payload) => {
        console.log('Ticket changed:', payload);
        loadData(period); // Recharge les données
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [period, loadData]);
```

**Événements écoutés** :
- INSERT : Nouveau ticket créé
- UPDATE : Ticket modifié (résolu, assigné, etc.)
- DELETE : Ticket supprimé

**Comportement** : Le dashboard se met à jour automatiquement en temps réel

---

## Architecture Technique

### Composants Principaux

```
src/
├── components/
│   └── dashboard/
│       ├── unified-dashboard-with-widgets.tsx  ← Dashboard principal
│       ├── widgets/
│       │   ├── widget-grid.tsx                 ← Layout des widgets
│       │   └── registry.ts                     ← Registre centralisé
│       ├── ceo/
│       │   ├── mttr-kpi-card.tsx              ← Widget MTTR
│       │   ├── tickets-ouverts-kpi-card.tsx   ← Widget Tickets Ouverts
│       │   ├── operational-alerts-section.tsx  ← Widget Alertes
│       │   ├── period-selector.tsx             ← Sélecteur période
│       │   └── ...                             ← Autres widgets CEO
│       ├── manager/
│       │   ├── support-evolution-chart-server-v2.tsx
│       │   ├── tickets-by-type-pie-chart-server.tsx
│       │   └── tickets-by-company-pie-chart-server.tsx
│       └── admin/
│           └── dashboard-widgets-config-client.tsx ← Config admin
├── services/
│   └── dashboard/
│       ├── ceo-kpis.ts                         ← Service principal
│       ├── mttr-calculation.ts                 ← Calcul MTTR
│       ├── ticket-flux.ts                      ← Calcul flux tickets
│       ├── workload-distribution.ts            ← Calcul charge
│       ├── product-health.ts                   ← Calcul santé produits
│       ├── operational-alerts.ts               ← Génération alertes
│       └── widgets/
│           ├── role-widgets.ts                 ← Gestion widgets rôle
│           ├── default-widgets.ts              ← Widgets par défaut
│           └── user-config.ts                  ← Config utilisateur
└── types/
    ├── dashboard.ts                            ← Types dashboard
    ├── dashboard-widgets.ts                    ← Types widgets
    └── dashboard-widget-props.ts               ← Types props widgets
```

### Patterns Utilisés

#### 1. Registry Pattern

**Avantages** :
- Centralisation de la configuration des widgets
- Facilite l'ajout de nouveaux widgets
- Type-safety garantie par TypeScript

**Exemple** :
```typescript
// Ajouter un nouveau widget en 3 étapes :

// 1. Créer le composant
export function NewWidget({ data }: NewWidgetProps) {
  return <Card>...</Card>;
}

// 2. Ajouter au registre
export const WIDGET_REGISTRY = {
  // ... widgets existants
  newWidget: {
    component: NewWidget,
    layoutType: 'chart',
    title: 'Nouveau Widget',
  },
};

// 3. Ajouter le mapper de données
export const WIDGET_DATA_MAPPERS = {
  // ... mappers existants
  newWidget: (data) => ({ data: data.strategic?.newData }),
};
```

#### 2. Flexbox Grid Layout

**Avantages** :
- Responsive automatique (wrap sur mobile)
- Cohérence visuelle maintenue quand un widget est désactivé
- Pas de grilles CSS Grid complexes

#### 3. Server Actions (Next.js 16)

**Widgets utilisant Server Actions** :
- Support Evolution Chart V2
- Tickets by Type Pie Chart
- Tickets by Company Pie Chart

**Avantages** :
- Chargement côté serveur (pas d'exposition de données sensibles)
- Streaming optimisé
- Cache automatique

**Exemple** :
```typescript
'use server';

export async function getSupportEvolutionDataAction(params: {
  period: string;
  dimensions: SupportDimension[];
  agents?: string[];
}): Promise<SupportEvolutionData> {
  const data = await getSupportEvolutionDataV2(params);
  return data;
}
```

#### 4. React Performance Optimizations

**useMemo pour mémorisation** :
```typescript
const chartData = useMemo(() => {
  return transformMTTRData(data);
}, [data?.byProduct]); // Recalculer seulement si byProduct change
```

**React.memo pour éviter re-renders** :
```typescript
const TopBugsModuleRow = memo(function TopBugsModuleRow({ module }) {
  // ...
}, areModulePropsEqual); // Comparaison personnalisée
```

**useTransition pour mises à jour non-bloquantes** :
```typescript
const [isPending, startTransition] = useTransition();

startTransition(() => {
  loadData();
});
```

**Debouncing pour éviter trop de requêtes** :
```typescript
const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

debounceTimerRef.current = setTimeout(() => {
  startTransition(() => {
    loadData();
  });
}, 300);
```

---

## Optimisations Performance

### 1. Lazy Loading des Widgets

Les widgets sont chargés dynamiquement selon le rôle de l'utilisateur :

```typescript
// Seuls les widgets activés pour le rôle sont chargés
const userWidgets = await getUserWidgets(userId);
```

### 2. Memoization Agressive

**Memoization des données transformées** :
```typescript
const chartData = useMemo(() => transformMTTRData(data), [data?.byProduct]);
```

**Memoization des composants** :
```typescript
const MemoizedWidget = memo(Widget, arePropsEqual);
```

### 3. Real-time Updates Optimisés

**Subscription Supabase avec debouncing** :
```typescript
let timeout: NodeJS.Timeout;

.on('postgres_changes', ..., (payload) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => loadData(), 500); // Debounce 500ms
})
```

### 4. Code Splitting

Les widgets Manager sont chargés uniquement si le rôle est "manager" ou "admin" :

```typescript
if (role === 'manager' || role === 'admin') {
  const { SupportEvolutionChartServerV2 } = await import('./manager/...');
}
```

### 5. Calculs de Tendance Optimisés

**Service** : [`src/services/dashboard/utils/trend-calculation.ts`](src/services/dashboard/utils/trend-calculation.ts)

Calcule les tendances en une seule passe (pas de double requête) :

```typescript
// Au lieu de :
const currentPeriodData = await getTickets(startDate, endDate);
const previousPeriodData = await getTickets(prevStartDate, prevEndDate);

// On fait :
const allData = await getTickets(prevStartDate, endDate);
// Puis on sépare en mémoire
```

---

## Points d'Extension

### Ajouter un Nouveau Widget

**Étapes** :

1. **Créer le composant widget** dans `src/components/dashboard/ceo/` ou `manager/`
   ```typescript
   export function NewMetricCard({ data }: NewMetricCardProps) {
     return <KPICard title="New Metric" value={data.value} />;
   }
   ```

2. **Ajouter le type** dans `src/types/dashboard-widgets.ts`
   ```typescript
   export type DashboardWidget =
     | 'mttr'
     | 'tickets-ouverts'
     | 'newMetric' // ← Nouveau
     | ...;
   ```

3. **Enregistrer dans le registre** (`registry.ts`)
   ```typescript
   export const WIDGET_REGISTRY = {
     // ...
     newMetric: {
       component: NewMetricCard,
       layoutType: 'kpi',
       title: 'Nouvelle Métrique',
     },
   };
   ```

4. **Ajouter le mapper de données** (`registry.ts`)
   ```typescript
   export const WIDGET_DATA_MAPPERS = {
     // ...
     newMetric: (data) => ({
       data: data.strategic?.newMetric,
       period: data.period
     }),
   };
   ```

5. **Ajouter aux widgets par défaut** (`default-widgets.ts`)
   ```typescript
   export const DEFAULT_ROLE_WIDGETS = {
     direction: [..., 'newMetric'],
     admin: [..., 'newMetric'],
   };
   ```

6. **Créer le service de données** dans `src/services/dashboard/`
   ```typescript
   export async function getNewMetric(period: Period): Promise<NewMetricData> {
     // Logique de calcul
   }
   ```

7. **Intégrer dans getCEODashboardData** (`ceo-kpis.ts`)
   ```typescript
   const [mttr, flux, ..., newMetric] = await Promise.all([
     calculateMTTR(...),
     getTicketFlux(...),
     getNewMetric(...), // ← Nouveau
   ]);
   ```

### Ajouter un Nouveau Rôle

1. **Ajouter le type** dans `src/types/dashboard.ts`
   ```typescript
   export type DashboardRole = 'direction' | 'manager' | 'agent' | 'admin' | 'newRole';
   ```

2. **Définir les widgets par défaut** (`default-widgets.ts`)
   ```typescript
   export const DEFAULT_ROLE_WIDGETS = {
     // ...
     newRole: ['mttr', 'tickets-ouverts', 'alerts'],
   };
   ```

3. **Ajouter le tab dans l'interface admin** (`dashboard-widgets-config-client.tsx`)
   ```typescript
   <TabsList>
     <TabsTrigger value="direction">Direction</TabsTrigger>
     <TabsTrigger value="newRole">New Role</TabsTrigger>
   </TabsList>
   ```

---

## Cohérence Visuelle

### Design System (ShadCN UI)

Tous les widgets utilisent les composants ShadCN UI pour une cohérence maximale :

**Composants utilisés** :
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Badge` (pour priorités, statuts)
- `ScrollArea` (pour listes longues)
- `Button`, `Select`, `Checkbox` (pour filtres)

### Color Scheme

**KPI Variants** :
```typescript
variant: 'info' | 'warning' | 'danger' | 'success' | 'default'
```

**Health Status Colors** :
- **Good** : `bg-green-100 text-green-800`
- **Warning** : `bg-orange-100 text-orange-800`
- **Critical** : `bg-red-100 text-red-800`

**Trend Colors** :
- **Positive** : `text-green-600`
- **Negative** : `text-red-600`
- **Stable** : `text-slate-400`

### Tailles Standardisées

**Hauteur des widgets** :
- KPI Cards : `auto` (s'adapte au contenu)
- Charts : `420px` (fixe)
- Tables : `420px` (fixe avec scroll interne)
- Alertes : calculé dynamiquement (`SCROLLABLE_HEIGHT`)

---

## Résumé

### Forces de l'Architecture Actuelle

✅ **Modularité** : Chaque widget est indépendant et réutilisable
✅ **Flexbox responsive** : Layout adaptatif automatique
✅ **Registre centralisé** : Facile d'ajouter/retirer des widgets
✅ **Configuration rôle-based** : Admin contrôle les widgets par rôle
✅ **Filtre période global** : Un seul filtre impact tous les widgets
✅ **Real-time** : Mises à jour automatiques via Supabase subscriptions
✅ **Performance** : Optimisations (memo, useMemo, useTransition, debouncing)
✅ **Type-safety** : TypeScript garantit la cohérence
✅ **Design cohérent** : ShadCN UI pour tous les composants

### Points à Améliorer (pour refonte)

⚠️ **Complexité des services** : Certains calculs de métriques sont complexes
⚠️ **Duplication de code** : Quelques patterns répétés entre widgets
⚠️ **Tests** : Manque de tests unitaires pour les widgets
⚠️ **Documentation widget** : Certains widgets manquent de docstrings
⚠️ **Cache** : Pas de cache Redis pour les données lourdes
⚠️ **Logs** : Logs de debug à nettoyer pour production

---

**Dernière mise à jour** : 2025-12-08
**Statut** : ✅ Documentation complète et prête pour planification de refonte
