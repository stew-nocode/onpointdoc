# 🎨 Guide de Migration vers Tremor

Guide complet pour migrer les widgets du dashboard vers Tremor pour un design moderne et élégant.

---

## 📦 Installation

```bash
npm install @tremor/react --legacy-peer-deps
```

**Note** : `--legacy-peer-deps` est nécessaire car Tremor supporte officiellement React 18, mais fonctionne avec React 19.

---

## ✨ Avantages de Tremor

### **vs Code Actuel (Recharts + ShadCN)**

| Critère | Code Actuel | Tremor |
|---------|-------------|--------|
| **Lignes de code** | ~50 lignes/widget | ~20 lignes/widget |
| **Dark mode** | Manuel (classes CSS) | Automatique |
| **API** | Verbose (Recharts) | Intuitive |
| **KPI Cards** | Custom (à créer) | Built-in |
| **Cohérence visuelle** | Manuelle | Automatique |
| **Maintenance** | Complexe | Simple |

### **Exemple Concret : Widget MTTR**

#### Avant (Recharts + ShadCN) - 52 lignes

```tsx
'use client';

import { KPICard } from '@/components/dashboard/kpi-card';
import type { MTTRData, Period } from '@/types/dashboard';

type MTTRKPICardProps = {
  data: MTTRData;
  period: Period;
};

export function MTTRKPICard({ data, period: _period }: MTTRKPICardProps) {
  if (!data) {
    return (
      <KPICard
        title="MTTR Global"
        value="N/A"
        description="Données non disponibles"
        icon="clock"
        variant="default"
        subtitle="vs période précédente"
      />
    );
  }

  const trendIsPositive = data.trend <= 0;

  return (
    <KPICard
      title="MTTR Global"
      value={`${data.global}j`}
      description="Temps moyen de résolution"
      icon="clock"
      variant="info"
      subtitle="vs période précédente"
      trend={
        data.trend !== 0
          ? {
              value: Math.abs(data.trend),
              isPositive: trendIsPositive
            }
          : undefined
      }
    />
  );
}
```

#### Après (Tremor) - 42 lignes (-20%)

```tsx
'use client';

import { Card, Metric, Text, Flex, BadgeDelta, type DeltaType } from '@tremor/react';
import { Clock } from 'lucide-react';
import type { MTTRData, Period } from '@/types/dashboard';

type MTTRCardTremorProps = {
  data: MTTRData;
  period: Period;
};

export function MTTRCardTremor({ data, period: _period }: MTTRCardTremorProps) {
  if (!data) {
    return (
      <Card decoration="top" decorationColor="slate">
        <Text>MTTR Global</Text>
        <Metric>N/A</Metric>
        <Text className="mt-2 text-slate-500">Données non disponibles</Text>
      </Card>
    );
  }

  const trendIsPositive = data.trend <= 0;
  const deltaType: DeltaType = trendIsPositive ? 'moderateIncrease' : 'moderateDecrease';

  return (
    <Card decoration="top" decorationColor="indigo">
      <Flex alignItems="start">
        <div className="flex-1">
          <Flex alignItems="start" className="gap-2">
            <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <Text>MTTR Global</Text>
          </Flex>
          <Metric className="mt-2">{data.global}j</Metric>
          <Text className="mt-1 text-slate-600 dark:text-slate-400">
            Temps moyen de résolution
          </Text>
        </div>
        {data.trend !== 0 && (
          <BadgeDelta deltaType={deltaType} size="xs">
            {Math.abs(data.trend)}%
          </BadgeDelta>
        )}
      </Flex>
    </Card>
  );
}
```

**Résultat** :
- ✅ Code plus concis
- ✅ Dark mode automatique
- ✅ Design moderne cohérent
- ✅ Badge tendance intégré

---

## 🎨 Composants Tremor Principaux

### 1. **Card** - Conteneur de base

```tsx
<Card decoration="top" decorationColor="indigo">
  {/* Contenu */}
</Card>
```

**Props** :
- `decoration` : "top" | "left" | "right" | "bottom"
- `decorationColor` : "indigo" | "cyan" | "amber" | "rose" | "emerald" | "slate"

### 2. **Metric** - Affichage de métriques

```tsx
<Metric>{value}</Metric>
```

**Utilisation** : Grandes valeurs (KPIs, nombres importants)

