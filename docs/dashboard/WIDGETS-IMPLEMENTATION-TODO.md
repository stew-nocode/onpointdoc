# 📊 TODO - Implémentation des Widgets Dashboard

Document de référence complet pour l'implémentation de tous les widgets du dashboard.
Ce document sert de TODO et de documentation technique.

---

## 📋 Table des Matières

1. [Widgets Existant à Enregistrer](#1-widgets-existants-à-enregistrer)
2. [Widgets Direction (Strategic)](#2-widgets-direction-strategic)
3. [Widgets Manager (Team)](#3-widgets-manager-team)
4. [Widgets Agent (Personal)](#4-widgets-agent-personal)
5. [Méthodologie d'Implémentation](#5-méthodologie-dimplémentation)

---

## 1. Widgets Existants à Enregistrer

Ces composants sont déjà créés mais pas encore enregistrés dans le système de widgets.

### 1.1. MTTR Evolution Chart

- **ID**: `mttrEvolution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ✅ Composant existant, ❌ Pas encore enregistré
- **Composant**: `MTTREvolutionChart` (`src/components/dashboard/ceo/mttr-evolution-chart.tsx`)
- **Description**: Graphique d'évolution du MTTR dans le temps (Line/Area chart)
- **Impact**: Permet à la Direction de suivre l'évolution de la performance de résolution
- **Données nécessaires**: `MTTRData` avec historique sur plusieurs périodes
- **Méthode de calcul**: 
  - Service existant: `calculateMTTR()` dans `src/services/dashboard/mttr-calculation.ts`
  - Calcule le MTTR global et par produit
  - Calcul: `SUM(temps_résolution) / COUNT(tickets_résolus)` en jours
  - Inclut une tendance vs période précédente
- **Filtres applicables**: Période, Produits, Types de tickets
- **Actions requises**:
  - [ ] Ajouter `mttrEvolution` au type `DashboardWidget`
  - [ ] Enregistrer dans `WIDGET_REGISTRY` avec layout `chart`
  - [ ] Ajouter le mapper de données dans `WIDGET_DATA_MAPPERS`
  - [ ] Ajouter le label dans `WIDGET_LABELS`
  - [ ] Tester l'affichage

---

### 1.2. Tickets Distribution Chart

- **ID**: `ticketsDistribution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ✅ Composant existant, ❌ Pas encore enregistré
- **Composant**: `TicketsDistributionChart` (`src/components/dashboard/ceo/tickets-distribution-chart.tsx`)
- **Description**: Graphique de distribution des tickets par type (Donut/Pie chart)
- **Impact**: Visualisation immédiate de la répartition BUG/REQ/ASSISTANCE
- **Données nécessaires**: `TicketFluxData.byProduct` ou données agrégées par type
- **Méthode de calcul**: 
  - Service existant: `getTicketFlux()` dans `src/services/dashboard/ticket-flux.ts`
  - Compte les tickets par type: `GROUP BY ticket_type`
  - Calcul: `COUNT(*) WHERE type = 'BUG'`, `COUNT(*) WHERE type = 'REQ'`, etc.
- **Filtres applicables**: Période, Produits
- **Actions requises**:
  - [ ] Ajouter `ticketsDistribution` au type `DashboardWidget`
  - [ ] Enregistrer dans `WIDGET_REGISTRY` avec layout `chart`
  - [ ] Ajouter le mapper de données
  - [ ] Ajouter le label
  - [ ] Tester l'affichage

---

### 1.3. Top Bugs Modules Table

- **ID**: `topBugsModules`
- **Type**: `table` (2 colonnes)
- **Statut**: ✅ Composant existant, ❌ Pas encore enregistré
- **Composant**: `TopBugsModulesTable` (`src/components/dashboard/ceo/top-bugs-modules-table.tsx`)
- **Description**: Tableau des modules ayant le plus de bugs avec taux et tendance
- **Impact**: Identification rapide des modules critiques nécessitant une attention
- **Données nécessaires**: `ProductHealthData.topBugModules`
- **Méthode de calcul**: 
  - Service existant: `getProductHealth()` dans `src/services/dashboard/product-health.ts`
  - Requête: `SELECT module_id, COUNT(*) as bug_count FROM tickets WHERE type = 'BUG' GROUP BY module_id ORDER BY bug_count DESC LIMIT 10`
  - Calcul taux: `(bug_count / total_tickets_module) * 100`
  - Tendance: comparaison avec période précédente
- **Filtres applicables**: Période, Produits
- **Actions requises**:
  - [ ] Ajouter `topBugsModules` au type `DashboardWidget`
  - [ ] Enregistrer dans `WIDGET_REGISTRY` avec layout `table`
  - [ ] Ajouter le mapper de données
  - [ ] Ajouter le label
  - [ ] Tester l'affichage

---

### 1.4. Workload By Agent Table

- **ID**: `workloadByAgent`
- **Type**: `table` (2 colonnes)
- **Statut**: ✅ Composant existant, ❌ Pas encore enregistré
- **Composant**: `WorkloadByAgentTable` (`src/components/dashboard/ceo/workload-by-agent-table.tsx`)
- **Description**: Tableau détaillé de la charge de travail par agent avec tickets actifs et résolus
- **Impact**: Permet de répartir équitablement la charge et identifier les surcharges
- **Données nécessaires**: `WorkloadData.byAgent`
- **Méthode de calcul**: 
  - Service existant: `getWorkloadDistribution()` dans `src/services/dashboard/workload-distribution.ts`
  - Requête: `SELECT assigned_to, COUNT(*) FILTER (WHERE status != 'RESOLVED') as active, COUNT(*) FILTER (WHERE resolved_at BETWEEN start AND end) as resolved FROM tickets GROUP BY assigned_to`
  - Calcul charge: `(active_tickets / max_capacity) * 100` (max_capacity = seuil défini)
- **Filtres applicables**: Période, Équipes
- **Actions requises**:
  - [ ] Ajouter `workloadByAgent` au type `DashboardWidget`
  - [ ] Enregistrer dans `WIDGET_REGISTRY` avec layout `table`
  - [ ] Ajouter le mapper de données
  - [ ] Ajouter le label
  - [ ] Tester l'affichage

---

## 2. Widgets Direction (Strategic)

### 2.1. KPIs Existants ✅

#### 2.1.1. MTTR Global
- **ID**: `mttr`
- **Type**: `kpi` (1 colonne)
- **Statut**: ✅ Enregistré et fonctionnel
- **Composant**: `MTTRKPICard`
- **Description**: Temps moyen de résolution global en jours avec tendance
- **Impact**: Indicateur clé de performance du support
- **Données**: `MTTRData.global`, `MTTRData.trend`
- **Calcul**: `AVG(resolved_at - created_at)` en jours pour tous les tickets résolus

#### 2.1.2. Flux Tickets
- **ID**: `flux`
- **Type**: `kpi` (1 colonne)
- **Statut**: ✅ Enregistré et fonctionnel
- **Composant**: `FluxKPICard`
- **Description**: Nombre de tickets ouverts/résolus avec taux de résolution
- **Impact**: Mesure du volume de travail et de l'efficacité
- **Données**: `TicketFluxData.opened`, `TicketFluxData.resolved`, `TicketFluxData.resolutionRate`
- **Calcul**: 
  - Ouverts: `COUNT(*) WHERE created_at BETWEEN start AND end`
  - Résolus: `COUNT(*) WHERE resolved_at BETWEEN start AND end`
  - Taux: `(résolus / ouverts) * 100`

#### 2.1.3. Charge de Travail
- **ID**: `workload`
- **Type**: `kpi` (1 colonne)
- **Statut**: ✅ Enregistré et fonctionnel
- **Composant**: `WorkloadKPICard`
- **Description**: Répartition de la charge par équipe et agent
- **Impact**: Visualisation de la répartition du travail
- **Données**: `WorkloadData.byTeam`, `WorkloadData.byAgent`, `WorkloadData.totalActive`
- **Calcul**: Tickets actifs par équipe/agent (voir 1.4)

#### 2.1.4. Santé Produits
- **ID**: `health`
- **Type**: `kpi` (1 colonne)
- **Statut**: ✅ Enregistré et fonctionnel
- **Composant**: `HealthKPICard`
- **Description**: Taux de bugs par produit avec statut santé
- **Impact**: Identification des produits nécessitant une attention
- **Données**: `ProductHealthData.byProduct` avec `bugRate` et `healthStatus`
- **Calcul**: `(COUNT(BUG) / COUNT(total)) * 100` par produit

---

### 2.2. Graphiques à Créer ❌

#### 2.2.1. Évolution Flux Tickets

- **ID**: `fluxEvolution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Graphique en ligne montrant l'évolution des tickets ouverts et résolus dans le temps
- **Impact**: Permet d'identifier les tendances et les pics d'activité
- **Données nécessaires**: 
  - Historique: `{ date: string, opened: number, resolved: number }[]`
  - Tendances: `openedTrend`, `resolvedTrend`
- **Méthode de calcul**: 
  - Service à créer: `getFluxEvolution(period, filters)`
  - Requête SQL:
    ```sql
    SELECT 
      DATE_TRUNC('day', created_at) as date,
      COUNT(*) FILTER (WHERE created_at BETWEEN start AND end) as opened,
      COUNT(*) FILTER (WHERE resolved_at BETWEEN start AND end) as resolved
    FROM tickets
    WHERE created_at >= start_date AND created_at <= end_date
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date ASC
    ```
  - Tendance: comparaison moyenne période actuelle vs période précédente
- **Type de graphique**: LineChart avec 2 séries (Ouverts, Résolus)
- **Composant à créer**: `FluxEvolutionChart.tsx`
- **Filtres applicables**: Période, Produits, Types, Équipes
- **Actions requises**:
  - [ ] Créer service `getFluxEvolution()` dans `src/services/dashboard/flux-evolution.ts`
  - [ ] Créer composant `FluxEvolutionChart.tsx`
  - [ ] Ajouter au registry avec layout `chart`
  - [ ] Intégrer dans `CEODashboardData` type
  - [ ] Tester avec différentes périodes

---

#### 2.2.2. MTTR par Produit (Comparaison)

- **ID**: `mttrByProduct`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Graphique en barres comparant le MTTR de chaque produit
- **Impact**: Identification des produits avec MTTR élevé nécessitant optimisation
- **Données nécessaires**: `MTTRData.byProduct[]` (déjà disponible)
- **Méthode de calcul**: 
  - Service existant: `calculateMTTR()` retourne déjà `byProduct`
  - Calcul: `AVG(resolved_at - created_at) GROUP BY product_id`
- **Type de graphique**: BarChart horizontal avec une barre par produit
- **Composant à créer**: `MTTRByProductChart.tsx`
- **Filtres applicables**: Période, Types
- **Actions requises**:
  - [ ] Créer composant `MTTRByProductChart.tsx`
  - [ ] Utiliser données existantes `MTTRData.byProduct`
  - [ ] Ajouter au registry
  - [ ] Tester l'affichage

---

#### 2.2.3. Taux de Résolution par Équipe

- **ID**: `resolutionRateByTeam`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Graphique comparant le taux de résolution de chaque équipe
- **Impact**: Comparaison de performance entre équipes
- **Données nécessaires**: 
  - `{ team: string, total: number, resolved: number, rate: number }[]`
- **Méthode de calcul**: 
  - Service à créer: `getResolutionRateByTeam(period, filters)`
  - Requête SQL:
    ```sql
    SELECT 
      p.department as team,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE t.status = 'RESOLVED' AND t.resolved_at BETWEEN start AND end) as resolved
    FROM tickets t
    JOIN profiles p ON t.assigned_to = p.id
    WHERE t.created_at BETWEEN start AND end
    GROUP BY p.department
    ```
  - Calcul taux: `(resolved / total) * 100`
- **Type de graphique**: BarChart horizontal
- **Composant à créer**: `ResolutionRateByTeamChart.tsx`
- **Filtres applicables**: Période, Produits, Types
- **Actions requises**:
  - [ ] Créer service `getResolutionRateByTeam()`
  - [ ] Créer composant `ResolutionRateByTeamChart.tsx`
  - [ ] Ajouter au registry
  - [ ] Intégrer dans `CEODashboardData`

---

#### 2.2.4. Évolution Santé Produits

- **ID**: `healthEvolution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Graphique montrant l'évolution du taux de bugs par produit dans le temps
- **Impact**: Suivi de l'amélioration ou dégradation de la santé des produits
- **Données nécessaires**: 
  - `{ date: string, productId: string, productName: string, bugRate: number }[]`
- **Méthode de calcul**: 
  - Service à créer: `getHealthEvolution(period, filters)`
  - Requête SQL similaire à flux evolution mais avec bug rate par produit
  - Calcul: `(COUNT(BUG) / COUNT(total)) * 100` par produit et par jour/semaine
- **Type de graphique**: MultiLineChart avec une ligne par produit
- **Composant à créer**: `HealthEvolutionChart.tsx`
- **Filtres applicables**: Période, Produits (multi-select)
- **Actions requises**:
  - [ ] Créer service `getHealthEvolution()`
  - [ ] Créer composant `HealthEvolutionChart.tsx`
  - [ ] Ajouter au registry

---

#### 2.2.5. Charge par Équipe (Graphique)

- **ID**: `workloadByTeamChart`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟢 Basse
- **Description**: Graphique en barres ou donut montrant la répartition de la charge par équipe
- **Impact**: Visualisation immédiate de la répartition du travail
- **Données nécessaires**: `WorkloadData.byTeam` (déjà disponible)
- **Méthode de calcul**: Service existant `getWorkloadDistribution()` retourne déjà `byTeam`
- **Type de graphique**: DonutChart ou BarChart
- **Composant à créer**: `WorkloadByTeamChart.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer composant `WorkloadByTeamChart.tsx`
  - [ ] Utiliser données existantes
  - [ ] Ajouter au registry

---

#### 2.2.6. Bugs par Module (Top)

- **ID**: `bugsByModuleChart`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟢 Basse
- **Description**: Graphique en barres horizontal des top modules avec bugs
- **Impact**: Visualisation alternative au tableau (plus visuelle)
- **Données nécessaires**: `ProductHealthData.topBugModules` (déjà disponible)
- **Méthode de calcul**: Service existant
- **Type de graphique**: HorizontalBarChart
- **Composant à créer**: `BugsByModuleChart.tsx`
- **Filtres applicables**: Période, Produits
- **Actions requises**:
  - [ ] Créer composant `BugsByModuleChart.tsx`
  - [ ] Utiliser données existantes
  - [ ] Ajouter au registry

---

### 2.3. Tableaux à Créer ❌

#### 2.3.1. Tickets par Produit

- **ID**: `ticketsByProduct`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Tableau détaillé des tickets par produit avec répartition par type et statut
- **Impact**: Vue d'ensemble du volume de tickets par produit
- **Données nécessaires**: 
  - `{ productId: string, productName: string, total: number, byType: { type: string, count: number }[], byStatus: { status: string, count: number }[] }[]`
- **Méthode de calcul**: 
  - Service à créer: `getTicketsByProduct(period, filters)`
  - Requête SQL:
    ```sql
    SELECT 
      p.id as product_id,
      p.name as product_name,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE t.type = 'BUG') as bugs,
      COUNT(*) FILTER (WHERE t.type = 'REQ') as reqs,
      COUNT(*) FILTER (WHERE t.type = 'ASSISTANCE') as assistances,
      COUNT(*) FILTER (WHERE t.status = 'OPEN') as open,
      COUNT(*) FILTER (WHERE t.status = 'RESOLVED') as resolved
    FROM tickets t
    JOIN products p ON t.product_id = p.id
    WHERE t.created_at BETWEEN start AND end
    GROUP BY p.id, p.name
    ORDER BY total DESC
    ```
- **Composant à créer**: `TicketsByProductTable.tsx`
- **Filtres applicables**: Période, Types, Statuts
- **Actions requises**:
  - [ ] Créer service `getTicketsByProduct()`
  - [ ] Créer composant `TicketsByProductTable.tsx`
  - [ ] Ajouter au registry

---

#### 2.3.2. Tickets par Priorité

- **ID**: `ticketsByPriority`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Tableau des tickets groupés par priorité avec statistiques
- **Impact**: Identification des tickets critiques nécessitant une attention
- **Données nécessaires**: 
  - `{ priority: string, total: number, open: number, resolved: number, avgResolutionTime: number }[]`
- **Méthode de calcul**: 
  - Service à créer: `getTicketsByPriority(period, filters)`
  - Requête SQL:
    ```sql
    SELECT 
      priority,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status != 'RESOLVED') as open,
      COUNT(*) FILTER (WHERE status = 'RESOLVED') as resolved,
      AVG(resolved_at - created_at) as avg_resolution_time
    FROM tickets
    WHERE created_at BETWEEN start AND end
    GROUP BY priority
    ORDER BY 
      CASE priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
      END
    ```
- **Composant à créer**: `TicketsByPriorityTable.tsx`
- **Filtres applicables**: Période, Produits, Types, Équipes
- **Actions requises**:
  - [ ] Créer service `getTicketsByPriority()`
  - [ ] Créer composant `TicketsByPriorityTable.tsx`
  - [ ] Ajouter au registry

---

#### 2.3.3. Performance par Équipe

- **ID**: `teamPerformance`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Tableau comparatif des performances par équipe (MTTR, taux résolution, charge)
- **Impact**: Comparaison équipes pour identifier les meilleures pratiques
- **Données nécessaires**: 
  - `{ team: string, mttr: number, resolutionRate: number, activeTickets: number, totalResolved: number }[]`
- **Méthode de calcul**: 
  - Service à créer: `getTeamPerformance(period, filters)`
  - Combine données de MTTR, flux, et workload par équipe
- **Composant à créer**: `TeamPerformanceTable.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer service `getTeamPerformance()`
  - [ ] Créer composant `TeamPerformanceTable.tsx`
  - [ ] Ajouter au registry

---

#### 2.3.4. Historique Résolutions

- **ID**: `resolutionHistory`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟢 Basse
- **Description**: Timeline des résolutions récentes avec détails
- **Impact**: Suivi de l'activité récente de résolution
- **Données nécessaires**: 
  - `{ id: string, title: string, product: string, type: string, priority: string, resolvedAt: string, resolvedBy: string, resolutionTime: number }[]`
- **Méthode de calcul**: 
  - Service à créer: `getResolutionHistory(period, limit = 50)`
  - Requête SQL:
    ```sql
    SELECT 
      t.id,
      t.title,
      p.name as product,
      t.type,
      t.priority,
      t.resolved_at,
      pr.full_name as resolved_by,
      t.resolved_at - t.created_at as resolution_time
    FROM tickets t
    JOIN products p ON t.product_id = p.id
    LEFT JOIN profiles pr ON t.resolved_by = pr.id
    WHERE t.status = 'RESOLVED' 
      AND t.resolved_at BETWEEN start AND end
    ORDER BY t.resolved_at DESC
    LIMIT limit
    ```
- **Composant à créer**: `ResolutionHistoryTable.tsx`
- **Filtres applicables**: Période, Produits, Types, Équipes
- **Actions requises**:
  - [ ] Créer service `getResolutionHistory()`
  - [ ] Créer composant `ResolutionHistoryTable.tsx`
  - [ ] Ajouter au registry

---

## 3. Widgets Manager (Team)

### 3.1. KPIs Équipe ❌

#### 3.1.1. MTTR Équipe

- **ID**: `teamMTTR`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Temps moyen de résolution de l'équipe avec tendance vs autres équipes
- **Impact**: Performance de résolution de l'équipe du manager
- **Données nécessaires**: `MTTRData` filtré par équipe
- **Méthode de calcul**: 
  - Service existant: `calculateMTTR()` avec filtre équipe
  - Filtre: `WHERE assigned_to IN (SELECT id FROM profiles WHERE department = team)`
- **Composant à créer**: `TeamMTTRKPICard.tsx`
- **Filtres applicables**: Période, Produits, Types
- **Actions requises**:
  - [ ] Créer composant `TeamMTTRKPICard.tsx`
  - [ ] Utiliser `calculateMTTR()` avec filtre équipe
  - [ ] Ajouter au registry

---

#### 3.1.2. Flux Équipe

- **ID**: `teamFlux`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Tickets ouverts/résolus par l'équipe avec taux de résolution
- **Impact**: Volume de travail et efficacité de l'équipe
- **Données nécessaires**: `TicketFluxData` filtré par équipe
- **Méthode de calcul**: Service existant `getTicketFlux()` avec filtre équipe
- **Composant à créer**: `TeamFluxKPICard.tsx`
- **Filtres applicables**: Période, Produits, Types
- **Actions requises**:
  - [ ] Créer composant `TeamFluxKPICard.tsx`
  - [ ] Utiliser `getTicketFlux()` avec filtre équipe
  - [ ] Ajouter au registry

---

#### 3.1.3. Charge Équipe

- **ID**: `teamWorkload`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Charge globale de l'équipe (tickets actifs, répartition agents)
- **Impact**: Visualisation de la charge globale de l'équipe
- **Données nécessaires**: `WorkloadData` filtré par équipe
- **Méthode de calcul**: Service existant `getWorkloadDistribution()` avec filtre équipe
- **Composant à créer**: `TeamWorkloadKPICard.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer composant `TeamWorkloadKPICard.tsx`
  - [ ] Utiliser `getWorkloadDistribution()` avec filtre équipe
  - [ ] Ajouter au registry

---

#### 3.1.4. Performance Équipe

- **ID**: `teamPerformanceKPI`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Indicateur global de performance de l'équipe (score composite)
- **Impact**: Score unique pour comparer rapidement la performance
- **Données nécessaires**: 
  - Combine MTTR, taux résolution, charge
  - Score: `(100 - mttr_normalized) * 0.4 + resolution_rate * 0.4 + (100 - workload_percent) * 0.2`
- **Méthode de calcul**: 
  - Service à créer: `getTeamPerformanceScore(teamId, period)`
  - Combine plusieurs métriques en un score 0-100
- **Composant à créer**: `TeamPerformanceKPICard.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer service `getTeamPerformanceScore()`
  - [ ] Créer composant `TeamPerformanceKPICard.tsx`
  - [ ] Ajouter au registry

---

### 3.2. Graphiques Équipe ❌

#### 3.2.1. Évolution Performance Équipe

- **ID**: `teamPerformanceEvolution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Graphique d'évolution des KPIs de l'équipe dans le temps
- **Impact**: Suivi de l'amélioration ou dégradation de la performance
- **Données nécessaires**: Historique MTTR, flux, charge par période
- **Méthode de calcul**: 
  - Service à créer: `getTeamPerformanceEvolution(teamId, period)`
  - Calcule les métriques pour chaque sous-période (semaine/mois)
- **Composant à créer**: `TeamPerformanceEvolutionChart.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer service `getTeamPerformanceEvolution()`
  - [ ] Créer composant `TeamPerformanceEvolutionChart.tsx`
  - [ ] Ajouter au registry

---

#### 3.2.2. Répartition Tickets Équipe

- **ID**: `teamTicketsDistribution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Distribution des tickets de l'équipe par type et priorité
- **Impact**: Compréhension du type de travail de l'équipe
- **Données nécessaires**: 
  - `{ byType: { type: string, count: number }[], byPriority: { priority: string, count: number }[] }`
- **Méthode de calcul**: 
  - Service à créer: `getTeamTicketsDistribution(teamId, period)`
  - Requête SQL similaire à tickets distribution mais filtrée par équipe
- **Composant à créer**: `TeamTicketsDistributionChart.tsx`
- **Filtres applicables**: Période, Produits, Types
- **Actions requises**:
  - [ ] Créer service `getTeamTicketsDistribution()`
  - [ ] Créer composant `TeamTicketsDistributionChart.tsx`
  - [ ] Ajouter au registry

---

#### 3.2.3. Charge Agents (Graphique)

- **ID**: `teamAgentsWorkload`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Graphique en barres de la charge de chaque agent de l'équipe
- **Impact**: Visualisation de la répartition de charge entre agents
- **Données nécessaires**: `WorkloadData.byAgent` filtré par équipe (déjà disponible)
- **Méthode de calcul**: Service existant avec filtre équipe
- **Composant à créer**: `TeamAgentsWorkloadChart.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer composant `TeamAgentsWorkloadChart.tsx`
  - [ ] Utiliser données existantes filtrées par équipe
  - [ ] Ajouter au registry

---

### 3.3. Tableaux Équipe ❌

#### 3.3.1. Tickets par Agent

- **ID**: `teamTicketsByAgent`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Détails des tickets assignés à chaque agent de l'équipe
- **Impact**: Vue détaillée de la charge par agent avec détails
- **Données nécessaires**: 
  - `{ agentId: string, agentName: string, active: number, resolved: number, byType: { type: string, count: number }[], byPriority: { priority: string, count: number }[] }[]`
- **Méthode de calcul**: 
  - Service à créer: `getTeamTicketsByAgent(teamId, period)`
  - Requête SQL similaire à workload by agent mais avec plus de détails
- **Composant à créer**: `TeamTicketsByAgentTable.tsx`
- **Filtres applicables**: Période, Produits, Types
- **Actions requises**:
  - [ ] Créer service `getTeamTicketsByAgent()`
  - [ ] Créer composant `TeamTicketsByAgentTable.tsx`
  - [ ] Ajouter au registry

---

#### 3.3.2. Tickets en Cours

- **ID**: `teamActiveTickets`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Liste des tickets actifs de l'équipe avec détails
- **Impact**: Vue opérationnelle des tickets à traiter
- **Données nécessaires**: 
  - Liste complète des tickets actifs avec colonnes: ID, Titre, Produit, Type, Priorité, Assigné, Créé, Dernière mise à jour
- **Méthode de calcul**: 
  - Service à créer: `getTeamActiveTickets(teamId, filters)`
  - Requête SQL:
    ```sql
    SELECT 
      t.*,
      p.name as product_name,
      pr.full_name as assigned_name
    FROM tickets t
    JOIN products p ON t.product_id = p.id
    LEFT JOIN profiles pr ON t.assigned_to = pr.id
    WHERE t.assigned_to IN (SELECT id FROM profiles WHERE department = team)
      AND t.status NOT IN ('RESOLVED', 'CLOSED')
    ORDER BY 
      CASE t.priority
        WHEN 'CRITICAL' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
      END,
      t.created_at ASC
    ```
- **Composant à créer**: `TeamActiveTicketsTable.tsx`
- **Filtres applicables**: Produits, Types, Priorités
- **Actions requises**:
  - [ ] Créer service `getTeamActiveTickets()`
  - [ ] Créer composant `TeamActiveTicketsTable.tsx`
  - [ ] Ajouter au registry

---

#### 3.3.3. Historique Actions Équipe

- **ID**: `teamHistory`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟢 Basse
- **Description**: Timeline des actions récentes de l'équipe (résolutions, assignations, commentaires)
- **Impact**: Suivi de l'activité récente de l'équipe
- **Données nécessaires**: 
  - `{ id: string, type: 'resolution' | 'assignment' | 'comment', ticketId: string, ticketTitle: string, agent: string, date: string, details: string }[]`
- **Méthode de calcul**: 
  - Service à créer: `getTeamHistory(teamId, period, limit = 50)`
  - Combine données de `ticket_status_history`, `ticket_comments`, `tickets`
- **Composant à créer**: `TeamHistoryTable.tsx`
- **Filtres applicables**: Période, Type d'action
- **Actions requises**:
  - [ ] Créer service `getTeamHistory()`
  - [ ] Créer composant `TeamHistoryTable.tsx`
  - [ ] Ajouter au registry

---

## 4. Widgets Agent (Personal)

### 4.1. KPIs Personnels ❌

#### 4.1.1. Mes Tickets Actifs

- **ID**: `myActiveTickets`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Nombre de tickets actifs assignés à l'agent
- **Impact**: Vue immédiate de la charge de travail personnelle
- **Données nécessaires**: `AgentDashboardData.myTickets.active`
- **Méthode de calcul**: 
  - Service à créer: `getAgentDashboardData(agentId, period)`
  - Requête: `COUNT(*) WHERE assigned_to = agentId AND status NOT IN ('RESOLVED', 'CLOSED')`
- **Composant à créer**: `MyActiveTicketsKPICard.tsx`
- **Filtres applicables**: Aucun (données personnelles)
- **Actions requises**:
  - [ ] Créer service `getAgentDashboardData()`
  - [ ] Créer composant `MyActiveTicketsKPICard.tsx`
  - [ ] Ajouter au registry

---

#### 4.1.2. Mes Tickets Résolus

- **ID**: `myResolvedTickets`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Nombre de tickets résolus sur la période avec tendance
- **Impact**: Mesure de la productivité personnelle
- **Données nécessaires**: `AgentDashboardData.myTickets.resolved`
- **Méthode de calcul**: `COUNT(*) WHERE assigned_to = agentId AND resolved_at BETWEEN start AND end`
- **Composant à créer**: `MyResolvedTicketsKPICard.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer composant `MyResolvedTicketsKPICard.tsx`
  - [ ] Utiliser données de `getAgentDashboardData()`
  - [ ] Ajouter au registry

---

#### 4.1.3. Mes Tâches

- **ID**: `myTasks`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Nombre de tâches par statut (todo, inProgress, done, blocked)
- **Impact**: Vue d'ensemble des tâches personnelles
- **Données nécessaires**: `AgentDashboardData.myTasks`
- **Méthode de calcul**: 
  - Service à créer: `getAgentTasks(agentId)`
  - Requête: `SELECT status, COUNT(*) FROM tasks WHERE assigned_to = agentId GROUP BY status`
- **Composant à créer**: `MyTasksKPICard.tsx`
- **Filtres applicables**: Aucun
- **Actions requises**:
  - [ ] Créer service `getAgentTasks()`
  - [ ] Créer composant `MyTasksKPICard.tsx`
  - [ ] Ajouter au registry

---

#### 4.1.4. Mes Activités

- **ID**: `myActivities`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Nombre d'activités à venir et complétées
- **Impact**: Suivi des activités personnelles (revues, ateliers, démos)
- **Données nécessaires**: `AgentDashboardData.myActivities`
- **Méthode de calcul**: 
  - Service à créer: `getAgentActivities(agentId)`
  - Requête: `SELECT status, COUNT(*) FROM activities WHERE participant_id = agentId GROUP BY status`
- **Composant à créer**: `MyActivitiesKPICard.tsx`
- **Filtres applicables**: Aucun
- **Actions requises**:
  - [ ] Créer service `getAgentActivities()`
  - [ ] Créer composant `MyActivitiesKPICard.tsx`
  - [ ] Ajouter au registry

---

#### 4.1.5. Mon MTTR Personnel

- **ID**: `myMTTR`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Temps moyen de résolution personnel avec comparaison à l'équipe
- **Impact**: Performance personnelle vs moyenne équipe
- **Données nécessaires**: 
  - `{ personal: number, teamAverage: number, trend: number }`
- **Méthode de calcul**: 
  - Service à créer: `getAgentMTTR(agentId, period)`
  - Calcul personnel: `AVG(resolved_at - created_at) WHERE assigned_to = agentId`
  - Calcul équipe: `AVG(resolved_at - created_at) WHERE assigned_to IN (team_agents)`
- **Composant à créer**: `MyMTTRKPICard.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer service `getAgentMTTR()`
  - [ ] Créer composant `MyMTTRKPICard.tsx`
  - [ ] Ajouter au registry

---

#### 4.1.6. Ma Charge

- **ID**: `myWorkload`
- **Type**: `kpi` (1 colonne)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Pourcentage de charge avec seuil d'alerte
- **Impact**: Visualisation de la charge de travail personnelle
- **Données nécessaires**: 
  - `{ activeTickets: number, maxCapacity: number, percent: number, status: 'low' | 'normal' | 'high' | 'critical' }`
- **Méthode de calcul**: 
  - Service à créer: `getAgentWorkload(agentId)`
  - Calcul: `(active_tickets / max_capacity) * 100`
  - Max capacity = seuil défini (ex: 10 tickets actifs max)
- **Composant à créer**: `MyWorkloadKPICard.tsx`
- **Filtres applicables**: Aucun
- **Actions requises**:
  - [ ] Créer service `getAgentWorkload()`
  - [ ] Créer composant `MyWorkloadKPICard.tsx`
  - [ ] Ajouter au registry

---

### 4.2. Graphiques Personnels ❌

#### 4.2.1. Évolution Personnelle

- **ID**: `myPerformanceEvolution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Graphique d'évolution des KPIs personnels dans le temps
- **Impact**: Suivi de l'amélioration personnelle
- **Données nécessaires**: 
  - Historique: `{ date: string, resolved: number, mttr: number, workload: number }[]`
- **Méthode de calcul**: 
  - Service à créer: `getAgentPerformanceEvolution(agentId, period)`
  - Calcule les métriques pour chaque sous-période
- **Composant à créer**: `MyPerformanceEvolutionChart.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer service `getAgentPerformanceEvolution()`
  - [ ] Créer composant `MyPerformanceEvolutionChart.tsx`
  - [ ] Ajouter au registry

---

#### 4.2.2. Répartition Mes Tickets

- **ID**: `myTicketsDistribution`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Distribution des tickets personnels par type et priorité
- **Impact**: Compréhension du type de travail personnel
- **Données nécessaires**: 
  - `{ byType: { type: string, count: number }[], byPriority: { priority: string, count: number }[] }`
- **Méthode de calcul**: 
  - Service à créer: `getAgentTicketsDistribution(agentId, period)`
  - Requête: `SELECT type, priority, COUNT(*) FROM tickets WHERE assigned_to = agentId GROUP BY type, priority`
- **Composant à créer**: `MyTicketsDistributionChart.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer service `getAgentTicketsDistribution()`
  - [ ] Créer composant `MyTicketsDistributionChart.tsx`
  - [ ] Ajouter au registry

---

#### 4.2.3. Timeline Personnelle

- **ID**: `myTimeline`
- **Type**: `chart` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟢 Basse
- **Description**: Timeline visuelle des activités, tâches et tickets sur la période
- **Impact**: Vue d'ensemble de l'activité personnelle
- **Données nécessaires**: 
  - Combine tickets, tâches, activités avec dates
  - `{ date: string, tickets: number, tasks: number, activities: number }[]`
- **Méthode de calcul**: 
  - Service à créer: `getAgentTimeline(agentId, period)`
  - Combine données de tickets, tasks, activities
- **Composant à créer**: `MyTimelineChart.tsx`
- **Filtres applicables**: Période
- **Actions requises**:
  - [ ] Créer service `getAgentTimeline()`
  - [ ] Créer composant `MyTimelineChart.tsx`
  - [ ] Ajouter au registry

---

### 4.3. Tableaux Personnels ❌

#### 4.3.1. Mes Tickets en Cours

- **ID**: `myActiveTicketsList`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Liste complète des tickets actifs avec actions rapides
- **Impact**: Vue opérationnelle des tickets à traiter
- **Données nécessaires**: 
  - Liste complète avec colonnes: ID, Titre, Produit, Type, Priorité, Créé, Dernière mise à jour
- **Méthode de calcul**: 
  - Service à créer: `getAgentActiveTickets(agentId, filters)`
  - Requête: `SELECT * FROM tickets WHERE assigned_to = agentId AND status NOT IN ('RESOLVED', 'CLOSED') ORDER BY priority, created_at`
- **Composant à créer**: `MyActiveTicketsTable.tsx`
- **Filtres applicables**: Produits, Types, Priorités
- **Actions requises**:
  - [ ] Créer service `getAgentActiveTickets()`
  - [ ] Créer composant `MyActiveTicketsTable.tsx`
  - [ ] Ajouter au registry

---

#### 4.3.2. Mes Tâches

- **ID**: `myTasksList`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🔥 Haute
- **Description**: Liste des tâches personnelles avec statut et dates
- **Impact**: Gestion des tâches personnelles
- **Données nécessaires**: 
  - Liste complète avec colonnes: ID, Titre, Statut, Priorité, Échéance, Progression
- **Méthode de calcul**: 
  - Service à créer: `getAgentTasksList(agentId, filters)`
  - Requête: `SELECT * FROM tasks WHERE assigned_to = agentId ORDER BY status, due_date`
- **Composant à créer**: `MyTasksTable.tsx`
- **Filtres applicables**: Statut, Priorité
- **Actions requises**:
  - [ ] Créer service `getAgentTasksList()`
  - [ ] Créer composant `MyTasksTable.tsx`
  - [ ] Ajouter au registry

---

#### 4.3.3. Mes Activités

- **ID**: `myActivitiesList`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟡 Moyenne
- **Description**: Liste des activités à venir et passées
- **Impact**: Suivi des activités personnelles
- **Données nécessaires**: 
  - Liste complète avec colonnes: ID, Titre, Type, Date, Statut
- **Méthode de calcul**: 
  - Service à créer: `getAgentActivitiesList(agentId, filters)`
  - Requête: `SELECT * FROM activities WHERE participant_id = agentId ORDER BY scheduled_date`
- **Composant à créer**: `MyActivitiesTable.tsx`
- **Filtres applicables**: Type, Statut, Date
- **Actions requises**:
  - [ ] Créer service `getAgentActivitiesList()`
  - [ ] Créer composant `MyActivitiesTable.tsx`
  - [ ] Ajouter au registry

---

#### 4.3.4. Mon Historique

- **ID**: `myHistory`
- **Type**: `table` (2 colonnes)
- **Statut**: ❌ À créer
- **Priorité**: 🟢 Basse
- **Description**: Timeline des actions personnelles récentes
- **Impact**: Suivi de l'historique personnel
- **Données nécessaires**: 
  - `{ id: string, type: string, description: string, date: string, relatedId: string }[]`
- **Méthode de calcul**: 
  - Service à créer: `getAgentHistory(agentId, period, limit = 50)`
  - Combine tickets résolus, tâches complétées, activités
- **Composant à créer**: `MyHistoryTable.tsx`
- **Filtres applicables**: Période, Type
- **Actions requises**:
  - [ ] Créer service `getAgentHistory()`
  - [ ] Créer composant `MyHistoryTable.tsx`
  - [ ] Ajouter au registry

---

## 5. Méthodologie d'Implémentation

### 5.1. Ordre de Priorité

#### Phase 1 : Widgets Existants (30 min)
1. ✅ Enregistrer les 4 composants existants dans le registry
   - `mttrEvolution`
   - `ticketsDistribution`
   - `topBugsModules`
   - `workloadByAgent`

#### Phase 2 : Direction - Essentiels (2-3h)
1. ✅ `fluxEvolution` (Graphique évolution flux)
2. ✅ `mttrByProduct` (Graphique MTTR par produit)
3. ✅ `ticketsByProduct` (Tableau tickets par produit)
4. ✅ `ticketsByPriority` (Tableau tickets par priorité)

#### Phase 3 : Manager - Essentiels (4-5h)
1. ✅ `teamMTTR`, `teamFlux`, `teamWorkload` (3 KPIs)
2. ✅ `teamPerformanceEvolution` (Graphique évolution)
3. ✅ `teamTicketsByAgent` (Tableau tickets par agent)
4. ✅ `teamActiveTickets` (Tableau tickets en cours)

#### Phase 4 : Agent - Essentiels (5-6h)
1. ✅ `myActiveTickets`, `myResolvedTickets` (2 KPIs)
2. ✅ `myTasks`, `myActivities` (2 KPIs)
3. ✅ `myActiveTicketsList` (Tableau tickets en cours)
4. ✅ `myTasksList` (Tableau tâches)

### 5.2. Étapes pour Chaque Widget

Pour chaque widget, suivre ces étapes :

1. **Créer le service de calcul** (si nécessaire)
   - Fichier: `src/services/dashboard/[widget-name].ts`
   - Fonction: `get[WidgetName](params)`
   - Tester avec différents filtres

2. **Créer le composant React**
   - Fichier: `src/components/dashboard/[role]/[widget-name].tsx`
   - Utiliser les composants ShadCN (Card, Chart, Table)
   - Respecter les conventions de style

3. **Ajouter au type DashboardWidget**
   - Fichier: `src/types/dashboard-widgets.ts`
   - Ajouter l'ID dans le type union

4. **Enregistrer dans le registry**
   - Fichier: `src/components/dashboard/widgets/registry.ts`
   - Ajouter dans `WIDGET_REGISTRY`
   - Définir le `layoutType` approprié

5. **Ajouter le mapper de données**
   - Fichier: `src/components/dashboard/widgets/registry.ts`
   - Ajouter dans `WIDGET_DATA_MAPPERS`
   - Mapper les données `UnifiedDashboardData` aux props du widget

6. **Ajouter le label**
   - Fichier: `src/lib/constants/widget-labels.ts`
   - Ajouter dans `WIDGET_LABELS`

7. **Tester**
   - Vérifier l'affichage dans le dashboard
   - Tester avec différents rôles
   - Vérifier la réactivité
   - Tester les filtres

### 5.3. Conventions de Nommage

- **Services**: `get[WidgetName]()` en camelCase
- **Composants**: `[WidgetName][Type]` en PascalCase (ex: `MTTRKPICard`, `FluxEvolutionChart`)
- **IDs Widgets**: `camelCase` (ex: `mttr`, `fluxEvolution`)
- **Fichiers**: `kebab-case.tsx` (ex: `mttr-kpi-card.tsx`)

### 5.4. Checklist de Validation

Pour chaque widget, vérifier :
- [ ] Le calcul est correct
- [ ] Les données sont filtrées selon le rôle
- [ ] Le layout est responsive
- [ ] Les filtres fonctionnent
- [ ] Les performances sont acceptables
- [ ] Le code suit les principes Clean Code
- [ ] La documentation est à jour

---

## 6. Notes Techniques

### 6.1. Performance

- Utiliser `Promise.all()` pour les requêtes parallèles
- Mettre en cache les résultats si possible
- Limiter les résultats des tableaux (pagination)
- Optimiser les requêtes SQL avec des index

### 6.2. Données Temporelles

- Toujours utiliser UTC pour les dates
- Gérer les fuseaux horaires côté client
- Calculer les périodes de manière cohérente

### 6.3. Filtres

- Tous les widgets doivent accepter `DashboardFiltersInput`
- Appliquer les filtres au niveau SQL (pas en mémoire)
- Préserver les filtres dans l'URL

---

**Dernière mise à jour**: [Date actuelle]
**Statut global**: 📝 TODO - En cours d'implémentation

