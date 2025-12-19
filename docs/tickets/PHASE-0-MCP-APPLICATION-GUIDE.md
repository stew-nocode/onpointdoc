# Guide d'Application Phase 0 via MCP Supabase

**Date**: 2025-12-20  
**Migrations**: 
- `20251220000000_optimize_rls_indexes.sql`
- `20251220010000_tickets_rpc_optimized.sql`

---

## ⚠️ IMPORTANT : CREATE INDEX CONCURRENTLY

Les migrations utilisent `CREATE INDEX CONCURRENTLY` qui **ne peut pas être exécuté dans une transaction**.

**Options** :
1. ✅ **Recommandé** : Utiliser `mcp_supabase_execute_sql` pour chaque index (pas de transaction)
2. ⚠️ **Alternative** : Modifier les migrations pour enlever `CONCURRENTLY` (moins optimal mais compatible avec `apply_migration`)

---

## 📋 MÉTHODE 1 : Via `execute_sql` (Recommandé)

### Étape 1 : Identifier le projet Supabase

```bash
# Via MCP, lister les projets
# Projet attendu : "ONPOINT CENTRAL" (id: xjcttqaiplnoalolebls)
```

### Étape 2 : Appliquer les index un par un

**Index 1 : RLS Ownership**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_rls_ownership
ON tickets(created_by, assigned_to)
WHERE created_by IS NOT NULL OR assigned_to IS NOT NULL;
```

**Via MCP** :
```typescript
mcp_supabase_execute_sql({
  project_id: "xjcttqaiplnoalolebls",
  query: `
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_rls_ownership
    ON tickets(created_by, assigned_to)
    WHERE created_by IS NOT NULL OR assigned_to IS NOT NULL;
  `
});
```

**Index 2 : Created/Assigned Combined**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_created_assigned_combined
ON tickets(created_by)
INCLUDE (assigned_to, status, ticket_type, created_at)
WHERE created_by IS NOT NULL;
```

**Index 3 : Profiles Role Managers**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role_managers
ON profiles(id)
INCLUDE (role)
WHERE role::text LIKE '%manager%'
   OR role::text IN ('director', 'daf', 'admin');
```

**Index 4 : Module ID**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_module_id
ON tickets(module_id)
WHERE module_id IS NOT NULL;
```

**Index 5 : Company ID**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_company_id
ON tickets(company_id)
WHERE company_id IS NOT NULL;
```

**Index 6 : Agent Filter**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_agent_filter
ON tickets(created_by, assigned_to, ticket_type, created_at DESC)
INCLUDE (status, company_id, priority);
```

**Index 7 : Priority Created At**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_priority_created_at
ON tickets(priority, created_at DESC)
WHERE priority IS NOT NULL;
```

**Index 8 : Updated At**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_updated_at_desc
ON tickets(updated_at DESC)
WHERE updated_at IS NOT NULL;
```

### Étape 3 : Analyser les tables

```sql
ANALYZE tickets;
ANALYZE profiles;
```

### Étape 4 : Appliquer la migration RPC (via `apply_migration`)

La migration RPC peut être appliquée via `apply_migration` car elle n'utilise pas `CONCURRENTLY` :

```typescript
mcp_supabase_apply_migration({
  project_id: "xjcttqaiplnoalolebls",
  name: "tickets_rpc_optimized",
  query: `
    -- Contenu complet de 20251220010000_tickets_rpc_optimized.sql
    ...
  `
});
```

---

## 📋 MÉTHODE 2 : Via `apply_migration` (Alternative)

Si vous préférez utiliser `apply_migration`, il faut modifier les migrations pour enlever `CONCURRENTLY`.

### Migration modifiée (sans CONCURRENTLY)