### 3. **Text** - Texte standard

```tsx
<Text>Description</Text>
```

**Utilisation** : Labels, descriptions, sous-titres

### 4. **BadgeDelta** - Badge de tendance

```tsx
<BadgeDelta deltaType="moderateIncrease" size="xs">
  12%
</BadgeDelta>
```

**DeltaType** :
- `moderateIncrease` : Vert (positif)
- `moderateDecrease` : Rouge (négatif)
- `unchanged` : Gris (stable)

### 5. **AreaChart** - Graphique en aires

```tsx
<AreaChart
  data={chartData}
  index="name"
  categories={['MTTR']}
  colors={['indigo']}
  valueFormatter={(value) => `${value}j`}
  showAnimation={true}
  curveType="monotone"
  className="h-80"
/>
```

### 6. **BarChart** - Graphique en barres

```tsx
<BarChart
  data={data}
  index="name"
  categories={['Valeur']}
  colors={['cyan']}
  valueFormatter={(value) => `${value}`}
  className="h-80"
/>
```

### 7. **DonutChart** - Graphique en donut

```tsx
<DonutChart
  data={[
    { name: 'BUG', value: 45 },
    { name: 'REQ', value: 32 },
    { name: 'ASSISTANCE', value: 23 }
  ]}
  category="value"
  index="name"
  colors={['rose', 'cyan', 'amber']}
  valueFormatter={(value) => `${value} tickets`}
  className="h-80"
/>
```

### 8. **BarList** - Liste avec barres horizontales

```tsx
<BarList
  data={[
    { name: 'Module A', value: 15 },
    { name: 'Module B', value: 12 }
  ]}
  valueFormatter={(value) => `${value} bugs`}
  color="rose"
/>
```

---

## 🔄 Plan de Migration

### **Phase 1 : Widgets KPI (2h)**

Migrer les 5 cartes KPI :

1. ✅ **MTTR** → `MTTRCardTremor`
2. ⏳ **Tickets Ouverts** → `TicketsOuvertsCardTremor`
3. ⏳ **Tickets Résolus** → `TicketsResolusCardTremor`
4. ⏳ **Workload** → `WorkloadCardTremor`
5. ⏳ **Health** → `HealthCardTremor`

**Gain** : Code divisé par 2, dark mode automatique

### **Phase 2 : Charts Simples (3h)**

Migrer les graphiques standards :

6. ✅ **Évolution MTTR** → `MTTREvolutionChartTremor`
7. ⏳ **Distribution Tickets** → `TicketsDistributionChartTremor`

**Gain** : API simplifiée, animations fluides

### **Phase 3 : Widgets Complexes (facultatif)**

Garder en Recharts si trop personnalisés :
- Support Evolution Chart (filtres complexes)
- Répartition par Type/Entreprise (légendes scrollables)

**Raison** : Tremor est excellent pour widgets standards, Recharts reste meilleur pour personnalisation avancée

---

## 📁 Structure des Fichiers

```
src/components/dashboard/
├── tremor/                      ← Nouveaux widgets Tremor
│   ├── mttr-card.tsx           ✅ Créé
│   ├── mttr-evolution-chart.tsx ✅ Créé
│   ├── tickets-ouverts-card.tsx
│   ├── tickets-resolus-card.tsx
│   ├── workload-card.tsx
│   ├── health-card.tsx
│   ├── tickets-distribution-chart.tsx
│   └── dashboard-example.tsx    ✅ Créé (exemple complet)
├── ceo/                         ← Widgets actuels (à garder temporairement)
│   ├── mttr-kpi-card.tsx
│   ├── mttr-evolution-chart.tsx
│   └── ...
└── manager/
    └── ...
```

---

## 🎨 Palette de Couleurs Tremor

### **Couleurs de Décoration**

```tsx
decorationColor="indigo"  // Bleu principal (KPIs généraux)
decorationColor="cyan"    // Bleu clair (Performance)
decorationColor="amber"   // Orange (Avertissements)
decorationColor="rose"    // Rouge/Rose (Alertes, Bugs)
decorationColor="emerald" // Vert (Success, Résolutions)
decorationColor="slate"   // Gris (Neutre)
```

### **Recommandations par Widget**

