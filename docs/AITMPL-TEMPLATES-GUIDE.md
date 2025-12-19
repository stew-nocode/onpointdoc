# 🎨 AITMPL Templates - Guide d'Utilisation

**Installé** : 6 commandes + 1 agent spécialisé pour Supabase

## 📦 Ce qui a été Installé

### ✅ 6 Commandes Slash (.claude/commands/)

| Commande | Description | Utilité pour OnpointDoc |
|----------|-------------|-------------------------|
| `/supabase-schema-sync` | Synchronise le schéma DB | Garder types TypeScript à jour avec Supabase |
| `/supabase-migration-assistant` | Assiste les migrations | Créer migrations sûres pour nouvelles fonctionnalités |
| `/supabase-performance-optimizer` | Optimise les performances | Identifier requêtes lentes du dashboard |
| `/supabase-security-audit` | Audit de sécurité | Vérifier les RLS policies sur tickets/companies |
| `/supabase-type-generator` | Génère types TypeScript | Auto-générer src/types/supabase.ts |
| `/supabase-data-explorer` | Explore les données | Analyser données tickets/entreprises |

### ✅ 1 Agent Spécialisé (.claude/agents/)

| Agent | Description | Quand l'Utiliser |
|-------|-------------|------------------|
| `supabase-schema-architect` | Architecte DB expert | - Nouvelle table (ex: `activities_history`)<br>- Migration complexe<br>- RLS policies pour multi-tenancy<br>- Optimisation schéma existant |

---

## 🚀 Comment les Utiliser

### 1️⃣ Commandes Slash (Workflows Rapides)

Les commandes sont des **prompts pré-écrits** que tu peux invoquer avec `/`.

#### Exemple 1 : Générer les Types TypeScript

```bash
# Dans Claude Code
/supabase-type-generator --all-tables
```

**Ce qui se passe** :
1. Analyse le schéma Supabase via MCP
2. Génère les types TypeScript dans `src/types/`
3. Crée les interfaces pour tickets, companies, profiles, etc.
4. Configure les imports et exports
5. Valide que le build TypeScript passe

**Résultat attendu** :
```typescript
// src/types/supabase.ts (auto-généré)
export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string;
          title: string;
          status: TicketStatus;
          // ... tous les champs
        };
        Insert: Omit<Row, 'id' | 'created_at'>;
        Update: Partial<Insert>;
      };
      // ... autres tables
    };
  };
}
```

---

#### Exemple 2 : Audit de Sécurité RLS

```bash
# Dans Claude Code
/supabase-security-audit
```

**Ce qui se passe** :
1. Scanne toutes les tables Supabase
2. Vérifie les RLS policies existantes
3. Identifie les tables sans RLS
4. Analyse les policies pour failles potentielles
5. Génère un rapport avec recommandations

**Résultat attendu** :
```
🔒 SECURITY AUDIT REPORT

✅ Tables with RLS: 15/20 (75%)
⚠️  Tables without RLS:
   - activities (5,234 rows) - CRITICAL
   - tasks (1,892 rows) - HIGH
   - notifications (12,456 rows) - MEDIUM

🔍 Policy Analysis:
   tickets table:
   ✅ SELECT policy: company_isolation - GOOD
   ⚠️  UPDATE policy: Missing user role check - FIX NEEDED

🛡️  Recommendations:
   1. Add RLS to 'activities' table (multi-tenant isolation)
   2. Strengthen 'tickets' UPDATE policy with role check
   3. Review 'profiles' SELECT policy (too permissive)
```

---

#### Exemple 3 : Optimisation Performance

```bash
# Dans Claude Code
/supabase-performance-optimizer
```

**Ce qui se passe** :
1. Analyse les requêtes lentes (via MCP Logs)
2. Identifie les tables sans index
3. Suggère des index stratégiques
4. Recommande des optimisations de schéma

**Résultat attendu** :
```
⚡ PERFORMANCE OPTIMIZATION REPORT

🐢 Slow Queries Detected:
   1. services/dashboard/product-health.ts:42
      Query: SELECT tickets.* FROM tickets WHERE product_id = ...
      Time: 2.1s avg (567 executions)
      💡 FIX: Add index on tickets(product_id, status)

   2. services/tickets/index.ts:178
      Query: SELECT t.*, p.first_name FROM tickets t JOIN profiles p ...
      Time: 1.8s avg (1,234 executions)
      💡 FIX: Add composite index on tickets(assigned_to, status)

📊 Index Recommendations:
   CREATE INDEX idx_tickets_product_status ON tickets(product_id, status);
   CREATE INDEX idx_tickets_assigned_status ON tickets(assigned_to, status);

   Estimated improvement: 85% faster (2.1s → 0.3s)
```

---

#### Exemple 4 : Assistant Migration

