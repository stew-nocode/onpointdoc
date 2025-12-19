# Analyse : Ajout de la sélection de département(s) dans le formulaire de tickets

## 📋 Contexte

L'utilisateur souhaite pouvoir choisir un ou plusieurs départements lors de la création d'un ticket, afin que les membres de ces départements puissent suivre le ticket.

**Exigences clés :**
- ✅ Possibilité de choisir un ou plusieurs départements dans le formulaire
- ✅ Les membres des départements sélectionnés doivent pouvoir voir/suivre le ticket
- ✅ Utilisation des MCP Supabase et Next.js pour garantir les meilleures pratiques

---

## 🔍 Analyse de l'architecture actuelle

### 1. Structure des départements existants

**Table `departments`** :
- ✅ Existe déjà dans la base de données
- ✅ Colonnes : `id`, `name`, `code`, `description`, `color`, `is_active`
- ✅ 3 départements actifs : IT, Marketing, Support

**Table `profiles`** :
- ✅ Colonne `department_id` (FK vers `departments`)
- ✅ Un utilisateur appartient à UN département

**Table `product_department_link`** :
- ✅ Relation N:M entre produits et départements
- ✅ Détermine quels départements peuvent accéder à quels produits

### 2. Structure actuelle des tickets

**Table `tickets`** :
- ❌ **Aucune colonne liée aux départements**
- ✅ Colonnes principales : `id`, `title`, `description`, `ticket_type`, `created_by`, `assigned_to`, `product_id`, `module_id`, etc.
- ✅ Relation avec `profiles` via `created_by` et `assigned_to`

**RLS (Row Level Security)** :
- ✅ Les tickets sont filtrés par département via le `department_id` du créateur
- ✅ Les managers peuvent voir les tickets de leur département

---

## 💡 Solutions proposées

### Solution 1 : Relation Many-to-Many (Recommandée) ⭐

**Architecture :**
- Créer une table de liaison `ticket_department_link`
- Permet à un ticket d'être associé à plusieurs départements
- Scalable et flexible

**Avantages :**
- ✅ Supporte plusieurs départements par ticket
- ✅ Facilement extensible
- ✅ Cohérent avec l'architecture existante (`product_department_link`, `ticket_company_link`)

**Structure :**
```sql
CREATE TABLE ticket_department_link (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false, -- Département principal (pour compatibilité)
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ticket_id, department_id)
);

CREATE INDEX idx_ticket_department_link_ticket 
  ON ticket_department_link(ticket_id);
CREATE INDEX idx_ticket_department_link_department 
  ON ticket_department_link(department_id);
```

**Modifications nécessaires :**

1. **Base de données :**
   - ✅ Créer la table `ticket_department_link`
   - ✅ Activer RLS sur cette table
   - ✅ Ajouter des index pour les performances

2. **Schéma Zod (`src/lib/validators/ticket.ts`) :**
   - Ajouter `selectedDepartmentIds?: string[]` dans `createTicketSchema`

3. **Formulaire (`src/components/forms/ticket-form.tsx`) :**
   - Ajouter un composant de sélection multiple de départements
   - Utiliser un pattern similaire à `CompanyMultiSelect`

4. **Service (`src/services/tickets/index.ts`) :**
   - Dans `createTicket`, créer les liens dans `ticket_department_link`
   - Dans les queries de lecture, joindre avec `ticket_department_link` pour filtrer par département

5. **RLS :**
   - Modifier les policies pour autoriser la lecture si le département de l'utilisateur est dans `ticket_department_link`

---

### Solution 2 : Colonne simple avec tableau (Alternative)

**Architecture :**
- Ajouter une colonne `department_ids UUID[]` dans `tickets`
- Stocker les IDs des départements dans un tableau PostgreSQL

**Avantages :**
- ✅ Plus simple (une seule colonne)
- ✅ Pas de table de liaison

