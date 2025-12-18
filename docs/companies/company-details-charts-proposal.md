# Proposition : Graphiques pour la Page Détails Entreprise

## 📊 Patterns UI/UX Identifiés (Dashboard)

### Structure des Charts
- **Wrapper** : `Card` avec `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- **Container** : `ChartContainer` de ShadCN UI (`@/ui/chart`)
- **Hauteur** : 280px (ou 320px selon les constantes)
- **Marges** : `{ top: 10, right: 20, left: 0, bottom: 10 }`

### Style & Design
- **Borders** : `border-slate-200 dark:border-slate-800`
- **Background** : `bg-white dark:bg-slate-950`
- **Hover** : `hover:shadow-md transition-shadow`
- **Titre** : `text-sm font-medium text-slate-900 dark:text-slate-100`
- **Description** : `text-xs text-slate-500 dark:text-slate-400`
- **Badges métadonnées** : `text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded`

### Couleurs Cohérentes
- **BUG** : `#F43F5E` (light) / `#FB7185` (dark)
- **REQ** : `#3B82F6` (light) / `#60A5FA` (dark)
- **ASSISTANCE** : `#14B8A6` (light) / `#2DD4BF` (dark)

### Composants Utilisés
- **Recharts** : `AreaChart`, `BarChart`, `PieChart`, `ResponsiveContainer`
- **Icônes** : Lucide React (`TrendingUp`, `PieChartIcon`, `Building2`, etc.)
- **Empty States** : Composants dédiés pour chaque chart
- **Animations** : `ANIMATION_DURATION = 1200ms`, `ANIMATION_EASING = 'ease-out'`

### Lazy Loading
- **Dynamic Import** : `next/dynamic` avec `ssr: false`
- **Viewport Lazy** : `ViewportLazyWidget` avec Intersection Observer
- **Skeleton** : `ChartSkeleton` pendant le chargement

---

## 📈 Graphiques Pertinents pour une Entreprise

### 1. **Distribution des Tickets par Type** (PieChart Donut)
**Données** : Répartition BUG / REQ / ASSISTANCE pour cette entreprise
- **Utilité** : Vue d'ensemble rapide du type de demandes
- **Pattern** : Identique à `TicketsDistributionChart` du dashboard

### 2. **Évolution des Tickets dans le Temps** (AreaChart)
**Données** : Création de tickets par période (jour/semaine/mois) pour cette entreprise
- **Utilité** : Tendance d'activité, pics de demandes
- **Pattern** : Identique à `TicketsEvolutionChart` du dashboard

