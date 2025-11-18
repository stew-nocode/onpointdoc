# Migration : Départements → Table + Relation Produits ↔ Départements

## 📋 Objectif

Transformer l'ENUM `department_t` en table `departments` et créer la relation N:M entre produits et départements pour permettre :
- La création dynamique de départements
- L'affectation de départements spécifiques à chaque produit

## 🎯 Exemple d'utilisation

```
OBC → Départements : IT, Support, Marketing
SNI → Départements : IT, Support, Marketing
Credit Factory → Départements : IT, Support
```

## 📊 Structure Proposée

### Table `departments`

```sql
departments (
  id UUID PK,
  name TEXT UNIQUE,      -- 'Support', 'IT', 'Marketing', 'RH', etc.
  code TEXT UNIQUE,      -- 'SUP', 'IT', 'MKT', 'RH'
  description TEXT,
  color TEXT,            -- Pour l'UI
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Table `product_department_link`

```sql
product_department_link (
  id UUID PK,
  product_id UUID FK → products.id,
  department_id UUID FK → departments.id,
  UNIQUE(product_id, department_id)
)
```

### Migration `profiles`

```sql
-- Avant
profiles.department department_t ENUM ('Support', 'IT', 'Marketing')

-- Après
profiles.department_id UUID FK → departments.id
profiles.department department_t  -- Conservé temporairement pour compatibilité
```

## 🔄 Étapes de Migration

### Phase 1 : Création des tables
1. ✅ Créer `departments` avec les 3 départements existants
2. ✅ Créer `product_department_link`
3. ✅ Ajouter `profiles.department_id`

### Phase 2 : Migration des données
1. ✅ Migrer les profils : `department` → `department_id`
2. ⏳ Créer les affectations produits ↔ départements (à faire manuellement ou via script)

### Phase 3 : Mise à jour RLS
1. ✅ Mettre à jour `user_can_access_product()` pour utiliser `department_id`
2. ✅ Ajouter vérification `product_department_link`
3. ✅ Mettre à jour les policies

### Phase 4 : Nettoyage (après tests)
1. ⏳ Supprimer `profiles.department` (ENUM)
2. ⏳ Supprimer l'ENUM `department_t`

## 📝 Scripts de Migration

### Migration principale
- `2025-01-17-transform-departments-to-table.sql`
  - Crée `departments`
  - Crée `product_department_link`
  - Migre les données

### Mise à jour RLS
- `2025-01-17-update-rls-for-departments-table.sql`
  - Met à jour `user_can_access_product()`
  - Met à jour les policies

## 🎯 Prochaines Étapes

1. **Appliquer les migrations** via MCP Supabase
2. **Créer les affectations initiales** :
   ```sql
   -- OBC accessible à IT, Support, Marketing
   INSERT INTO product_department_link (product_id, department_id)
   SELECT p.id, d.id
   FROM products p, departments d
   WHERE p.name = 'OBC' AND d.name IN ('IT', 'Support', 'Marketing');
   
   -- SNI accessible à IT, Support, Marketing
   INSERT INTO product_department_link (product_id, department_id)
   SELECT p.id, d.id
   FROM products p, departments d
   WHERE p.name = 'SNI' AND d.name IN ('IT', 'Support', 'Marketing');
   ```
3. **Mettre à jour le code TypeScript** pour utiliser la table `departments`
4. **Créer l'interface admin** pour gérer les départements et les affectations
5. **Tester** les RLS avec différents scénarios
6. **Nettoyer** l'ancien ENUM après validation

## ⚠️ Points d'Attention

1. **Compatibilité** : L'ancienne colonne `department` est conservée temporairement
2. **RLS** : Les policies doivent être mises à jour pour utiliser `department_id`
3. **Code TypeScript** : Mettre à jour les validators et composants
4. **Données existantes** : Vérifier que tous les profils ont un `department_id` après migration

---

**Date** : 2025-01-17  
**Statut** : ✅ Migrations créées, prêtes à être appliquées

