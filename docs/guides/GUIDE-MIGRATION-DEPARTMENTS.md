# Guide : Migration Départements → Table + Relation Produits

## 📋 Vue d'ensemble

Cette migration transforme le système de départements d'un ENUM fixe vers une table flexible, permettant :
- ✅ Création dynamique de départements
- ✅ Affectation de départements spécifiques à chaque produit
- ✅ Gestion via l'interface admin

## 🎯 Exemple d'utilisation

```
OBC → Départements : IT, Support, Marketing
SNI → Départements : IT, Support, Marketing
Credit Factory → Départements : IT, Support
```

## 📦 Fichiers de Migration

1. **`2025-01-17-transform-departments-to-table.sql`**
   - Crée la table `departments`
   - Crée la table `product_department_link`
   - Migre les données existantes
   - Ajoute `profiles.department_id`

2. **`2025-01-17-update-rls-for-departments-table.sql`**
   - Met à jour la fonction `user_can_access_product()`
   - Met à jour les policies RLS

3. **`scripts/init-product-department-links.js`**
   - Script d'initialisation des affectations produits ↔ départements

## 🚀 Étapes d'Application

### Étape 1 : Appliquer les migrations SQL

Via MCP Supabase ou directement dans Supabase Dashboard :

```sql
-- Migration 1 : Transformation ENUM → Table
-- Appliquer : 2025-01-17-transform-departments-to-table.sql

-- Migration 2 : Mise à jour RLS
-- Appliquer : 2025-01-17-update-rls-for-departments-table.sql
```

### Étape 2 : Initialiser les affectations Produits ↔ Départements

```bash
node scripts/init-product-department-links.js
```

Ce script va créer les liaisons :
- OBC → IT, Support, Marketing
- SNI → IT, Support, Marketing
- Credit Factory → IT, Support

### Étape 3 : Vérifier les données

```sql
-- Vérifier les départements créés
SELECT * FROM departments ORDER BY name;

-- Vérifier les affectations produits ↔ départements
SELECT 
  p.name as produit,
  d.name as departement,
  d.code
FROM product_department_link pdl
JOIN products p ON p.id = pdl.product_id
JOIN departments d ON d.id = pdl.department_id
ORDER BY p.name, d.name;

-- Vérifier que les profils ont un department_id
SELECT 
  full_name,
  department::text as old_department,
  department_id,
  d.name as new_department
FROM profiles p
LEFT JOIN departments d ON d.id = p.department_id
WHERE department IS NOT NULL
LIMIT 10;
```

## 🔄 Changements dans le Code

### TypeScript Validators

**Avant** (`src/lib/validators/user.ts`) :
```typescript
export const departments = ['Support', 'IT', 'Marketing'] as const;
```

**Après** :
```typescript
// Récupération dynamique depuis la base
export async function listDepartments() {
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase
    .from('departments')
    .select('id, name, code, description, color')
    .eq('is_active', true)
    .order('name');
  return data ?? [];
}
```

### Formulaires Utilisateurs

Remplacer les `RadioGroup` par un `Combobox` pour sélectionner le département.

## 📊 Structure des Nouvelles Tables

### Table `departments`

| Colonne | Type | Description |
|--------|------|-------------|
| `id` | UUID | Clé primaire |
| `name` | TEXT | Nom du département (unique) |
| `code` | TEXT | Code court (unique, ex: 'SUP', 'IT') |
| `description` | TEXT | Description optionnelle |
| `color` | TEXT | Couleur pour l'UI (hex) |
| `is_active` | BOOLEAN | Actif/Désactivé |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour |

### Table `product_department_link`

| Colonne | Type | Description |
|--------|------|-------------|
| `id` | UUID | Clé primaire |
| `product_id` | UUID | FK → `products.id` |
| `department_id` | UUID | FK → `departments.id` |
| `created_at` | TIMESTAMPTZ | Date de création |
| **UNIQUE** | `(product_id, department_id)` | Une seule liaison par couple |

## 🔐 RLS (Row Level Security)

### Départements
- **Lecture** : Tous les utilisateurs authentifiés (départements actifs uniquement)
- **Écriture** : Admin et Director uniquement

### Product Department Link
- **Lecture** : Tous les utilisateurs authentifiés
- **Écriture** : Admin et Director uniquement

## ⚠️ Points d'Attention

1. **Compatibilité** : L'ancienne colonne `profiles.department` (ENUM) est conservée temporairement
2. **Migration des données** : Tous les profils existants doivent avoir un `department_id`
3. **RLS** : La fonction `user_can_access_product()` vérifie maintenant :
   - Les modules affectés (comme avant)
   - **ET** l'accès via `product_department_link` (nouveau)
4. **Code TypeScript** : Mettre à jour les composants pour utiliser la table `departments`

## 🧹 Nettoyage (Après Validation)

Une fois que tout fonctionne correctement :

```sql
-- Supprimer l'ancienne colonne ENUM
ALTER TABLE public.profiles DROP COLUMN IF EXISTS department;

-- Supprimer l'ENUM (attention aux dépendances)
DROP TYPE IF EXISTS department_t CASCADE;
```

## 📝 Prochaines Étapes

1. ⏳ **Interface Admin** : Créer les pages pour gérer :
   - Les départements (CRUD)
   - Les affectations produits ↔ départements
2. ⏳ **Mise à jour du code** : Adapter les formulaires et validators
3. ⏳ **Tests** : Vérifier les RLS avec différents scénarios
4. ⏳ **Documentation** : Mettre à jour la documentation utilisateur

---

**Date** : 2025-01-17  
**Statut** : ✅ Migrations créées, prêtes à être appliquées

