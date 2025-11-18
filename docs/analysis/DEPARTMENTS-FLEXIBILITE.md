# Analyse : Flexibilité des Départements

## 📋 Question

Si on veut affecter des départements aux produits, cela implique-t-il qu'on puisse créer plusieurs départements ?

## 🔍 État Actuel

### Structure Actuelle

**Dans le code TypeScript** (`src/lib/validators/user.ts`) :
```typescript
export const departments = ['Support', 'IT', 'Marketing'] as const;
export type Department = typeof departments[number];
```

**Dans la base de données** :
- Le champ `department` dans `profiles` utilise probablement un ENUM `department_t`
- Valeurs possibles : 'Support', 'IT', 'Marketing' (fixes)

### Limitation Actuelle

❌ **On ne peut PAS actuellement** :
- Créer de nouveaux départements dynamiquement
- Modifier les noms des départements
- Supprimer des départements
- Ajouter des métadonnées aux départements (description, couleur, etc.)

**Pourquoi ?** Parce que les départements sont codés en dur dans :
1. Un ENUM PostgreSQL (si c'est le cas)
2. Un tableau constant TypeScript

## ✅ Solution : Table `departments`

Pour permettre la création dynamique de départements, il faut transformer l'ENUM en table :

### Migration Proposée

```sql
-- 1. Créer la table departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- Code court (ex: 'SUP', 'IT', 'MKT')
  description TEXT,
  color TEXT, -- Pour l'UI (ex: '#3B82F6')
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_departments_name ON public.departments(name);
CREATE INDEX idx_departments_code ON public.departments(code);
CREATE INDEX idx_departments_active ON public.departments(is_active) WHERE is_active = true;

-- 2. Migrer les données existantes
INSERT INTO public.departments (name, code) VALUES
  ('Support', 'SUP'),
  ('IT', 'IT'),
  ('Marketing', 'MKT')
ON CONFLICT (name) DO NOTHING;

-- 3. Ajouter la colonne department_id dans profiles
ALTER TABLE public.profiles
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 4. Migrer les données de department (ENUM) vers department_id (FK)
UPDATE public.profiles p
SET department_id = d.id
FROM public.departments d
WHERE p.department::text = d.name;

-- 5. Créer un index
CREATE INDEX idx_profiles_department_id ON public.profiles(department_id);

-- 6. Supprimer l'ancienne colonne department (après vérification)
-- ALTER TABLE public.profiles DROP COLUMN department;

-- 7. Supprimer l'ENUM (après vérification)
-- DROP TYPE IF EXISTS department_t;
```

### Avantages

1. ✅ **Flexibilité** : Créer/modifier/supprimer des départements dynamiquement
2. ✅ **Métadonnées** : Ajouter description, couleur, code, etc.
3. ✅ **Soft delete** : Désactiver sans supprimer (`is_active`)
4. ✅ **Historique** : `created_at`, `updated_at`
5. ✅ **Normalisation** : Relation FK propre
6. ✅ **Évolutivité** : Facile d'ajouter de nouveaux champs

### Impact sur le Code

**TypeScript** (`src/lib/validators/user.ts`) :
```typescript
// Avant
export const departments = ['Support', 'IT', 'Marketing'] as const;

// Après : Récupération depuis la base
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

**Formulaires** : Remplacer les RadioGroup par un Combobox/Select

## 🔄 Alternative : Garder ENUM mais Permettre l'Ajout

Si on veut garder l'ENUM mais permettre l'ajout de valeurs :

```sql
-- Ajouter une valeur à l'ENUM
ALTER TYPE department_t ADD VALUE IF NOT EXISTS 'RH';
ALTER TYPE department_t ADD VALUE IF NOT EXISTS 'Finance';
```

**Limitations** :
- ❌ Ne peut pas supprimer des valeurs
- ❌ Ne peut pas renommer des valeurs
- ❌ Pas de métadonnées
- ⚠️ Requiert une migration à chaque ajout

## 📊 Recommandation

**Option 1 : Table `departments`** (Recommandée)
- ✅ Maximum de flexibilité
- ✅ Aligné avec les autres entités (products, modules, etc.)
- ✅ Permet la gestion via l'interface admin
- ⚠️ Nécessite une migration des données

**Option 2 : ENUM extensible**
- ✅ Plus simple (pas de table)
- ✅ Pas de migration de données
- ❌ Moins flexible
- ❌ Pas de métadonnées

## 🎯 Prochaines Étapes

1. **Décider de l'approche** : Table ou ENUM extensible
2. **Si table** :
   - Créer la migration SQL
   - Migrer les données existantes
   - Mettre à jour le code TypeScript
   - Créer l'interface admin pour gérer les départements
3. **Si ENUM** :
   - Documenter les valeurs possibles
   - Créer un script pour ajouter de nouvelles valeurs
4. **Tester** : Vérifier que les RLS fonctionnent toujours
5. **Documenter** : Guide de gestion des départements

---

**Date d'analyse** : 2025-01-17  
**Statut** : ⏳ En attente de décision