```bash
# Dans Claude Code
/supabase-migration-assistant add sla_deadline to tickets
```

**Ce qui se passe** :
1. Analyse la table `tickets` actuelle
2. Propose une migration sûre
3. Génère le SQL avec `ALTER TABLE`
4. Crée la migration Supabase
5. Génère le rollback automatiquement

**Résultat attendu** :
```sql
-- supabase/migrations/20250108_add_sla_deadline.sql

BEGIN;

-- Add SLA deadline column
ALTER TABLE public.tickets
ADD COLUMN sla_deadline TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.tickets.sla_deadline IS
'Deadline for ticket resolution based on SLA (Service Level Agreement)';

-- Create index for efficient deadline queries
CREATE INDEX idx_tickets_sla_deadline ON public.tickets(sla_deadline)
WHERE sla_deadline IS NOT NULL;

COMMIT;

-- Rollback script (if needed):
-- ALTER TABLE public.tickets DROP COLUMN sla_deadline;
```

---

### 2️⃣ Agent Spécialisé (Tâches Complexes)

L'agent `supabase-schema-architect` est un **expert en conception de schéma DB** qui travaille de manière **autonome**.

#### Quand l'Utiliser ?

**✅ Utilise l'agent pour** :
- Concevoir une nouvelle table complexe
- Refactoriser le schéma existant
- Créer des RLS policies multi-tenancy
- Planifier une migration majeure
- Optimiser les relations entre tables

**❌ N'utilise PAS l'agent pour** :
- Générer des types TypeScript (utilise `/supabase-type-generator`)
- Auditer la sécurité (utilise `/supabase-security-audit`)
- Requêtes SQL simples (utilise MCP Supabase directement)

---

#### Exemple 1 : Créer une Table d'Historique

```bash
# Dans Claude Code
Je veux créer une table 'activities_history' pour tracker toutes les modifications
des activités avec audit trail complet (qui, quand, quoi).
Utilise l'agent supabase-schema-architect.
```

**Ce qui se passe** :
1. L'agent analyse le schéma actuel (`activities` table)
2. Conçoit une table d'audit optimisée
3. Crée les triggers PostgreSQL pour auto-logging
4. Génère les RLS policies appropriées
5. Écrit la migration complète avec rollback
6. Génère les types TypeScript

**Résultat attendu** :
```sql
-- Migration créée par l'agent

CREATE TABLE public.activities_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  change_description TEXT
);

-- Index pour recherche rapide
CREATE INDEX idx_activities_history_activity ON activities_history(activity_id, changed_at DESC);
CREATE INDEX idx_activities_history_user ON activities_history(changed_by, changed_at DESC);

-- Trigger automatique
CREATE OR REPLACE FUNCTION log_activity_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activities_history (activity_id, changed_by, operation, old_data, new_data)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER activities_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.activities
FOR EACH ROW EXECUTE FUNCTION log_activity_changes();

-- RLS Policies
ALTER TABLE public.activities_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of their company activities"
ON public.activities_history
FOR SELECT
USING (
  activity_id IN (
    SELECT id FROM public.activities
    WHERE company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  )
);
```

---

#### Exemple 2 : Refactoriser Multi-Tenancy

```bash
# Dans Claude Code
Notre table 'tickets' a un problème de performance avec les RLS policies.
Je veux refactoriser pour optimiser l'isolation par entreprise.
Utilise l'agent supabase-schema-architect.
```

**Ce qui se passe** :
1. L'agent analyse les RLS policies actuelles
2. Identifie les bottlenecks de performance
3. Propose un schéma optimisé (ex: `company_id` direct au lieu de jointures)
4. Crée une migration progressive (sans downtime)
5. Réécrit les RLS policies optimisées
6. Fournit un plan de rollback détaillé

**Résultat attendu** :
```
🏗️ SUPABASE SCHEMA ARCHITECTURE

## Schema Analysis
- Current tables: 23
- Relationship complexity: HIGH (5-level joins)
- RLS coverage: 87% of sensitive tables
- Performance bottlenecks:
  * tickets RLS policy with 3 joins (avg 150ms overhead)
  * activities query scans 12K rows per request

## Proposed Changes

### Schema Refactoring: Add Direct company_id
**Problem**: Current RLS does `assigned_to → profiles → company_id` (2 joins)
**Solution**: Add denormalized `company_id` directly to tickets

### Migration Strategy
1. Phase 1: Add company_id column (nullable) - Risk: LOW
   - ALTER TABLE tickets ADD COLUMN company_id UUID REFERENCES companies(id)
   - Backfill existing data via trigger

2. Phase 2: Create optimized RLS - Risk: LOW
   - New policy: tickets.company_id = user_company_id()
   - Performance: 150ms → 5ms (30x faster)

3. Phase 3: Deprecate old policy - Risk: MEDIUM
   - Keep old policy for 1 week (monitoring)
   - Remove after validation

### Rollback plan
- Phase 1: DROP COLUMN company_id
- Phase 2: Reactivate old RLS policy
- Phase 3: No rollback needed (old policy still exists)

## Performance Projections
- Query performance improvement: 95% (150ms → 5ms)
- Dashboard load time: 2.3s → 0.4s
- Security coverage: Maintained at 100%
```

