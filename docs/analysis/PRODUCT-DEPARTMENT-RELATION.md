# Analyse : Relation Produits ↔ Départements

## 📋 Question

Peut-on actuellement affecter des départements à des produits pour limiter la visibilité des départements selon les produits ?

## 🔍 État Actuel de la Base de Données

### Structure Actuelle

**Table `products`** :
- `id` (UUID, PK)
- `name` (TEXT)
- `jira_product_id` (INTEGER, nullable)
- Pas de champ `department` ou relation directe avec les départements

**Table `profiles`** :
- `id` (UUID, PK)
- `department` (ENUM: 'Support', 'IT', 'Marketing')
- `role` (ENUM: 'agent', 'manager', 'admin', 'director', 'client')

**Table `modules`** :
- `id` (UUID, PK)
- `product_id` (UUID, FK → `products.id`)
- `name` (TEXT)

**Table `user_module_assignments`** :
- `user_id` (UUID, FK → `profiles.id`)
- `module_id` (UUID, FK → `modules.id`)

### Relation Actuelle (Indirecte)

```
products → modules (via modules.product_id)
modules → users (via user_module_assignments)
users → departments (via profiles.department)
```

**Conclusion** : Il n'existe **PAS** de relation directe entre `products` et `departments`.

## 🎯 Logique de Visibilité Actuelle

La fonction `user_can_access_product()` dans `2025-11-16-rls-department-product-filter.sql` fonctionne ainsi :

1. **DG/DAF et Admin** : Voient tout (tous départements, tous produits)
2. **Agents/Managers** : Voient uniquement :
   - Les produits de leurs **modules affectés** (`user_module_assignments`)
   - ET dans leur **département** (`profiles.department`)

### Exemple Actuel

- Un agent Support avec modules "Finance" et "RH" (OBC) voit :
  - ✅ Tickets OBC créés par le département Support
  - ❌ Tickets OBC créés par le département IT
  - ❌ Tickets SNI (même si Support)

## ❌ Limitation Actuelle

**On ne peut PAS actuellement** :
- Dire "Le produit OBC est accessible uniquement au département Support"
- Dire "Le produit SNI est accessible uniquement au département IT"
- Limiter la visibilité d'un produit à un département spécifique

**Pourquoi ?** Parce que la relation est indirecte via les modules. Un produit peut avoir des modules accessibles à plusieurs départements.

## ✅ Solution Proposée : Table de Liaison

Pour permettre l'affectation directe de départements aux produits, il faut créer une table de liaison :

```sql
CREATE TABLE public.product_department_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  department department_t NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, department)
);

CREATE INDEX idx_product_department_link_product 
ON public.product_department_link(product_id);

CREATE INDEX idx_product_department_link_department 
ON public.product_department_link(department);
```

### Avantages

1. **Flexibilité** : Un produit peut être accessible à plusieurs départements
2. **Simplicité** : Relation directe et explicite
3. **Évolutivité** : Facile d'ajouter/retirer des départements d'un produit
4. **RLS** : Peut être utilisée dans les policies pour filtrer la visibilité

### Utilisation dans RLS

La fonction `user_can_access_product()` pourrait être modifiée pour vérifier :

```sql
-- Vérifier si le produit est accessible au département de l'utilisateur
EXISTS (
  SELECT 1
  FROM public.product_department_link pdl
  WHERE pdl.product_id = target_product_id
    AND pdl.department = current_user_profile.department
)
```

## 🔄 Alternative : Champ Direct

Au lieu d'une table de liaison, on pourrait ajouter un champ `allowed_departments` (ARRAY) :

```sql
ALTER TABLE public.products
ADD COLUMN allowed_departments department_t[];

-- Exemple : OBC accessible à Support et IT
UPDATE products SET allowed_departments = ARRAY['Support', 'IT']::department_t[] WHERE name = 'OBC';
```

**Avantages** :
- Plus simple (pas de table supplémentaire)
- Plus rapide (pas de JOIN)

**Inconvénients** :
- Moins flexible pour des règles complexes
- Moins normalisé

## 📊 Recommandation

**Option 1 : Table de liaison** (Recommandée)
- ✅ Plus flexible et évolutive
- ✅ Suit les conventions du projet (tables de liaison pour N:M)
- ✅ Facilite les requêtes et statistiques

**Option 2 : Champ ARRAY**
- ✅ Plus simple à implémenter
- ✅ Moins de tables
- ⚠️ Moins flexible pour des règles complexes

## 🎯 Prochaines Étapes

1. **Décider de l'approche** : Table de liaison ou champ ARRAY
2. **Créer la migration SQL** pour ajouter la relation
3. **Modifier la fonction RLS** `user_can_access_product()` pour utiliser cette relation
4. **Tester** avec différents scénarios (produit multi-départements, produit mono-département)
5. **Documenter** les règles de visibilité dans le guide RLS

---

**Date d'analyse** : 2025-01-17  
**Statut** : ⏳ En attente de décision