### 3. **Répartition par Statut** (BarChart Horizontal)
**Données** : Nombre de tickets par statut (Ouvert, En cours, Résolu, etc.)
- **Utilité** : État actuel des demandes
- **Pattern** : Similaire à `TicketsByCompanyChart` mais inversé (statuts au lieu d'entreprises)

### 4. **Tickets par Produit/Module** (BarChart Stacked)
**Données** : Répartition des tickets par produit (OBC, SNI, Credit Factory) et modules
- **Utilité** : Identifier les zones de friction
- **Pattern** : Nouveau, mais cohérent avec les autres charts

### 5. **Durée Moyenne de Résolution** (LineChart ou BarChart)
**Données** : MTTR (Mean Time To Resolution) par type de ticket
- **Utilité** : Performance de résolution pour cette entreprise
- **Pattern** : Nouveau, mais cohérent avec les autres charts

---

## 🎯 Meilleurs Emplacements dans la Page

### **Option A : Section Dédiée "Statistiques" (Recommandée)**

#### Desktop Layout (≥ lg)
```
┌─────────────────────────────────────────────────────────────┐
│ Header (Titre + Navigation + Actions)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌──────────────────────────┐  ┌──────────────────────────┐ │
│ │ Détails Entreprise        │  │ Informations             │ │
│ │ (Card lg:col-span-2)     │  │ (CompanyInfoCard)        │ │
│ └──────────────────────────┘  └──────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 STATISTIQUES                                          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│ │ │ Distribution │  │ Évolution    │  │ Par Statut   │   │ │
│ │ │ (PieChart)   │  │ (AreaChart)  │  │ (BarChart)   │   │ │
│ │ └──────────────┘  └──────────────┘  └──────────────┘   │ │
│ │                                                           │ │
│ │ ┌──────────────┐  ┌──────────────┐                      │ │
│ │ │ Par Produit  │  │ MTTR         │                      │ │
│ │ │ (Stacked)    │  │ (LineChart)  │                      │ │
│ │ └──────────────┘  └──────────────┘                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Timeline (w-96, fixe à droite)                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### Mobile Layout (< lg)
```
┌─────────────────────────────┐
│ Header                      │
├─────────────────────────────┤
│ [Tabs: Détails | Historique]│
├─────────────────────────────┤
│ Tab "Détails":              │
│ ┌─────────────────────────┐ │
│ │ Détails Entreprise      │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Informations            │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 📊 STATISTIQUES         │ │
│ ├─────────────────────────┤ │
│ │ ┌─────────────────────┐ │ │
│ │ │ Distribution        │ │ │
│ │ └─────────────────────┘ │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ Évolution           │ │ │
│ │ └─────────────────────┘ │ │
│ │ ┌─────────────────────┐ │ │
│ │ │ Par Statut          │ │ │
│ │ └─────────────────────┘ │ │
│ │ ... (autres charts)     │ │
│ └─────────────────────────┘ │
│                             │
│ Tab "Historique":           │
│ ┌─────────────────────────┐ │
│ │ Timeline                │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### **Option B : Intégration dans les Tabs (Alternative)**

Ajouter un 3ème tab "Statistiques" entre "Détails" et "Historique" :
- **Tab 1** : Détails (informations + CompanyInfoCard)
- **Tab 2** : **Statistiques** (tous les charts)
- **Tab 3** : Historique (timeline)

---

## 🏗️ Structure de Code Proposée

### Fichiers à Créer

```
src/components/companies/charts/
├── company-tickets-distribution-chart.tsx    # PieChart Donut
├── company-tickets-evolution-chart.tsx      # AreaChart
├── company-tickets-by-status-chart.tsx      # BarChart Horizontal
├── company-tickets-by-product-chart.tsx     # BarChart Stacked
├── company-mttr-chart.tsx                   # LineChart
└── index.ts                                 # Exports

src/services/companies/stats/
├── company-tickets-distribution-stats.ts   # Service pour PieChart
├── company-tickets-evolution-stats.ts      # Service pour AreaChart
├── company-tickets-by-status-stats.ts       # Service pour BarChart Statut
├── company-tickets-by-product-stats.ts     # Service pour BarChart Produit
├── company-mttr-stats.ts                   # Service pour MTTR
└── index.ts                                 # Exports
```

### Modifications à Apporter

1. **`src/app/(main)/config/companies/[id]/page.tsx`**
   - Ajouter une section "Statistiques" après les détails
   - Charger les données des stats en parallèle avec `Promise.all()`
   - Utiliser `ViewportLazyWidget` pour le lazy loading

2. **`src/components/companies/company-detail-tabs.tsx`**
   - Ajouter un tab "Statistiques" (Option B uniquement)
   - Ou intégrer les charts dans le tab "Détails" (Option A)

3. **Services de Stats**
   - Créer des services similaires à `src/services/dashboard/`
   - Filtrer par `company_id` au lieu de `product_id`
   - Réutiliser les fonctions PostgreSQL optimisées si possible

---

## 📋 Recommandations Finales

### **Option A (Recommandée)** : Section Dédiée
✅ **Avantages** :
- Cohérence avec le dashboard (section visible)
- Pas de navigation supplémentaire
- Meilleure UX : tout est visible d'un coup d'œil
- Facile à implémenter (ajout d'une section)

### **Option B** : Tab Dédiée
✅ **Avantages** :
- Organisation claire par catégorie
- Moins de scroll sur mobile
- Cohérent avec le pattern tabs existant

❌ **Inconvénients** :
- Navigation supplémentaire pour voir les stats
- Moins visible par défaut

### **Graphiques Prioritaires** (Phase 1)
1. **Distribution par Type** (PieChart) - Le plus simple, impact visuel fort
2. **Évolution dans le Temps** (AreaChart) - Très utile pour voir les tendances
3. **Répartition par Statut** (BarChart) - État actuel immédiat

### **Graphiques Phase 2**
4. **Par Produit/Module** (Stacked BarChart) - Plus complexe, nécessite plus de données
5. **MTTR** (LineChart) - Nécessite calculs de durée, plus avancé

---

## 🎨 Exemple de Code Structure

```typescript
// src/components/companies/charts/company-tickets-distribution-chart.tsx
'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/ui/chart';
import { cn } from '@/lib/utils';
// ... pattern identique aux charts du dashboard
```

---

## 📅 Gestion du Choix de Période

### Analyse des Patterns Dashboard

Le dashboard utilise deux approches pour la sélection de période :

1. **`PeriodSelector`** (Simple) : Select avec options prédéfinies
   - `week` : 7 derniers jours
   - `month` : 30 derniers jours (mois en cours)
   - `quarter` : 3 derniers mois
   - `year` : 12 derniers mois

2. **`CustomPeriodSelector`** (Avancé) : Calendrier avec presets
   - Presets : Aujourd'hui, 3/7/30 jours, 3/6 mois, dernière année
   - Calendrier personnalisé : Sélection de plage de dates
   - Support de `startDate` et `endDate` dans les URL params

### Options pour la Page Détails Entreprise

#### **Option 1 : Sélecteur Simple (Recommandée pour Phase 1)**

**Composant** : `PeriodSelector` (réutilisable depuis dashboard)

**Avantages** :
- ✅ Cohérent avec le dashboard
- ✅ Simple à implémenter
- ✅ Pas de dépendances supplémentaires
- ✅ Suffisant pour la plupart des cas d'usage

**Implémentation** :
```typescript
// Dans la section Statistiques
import { PeriodSelector } from '@/components/dashboard/ceo/period-selector';
import { getPeriodRange } from '@/app/(main)/dashboard/page'; // À extraire dans utils

// Utiliser searchParams pour la période
const period = searchParams.period || 'month';
const { periodStart, periodEnd } = getPeriodRange(period);
```

**Emplacement** :
- **Desktop** : En-tête de la section "Statistiques" (à droite du titre)
- **Mobile** : Au-dessus de la grille de charts

#### **Option 2 : Sélecteur Avancé (Phase 2)**

**Composant** : `CustomPeriodSelector` (réutilisable depuis dashboard)

**Avantages** :
- ✅ Plus de flexibilité (plages personnalisées)
- ✅ Calendrier visuel
- ✅ Presets rapides
- ✅ Cohérent avec le dashboard (si utilisé)

**Inconvénients** :
- ❌ Plus complexe à intégrer
- ❌ Nécessite gestion des URL params (`startDate`, `endDate`)
- ❌ Peut être "overkill" pour une page détail

**Implémentation** :
```typescript
import { CustomPeriodSelector } from '@/components/dashboard/ceo/custom-period-selector';

// Gérer les dates depuis searchParams
const customRange = getCustomRangeFromParams(searchParams);
const effectivePeriodStart = customRange?.start ?? periodStart;
const effectivePeriodEnd = customRange?.end ?? periodEnd;
```

### Recommandation : Option 1 (Simple) + URL Params

**Pourquoi** :
1. **Simplicité** : Suffisant pour 90% des cas d'usage
2. **Cohérence** : Même pattern que le dashboard principal
3. **Performance** : Moins de code, moins de complexité
4. **Évolutif** : Peut être remplacé par Option 2 si besoin

**Structure Proposée** :

```typescript
// src/app/(main)/config/companies/[id]/page.tsx
type CompanyDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ 
    edit?: string;
    period?: Period; // Nouveau paramètre
  }>;
};

export default async function CompanyDetailPage({
  params,
  searchParams
}: CompanyDetailPageProps) {
  const { id } = await params;
  const { edit, period: periodParam } = await searchParams;
  
  // Parser la période (défaut: month)
  const period: Period = ['week', 'month', 'quarter', 'year'].includes(periodParam as string)
    ? (periodParam as Period)
    : 'month';
  
  const { periodStart, periodEnd } = getPeriodRange(period);
  
  // Charger les stats avec la période
  const [company, history, stats] = await Promise.all([
    loadCompany(id),
    loadCompanyHistory(id),
    loadCompanyStats(id, periodStart, periodEnd, period)
  ]);
  
  // ...
}
```

**Composant Client pour le Sélecteur** :

```typescript
// src/components/companies/company-stats-period-selector.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PeriodSelector } from '@/components/dashboard/ceo/period-selector';
import type { Period } from '@/types/dashboard';

export function CompanyStatsPeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPeriod = (searchParams.get('period') as Period) || 'month';
  
  const handlePeriodChange = (period: Period) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', period);
    router.push(`?${params.toString()}`, { scroll: false });
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">
        Période :
      </span>
      <PeriodSelector 
        value={currentPeriod} 
        onChange={handlePeriodChange} 
      />
    </div>
  );
}
```

**Emplacement dans le Layout** :

```
┌─────────────────────────────────────────────────────────┐
│ 📊 STATISTIQUES                    [Période: ▼ month]    │
├─────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│ │ Distribution │  │ Évolution    │  │ Par Statut   │   │
│ └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Utilitaires à Créer/Extraire

**Fichier** : `src/lib/utils/period-utils.ts`

```typescript
import type { Period } from '@/types/dashboard';

/**
 * Calcule la plage de dates pour une période donnée
 * 
 * @param period - Période (week, month, quarter, year)
 * @returns Objet avec periodStart et periodEnd (ISO strings)
 */
export function getPeriodRange(period: Period): { 
  periodStart: string; 
  periodEnd: string 
} {
  const now = new Date();
  const end = now.toISOString();

  const start = new Date(now);
  if (period === 'week') start.setDate(now.getDate() - 7);
  if (period === 'month') start.setDate(1);
  if (period === 'quarter') start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === 'year') start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);

  return { periodStart: start.toISOString(), periodEnd: end };
}