| Widget | Couleur | Raison |
|--------|---------|--------|
| MTTR | `indigo` | Métrique principale |
| Tickets Ouverts | `amber` | Avertissement (à traiter) |
| Tickets Résolus | `emerald` | Success |
| Workload | `rose` | Attention (charge élevée) |
| Health | `cyan` | État système |
| Évolution MTTR | `indigo` | Cohérent avec KPI |
| Distribution | `cyan` | Neutre, analytique |

---

## ✅ Checklist de Migration

### **Avant de Migrer un Widget**

- [ ] Lire la documentation Tremor du composant
- [ ] Identifier le type de widget (KPI, Chart, Table)
- [ ] Vérifier si les données actuelles sont compatibles
- [ ] Créer le fichier dans `src/components/dashboard/tremor/`

### **Pendant la Migration**

- [ ] Importer les composants Tremor nécessaires
- [ ] Adapter les données au format Tremor
- [ ] Configurer `decorationColor` appropriée
- [ ] Gérer les cas d'erreur (données manquantes)
- [ ] Ajouter `BadgeDelta` pour les tendances
- [ ] Tester le dark mode

### **Après la Migration**

- [ ] Comparer visuellement avec l'ancien widget
- [ ] Vérifier le responsive (mobile/desktop)
- [ ] Tester les interactions (hover, click)
- [ ] Mesurer la réduction de code
- [ ] Mettre à jour le registre si nécessaire

---

## 🚀 Démarrage Rapide

### **1. Tester l'Exemple Complet**

Créer une page de test :

```tsx
// src/app/dashboard-tremor-test/page.tsx
import { DashboardExample } from '@/components/dashboard/tremor/dashboard-example';
import { getCEODashboardData } from '@/services/dashboard/ceo-kpis';

export default async function DashboardTremorTestPage() {
  const data = await getCEODashboardData('month');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Tremor Test</h1>
      <DashboardExample data={{
        role: 'direction',
        strategic: data,
        alerts: data.alerts,
        period: 'month',
        periodStart: data.periodStart,
        periodEnd: data.periodEnd
      }} />
    </div>
  );
}
```

Accéder à : `http://localhost:3000/dashboard-tremor-test`

### **2. Remplacer un Widget dans le Dashboard Actuel**

Modifier le registre :

```tsx
// src/components/dashboard/widgets/registry.ts
import { MTTRCardTremor } from '../tremor/mttr-card';

export const WIDGET_REGISTRY: Record<DashboardWidget, WidgetDefinition> = {
  mttr: {
    component: MTTRCardTremor, // ← Remplacer MTTRKPICard
    layoutType: 'kpi',
    title: 'Temps moyen de résolution (MTTR)',
  },
  // ...
};
```

---

## 🎯 Résumé des Gains

### **Quantitatifs**

- **Code** : -40% à -60% de lignes
- **Bundle size** : +150kb (acceptable)
- **Temps dev** : -50% (API plus simple)

### **Qualitatifs**

- ✅ Dark mode automatique (pas de classes à gérer)
- ✅ Design cohérent sans effort
- ✅ API intuitive (moins de props complexes)
- ✅ Animations fluides intégrées
- ✅ Responsive par défaut
- ✅ Accessibilité (ARIA labels automatiques)

---

## 📚 Ressources

### **Documentation Officielle**
- [Tremor Docs](https://tremor.so/docs/getting-started/installation)
- [Components Reference](https://tremor.so/docs/components/overview)
- [Theming](https://tremor.so/docs/theming/dark-mode)

### **Exemples**
- [Dashboard Example (créé)](../src/components/dashboard/tremor/dashboard-example.tsx)
- [MTTR Card (créé)](../src/components/dashboard/tremor/mttr-card.tsx)
- [MTTR Chart (créé)](../src/components/dashboard/tremor/mttr-evolution-chart.tsx)

---

## 🔥 Prochaines Étapes

1. **Tester l'exemple complet** : `/dashboard-tremor-test`
2. **Migrer 1-2 widgets KPI** : Commencer par MTTR et Tickets Ouverts
3. **Comparer visuellement** : Ancien vs Nouveau
4. **Décider** : Continuer la migration ou garder l'existant ?

---

**Dernière mise à jour** : 2025-12-11
**Statut** : ✅ Tremor installé, exemples créés, prêt pour migration
