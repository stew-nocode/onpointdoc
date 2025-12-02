# Proposition : Widgets de Performance pour Agents Support

**Date**: 30 novembre 2025  
**Contexte**: Ajout de widgets graphiques pour suivre les performances des agents support  
**Objectif**: Permettre aux managers de suivre et analyser les performances individuelles et collectives

---

## 📊 Analyse de l'Existant

### ✅ Ce qui existe déjà

1. **Bibliothèque de graphiques**: `recharts@2.15.4` (déjà installée)
2. **Structure de widgets**: Système modulaire dans `src/components/dashboard/ceo/`
3. **KPIs basiques**: `src/services/tickets/support-kpis.ts` avec 4 métriques simples
4. **Types de données**: `WorkloadData`, `MTTRData` dans `src/types/dashboard.ts`
5. **Système de widgets**: Configuration dynamique via `dashboard_role_widgets` et `dashboard_user_preferences`

### 📋 Données disponibles dans Supabase

- **Table `tickets`**:
  - `assigned_to` (FK → profiles.id)
  - `created_at`, `updated_at`, `resolved_at`
  - `ticket_type` (BUG, REQ, ASSISTANCE)
  - `status`, `priority`, `canal`
  - `module_id` (via relation)
  
- **Table `profiles`**:
  - `id`, `full_name`, `role_id`, `department`
  
- **Table `ticket_status_history`**:
  - Historique des changements de statut
  - Permet de calculer le temps de résolution précis

---

## 🎯 Objectifs des Widgets

