# 📊 Spécification de Refonte du Dashboard OnpointDoc

> **Document de référence** pour tous les futurs développements du dashboard.
> 
> Dernière mise à jour : 16 décembre 2025

---

## 📋 Table des matières

1. [Architecture actuelle](#1-architecture-actuelle)
2. [Principes fondamentaux](#2-principes-fondamentaux)
3. [Analyse des Widgets par Section (Best Practices)](#3-analyse-des-widgets-par-section-best-practices)
   - [3.6 Dark Mode (OBLIGATOIRE)](#36-dark-mode-obligatoire)
   - [3.7 Checklist de Performance](#37-checklist-de-performance)
4. [Système de Widgets](#4-système-de-widgets)
5. [Système de Layout](#5-système-de-layout)
6. [Configuration Admin](#6-configuration-admin)
7. [Préférences Utilisateur](#7-préférences-utilisateur)
8. [Roadmap des améliorations](#8-roadmap-des-améliorations)
9. [Méthodologie de Développement (OBLIGATOIRE)](#9-méthodologie-de-développement-obligatoire)
   - [9.2 Utilisation de Context7](#92-utilisation-de-context7-obligatoire)
   - [9.3 Utilisation de Supabase MCP](#93-utilisation-de-supabase-mcp-obligatoire)
   - [9.4 Clean Code Dashboard](#94-clean-code-dashboard-rappel)
10. [Standards Techniques](#10-standards-techniques)

---

## 1. Architecture actuelle

### 1.1 Structure des fichiers

```
src/
├── app/(main)/
│   ├── dashboard/
│   │   └── page.tsx                    # Page principale (Server Component)
│   └── config/dashboard/
│       └── page.tsx                    # Page de configuration admin
│
├── components/dashboard/
│   ├── widgets/
│   │   ├── registry.ts                 # Registry centralisé des widgets
│   │   ├── widget-grid.tsx             # Grille de rendu des widgets
│   │   └── index.ts
│   ├── ceo/                            # Widgets KPI, Charts, Tables
│   ├── manager/                        # Widgets spécifiques Manager
│   ├── admin/                          # Composants de configuration
│   └── unified-dashboard-with-widgets.tsx  # Composant principal
│
├── services/dashboard/
│   └── widgets/                        # Services de configuration
│
└── types/
    ├── dashboard.ts                    # Types généraux
    └── dashboard-widgets.ts            # Types des widgets
```

### 1.2 Flux de données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Supabase   │────►│  Services   │────►│  Dashboard  │
│  (Config)   │     │  (Cache)    │     │  Page       │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │  Widget     │
                                        │  Grid       │
                                        └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
             ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
             │  KPIs       │            │  Charts     │            │  Tables     │
             │  Section    │            │  Section    │            │  Section    │
             └─────────────┘            └─────────────┘            └─────────────┘
```

---

## 2. Principes fondamentaux

### 2.1 Placement automatique des widgets par type

> **RÈGLE FONDAMENTALE** : Chaque widget est automatiquement placé dans la section correspondant à son `layoutType`.

| layoutType | Section cible | Classe CSS | Soumis aux filtres |
|------------|---------------|------------|:------------------:|
| `kpi-static` | KPIsStaticSection | `kpi-static-grid-responsive` | ❌ NON |
| `kpi` | KPIsSection | `kpi-grid-responsive` | ✅ OUI |
| `chart` | ChartsSection | `chart-grid-responsive` | ✅ OUI |
| `table` | TablesSection | `table-grid-responsive` | ✅ OUI |
| `full-width` | FullWidthSection | `space-y-4` | ✅ OUI |

**Implémentation** : Le `WIDGET_REGISTRY` définit le `layoutType` de chaque widget. Le `DashboardWidgetGrid` groupe automatiquement les widgets par type et les rend dans la section appropriée.

```typescript
// Exemple : Le widget MTTR est de type 'kpi'
// Il sera automatiquement placé dans la section KPIs
WIDGET_REGISTRY['mttr'] = {
  component: MTTRKPICard,
  layoutType: 'kpi',  // ← Détermine la section
  title: 'Temps moyen de résolution (MTTR)',
};
```

### 2.2 Configuration par défaut selon le rôle

> **RÈGLE** : L'admin a **tous les widgets activés** par défaut.

| Rôle | Widgets par défaut |
|------|-------------------|
| **admin** | ✅ Tous les widgets activés |
| **direction** | KPIs stratégiques + Charts + Tables + Alertes |
| **manager** | KPIs équipe + Charts équipe + Alertes |
| **agent** | KPIs personnels + Alertes |

Cette configuration par défaut est définie dans le service de configuration et peut être personnalisée par l'admin via `/config/dashboard`.

### 2.3 Gestion des permissions de configuration

> **RÈGLE** : Seul l'admin peut affecter des widgets aux autres rôles.

| Action | Admin | Direction | Manager | Agent |
|--------|:-----:|:---------:|:-------:|:-----:|
| Affecter widgets à un rôle | ✅ | ❌ | ❌ | ❌ |
| Masquer ses propres widgets | ✅ | ✅ | ✅ | ✅ |
| Voir la page `/config/dashboard` | ✅ | ❌ | ❌ | ❌ |

**Workflow de configuration** :
1. L'**admin** configure quels widgets sont disponibles pour chaque rôle
2. Chaque **utilisateur** peut ensuite masquer/afficher les widgets qui lui sont affectés (préférences personnelles)

### 2.4 Préférences utilisateur (masquer/afficher widgets)

> **RÈGLE** : Chaque utilisateur peut masquer ou réafficher les widgets qui lui sont affectés, sans impacter les autres utilisateurs.

**Principe** :
- L'utilisateur ne peut agir **que sur les widgets affectés à son rôle** par l'admin
- Il ne peut pas ajouter un widget non affecté à son rôle
- Ses préférences sont **personnelles** et stockées séparément

**Calcul des widgets visibles** :
```
Widgets Visibles = Widgets Affectés (par admin) − Widgets Masqués (par user)
```

**Exemple** :
| Étape | Widgets |
|-------|---------|
| Admin affecte au rôle "manager" | `[mttr, tickets-ouverts, tickets-resolus, alerts]` |
| User "Jean" (manager) masque | `[tickets-resolus]` |
| **Jean voit** | `[mttr, tickets-ouverts, alerts]` |
| User "Marie" (manager) ne masque rien | `[mttr, tickets-ouverts, tickets-resolus, alerts]` |

**Interface** : Bouton "Personnaliser" dans le header du dashboard → Modale avec toggles.

### 2.5 Filtres globaux (Année et Période)

> **RÈGLE** : Tous les widgets sont soumis aux filtres globaux. Quand un filtre change, tous les widgets se mettent à jour.

**Période par défaut au chargement** :

| Paramètre | Valeur |
|-----------|--------|
| **Période** | `month` (mois en cours) |
| **Pour tous les rôles** | admin, direction, manager, agent |
| **Tendance** | Calculée vs mois précédent |
| **Raison** | Standard industrie B2B, équilibre données/performance |

**Filtres disponibles** :

| Filtre | Type | Valeurs | Comportement |
|--------|------|---------|--------------|
| **Année** | Sélecteur | 2023, 2024, 2025... | Filtre sur l'année complète |
| **Période standard** | Sélecteur | week, month, quarter, year | Période relative à aujourd'hui |
| **Période personnalisée** | Date range | Date début → Date fin | Plage de dates libre |

**Priorité des filtres** (exclusifs mutuellement) :
1. **Période personnalisée** (si définie) → Priorité haute
2. **Année** (si sélectionnée) → Priorité moyenne
3. **Période standard** → Priorité basse (défaut: `month`)

**Propagation aux widgets** :
```
┌─────────────────────────────────────────────────────────────┐
│  Header Dashboard                                           │
│  [Année ▼] [Période personnalisée 📅]                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (période propagée)
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
   ┌─────────┐        ┌─────────┐        ┌─────────┐
   │  KPIs   │        │ Charts  │        │ Tables  │
   │ (filtrés)│        │(filtrés)│        │(filtrés)│
   └─────────┘        └─────────┘        └─────────┘
```

**Données transmises à chaque widget** :
```typescript
{
  period: 'month' | 'quarter' | 'year' | 'week' | string, // Année ou période
  periodStart: string,  // ISO date début
  periodEnd: string,    // ISO date fin
}
```

### 2.6 Deux types de KPIs : Filtrés vs Statiques

> **RÈGLE** : Il existe deux sections de KPIs distinctes avec des comportements différents.

#### Section 1 : KPIs Statiques (non filtrés)

| Caractéristique | Valeur |
|-----------------|--------|
| **Position** | Tout en haut du dashboard |
| **Soumis aux filtres globaux** | ❌ NON |
| **Données affichées** | Totaux absolus / Temps réel |
| **Classe CSS** | `kpi-static-grid-responsive` (à créer) |
| **layoutType** | `kpi-static` (nouveau type) |
| **Visible par** | ⚠️ **Admin et Direction uniquement** |

> **RÈGLE** : La section KPIs Statiques n'est visible que par les rôles `admin` et `direction`. Les rôles `manager` et `agent` ne voient pas cette section.

| Rôle | Voit KPIs Statiques |
|------|:-------------------:|
| **admin** | ✅ OUI |
| **direction** | ✅ OUI |
| **manager** | ❌ NON |
| **agent** | ❌ NON |

**Exemples de KPIs statiques** :
- Total tickets actifs (tous temps confondus)
- Tickets en attente actuellement
- Alertes critiques en cours

#### Section 2 : KPIs Filtrés (existants)

| Caractéristique | Valeur |
|-----------------|--------|
| **Position** | Sous les KPIs statiques |
| **Soumis aux filtres globaux** | ✅ OUI |
| **Données affichées** | Selon période sélectionnée |
| **Classe CSS** | `kpi-grid-responsive` (existant) |
| **layoutType** | `kpi` (existant) |

**Schéma visuel (Admin / Direction)** :
```
┌─────────────────────────────────────────────────────────────────┐
│  [Personnaliser]              [Année ▼] [Période 📅]           │
├─────────────────────────────────────────────────────────────────┤
│  KPIs STATIQUES (non filtrés) - 🔒 Admin & Direction only      │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                     │
│  │ Total     │ │ En attente│ │ Alertes   │  ← PAS de filtre    │
│  │ Actifs    │ │ actuel    │ │ critiques │                     │
│  └───────────┘ └───────────┘ └───────────┘                     │
├─────────────────────────────────────────────────────────────────┤
│  KPIs FILTRÉS (selon période)                                  │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ MTTR      │ │ Tickets   │ │ Tickets   │ │ Santé     │       │
│  │ Global    │ │ Ouverts   │ │ Résolus   │ │ Produit   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  Charts (filtrés)                                               │
├─────────────────────────────────────────────────────────────────┤
│  Tables (filtrés)                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Schéma visuel (Manager / Agent)** :
```
┌─────────────────────────────────────────────────────────────────┐
│  [Personnaliser]              [Année ▼] [Période 📅]           │
├─────────────────────────────────────────────────────────────────┤
│  KPIs FILTRÉS (selon période) ← Pas de section statique        │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│  │ MTTR      │ │ Tickets   │ │ Tickets   │ │ Santé     │       │
│  │ Global    │ │ Ouverts   │ │ Résolus   │ │ Produit   │       │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  Charts (filtrés)                                               │
├─────────────────────────────────────────────────────────────────┤
│  Tables (filtrés)                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.7 Ordre de rendu des sections (mis à jour)

L'ordre des sections est **fixe** et défini dans `widget-grid.tsx` :

1. **KPIs Statiques** (non filtrés, temps réel) ← NOUVEAU
2. **KPIs Filtrés** (selon période sélectionnée)
3. **Charts** (graphiques, filtrés)
4. **Tables** (tableaux de données, filtrés)
5. **Full-width** (alertes, en bas)

### 2.8 Système de tags sur les widgets (Produit, Département, Rôle)

> **RÈGLE** : Chaque widget est flagué par Produit, Département et Rôle pour permettre un filtrage et une affectation granulaire.

#### Tags disponibles

| Catégorie | Valeurs possibles |
|-----------|-------------------|
| **Produit** | `OBC`, `SNI`, `CREDIT_FACTORY`, `ALL` (tous) |
| **Département** | `SUPPORT`, `MARKETING`, `IT`, `ALL` (tous) |
| **Rôle** | `direction`, `manager`, `agent`, `admin`, `ALL` (tous) |

#### Structure d'un widget avec tags

```typescript
type WidgetDefinition = {
  id: DashboardWidget;
  component: ComponentType;
  layoutType: WidgetLayoutType;
  title: string;
  description?: string;
  // Nouveaux champs de tags
  tags: {
    products: ('OBC' | 'SNI' | 'CREDIT_FACTORY' | 'ALL')[];
    departments: ('SUPPORT' | 'MARKETING' | 'IT' | 'ALL')[];
    roles: ('direction' | 'manager' | 'agent' | 'admin' | 'ALL')[];
  };
};
```

#### Exemples de widgets tagués

| Widget | Produits | Départements | Rôles |
|--------|----------|--------------|-------|
| `mttr` | ALL | SUPPORT, IT | ALL |
| `tickets-ouverts` | ALL | ALL | ALL |
| `health` | ALL | IT | direction, manager |
| `supportEvolutionChart` | ALL | SUPPORT | manager, direction |
| `workloadByAgent` | ALL | ALL | manager, admin |

#### Utilisation des tags

1. **Filtrage dans la configuration admin** : L'admin peut filtrer les widgets par tag avant de les affecter
2. **Affichage contextuel** : Un widget tagué `SUPPORT` ne sera proposé qu'aux utilisateurs du département Support
3. **Recherche** : Permet de retrouver rapidement les widgets pertinents

#### Règle de visibilité avec tags

```
Widget visible SI :
  - Widget affecté au rôle de l'utilisateur (par admin)
  - ET Widget non masqué par l'utilisateur (préférences)
  - ET (Widget.tags.departments contient user.department OU 'ALL')
  - ET (Widget.tags.products contient filtre produit actif OU 'ALL')
```

### 2.9 Responsive Design

| Breakpoint | Comportement |
|------------|--------------|
| Mobile (< 640px) | 1 widget par ligne (100%) |
| Desktop (≥ 640px) | Flexbox avec wrap automatique |

---

## 3. Analyse des Widgets par Section (Best Practices)

Cette section analyse chaque widget existant et définit le **modèle de développement optimal** basé sur les best practices identifiées avec Context7 et Supabase MCP.

### 3.1 Section KPIs Statiques (Non filtrés)

> **Caractéristique** : Données temps réel, pas de filtres de période

#### Architecture recommandée

```typescript
// Structure d'un KPI Statique
type StaticKPIWidget = {
  layoutType: 'kpi-static';
  dataSource: 'realtime' | 'cached';  // Temps réel ou cache court
  refreshInterval?: number;            // En secondes (optionnel)
  tags: WidgetTags;
};
```

#### Widgets à créer

| Widget ID | Titre | Source Supabase | Requête |
|-----------|-------|-----------------|---------|
| `total-tickets-actifs` | Tickets Actifs | `tickets` | `COUNT WHERE status NOT IN ('Resolue', 'Closed', 'Done')` |
| `tickets-en-attente` | En Attente | `tickets` | `COUNT WHERE status = 'Nouveau' OR assigned_to IS NULL` |
| `alertes-critiques` | Alertes Critiques | `tickets` | `COUNT WHERE priority = 'Critical' AND status NOT IN ('Resolue', 'Closed')` |

#### Best Practices KPIs Statiques

```typescript
// ✅ BEST PRACTICE : Pas de dépendance aux filtres de période
export function TotalTicketsActifsKPI() {
  // Requête sans filtre de date
  const query = supabase
    .from('tickets')
    .select('id', { count: 'exact' })
    .not('status', 'in', '("Resolue","Closed","Done")');
}
```

---

### 3.2 Section KPIs Filtrés (Selon période)

> **Caractéristique** : Données filtrées par période globale (année, mois, etc.)

#### Analyse du composant existant : `KPICard`

**Fichier** : `src/components/dashboard/kpi-card.tsx`

| Critère | Score | Observation |
|---------|:-----:|-------------|
| **Réutilisabilité** | ✅ | Composant générique avec props flexibles |
| **Typage** | ✅ | Props bien typées avec TypeScript |
| **Performance** | ⚠️ | Pas de `React.memo()` sur le composant principal |
| **Accessibilité** | ⚠️ | Manque `aria-label` sur les icônes de tendance |
| **Responsive** | ✅ | Utilise Flexbox avec `min-w-0` |

#### Best Practices KPIs Filtrés

```typescript
// ✅ BEST PRACTICE : Service avec React.cache()
export const calculateMTTR = cache(calculateMTTRInternal);

// ✅ BEST PRACTICE : Requête optimisée avec filtres
let resolvedQuery = supabase
  .from('tickets')
  .select('id, created_at, resolved_at, ticket_type, product_id, product:products!inner(id, name)')
  .not('resolved_at', 'is', null)
  .gte('resolved_at', startDate)
  .lte('resolved_at', endDate);

// ✅ BEST PRACTICE : Calcul de tendance vs période précédente
const trend = calculateTrend(globalMTTR, prevGlobalMTTR);
```

#### Widgets KPIs Filtrés existants

| Widget | Composant | Service | Performance |
|--------|-----------|---------|:-----------:|
| `mttr` | `MTTRKPICard` | `calculateMTTR` | ✅ cache() |
| `tickets-ouverts` | `TicketsOuvertsKPICard` | `getTicketFlux` | ✅ cache() |
| `tickets-resolus` | `TicketsResolusKPICard` | `getTicketFlux` | ✅ cache() |
| `workload` | `WorkloadKPICard` | `getWorkloadDistribution` | ✅ cache() |
| `health` | `HealthKPICard` | `getProductHealth` | ✅ cache() |

---

### 3.3 Section Charts (Graphiques)

> **Caractéristique** : Visualisations de données avec Recharts

#### Analyse du composant existant : `MTTREvolutionChart`

**Fichier** : `src/components/dashboard/ceo/mttr-evolution-chart.tsx`

| Critère | Score | Observation |
|---------|:-----:|-------------|
| **Bibliothèque** | ✅ | Recharts (stable, performant) |
| **Mémoisation** | ✅ | `useMemo()` pour transformer les données |
| **Hauteur fixe** | ✅ | `h-[420px]` pour uniformité |
| **Empty state** | ✅ | Gère le cas "Aucune donnée" |
| **Config séparée** | ✅ | `chartConfig` extrait |
| **Animation** | ✅ | Constantes dans fichier dédié |

#### Best Practices Charts

```typescript
// ✅ BEST PRACTICE : Mémoisation des données transformées
const chartData = useMemo(() => {
  if (!data || !data.byProduct) return [];
  return transformMTTRData(data);
}, [data?.byProduct]);

// ✅ BEST PRACTICE : Configuration externalisée
const chartConfig = {
  mttr: { label: 'MTTR', color: '#6366F1' }
} satisfies ChartConfig;

// ✅ BEST PRACTICE : Constantes d'animation
import {
  CHART_MARGIN,
  AREA_STROKE_WIDTH,
  ANIMATION_DURATION,
  ANIMATION_EASING
} from './charts/chart-constants';
```

#### Widgets Charts existants

| Widget | Type | Hauteur | Mémoisation |
|--------|------|:-------:|:-----------:|
| `mttrEvolution` | AreaChart | 420px | ✅ useMemo |
| `ticketsDistribution` | PieChart | 420px | ✅ useMemo |
| `supportEvolutionChart` | LineChart | 420px | ✅ Server Component |
| `ticketsByTypePieChart` | PieChart | 420px | ✅ Server Component |
| `ticketsByCompanyPieChart` | PieChart | 420px | ✅ Server Component |

---

### 3.4 Section Tables (Tableaux)

> **Caractéristique** : Affichage tabulaire avec tri et scroll

#### Analyse du composant existant : `TopBugsModulesTable`

**Fichier** : `src/components/dashboard/ceo/top-bugs-modules-table.tsx`

| Critère | Score | Observation |
|---------|:-----:|-------------|
| **Lignes mémorisées** | ✅ | `React.memo()` sur `TopBugsModuleRow` |
| **Comparaison custom** | ✅ | `areModulePropsEqual` pour éviter re-renders |
| **Scroll interne** | ✅ | `overflow-y-auto` dans le container |
| **Colonnes fixes** | ✅ | `<colgroup>` pour largeurs fixes |
| **Hover state** | ✅ | `hover:bg-slate-50` sur les lignes |
| **Dark mode** | ✅ | Classes `dark:` partout |

#### Best Practices Tables

```typescript
// ✅ BEST PRACTICE : Ligne mémorisée avec comparaison personnalisée
const TopBugsModuleRow = memo(function TopBugsModuleRow({ module }) {
  // ...
}, areModulePropsEqual);

// ✅ BEST PRACTICE : Fonction de comparaison explicite
function areModulePropsEqual(prevProps, nextProps): boolean {
  const prev = prevProps.module;
  const next = nextProps.module;
  
  if (prev.moduleId !== next.moduleId) return false;
  // ... comparaisons granulaires
  return true;
}

// ✅ BEST PRACTICE : Colonnes à largeur fixe
<colgroup>
  <col className="w-[84px]" />
  <col className="w-[98px]" />
  {/* ... */}
</colgroup>
```

---

### 3.5 Modèle de Développement Optimal

#### Structure d'un nouveau widget

```
src/components/dashboard/
├── [section]/
│   ├── [widget-name].tsx           # Composant principal
│   ├── [widget-name]-skeleton.tsx  # État de chargement
│   └── [widget-name]-server.tsx    # Server Component (optionnel)
│
src/services/dashboard/
├── [widget-data].ts                # Service de données
```

#### Template de widget KPI

```typescript
// src/components/dashboard/ceo/nouveau-kpi-card.tsx
'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { Period } from '@/types/dashboard';

type NouveauKPICardProps = {
  data: NouveauKPIData;
  period: Period;
};

export function NouveauKPICard({ data, period: _period }: NouveauKPICardProps) {
  if (!data) {
    return (
      <KPICard
        title="Nouveau KPI"
        value="N/A"
        description="Données non disponibles"
        icon="chart"
        variant="default"
      />
    );
  }

  return (
    <KPICard
      title="Nouveau KPI"
      value={data.value}
      description="Description du KPI"
      icon="chart"
      variant="info"
      subtitle="vs période précédente"
      trend={data.trend ? {
        value: Math.abs(data.trend),
        isPositive: data.trend >= 0
      } : undefined}
    />
  );
}
```

#### Template de service avec cache

```typescript
// src/services/dashboard/nouveau-kpi.ts
import { cache } from 'react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Period } from '@/types/dashboard';
import { getPeriodDates, getPreviousPeriodDates } from './period-utils';
import { calculateTrend } from './utils/trend-calculation';

async function getNouveauKPIInternal(
  period: Period | string,
  customStartDate?: string,
  customEndDate?: string
): Promise<NouveauKPIData> {
  const { startDate, endDate } = getPeriodDates(period, customStartDate, customEndDate);
  const { startDate: prevStart, endDate: prevEnd } = getPreviousPeriodDates(period, customStartDate, customEndDate);

  const supabase = await createSupabaseServerClient();

  // Requête période actuelle
  const { data: current } = await supabase
    .from('tickets')
    .select('id', { count: 'exact' })
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Requête période précédente (pour tendance)
  const { data: previous } = await supabase
    .from('tickets')
    .select('id', { count: 'exact' })
    .gte('created_at', prevStart)
    .lte('created_at', prevEnd);

  const value = current?.length || 0;
  const prevValue = previous?.length || 0;
  const trend = calculateTrend(value, prevValue);

  return { value, trend };
}

// Export avec React.cache()
export const getNouveauKPI = cache(getNouveauKPIInternal);
```

---

### 3.6 Dark Mode (OBLIGATOIRE)

> **RÈGLE** : Tous les composants DOIVENT supporter le dark mode. Ne jamais oublier le dark mode lors de chaque développement.

#### Pattern Dark Mode pour Tailwind (UI)

```tsx
// ✅ TOUJOURS ajouter les variantes dark:
<Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
  <CardTitle className="text-slate-900 dark:text-slate-100">Titre</CardTitle>
  <p className="text-slate-600 dark:text-slate-400">Description</p>
</Card>

// ❌ NE JAMAIS faire ça
<Card className="border-slate-200 bg-white">  {/* Missing dark: */}
```

#### Pattern Dark Mode pour Recharts (Charts)

Le composant `ChartContainer` de ShadCN UI supporte le dark mode via le système `theme` dans `ChartConfig`.

```typescript
// ❌ MAUVAIS : Couleur fixe (ne s'adapte pas au dark mode)
const chartConfig = {
  mttr: {
    label: 'MTTR',
    color: '#6366F1'  // Couleur fixe!
  }
} satisfies ChartConfig;

// ✅ BON : Couleurs adaptatives avec theme
const chartConfig = {
  mttr: {
    label: 'MTTR',
    theme: {
      light: '#6366F1',  // Indigo pour light mode
      dark: '#818CF8'    // Indigo plus clair pour dark mode
    }
  }
} satisfies ChartConfig;
```

#### Palette de couleurs recommandée pour Charts

| Couleur | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| **Indigo** | `#6366F1` | `#818CF8` | KPI principal, MTTR |
| **Emerald** | `#10B981` | `#34D399` | Positif, Résolu |
| **Amber** | `#F59E0B` | `#FBBF24` | Warning, En cours |
| **Rose** | `#F43F5E` | `#FB7185` | Négatif, Critique |
| **Cyan** | `#06B6D4` | `#22D3EE` | Info, Secondaire |
| **Slate** | `#64748B` | `#94A3B8` | Neutre, Grille |

#### Exemple complet Chart avec Dark Mode

```typescript
// src/components/dashboard/ceo/mttr-evolution-chart.tsx
const chartConfig = {
  mttr: {
    label: 'MTTR',
    theme: {
      light: '#6366F1',
      dark: '#818CF8'
    }
  },
  tickets: {
    label: 'Tickets',
    theme: {
      light: '#10B981',
      dark: '#34D399'
    }
  }
} satisfies ChartConfig;

// Le ChartContainer génère automatiquement les CSS variables:
// Light: --color-mttr: #6366F1;
// Dark:  --color-mttr: #818CF8;

// Utilisation dans le chart:
<Area
  dataKey="mttr"
  fill="var(--color-mttr)"
  stroke="var(--color-mttr)"
/>
```

#### Éléments à vérifier pour le Dark Mode

| Élément | Pattern Light | Pattern Dark |
|---------|---------------|--------------|
| **Fond Card** | `bg-white` | `dark:bg-slate-950` |
| **Bordure Card** | `border-slate-200` | `dark:border-slate-800` |
| **Texte principal** | `text-slate-900` | `dark:text-slate-100` |
| **Texte secondaire** | `text-slate-600` | `dark:text-slate-400` |
| **Hover fond** | `hover:bg-slate-50` | `dark:hover:bg-slate-900` |
| **Bordure tableau** | `border-slate-100` | `dark:border-slate-800` |
| **CartesianGrid** | stroke default | `stroke-border/50` (auto) |
| **Tooltip** | `bg-white` | `dark:bg-slate-950` |

---

### 3.7 Checklist de Performance

Avant de merger un nouveau widget, vérifier :

- [ ] **Service** : Utilise `React.cache()` pour éviter les appels redondants
- [ ] **Requête** : Sélectionne uniquement les colonnes nécessaires
- [ ] **Composant** : `useMemo()` sur les transformations de données
- [ ] **Lignes de tableau** : `React.memo()` avec comparaison personnalisée
- [ ] **Empty state** : Gère le cas "aucune donnée"
- [ ] **Skeleton** : Composant de chargement dédié
- [ ] **Dark mode UI** : Classes `dark:` sur **TOUS** les éléments stylisés
- [ ] **Dark mode Charts** : Utiliser `theme: { light, dark }` au lieu de `color`
- [ ] **Hauteur fixe** : 420px pour Charts/Tables, auto pour KPIs
- [ ] **Documentation** : JSDoc sur les fonctions principales

---

## 4. Système de Widgets

### 4.1 Liste des widgets disponibles

#### KPIs (layoutType: `kpi`)

| ID | Composant | Description |
|----|-----------|-------------|
| `mttr` | MTTRKPICard | Temps moyen de résolution |
| `tickets-ouverts` | TicketsOuvertsKPICard | Tickets créés sur la période |
| `tickets-resolus` | TicketsResolusKPICard | Tickets résolus + taux |
| `workload` | WorkloadKPICard | Charge de travail |
| `health` | HealthKPICard | Santé des produits |

#### Charts (layoutType: `chart`)

| ID | Composant | Description |
|----|-----------|-------------|
| `mttrEvolution` | MTTREvolutionChart | Évolution MTTR dans le temps |
| `ticketsDistribution` | TicketsDistributionChart | Répartition par type |
| `supportEvolutionChart` | SupportEvolutionChartServerV2 | Évolution performance support |
| `ticketsByTypePieChart` | TicketsByTypePieChartServer | Camembert par type |
| `ticketsByCompanyPieChart` | TicketsByCompanyPieChartServer | Camembert par entreprise |

#### Tables (layoutType: `table`)

| ID | Composant | Description |
|----|-----------|-------------|
| `topBugsModules` | TopBugsModulesTable | Modules les plus bugués |
| `workloadByAgent` | WorkloadByAgentTable | Charge par agent |

#### Full-width (layoutType: `full-width`)

| ID | Composant | Description |
|----|-----------|-------------|
| `alerts` | OperationalAlertsSection | Alertes opérationnelles |

### 4.2 Ajouter un nouveau widget

Pour ajouter un nouveau widget :

1. **Créer le composant** dans `src/components/dashboard/`
2. **L'enregistrer** dans `WIDGET_REGISTRY` (`registry.ts`)
3. **Ajouter le mapper** de données dans `WIDGET_DATA_MAPPERS`
4. **Ajouter le type** dans `DashboardWidget` (`dashboard-widgets.ts`)
5. **Configurer** via l'admin pour l'affecter aux rôles

---

## 5. Système de Layout

### 5.1 Classes CSS Flexbox

Définies dans `src/app/globals.css` :

```css
/* KPIs : min-width 280px */
.kpi-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.kpi-grid-responsive > * {
  flex: 1 1 280px;
  min-width: 280px;
}

/* Charts : min-width 400px (max 3 par ligne) */
.chart-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.chart-grid-responsive > * {
  flex: 1 1 400px;
  min-width: 400px;
}

/* Tables : min-width 400px (max 3 par ligne) */
.table-grid-responsive {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.table-grid-responsive > * {
  flex: 1 1 400px;
  min-width: 400px;
}

/* Mobile : 100% width */
@media (max-width: 639px) {
  .kpi-grid-responsive > *,
  .chart-grid-responsive > *,
  .table-grid-responsive > * {
    flex-basis: 100%;
    min-width: 100%;
  }
}
```

### 5.2 Structure du conteneur principal

```tsx
<div className="space-y-6">
  {/* Section KPIs */}
  <div className="kpi-grid-responsive gap-4">
    {/* Widgets KPI */}
  </div>

  {/* Section Charts */}
  <div className="chart-grid-responsive gap-4">
    {/* Widgets Chart */}
  </div>

  {/* Section Tables */}
  <div className="table-grid-responsive gap-4">
    {/* Widgets Table */}
  </div>

  {/* Section Full-width */}
  <div className="space-y-4">
    {/* Widgets Full-width */}
  </div>
</div>
```

---

## 6. Configuration Admin

### 6.1 Accès

- **URL** : `/config/dashboard`
- **Restriction** : Réservé aux utilisateurs avec `role === 'admin'`

### 6.2 Fonctionnalités

| Action | Description |
|--------|-------------|
| **Activer/Désactiver** | Toggle un widget pour un rôle |
| **Sauvegarder** | Persiste la configuration en DB |
| **Réinitialiser** | Remet les valeurs par défaut |

### 6.3 Système de configuration

```
┌─────────────────────────────────────────┐
│  dashboard_role_widgets (Supabase)      │
├─────────────────────────────────────────┤
│  role: DashboardRole                    │
│  widgets: DashboardWidget[]             │
│  updated_at: timestamp                  │
│  updated_by: uuid (nullable)            │
└─────────────────────────────────────────┘
```

---

## 7. Préférences Utilisateur

### 7.1 Principe

Chaque utilisateur peut **masquer** des widgets qui lui sont affectés (par rôle) sans affecter les autres utilisateurs.

### 7.2 Calcul des widgets visibles

```
Widgets Visibles = Widgets Affectés (rôle) - Widgets Masqués (user)
```

### 7.3 Interface utilisateur

Le bouton **"Personnaliser"** dans le dashboard ouvre une modale permettant de masquer/afficher des widgets.

---

## 8. Roadmap des améliorations

### Phase 1 : Consolidation (actuel)
- [x] Système de widgets fonctionnel
- [x] Configuration admin par rôle
- [x] Préférences utilisateur
- [x] Layout Flexbox responsive

### Phase 2 : Améliorations UX
- [ ] Drag & drop pour réorganiser les widgets au sein d'une section
- [ ] Preview live dans la configuration admin
- [ ] Animations de transition entre états

### Phase 3 : Fonctionnalités avancées
- [ ] Widgets personnalisables (taille, options)
- [ ] Export PDF du dashboard
- [ ] Dashboards sauvegardés multiples par utilisateur

---

## 📝 Notes de développement

### Convention de nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Widget ID | kebab-case | `tickets-ouverts` |
| Composant | PascalCase | `TicketsOuvertsKPICard` |
| Fichier | kebab-case | `tickets-ouverts-kpi-card.tsx` |

### Tests

Chaque nouveau widget doit avoir :
- [ ] Tests unitaires du composant
- [ ] Tests d'intégration avec le registry
- [ ] Tests e2e du rendu dans le dashboard

---

---

## 9. Méthodologie de Développement (OBLIGATOIRE)

> **RÈGLE ABSOLUE** : Tout développement DOIT utiliser Context7 + Supabase MCP + Clean Code pour éviter erreurs, choix obsolètes et code non performant.

### 9.1 Workflow obligatoire pour chaque widget

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: AVANT DE CODER                                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ Context7: Vérifier best practices de la librairie utilisée         │
│     → mcp_context7_resolve-library-id + mcp_context7_get-library-docs  │
│  ✅ Supabase MCP: Vérifier schéma et requêtes optimales               │
│     → mcp_supabase_list_tables + mcp_supabase_execute_sql              │
│  ✅ Clean Code: Planifier structure (services, composants, types)      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2: PENDANT LE DÉVELOPPEMENT                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ Respecter SOLID (Single Responsibility, Open/Closed, etc.)         │
│  ✅ Fonctions < 20 lignes, Composants < 100 lignes                     │
│  ✅ Types explicites (pas de `any`)                                    │
│  ✅ React.cache() sur les services                                      │
│  ✅ Dark mode partout                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3: APRÈS LE DÉVELOPPEMENT                                        │
├─────────────────────────────────────────────────────────────────────────┤
│  ✅ Supabase MCP: Vérifier RLS et advisors                             │
│     → mcp_supabase_get_advisors (security + performance)               │
│  ✅ Tests unitaires sur le service                                      │
│  ✅ Lint + TypeCheck                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Utilisation de Context7 (OBLIGATOIRE)

> **NE JAMAIS répondre de mémoire** sur les choix technologiques. TOUJOURS vérifier avec Context7.

#### Quand utiliser Context7

| Situation | Action Context7 |
|-----------|-----------------|
| Nouveau composant Chart | `get-library-docs` pour Recharts |
| Pattern React inconnu | `get-library-docs` pour React |
| Optimisation performance | `get-library-docs` topic "performance" |
| Question Next.js | `get-library-docs` pour Next.js |
| Nouveau hook | `get-library-docs` topic "hooks" |

#### Exemple de workflow Context7

```typescript
// 1. Résoudre l'ID de la librairie
mcp_context7_resolve-library-id({ libraryName: "recharts" })
// → /recharts/recharts

// 2. Obtenir la documentation pertinente
mcp_context7_get-library-docs({
  context7CompatibleLibraryID: "/recharts/recharts",
  topic: "ResponsiveContainer dark mode"
})

// 3. Appliquer les best practices trouvées
```

### 9.3 Utilisation de Supabase MCP (OBLIGATOIRE)

> **TOUJOURS vérifier le schéma** avant d'écrire une requête. TOUJOURS utiliser les migrations pour les changements DDL.

#### Commandes Supabase MCP fréquentes

| Action | Commande MCP |
|--------|--------------|
| Voir les tables | `mcp_supabase_list_tables` |
| Exécuter une requête | `mcp_supabase_execute_sql` |
| Créer une migration | `mcp_supabase_apply_migration` |
| Vérifier sécurité | `mcp_supabase_get_advisors` type="security" |
| Vérifier performance | `mcp_supabase_get_advisors` type="performance" |
| Voir les logs | `mcp_supabase_get_logs` |

#### Pattern de requête optimisée

```typescript
// ❌ MAUVAIS : Requête non vérifiée, SELECT *
const { data } = await supabase.from('tickets').select('*');

// ✅ BON : Vérifier schéma avec MCP, sélectionner colonnes nécessaires
// 1. D'abord: mcp_supabase_list_tables pour voir la structure
// 2. Ensuite: requête optimisée
const { data } = await supabase
  .from('tickets')
  .select('id, title, status, created_at, product:products(id, name)')
  .eq('status', 'Open')
  .gte('created_at', startDate)
  .order('created_at', { ascending: false })
  .limit(100);
```

### 9.4 Clean Code Dashboard (Rappel)

#### Architecture des widgets

```
src/
├── components/dashboard/
│   └── [section]/
│       ├── [widget].tsx              # < 100 lignes
│       └── [widget]-skeleton.tsx     # État de chargement
│
├── services/dashboard/
│   └── [widget-data].ts              # Fonctions < 20 lignes
│                                      # React.cache() obligatoire
│
└── types/
    └── dashboard-widgets.ts          # Types explicites
```

#### Principes SOLID appliqués aux widgets

| Principe | Application Dashboard |
|----------|----------------------|
| **S**ingle Responsibility | 1 widget = 1 responsabilité |
| **O**pen/Closed | Nouveau widget via Registry, pas modification |
| **L**iskov | Tous les widgets implémentent la même interface |
| **I**nterface Segregation | Props minimales par widget |
| **D**ependency Inversion | Widgets dépendent de `WidgetDefinition`, pas d'implémentation |

### 9.5 Checklist avant développement d'un widget

- [ ] **Context7** : Documentation de la librairie consultée
- [ ] **Supabase MCP** : Schéma vérifié (`list_tables`)
- [ ] **Clean Code** : Structure planifiée (service + composant + type)
- [ ] **Dark Mode** : Pattern `theme: { light, dark }` prévu pour charts
- [ ] **Performance** : `React.cache()` et `useMemo()` planifiés

### 9.6 Checklist après développement d'un widget

- [ ] **Supabase MCP** : `get_advisors` exécuté (security + performance)
- [ ] **Lint** : `npm run lint` sans erreur
- [ ] **TypeCheck** : `npm run typecheck` sans erreur
- [ ] **Tests** : Tests unitaires passent
- [ ] **Dark Mode** : Vérifié visuellement en light ET dark

---

## 10. Standards Techniques

### 10.1 Bibliothèque de Charts : Recharts

> **DÉCISION** : Recharts est la seule bibliothèque de charts autorisée pour le projet.

| Critère | Recharts | ~~Tremor~~ (à supprimer) |
|---------|:--------:|:------------------------:|
| **Benchmark Score** | **74.2/100** | 62.7/100 |
| **Taille bundle** | ~300KB | ~800KB+ |
| **En production** | ✅ 5 fichiers | ❌ Exemples seulement |
| **Personnalisation** | **Très flexible** | Clé en main |
| **Base** | D3.js + SVG natif | Utilise Recharts ! |

#### Action : Supprimer Tremor

```bash
# À exécuter pour nettoyer le projet
npm uninstall @tremor/react

# Supprimer le dossier d'exemples
rm -rf src/components/dashboard/tremor/
```

#### Imports Recharts autorisés

```typescript
// ✅ Import recommandé
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

// ✅ Wrapper ShadCN UI pour le dark mode
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from '@/ui/chart';
```

#### ResponsiveContainer obligatoire

```tsx
// ✅ TOUJOURS wrapper dans ResponsiveContainer
<ChartContainer config={chartConfig} className="h-full w-full">
  <AreaChart data={data} margin={CHART_MARGIN}>
    {/* ... */}
  </AreaChart>
</ChartContainer>

// Le ChartContainer inclut automatiquement ResponsiveContainer
```

### 10.2 Design System : ShadCN UI

| Composant | Usage |
|-----------|-------|
| `Card` | Conteneur de widget |
| `Button` | Actions |
| `Select` | Sélecteurs (période, année) |
| `Badge` | Indicateurs de statut |
| `Tooltip` | Aide contextuelle |
| `Dialog` | Modales (préférences) |
| `Switch` | Toggles (configuration) |

### 10.3 Constantes d'animation

Définies dans `src/components/dashboard/ceo/charts/chart-constants.ts` :

```typescript
export const CHART_MARGIN = { top: 10, right: 30, left: 0, bottom: 0 };
export const AREA_STROKE_WIDTH = 2;
export const DOT_RADIUS = 4;
export const ACTIVE_DOT_RADIUS = 6;
export const ANIMATION_DURATION = 300;
export const ANIMATION_EASING = 'ease-out';
```

### 10.4 Récapitulatif des règles clés

| Règle | Description |
|-------|-------------|
| 📚 **Context7** | OBLIGATOIRE avant tout choix technologique |
| 🗄️ **Supabase MCP** | OBLIGATOIRE pour toute opération DB |
| 🧹 **Clean Code** | SOLID, DRY, KISS, YAGNI |
| 🎨 **Dark Mode** | OBLIGATOIRE sur tous les composants |
| 📊 **Charts** | Recharts uniquement + `theme: { light, dark }` |
| 🚀 **Cache** | `React.cache()` sur tous les services |
| 📦 **Memo** | `React.memo()` sur les lignes de tableau |
| ⏱️ **Hauteur** | 420px pour Charts/Tables |
| 🔄 **Responsive** | Flexbox avec classes `*-grid-responsive` |
| 📏 **Fonctions** | Maximum 20 lignes |
| 📦 **Composants** | Maximum 100 lignes |
| 🔒 **Types** | Explicites partout, pas de `any` |

---

> **Maintenu par** : Équipe OnpointDoc
> **Contact** : [À définir]

