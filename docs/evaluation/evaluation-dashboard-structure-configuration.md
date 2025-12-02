# Évaluation - Structure Dashboard et Panneau de Configuration

**Date**: 30 novembre 2025  
**Évalué avec**: MCP Next.js, MCP Supabase, Analyse du codebase

---

## 📋 Vue d'Ensemble

Le dashboard d'OnpointDoc est un système de widgets modulaire avec configuration multi-niveaux (admin, rôle, utilisateur). Cette évaluation analyse la structure, le panneau de configuration et les optimisations possibles.

---

## 🏗️ Architecture Actuelle

### 1. Structure des Pages

#### Page Dashboard Principale (`/dashboard`)
- **Fichier**: `src/app/(main)/dashboard/page.tsx`
- **Type**: Server Component (Next.js App Router)
- **Responsabilités**:
  - Détermine le rôle de l'utilisateur
  - Charge les données initiales selon le rôle
  - Charge la configuration des widgets
  - Passe les props au Client Component

**Points forts**:
- ✅ Utilisation de `unstable_noStore()` pour éviter le cache
- ✅ Chargement conditionnel des données selon le rôle
- ✅ Séparation claire Server/Client Components

**Points d'amélioration**:
- ⚠️ Import dynamique des services (`import('@/services/dashboard/ceo-kpis')`) - pourrait être optimisé
- ⚠️ Calcul de `periodStart` et `periodEnd` marqué comme TODO

#### Page Configuration Admin (`/config/dashboard`)
- **Fichier**: `src/app/(main)/config/dashboard/page.tsx`
- **Type**: Server Component
- **Accès**: Restreint aux admins uniquement
- **Responsabilités**:
  - Vérifie les permissions admin
  - Charge toutes les configurations de rôles
  - Passe les données au Client Component

**Points forts**:
- ✅ Protection d'accès claire
- ✅ Message d'erreur explicite si non-admin

---

### 2. Système de Widgets

#### Registry Centralisé
- **Fichier**: `src/components/dashboard/widgets/registry.ts`
- **Widgets disponibles**: 10 widgets
  - 5 KPIs: `mttr`, `tickets-ouverts`, `tickets-resolus`, `workload`, `health`
  - 2 Charts: `mttrEvolution`, `ticketsDistribution`
  - 2 Tables: `topBugsModules`, `workloadByAgent`
  - 1 Section: `alerts` (full-width)

**Structure**:
```typescript
WIDGET_REGISTRY: {
  widgetId: {
    component: ComponentType,
    layoutType: 'kpi' | 'chart' | 'table' | 'full-width',
    title: string,
    description?: string
  }
}
```

**Points forts**:
- ✅ Système extensible (ajout facile de nouveaux widgets)
- ✅ Mapping automatique des données aux props
- ✅ Valeurs par défaut pour éviter les erreurs

**Points d'amélioration**:
- ⚠️ Type `ComponentType<any>` - perte de sécurité de type
- 💡 Suggestion: Créer un type générique pour les props de widget

#### Widget Grid
- **Fichier**: `src/components/dashboard/widgets/widget-grid.tsx`
- **Layouts**:
  - KPIs: Flexbox responsive (min-width: 280px)
  - Charts: Flexbox responsive (min-width: 400px, hauteur: 420px)
  - Tables: Flexbox responsive (min-width: 400px, hauteur: 420px)
  - Full-width: Pleine largeur

**Points forts**:
- ✅ Responsive design
- ✅ Mémorisation des widgets avec `React.memo`
- ✅ Groupement par type de layout

---

### 3. Configuration Multi-Niveaux

#### Niveau 1: Configuration par Rôle (Admin)
- **Table**: `dashboard_configurations`
- **Service**: `src/services/dashboard/config.ts`
- **Champs**:
  - `role`: DashboardRole ('direction' | 'manager' | 'agent' | 'admin')
  - `visible_widgets`: Array<DashboardWidget> (widgets activés)
  - `sections`: Record<DashboardSectionKey, boolean> (sections visibles)
  - `created_at`, `updated_at`