```sql
-- Migration: Optimisation des index RLS pour page /tickets
-- Date: 2025-12-20
-- Version: Sans CONCURRENTLY (compatible avec apply_migration)

-- Index composé pour les checks RLS created_by/assigned_to
CREATE INDEX IF NOT EXISTS idx_tickets_rls_ownership
ON tickets(created_by, assigned_to)
WHERE created_by IS NOT NULL OR assigned_to IS NOT NULL;

-- ... (autres index sans CONCURRENTLY)
```

**⚠️ Note** : Sans `CONCURRENTLY`, la création d'index peut bloquer les écritures sur la table pendant la création.

---

## 🧪 VÉRIFICATION POST-APPLICATION

### Vérifier les index créés

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'tickets'
  AND indexname LIKE 'idx_tickets_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Output attendu** :
```
indexname                                | index_size
-----------------------------------------|------------
idx_tickets_agent_filter                 | 1024 kB
idx_tickets_created_assigned_combined    | 896 kB
idx_tickets_rls_ownership                | 768 kB
idx_tickets_priority_created_at          | 512 kB
idx_tickets_updated_at_desc              | 512 kB
idx_tickets_module_id                    | 256 kB
idx_tickets_company_id                   | 256 kB
```

### Vérifier la fonction RPC

```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'list_tickets_with_user_context';
```

### Tester la fonction RPC

```sql
SELECT COUNT(*) as total_tickets
FROM list_tickets_with_user_context(
  p_user_id := NULL,
  p_quick_filter := 'all',
  p_offset := 0,
  p_limit := 10
);
```

---

## 📊 SCRIPT D'APPLICATION AUTOMATISÉ

Pour automatiser l'application via MCP, voici un exemple de script :

```typescript
// Script d'application Phase 0 via MCP
const PROJECT_ID = "xjcttqaiplnoalolebls";

// Liste des index à créer
const indexes = [
  {
    name: "idx_tickets_rls_ownership",
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_rls_ownership
          ON tickets(created_by, assigned_to)
          WHERE created_by IS NOT NULL OR assigned_to IS NOT NULL;`
  },
  // ... autres index
];

// Appliquer chaque index
for (const index of indexes) {
  await mcp_supabase_execute_sql({
    project_id: PROJECT_ID,
    query: index.sql
  });
  console.log(`✅ Index ${index.name} créé`);
}

// Analyser les tables
await mcp_supabase_execute_sql({
  project_id: PROJECT_ID,
  query: "ANALYZE tickets; ANALYZE profiles;"
});

// Appliquer la migration RPC
const rpcMigration = readFileSync(
  "supabase/migrations/20251220010000_tickets_rpc_optimized.sql",
  "utf-8"
);

await mcp_supabase_apply_migration({
  project_id: PROJECT_ID,
  name: "tickets_rpc_optimized",
  query: rpcMigration
});
```

---

## 🔍 DÉPANNAGE

### Erreur : "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"

**Cause** : Tentative d'exécuter `CREATE INDEX CONCURRENTLY` dans une transaction.

**Solution** : Utiliser `mcp_supabase_execute_sql` au lieu de `apply_migration` pour les index.

### Erreur : "relation already exists"

**Cause** : L'index existe déjà.

**Solution** : Les migrations utilisent `IF NOT EXISTS`, donc c'est normal. Vérifier avec la requête de vérification.

### Erreur : "type ticket_list_result does not exist"

**Cause** : La migration RPC n'a pas été appliquée ou le type n'a pas été créé.

**Solution** : Vérifier que la migration RPC a été appliquée complètement (elle crée le type en premier).

---

## ✅ CHECKLIST FINALE

- [ ] 8 index créés (vérification via requête SQL)
- [ ] Index `idx_profiles_role_managers` créé
- [ ] Tables analysées (`ANALYZE tickets; ANALYZE profiles;`)
- [ ] Type `ticket_list_result` créé
- [ ] Fonction `list_tickets_with_user_context` créée
- [ ] Permissions `GRANT EXECUTE` appliquées
- [ ] Test de la fonction RPC réussi

---

**Document prêt pour application via MCP** ✅