/**
 * Parse une période depuis les searchParams
 * 
 * @param periodParam - Paramètre de période depuis l'URL
 * @returns Période valide ou 'month' par défaut
 */
export function parsePeriodFromParams(
  periodParam: string | string[] | undefined
): Period {
  if (!periodParam || typeof periodParam !== 'string') return 'month';
  if (['week', 'month', 'quarter', 'year'].includes(periodParam)) {
    return periodParam as Period;
  }
  return 'month';
}
```

### Services de Stats avec Période

Tous les services de stats doivent accepter `periodStart`, `periodEnd` et `period` :

```typescript
// src/services/companies/stats/company-tickets-evolution-stats.ts
export async function getCompanyTicketsEvolutionStats(
  companyId: string,
  periodStart: string,
  periodEnd: string,
  period: Period = 'month'
): Promise<CompanyTicketsEvolutionStats | null> {
  const supabase = await createSupabaseServerClient();
  
  // Utiliser la fonction PostgreSQL optimisée si disponible
  // Sinon, requête directe avec filtres
  const { data, error } = await supabase.rpc('get_tickets_evolution_stats', {
    p_company_id: companyId, // Nouveau paramètre
    p_period_start: periodStart,
    p_period_end: periodEnd,
    p_granularity: getGranularity(period, periodStart, periodEnd),
  });
  
  // ...
}
```

---

## ✅ Prochaines Étapes

1. **Valider l'option** (A ou B) avec l'utilisateur
2. **Valider le choix de période** (Option 1 Simple recommandée)
3. **Extraire `getPeriodRange`** dans `src/lib/utils/period-utils.ts`
4. **Créer `CompanyStatsPeriodSelector`** (composant client)
5. **Créer les services de stats** avec support période
6. **Créer les composants charts** en suivant les patterns identifiés
7. **Intégrer dans la page** avec lazy loading et gestion URL params
8. **Tester responsive** (mobile/tablet/desktop)