**Structure**:
```sql
dashboard_configurations (
  id UUID PRIMARY KEY,
  role TEXT UNIQUE NOT NULL,
  visible_widgets JSONB,
  sections JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Fonctionnalités**:
- ✅ Configuration par défaut si aucune config en DB
- ✅ CRUD complet (create, read, update, reset to defaults)
- ✅ Page admin avec onglets par rôle

**Points d'amélioration**:
- ⚠️ Pas de validation Zod pour `visible_widgets` et `sections`
- 💡 Suggestion: Ajouter validation Zod pour sécurité

#### Niveau 2: Préférences Utilisateur
- **Table**: `dashboard_user_widget_preferences`
- **Service**: `src/services/dashboard/widgets/user-preferences.ts`
- **Champs**:
  - `user_id`: UUID (FK vers profiles)
  - `hidden_widgets`: Array<DashboardWidget> (widgets masqués par l'utilisateur)
  - `updated_at`: TIMESTAMPTZ

**Logique**:
```
Widgets visibles = Widgets du rôle - Widgets masqués par l'utilisateur
```

**Points forts**:
- ✅ Personnalisation fine par utilisateur
- ✅ Dialog de préférences accessible depuis le dashboard

**Points d'amélioration**:
- ⚠️ Pas de possibilité de réorganiser les widgets (ordre)
- 💡 Suggestion: Ajouter un système de drag-and-drop

---

### 4. Chargement des Données

#### Dashboard Principal
- **Composant**: `UnifiedDashboardWithWidgets`
- **Type**: Client Component
- **Hooks temps réel**:
  - `useRealtimeDashboardData`: Écoute les changements sur `tickets`, `activities`, `tasks`
  - `useRealtimeWidgetConfig`: Écoute les changements sur la configuration

**Flow de données**:
1. Server Component charge les données initiales
2. Client Component reçoit les props
3. Hooks Supabase Realtime s'abonnent aux changements
4. Rechargement automatique lors des changements

**Points forts**:
- ✅ Rafraîchissement temps réel
- ✅ Utilisation de `useMemo` pour éviter les recalculs
- ✅ Gestion des erreurs

**Points d'amélioration**:
- ⚠️ Rechargement complet des données à chaque changement (pas de cache)
- ⚠️ Pas de debounce/throttle sur les événements temps réel
- 💡 Suggestion: Implémenter un système de cache avec revalidation partielle

---

### 5. Panneau de Configuration Admin

#### Structure
- **Page**: `/config/dashboard`
- **Composant principal**: `DashboardConfigPageClient`
- **Sous-composants**:
  - `DashboardConfigForm`: Formulaire de configuration par rôle
  - `DashboardConfigSectionList`: Liste des sections à activer/désactiver
  - `DashboardConfigActions`: Boutons sauvegarder/reset

#### Interface
- **Onglets**: Un onglet par rôle (Direction, Manager, Agent, Admin)
- **Sections configurables**:
  - Affichage par blocs (KPIs, Charts, Tables, Alertes)
  - Activer/désactiver chaque section
- **Actions**:
  - Sauvegarder les modifications
  - Réinitialiser aux valeurs par défaut

**Points forts**:
- ✅ Interface claire et intuitive
- ✅ Onglets par rôle pour organisation
- ✅ Feedback visuel (loading states)

**Points d'amélioration**:
- ⚠️ Pas de preview des widgets avant sauvegarde
- ⚠️ Pas de validation côté client avant envoi
- ⚠️ Pas de possibilité de configurer l'ordre des widgets
- 💡 Suggestions:
  - Ajouter une preview en temps réel
  - Ajouter validation Zod côté client
  - Système de drag-and-drop pour réorganiser

---

## 📊 Analyse des Performances

### Server Components
- ✅ Utilisation correcte de Server Components pour le chargement initial
- ✅ `unstable_noStore()` pour éviter le cache (approprié pour données temps réel)
- ⚠️ Pas de streaming React Server Components pour les données lentes

### Client Components
- ✅ Mémorisation avec `React.memo` et `useMemo`
- ✅ Hooks optimisés avec callbacks stables
- ⚠️ Re-renders potentiels lors des changements temps réel

### Requêtes Base de Données
- ⚠️ Pas d'indexation visible sur `dashboard_configurations.role`
- ⚠️ Pas de pagination pour les widgets (mais limité à 10 widgets max)
- ✅ Requêtes optimisées avec sélection de colonnes spécifiques

---

## 🔒 Sécurité et Validation

### RLS (Row Level Security)
- ⚠️ **À vérifier**: RLS sur `dashboard_configurations`
- ⚠️ **À vérifier**: RLS sur `dashboard_user_widget_preferences`

### Validation
- ⚠️ Pas de validation Zod pour les configurations
- ⚠️ Pas de validation des widget IDs avant insertion
- 💡 Suggestions:
  - Ajouter schémas Zod pour `DashboardConfigurationInput`
  - Valider les widget IDs contre le registry

---

## 🎨 UX/UI

### Points Forts
- ✅ Interface responsive
- ✅ Loading states
- ✅ Messages d'erreur clairs
- ✅ Personnalisation par utilisateur

### Points d'Amélioration
- ⚠️ Pas de preview des widgets avant activation
- ⚠️ Pas de réorganisation drag-and-drop
- ⚠️ Pas de recherche/filtre dans la liste des widgets
- 💡 Suggestions:
  - Modal de preview
  - Drag-and-drop pour réorganiser
  - Filtre de recherche pour les widgets

---

## 📝 Recommandations

### Priorité Haute

1. **Ajouter validation Zod**
   - Schémas pour `DashboardConfigurationInput`
   - Validation des widget IDs
   - Validation des sections

2. **Vérifier et ajouter RLS**
   - RLS sur `dashboard_configurations` (lecture: tous, écriture: admin uniquement)
   - RLS sur `dashboard_user_widget_preferences` (lecture/écriture: propriétaire uniquement)

3. **Optimiser les requêtes temps réel**
   - Debounce/throttle sur les événements
   - Cache avec revalidation partielle

### Priorité Moyenne

4. **Système de preview**
   - Modal de preview des widgets avant sauvegarde
   - Aperçu du dashboard avec la nouvelle configuration

5. **Réorganisation des widgets**
   - Drag-and-drop pour réorganiser l'ordre
   - Sauvegarde de l'ordre dans la configuration

6. **Indexation base de données**
   - Index sur `dashboard_configurations.role`
   - Index sur `dashboard_user_widget_preferences.user_id`

### Priorité Basse

7. **Améliorer les types**
   - Types génériques pour les props de widgets
   - Éviter `ComponentType<any>`

8. **Streaming React Server Components**
   - Utiliser streaming pour les données lentes
   - Progressive loading des widgets

---

## 📚 Documentation

### Fichiers Clés
- `src/app/(main)/dashboard/page.tsx`: Page dashboard principale
- `src/app/(main)/config/dashboard/page.tsx`: Page configuration admin
- `src/components/dashboard/unified-dashboard-with-widgets.tsx`: Composant principal
- `src/components/dashboard/widgets/registry.ts`: Registry des widgets
- `src/services/dashboard/config.ts`: Service de configuration
- `src/services/dashboard/widgets/user-config.ts`: Service de configuration utilisateur

### Tables Supabase
- `dashboard_configurations`: Configuration par rôle
- `dashboard_user_widget_preferences`: Préférences utilisateur

---

## ✅ Conclusion

Le système de dashboard est bien structuré avec une architecture modulaire solide. Les principaux points d'amélioration concernent :
- La validation des données
- L'optimisation des performances (cache, debounce)
- L'UX (preview, réorganisation)

Le panneau de configuration est fonctionnel mais pourrait bénéficier d'une preview et d'un système de réorganisation des widgets.

**Score Global**: 7.5/10
- Architecture: 9/10
- Performance: 7/10
- Sécurité: 6/10
- UX: 7/10