---

## 🎯 Workflows Recommandés pour OnpointDoc

### Workflow 1 : Nouvelle Fonctionnalité (ex: SLA Management)

```bash
# 1. Conception du schéma (Agent)
"Je veux ajouter un système de SLA aux tickets avec deadlines,
escalations automatiques et notifications. Utilise l'agent supabase-schema-architect."

# 2. Génération des types TypeScript (Command)
/supabase-type-generator --all-tables

# 3. Audit sécurité (Command)
/supabase-security-audit

# 4. Test de performance (Command)
/supabase-performance-optimizer
```

---

### Workflow 2 : Maintenance Mensuelle

```bash
# 1. Audit sécurité complet
/supabase-security-audit

# 2. Optimisation performance
/supabase-performance-optimizer

# 3. Synchronisation types
/supabase-type-generator --all-tables

# 4. Exploration données (anomalies)
/supabase-data-explorer
```

---

### Workflow 3 : Débogage Dashboard Lent

```bash
# 1. Identifier les requêtes lentes
/supabase-performance-optimizer

# 2. Analyser les données (patterns)
/supabase-data-explorer

# 3. Créer index manquants (Agent si complexe)
"Optimise les requêtes dashboard CEO identifiées par le performance optimizer.
Utilise l'agent supabase-schema-architect."
```

---

## 🔄 Intégration avec MCP Supabase Officiel

### Comment ils Travaillent Ensemble

| Composant | Rôle | Utilisation |
|-----------|------|-------------|
| **MCP Supabase** | Infrastructure de base | Toujours actif, fournit accès DB/Auth/Functions |
| **AITMPL Commands** | Workflows rapides | Appels manuels pour tâches spécifiques |
| **AITMPL Agent** | Expert autonome | Tâches complexes nécessitant réflexion |

**Exemple de Collaboration** :

```
User: /supabase-performance-optimizer

Claude: [Utilise MCP Supabase pour accéder aux logs]
        [Analyse via le Command AITMPL]
        [Retourne recommandations]

        📊 3 requêtes lentes identifiées (via MCP Logs)
        💡 Recommandation: Ajouter 2 index (via Command)

User: OK, crée ces index avec migration sûre

Claude: [Lance l'Agent supabase-schema-architect]
        [Agent utilise MCP pour lire schéma actuel]
        [Agent crée migration optimisée]
        [Agent applique via MCP Database]

        ✅ Migration créée et appliquée
        ✅ Types TypeScript régénérés
        ✅ Performance testée: 2.1s → 0.3s
```

---

## 📊 Résumé : Quoi Utiliser Quand ?

### Tâche Simple (< 5 min)

**Utilise** : Commandes Slash
- `/supabase-type-generator` → Régénérer types
- `/supabase-security-audit` → Check sécurité rapide
- `/supabase-data-explorer` → Explorer données

### Tâche Moyenne (5-30 min)

**Utilise** : MCP Supabase Directement
- "Claude, crée une migration pour ajouter colonne X"
- "Claude, montre-moi les 10 requêtes les plus lentes"
- "Claude, liste les utilisateurs créés cette semaine"

### Tâche Complexe (30 min+)

**Utilise** : Agent supabase-schema-architect
- Concevoir nouvelle table avec relations complexes
- Refactoriser schéma pour performance
- Créer RLS policies multi-tenancy sophistiquées
- Planifier migration majeure avec rollback

---

## 🚀 Prochaines Étapes

### 1️⃣ Tester les Commandes (5 min)

```bash
# Test 1: Générer les types
/supabase-type-generator --all-tables

# Test 2: Audit sécurité
/supabase-security-audit

# Test 3: Check performance
/supabase-performance-optimizer
```

### 2️⃣ Tester l'Agent (10 min)

```bash
"Analyse le schéma de la table tickets et propose des optimisations
pour améliorer les performances du dashboard CEO.
Utilise l'agent supabase-schema-architect."
```

### 3️⃣ Workflow Réel

Choisis une tâche réelle de ton backlog et utilise les templates appropriés.

---

## 📚 Documentation

- **AITMPL Website** : https://aitmpl.com
- **Documentation** : https://docs.aitmpl.com
- **Templates Supabase** : https://aitmpl.com/?search=supabase
- **Article Dan Avila** : Installé et documenté ci-dessus

---

**Dernière mise à jour** : 2025-12-08
**Installé par** : Claude Code
**Source** : Article Medium de Dan Avila
