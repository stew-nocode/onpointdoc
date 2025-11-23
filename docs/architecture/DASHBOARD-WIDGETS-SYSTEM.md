# Système de Widgets Dashboard - Architecture Clean Code

## 🎯 Vue d'ensemble

Architecture modulaire permettant d'ajouter facilement des widgets (graphiques, tableaux, KPIs) au dashboard, avec :
- **Affectation par rôle** (Admin) : widgets disponibles pour chaque rôle
- **Personnalisation utilisateur** : chaque utilisateur peut masquer les widgets affectés à son rôle
- **Layout responsive automatique** : adaptation selon le type de widget (kpi/chart/table/full-width)

## 📁 Structure des fichiers

### Types
- `src/types/dashboard-widgets.ts` : Types TypeScript pour widgets, configurations, préférences

### Services (Logique métier)
- `src/services/dashboard/widgets/role-widgets.ts` : Gestion widgets par rôle (admin)
- `src/services/dashboard/widgets/user-preferences.ts` : Gestion préférences utilisateur
- `src/services/dashboard/widgets/user-config.ts` : Calcul configuration finale
- `src/services/dashboard/widgets/default-widgets.ts` : Configuration par défaut

### Composants React
- `src/components/dashboard/widgets/registry.ts` : Registre centralisé des widgets
- `src/components/dashboard/widgets/widget-grid.tsx` : Grille responsive automatique
- `src/components/dashboard/unified-dashboard-with-widgets.tsx` : Dashboard utilisant le système
- `src/components/dashboard/admin/dashboard-widgets-config-client.tsx` : Interface admin
- `src/components/dashboard/user/widget-preferences-dialog.tsx` : Interface utilisateur
- `src/components/dashboard/admin/widget-config-tab.tsx` : Tab de configuration (sous-composant)
- `src/components/dashboard/admin/widget-list-item.tsx` : Item de liste widget (sous-composant)
- `src/components/dashboard/user/widget-preference-item.tsx` : Item de préférence (sous-composant)

### Hooks personnalisés
- `src/hooks/dashboard/use-widget-config-save.ts` : Hook pour sauvegarder config admin
- `src/hooks/dashboard/use-widget-preferences-save.ts` : Hook pour sauvegarder préférences
- `src/hooks/dashboard/use-realtime-widget-config.ts` : Hook pour temps réel config widgets
- `src/hooks/dashboard/use-realtime-dashboard-data.ts` : Hook pour temps réel données dashboard

### Routes API
- `GET/POST /api/dashboard/widgets/role` : Gestion widgets par rôle (admin)
- `GET/POST/DELETE /api/dashboard/widgets/preferences` : Gestion préférences utilisateur
- `GET /api/dashboard/widgets/config` : Configuration finale pour utilisateur
- `POST /api/dashboard/widgets/initialize` : Initialisation widgets par défaut

### Constantes centralisées
- `src/lib/constants/widget-labels.ts` : Labels des widgets et rôles (ROLE_LABELS, WIDGET_LABELS)
- `src/lib/constants/dashboard-roles.ts` : Liste des rôles (ALL_DASHBOARD_ROLES)

### Migrations Base de données
- Tables créées via Supabase MCP :
  - `dashboard_role_widgets` : Affectation widgets par rôle
  - `dashboard_user_preferences` : Préférences utilisateur (widgets masqués)

## 🚀 Ajouter un nouveau widget

### Étape 1 : Créer le composant du widget

```typescript
// src/components/dashboard/widgets/my-new-widget.tsx
'use client';

export function MyNewWidget({ data }: { data: MyWidgetData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mon Nouveau Widget</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Votre widget ici */}
      </CardContent>
    </Card>
  );
}
```

### Étape 2 : Enregistrer dans le registry

```typescript
// src/components/dashboard/widgets/registry.ts
import { MyNewWidget } from './my-new-widget';

export const WIDGET_REGISTRY: Record<DashboardWidget, WidgetDefinition> = {
  // ... widgets existants
  myNewWidget: {
    component: MyNewWidget,
    layoutType: 'chart', // ou 'kpi', 'table', 'full-width'
    title: 'Mon Nouveau Widget',
    description: 'Description du widget',
  },
};
```

### Étape 3 : Ajouter le mapper de données

```typescript
// src/components/dashboard/widgets/registry.ts
export const WIDGET_DATA_MAPPERS: Record<DashboardWidget, WidgetDataMapper> = {
  // ... mappers existants
  myNewWidget: (data) => ({ data: data.strategic?.myWidgetData }),
};
```

### Étape 4 : Ajouter le type

```typescript
// src/types/dashboard-widgets.ts
export type DashboardWidget = 
  | 'mttr'
  | 'flux'
  | 'workload'
  | 'health'
  | 'alerts'
  | 'myNewWidget'; // ✅ Ajouté
```

### Étape 5 : Ajouter le label

```typescript
// src/lib/constants/widget-labels.ts
export const WIDGET_LABELS: Record<DashboardWidget, string> = {
  // ... labels existants
  myNewWidget: 'Mon Nouveau Widget',
};
```

### Étape 6 : Affecter le widget à un rôle (Admin)

Aller sur `/config/dashboard/widgets` et activer le widget pour le rôle souhaité.

## 📐 Layout responsive automatique

Le système adapte automatiquement le layout selon le type de widget :

- **kpi** : 1 colonne (petit, côte à côte sur desktop)
- **chart/table** : 2 colonnes (moyen, pleine largeur)
- **full-width** : 3 colonnes (pleine largeur, pour alertes)

Sur mobile : tous les widgets en 1 colonne (stack vertical).

## 🔐 Sécurité

- **RLS activée** sur toutes les tables
- **Admin uniquement** pour affecter widgets aux rôles
- **Utilisateur uniquement** pour ses propres préférences
- **Lecture publique** des widgets affectés aux rôles

## ⚡ Temps réel

Le dashboard se met à jour automatiquement lors de :
- Changements sur les tables `tickets`, `activities`, `tasks`
- Modifications de la configuration des widgets (admin)
- Modifications des préférences utilisateur

## 📊 Statistiques Clean Code

- ✅ TypeScript : 0 erreur
- ✅ Composants : Tous < 100 lignes (ou justifiés)
- ✅ Fonctions : Tous < 20 lignes (ou justifiées)
- ✅ Duplications : Éliminées (constantes centralisées, hooks réutilisables)
- ✅ Séparation des responsabilités : Services / Composants / Hooks

## 🎨 Principes appliqués

1. **SOLID** : Responsabilités isolées, ouverture à l'extension
2. **DRY** : Pas de duplication, code réutilisable
3. **KISS** : Simplicité avant tout
4. **YAGNI** : Pas de fonctionnalités "au cas où"
5. **Clean Architecture** : Couches séparées (UI / Services / Infrastructure)