**Inconvénients :**
- ❌ Moins flexible pour les requêtes complexes
- ❌ Pas de métadonnées supplémentaires (date d'ajout, rôle, etc.)
- ❌ Moins cohérent avec l'architecture existante (tables de liaison partout)

**⚠️ Non recommandée** car incohérente avec le reste de l'architecture.

---

## 🎯 Solution recommandée : Many-to-Many

### Phase 1 : Migration Base de données

**1.1. Créer la table de liaison :**

```sql
-- Migration SQL
CREATE TABLE IF NOT EXISTS public.ticket_department_link (
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (ticket_id, department_id)
);

CREATE INDEX IF NOT EXISTS idx_ticket_department_link_ticket 
  ON public.ticket_department_link(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_department_link_department 
  ON public.ticket_department_link(department_id);

COMMENT ON TABLE public.ticket_department_link IS 
  'Liaison many-to-many entre tickets et départements. Permet à un ticket d''être suivi par plusieurs départements.';
```

**1.2. Activer RLS :**

```sql
ALTER TABLE public.ticket_department_link ENABLE ROW LEVEL SECURITY;

-- Lecture : Tous les utilisateurs authentifiés peuvent voir les liens
CREATE POLICY ticket_department_link_read_all
ON public.ticket_department_link FOR SELECT TO authenticated
USING (true);

-- Création : Seuls les créateurs de tickets peuvent créer des liens
CREATE POLICY ticket_department_link_insert_creator
ON public.ticket_department_link FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
      AND t.created_by = auth.uid()
  )
);
```

**1.3. Mettre à jour les policies RLS des tickets :**

```sql
-- Ajouter une policy pour permettre la lecture si le département de l'utilisateur est associé
DROP POLICY IF EXISTS tickets_read_by_department ON public.tickets;
CREATE POLICY tickets_read_by_department
ON public.tickets FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.ticket_department_link tdl
    JOIN public.profiles p ON p.department_id = tdl.department_id
    WHERE tdl.ticket_id = tickets.id
      AND p.auth_uid = auth.uid()
  )
);
```

### Phase 2 : Modifications du schéma Zod

**Fichier : `src/lib/validators/ticket.ts`**

```typescript
export const createTicketSchema = z
  .object({
    // ... champs existants ...
    selectedDepartmentIds: z.array(z.string().uuid()).optional(),
  })
  // ... refinements existants ...
```

### Phase 3 : Service de récupération des départements

**Fichier : `src/services/departments/server.ts`** (déjà existant, vérifier)

```typescript
/**
 * Récupère tous les départements actifs
 */
export const listActiveDepartments = async (): Promise<Department[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('departments')
    .select('id, name, code, description, color')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw new Error(error.message);
  return data ?? [];
};
```

### Phase 4 : Composant de sélection multiple

**Fichier : `src/components/forms/ticket-form/sections/department-multi-select.tsx`** (nouveau)

- Inspiré de `company-multi-select.tsx`
- Permet de sélectionner plusieurs départements via checkboxes
- Recherche/filtrage par nom ou code

### Phase 5 : Intégration dans le formulaire

**Fichier : `src/components/forms/ticket-form.tsx`**

- Ajouter la section de sélection des départements
- Position : après le produit/module, avant les entreprises
- Optionnel mais recommandé

### Phase 6 : Service de création de tickets

**Fichier : `src/services/tickets/index.ts`**

- Dans `createTicket`, après l'insertion du ticket :
  - Si `selectedDepartmentIds` est fourni et non vide
  - Créer les liens dans `ticket_department_link`
  - Marquer le premier comme `is_primary = true`

---

## 📊 User Flow

### Cas d'usage 1 : Ticket avec un seul département
1. Agent Support crée un ticket
2. Sélectionne "IT" dans les départements
3. Les membres du département IT peuvent voir le ticket dans leur liste

### Cas d'usage 2 : Ticket avec plusieurs départements
1. Agent Support crée un ticket qui concerne IT et Marketing
2. Sélectionne "IT" et "Marketing" dans les départements
3. Les membres des deux départements peuvent voir le ticket

### Cas d'usage 3 : Ticket sans département spécifique
1. Agent Support crée un ticket
2. Ne sélectionne aucun département
3. Le ticket suit les règles RLS existantes (basées sur le créateur)

---

## 🔐 Impact sur la sécurité (RLS)

### Politiques à mettre à jour :

1. **Lecture des tickets :**
   - ✅ Conserver les policies existantes (owner, assigned, managers)
   - ✅ Ajouter une policy pour les membres des départements associés

2. **Écriture :**
   - ✅ Seul le créateur peut modifier les départements associés
   - ✅ Les managers peuvent ajouter/retirer des départements

---

## ✅ Checklist d'implémentation

### Base de données
- [ ] Créer la table `ticket_department_link`
- [ ] Ajouter les index
- [ ] Activer RLS
- [ ] Créer les policies RLS
- [ ] Mettre à jour les policies de `tickets` pour inclure les départements

### Backend
- [ ] Ajouter `selectedDepartmentIds` au schéma Zod
- [ ] Créer/modifier le service `listActiveDepartments`
- [ ] Modifier `createTicket` pour créer les liens
- [ ] Modifier les queries de lecture pour filtrer par département

### Frontend
- [ ] Créer le composant `DepartmentMultiSelect`
- [ ] Intégrer dans `TicketForm`
- [ ] Charger les départements dans la page de création
- [ ] Ajouter la validation UI

### Tests
- [ ] Tester la création avec un département
- [ ] Tester la création avec plusieurs départements
- [ ] Tester la visibilité pour les membres des départements
- [ ] Tester les RLS

---

## 🚀 Recommandation finale

**✅ Implémenter la Solution 1 (Many-to-Many)** car :
- Cohérente avec l'architecture existante
- Scalable et flexible
- Permet des métadonnées supplémentaires si nécessaire
- Facile à maintenir

**Ordre d'implémentation :**
1. Migration base de données (MCP Supabase)
2. Services backend
3. Schéma Zod
4. Composant UI
5. Intégration dans le formulaire
6. Tests et validation

---

**Document créé avec l'assistance des MCP Supabase et Next.js**  
**Date : 2025-01-17**

