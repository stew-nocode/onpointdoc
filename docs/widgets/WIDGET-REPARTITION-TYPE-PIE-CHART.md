# 📊 Widget - Répartition par Type (Pie Chart)

**Date de création**: 2025-01-16  
**Type**: Pie Chart  
**Filtres**: Agent Support (local)

---

## 📋 Description

Widget pie chart (graphique en secteurs) affichant la répartition des tickets créés par type (BUG, REQ, ASSISTANCE) avec un filtre local par agent Support.

**Basé sur**: Architecture du widget "Évolution Performance Support"

---

## 🎯 Fonctionnalités

### ✅ Caractéristiques

- **Pie Chart** : Visualisation en secteurs avec pourcentages
- **Filtre Agent** : Multi-sélection d'agents Support
- **Respect des filtres globaux** : Année et Période personnalisée
- **Données temps réel** : Chargement via Server Action avec debouncing
- **Dark Mode** : Support complet du mode sombre
- **Responsive** : Adaptatif à toutes les tailles d'écran

### 🎨 Design

- **Couleurs cohérentes** : Utilise les mêmes couleurs que Support Evolution
  - BUG : Rouge (#EF4444)
  - REQ : Bleu (#3B82F6)
  - ASSISTANCE : Vert (#10B981)
- **Donut Chart** : Style donut (trou au centre) pour un design moderne
- **Labels de pourcentage** : Affichage automatique des % sur chaque secteur

---

## 📁 Structure des Fichiers

```
src/
├── services/dashboard/
│   └── tickets-by-type-distribution.ts    # Service de comptage
├── app/actions/
│   └── dashboard-tickets-by-type.ts       # Server Action
└── components/dashboard/manager/
    ├── tickets-by-type-pie-chart.tsx           # Composant Client (pie chart)
    ├── tickets-by-type-pie-chart-server.tsx    # Composant Server wrapper
    ├── tickets-by-type-pie-chart-filters.tsx   # Composant de filtres
    └── tickets-by-type-pie-chart-skeleton.tsx  # Skeleton de chargement
```

---

## 🔧 Architecture

### Flux de Données

```
TicketsByTypePieChartServer (Client Component)
  ↓
  getTicketsByTypeDistributionAction (Server Action)
  ↓
  getTicketsByTypeDistribution (Service avec React.cache)
  ↓
  countTicketsByType (Requête Supabase)
  ↓
  TicketsByTypePieChart (Affichage du pie chart)
```

### Composants

1. **TicketsByTypePieChartServer** : Wrapper serveur qui charge les données
2. **TicketsByTypePieChart** : Composant client avec le pie chart
3. **TicketsByTypePieChartFilters** : Composant de filtres (agents)
4. **TicketsByTypePieChartSkeleton** : Skeleton de chargement

---

## 📊 Données

### Structure de Données

```typescript
type TicketTypeDistribution = {
  BUG: number;
  REQ: number;
  ASSISTANCE: number;
  total: number;
};

type TicketsByTypeDistributionData = {
  distribution: TicketTypeDistribution;
  agents: Array<{ id: string; name: string }>;
  period: Period | string;
  periodStart: string;
  periodEnd: string;
  selectedAgents?: string[];
};
```

---

## 🔍 Filtres

### Filtres Globaux (Dashboard)

- ✅ **Année** : Respecte le filtre année du dashboard
- ✅ **Période personnalisée** : Respecte le filtre période personnalisée

### Filtres Locaux (Widget)

- ✅ **Agent Support** : Multi-sélection d'agents
  - Tous par défaut (affiche tous les agents)
  - Filtre par `created_by` dans la requête SQL

---

## ✅ Améliorations par rapport au widget Support Evolution

1. **Pie Chart au lieu de Line Chart** : Visualisation plus adaptée pour une répartition
2. **Filtre simplifié** : Uniquement les agents (pas de dimensions)
3. **Donut Chart** : Style moderne avec trou au centre
4. **Labels automatiques** : Pourcentages affichés directement sur le graphique
5. **Couleurs cohérentes** : Mêmes couleurs que Support Evolution pour la cohérence

---

## 📋 Intégration

### Enregistrement dans le Registry

```typescript
ticketsByTypePieChart: {
  component: TicketsByTypePieChartServer,
  layoutType: 'chart',
  title: 'Répartition par Type',
  description: 'Répartition des tickets créés par type (BUG, REQ, ASSISTANCE) avec filtre par agent Support',
}
```

### Mapper de Données

```typescript
ticketsByTypePieChart: (data) => ({
  period: data.period,
  periodStart: data.periodStart,
  periodEnd: data.periodEnd,
})
```

---

## 🎯 Utilisation

1. Le widget apparaît dans la liste des widgets disponibles pour le rôle "direction" ou "manager"
2. Il peut être activé/désactivé via les préférences utilisateur
3. Il respecte automatiquement les filtres globaux (année/période)
4. L'utilisateur peut filtrer par agent via le bouton "Filtres"

---

## 🔄 Évolutions Futures (Optionnelles)

1. **Filtre par produit** : Ajouter un filtre par produit
2. **Filtre par module** : Ajouter un filtre par module
3. **Comparaison période précédente** : Afficher les tendances
4. **Export** : Permettre l'export du graphique en image

---

**Statut**: ✅ **Widget créé et prêt à l'utilisation**