1. **Performance individuelle** par agent
2. **Comparaison entre agents** (benchmarking)
3. **Évolution temporelle** des métriques
4. **Filtrage flexible** (type de ticket, période, module, etc.)
5. **Actionnable** (identifier les points d'amélioration)

---

## 💡 Propositions de Widgets

### **Option 1: Scorecard Performance Agent (Recommandé)**

**Type**: Widget composé (KPI Cards + Mini Graphique)

**Métriques affichées**:
- ✅ **Tickets résolus** (période)
- ✅ **MTTR moyen** (temps de résolution)
- ✅ **Taux de résolution** (résolu / assigné)
- ✅ **Tickets en retard** (overdue)
- ✅ **Tendance** vs période précédente

**Graphique mini**: Évolution sur 7 jours

**Filtres**:
- Période (semaine, mois, trimestre)
- Type de ticket (BUG, REQ, ASSISTANCE, Tous)
- Module/Produit
- Agent (multiselect pour comparaison)

**Avantages**:
- Vue d'ensemble rapide
- Comparaison facile entre agents
- Indicateurs actionnables

---

### **Option 2: Graphique Évolution Performance (Recommandé)**

**Type**: Graphique linéaire ou barres (Recharts)

**Métriques affichées**:
- **Ligne 1**: Tickets résolus par jour/semaine
- **Ligne 2**: MTTR moyen (en jours)
- **Ligne 3**: Tickets créés (charge entrante)

**Filtres**:
- Période (7 jours, 30 jours, 90 jours)
- Type de ticket
- Agent(s) (comparaison multi-agents)
- Module/Produit

**Avantages**:
- Visualisation de tendances
- Détection de patterns (pic, baisse)
- Comparaison temporelle

---

### **Option 3: Heatmap Performance par Type (Avancé)**

**Type**: Heatmap (matrice)

**Axes**:
- **X**: Type de ticket (BUG, REQ, ASSISTANCE)
- **Y**: Agents
- **Couleur**: MTTR ou Nombre de tickets

**Filtres**:
- Période
- Module/Produit

**Avantages**:
- Identification rapide des forces/faiblesses par type
- Répartition de la charge visible

---

### **Option 4: Radar Chart Compétences (Avancé)**

**Type**: Radar Chart (Recharts)

**Axe**: 6 dimensions
1. **Vitesse de résolution** (MTTR inverse)
2. **Volume traité** (tickets résolus)
3. **Qualité** (taux de réouverture, si disponible)
4. **Réactivité** (temps moyen de première réponse)
5. **Assistance** (tickets ASSISTANCE)
6. **Bugs/Requêtes** (tickets BUG/REQ transférés)

**Filtres**:
- Période
- Agent(s) pour comparaison

**Avantages**:
- Profil de compétences visuel
- Identification des axes d'amélioration

---

### **Option 5: Tableau Comparatif avec Graphiques (Recommandé)**

**Type**: Table enrichie (comme `WorkloadByAgentTable` mais avec graphiques)

**Colonnes**:
- Agent
- Équipe/Département
- Tickets Actifs
- Tickets Résolus (période)
- MTTR Moyen
- Taux de Résolution
- Graphique mini (évolution 7 jours)

**Filtres**:
- Période
- Type de ticket
- Module/Produit
- Tri par colonne

**Avantages**:
- Vue comparative complète
- Actionnable (tri, filtres)
- Détails au survol

---

## 🎨 Meilleures Pratiques (Next.js + Clean Code)

### Architecture Recommandée

```
src/
├── services/
│   └── dashboard/
│       └── agent-performance.ts          # Calcul des métriques
├── components/
│   └── dashboard/
│       └── manager/                       # Nouveau dossier
│           ├── agent-performance-widget.tsx
│           ├── agent-performance-chart.tsx
│           ├── agent-performance-table.tsx
│           └── agent-performance-filters.tsx
└── types/
    └── dashboard.ts                       # Extension avec AgentPerformanceData
```

### Principes Clean Code

1. **Séparation des responsabilités**:
   - `services/`: Calcul des métriques (pure logique)
   - `components/`: Affichage uniquement
   - `types/`: Typage strict

2. **Composants < 100 lignes**:
   - Découpage atomique
   - Réutilisabilité

3. **Server Components par défaut**:
   - Fetch des données côté serveur
   - Client Components uniquement pour interactivité

4. **Mémoïsation**:
   - `React.cache()` pour les données
   - `useMemo`/`useCallback` côté client

5. **Gestion d'erreur**:
   - Try/catch systématique
   - Affichage d'erreurs gracieux

---

## 🔧 Implémentation Technique

### 1. Service de Calcul (Backend)

**Fichier**: `src/services/dashboard/agent-performance.ts`

```typescript
export type AgentPerformanceMetrics = {
  agentId: string;
  agentName: string;
  department: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    ticketsResolved: number;
    ticketsAssigned: number;
    ticketsOverdue: number;
    mttr: number; // en jours
    resolutionRate: number; // %
    byType: {
      BUG: { resolved: number; mttr: number };
      REQ: { resolved: number; mttr: number };
      ASSISTANCE: { resolved: number; mttr: number };
    };
  };
  trend: {
    ticketsResolvedTrend: number; // %
    mttrTrend: number; // %
  };
  evolution: {
    date: string; // ISO date
    resolved: number;
    mttr: number;
  }[];
};

export async function getAgentPerformanceMetrics(
  agentIds: string[],
  filters: {
    period: 'week' | 'month' | 'quarter';
    ticketTypes?: ('BUG' | 'REQ' | 'ASSISTANCE')[];
    moduleIds?: string[];
    productIds?: string[];
  }
): Promise<AgentPerformanceMetrics[]>
```

### 2. Widget Principal

**Fichier**: `src/components/dashboard/manager/agent-performance-widget.tsx`

- Server Component pour fetch initial
- Client Component pour interactivité (filtres)
- Suspense boundary pour loading
- Error boundary pour erreurs

### 3. Filtres

**Fichier**: `src/components/dashboard/manager/agent-performance-filters.tsx`

- Select période (Semaine, Mois, Trimestre)
- Multi-select type de ticket
- Multi-select agent
- Select module/produit
- Bouton "Appliquer" + URL params pour partage

### 4. Graphiques (Recharts)

**Types recommandés**:
- **LineChart**: Évolution temporelle
- **BarChart**: Comparaison entre agents
- **AreaChart**: Volume cumulé
- **RadarChart**: Profil de compétences

**Design**: Utiliser `@/ui/chart` (ChartContainer, ChartTooltip, etc.)

---

## 📊 Métriques à Calculer

### Métriques de Base

1. **Tickets Résolus**
   ```sql
   COUNT(*) WHERE status IN ('Resolue', 'Terminé', 'Terminé(e)')
   AND resolved_at BETWEEN period_start AND period_end
   ```

2. **MTTR (Mean Time To Resolution)**
   ```sql
   AVG(resolved_at - created_at) WHERE resolved_at IS NOT NULL
   ```

3. **Taux de Résolution**
   ```sql
   (tickets_resolved / tickets_assigned) * 100
   ```

4. **Tickets en Retard**
   ```sql
   COUNT(*) WHERE target_date < NOW()
   AND status NOT IN ('Resolue', 'Terminé', 'Terminé(e)')
   ```

### Métriques Avancées (Phase 2)

5. **Temps de Première Réponse** (nécessite `ticket_comments`)
   ```sql
   MIN(created_at) FROM ticket_comments
   WHERE ticket_id IN (SELECT id FROM tickets WHERE assigned_to = agent_id)
   ```

6. **Taux de Réouverture** (nécessite `ticket_status_history`)
   ```sql
   COUNT(DISTINCT ticket_id) WHERE status_to = 'Ouvert'
   AND status_from IN ('Resolue', 'Terminé', 'Terminé(e)')
   ```

---

## 🚀 Plan d'Implémentation (Phases)

### Phase 1: Fondations (MVP)

1. ✅ Service de calcul `getAgentPerformanceMetrics`
2. ✅ Widget principal avec KPI Cards
3. ✅ Filtres basiques (période, type ticket, agent)
4. ✅ Graphique évolution simple (LineChart)

**Livrables**:
- Scorecard avec 4 métriques principales
- Graphique évolution 7/30 jours
- Filtres fonctionnels

### Phase 2: Enrichissement

1. ✅ Tableau comparatif avec graphiques
2. ✅ Métriques avancées (première réponse, réouverture)
3. ✅ Comparaison multi-agents
4. ✅ Export CSV/PDF

### Phase 3: Optimisations

1. ✅ Heatmap par type
2. ✅ Radar Chart compétences
3. ✅ Alertes automatiques (performance en baisse)
4. ✅ Cache intelligent (React.cache + Supabase)

---

## 🎯 Recommandations Finales

### Pour Démarrer (MVP)

**Widget 1: Scorecard Performance Agent**
- ✅ Rapide à implémenter
- ✅ Actionnable immédiatement
- ✅ Filtres essentiels

**Widget 2: Graphique Évolution**
- ✅ Complémentaire au scorecard
- ✅ Visualisation temporelle
- ✅ Détection de tendances

### À Ajouter Plus Tard

- **Tableau Comparatif**: Pour benchmarking équipe
- **Radar Chart**: Pour profils de compétences détaillés
- **Heatmap**: Pour analyse fine par type

---

## ❓ Questions à Valider

1. **Période par défaut** : Semaine ou Mois ?
2. **Agents visibles** : Tous les agents support ou filtrable par équipe ?
3. **Métrique prioritaire** : MTTR ou Volume de tickets ?
4. **Comparaison** : Toujours multi-agents ou vue individuelle d'abord ?
5. **Filtres** : Tous dès Phase 1 ou progressif ?
6. **Export** : Nécessaire pour Phase 1 ?

---

## 📝 Prochaines Étapes

1. **Valider les options** de widgets
2. **Choisir les métriques** prioritaires
3. **Définir les filtres** essentiels
4. **Planifier l'implémentation** (Phase 1)
5. **Créer le service** de calcul
6. **Développer le widget** MVP

---

**Note**: Toutes les propositions respectent les principes Clean Code, utilisent Recharts (déjà installé), et s'intègrent dans l'architecture existante du dashboard.

