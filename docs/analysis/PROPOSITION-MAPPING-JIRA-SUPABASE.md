# Proposition de Mapping Jira ↔ Supabase

**Date**: 2025-01-18  
**Contexte**: Analyse de 813 bugs du projet Jira OD (OD10006)  
**Objectif**: Optimiser la synchronisation bidirectionnelle entre Jira et Supabase

---

## 1. Vue d'ensemble

### 1.1. Principes de mapping

- **Champs standards Jira** → Colonnes directes dans `tickets` ou tables liées
- **Champs personnalisés Jira** → Colonnes dédiées ou tables de liaison selon la complexité
- **Données structurées** (modules, fonctionnalités) → Relations avec `product_structure` existante
- **Métadonnées Jira** → Table `jira_sync` pour traçabilité

### 1.2. Stratégie de synchronisation

- **Jira → Supabase** : Synchronisation complète des champs mappés
- **Supabase → Jira** : Synchronisation sélective (statut, priorité, assigné)
- **Source de vérité** : Jira pour BUG/REQ, Supabase pour ASSISTANCE

---

## 2. Mapping des champs standards Jira

| Champ Jira | Type | Mapping Supabase | Table/Colonne | Notes |
|------------|------|------------------|---------------|-------|
| `key` | String | `jira_issue_key` | `jira_sync.jira_issue_key` | ✅ Existant |
| `summary` | String | `title` | `tickets.title` | ✅ Existant |
| `description` | Text | `description` | `tickets.description` | ✅ Existant |
| `status.name` | Enum | `status` | `tickets.status` | ⚠️ Mapping nécessaire (voir §3.1) |
| `priority.name` | Enum | `priority` | `tickets.priority` | ⚠️ Mapping nécessaire (voir §3.2) |
| `issuetype.name` | Enum | `ticket_type` | `tickets.ticket_type` | ✅ Existant (BUG/REQ/ASSISTANCE) |
| `reporter.accountId` | UUID | `created_by` | `tickets.created_by` | ⚠️ Mapping via `profiles.jira_user_id` |
| `assignee.accountId` | UUID | `assigned_to` | `tickets.assigned_to` | ⚠️ Mapping via `profiles.jira_user_id` |
| `created` | DateTime | `created_at` | `tickets.created_at` | ✅ Existant |
| `updated` | DateTime | `updated_at` | `tickets.updated_at` | ⚠️ À ajouter si absent |
| `resolution.name` | String | `resolution` | `tickets.resolution` | ⚠️ Nouveau champ |
| `fixVersions[].name` | Array | `fix_version` | `tickets.fix_version` | ⚠️ Nouveau champ (ex: "OBC V T1 2024") |

---

## 3. Mapping des statuts et priorités

### 3.1. Statuts Jira → Supabase

| Statut Jira | Statut Supabase | Type Ticket | Notes |
|-------------|-----------------|-------------|-------|
| `Sprint Backlog` | `NOUVEAU` | BUG/REQ | Statut initial |
| `Traitement en Cours` | `EN_COURS` | BUG/REQ | En cours de traitement |
| `Terminé(e)` | `RESOLU` | BUG/REQ | Résolu/Clôturé |

**Action requise** : Créer une table `jira_status_mapping` pour gérer les mappings dynamiques.

### 3.2. Priorités Jira → Supabase

| Priorité Jira | Priorité Supabase | Notes |
|---------------|-------------------|-------|
| `Priorité 1` | `Critical` | Urgence maximale |
| `Priorité 2` | `High` | Urgence élevée |
| `Priorité 3` | `Medium` | Urgence moyenne |
| `Priorité 4` | `Low` | Urgence faible |

**Action requise** : Créer une table `jira_priority_mapping` pour gérer les mappings dynamiques.

---

## 4. Mapping des champs personnalisés critiques

### 4.1. Informations client/contact

| Champ Jira | Type | Mapping Supabase | Table/Colonne | Notes |
|------------|------|------------------|---------------|-------|
| `customfield_10053` | String | Nom du client | `contacts.full_name` | Via `tickets.contact_user_id` |
| `customfield_10054` | Object | Fonction/Poste | `contacts.function` | ⚠️ À ajouter dans `contacts` |
| `customfield_10045` | Object | Entreprise | `companies.name` | Via `contacts.company_id` |
| `customfield_10055` | Object | Canal de contact | `tickets.channel` | ✅ Existant (mapping nécessaire) |

**Mapping canal** :
- `Appel Téléphonique` → `Appel`
- `Appel WhatsApp` → `Whatsapp`
- `En présentiel` → `Autre`
- `Online (Google Meet, Teams...)` → `Autre`
- `Constat Interne` → `Autre`

### 4.2. Structure produit/module/fonctionnalité

| Champ Jira | Type | Mapping Supabase | Table/Colonne | Notes |
|------------|------|------------------|---------------|-------|
| `customfield_10052` | Object | Module/Fonctionnalité | `features.id` | Via `tickets.feature_id` |
| `customfield_10046` | Object | Département | `departments.id` | Via `product_department_link` |

**Exemples de mapping `customfield_10052`** :
- `"Finance - Comptabilité Générale"` → Feature "Comptabilité Générale" du module "Finance"
- `"RH - Paramétrage"` → Feature "Paramétrage" du module "RH"
- `"Projets - Gérer mes projets"` → Feature "Gérer mes projets" du module "Projets"

**Action requise** : Créer une table `jira_feature_mapping` pour mapper les valeurs Jira vers `features.id`.

### 4.3. Informations de workflow

| Champ Jira | Type | Mapping Supabase | Table/Colonne | Notes |
|------------|------|------------------|---------------|-------|
| `customfield_10020` | Object | Sprint | `tickets.sprint_id` | ⚠️ Nouvelle table `sprints` ou champ JSON |
| `customfield_10083` | Object | Statut workflow | `tickets.workflow_status` | ⚠️ Nouveau champ (ex: "Analyse terminée") |
| `customfield_10084` | Object | Statut test | `tickets.test_status` | ⚠️ Nouveau champ (ex: "Test Concluant") |
| `customfield_10021` | Object | Type (Impediment) | `tickets.issue_type` | ⚠️ Nouveau champ (pour différencier Bug/Impediment) |

### 4.4. Informations de suivi

| Champ Jira | Type | Mapping Supabase | Table/Colonne | Notes |
|------------|------|------------------|---------------|-------|
| `customfield_10057` | String | Ticket lié | `tickets.related_ticket_id` | ⚠️ Nouveau champ (ex: "B-OD-029") |
| `customfield_10111` | Date | Date cible | `tickets.target_date` | ⚠️ Nouveau champ |
| `customfield_10115` | Date | Date de résolution | `tickets.resolved_at` | ⚠️ Nouveau champ |

### 4.5. Champs spécifiques par produit

Ces champs sont conditionnels selon le produit/module. Proposition : **table `ticket_custom_fields`** (JSONB) pour stocker les champs spécifiques.

| Champ Jira | Produit | Description |
|------------|---------|-------------|
| `customfield_10297` | OBC - Opérations | Opérations détaillées (Vente, Immobilisations, AGRO, etc.) |
| `customfield_10298` | OBC - Finance | Finance détaillé (Budget, Comptabilité, Impôts, etc.) |
| `customfield_10300` | OBC - RH | RH détaillé (Salaire, Documents, Gestion employé, etc.) |
| `customfield_10299` | OBC - Projets | Projets détaillé (Feuille de temps, Dashboard, etc.) |
| `customfield_10301` | OBC - CRM | CRM détaillé (Activités commerciales, Offres, Clients, etc.) |
| `customfield_10313` | Finance | Traitements comptables, Paramétrage, Livres comptables |
| `customfield_10324` | RH | Gestion de temps, Contrat employé, Gestion de prêts |
| `customfield_10364` | Paramétrage admin | Workflow, Gestion des utilisateurs, Autres admin |

**Proposition** : Stocker ces champs dans `tickets.custom_fields` (JSONB) avec une structure :
```json
{
  "product_specific": {
    "operations": "Opérations - Vente",
    "finance": "Finance - Comptabilité Générale",
    "rh": "RH - Salaire"
  }
}
```

---

## 5. Structure de tables proposée

### 5.1. Modifications de la table `tickets`

```sql
ALTER TABLE public.tickets
  -- Champs standards
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS fix_version TEXT,
  
  -- Champs workflow
  ADD COLUMN IF NOT EXISTS workflow_status TEXT,
  ADD COLUMN IF NOT EXISTS test_status TEXT,
  ADD COLUMN IF NOT EXISTS issue_type TEXT, -- 'Bug', 'Impediment', etc.
  
  -- Champs de suivi
  ADD COLUMN IF NOT EXISTS related_ticket_id UUID REFERENCES public.tickets(id),
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  
  -- Champs spécifiques (JSONB pour flexibilité)
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sprint_id TEXT, -- Ou UUID si table sprints créée
  
  -- Index pour performance
  CREATE INDEX IF NOT EXISTS idx_tickets_custom_fields_gin ON public.tickets USING GIN (custom_fields);
  CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets(resolved_at);
  CREATE INDEX IF NOT EXISTS idx_tickets_target_date ON public.tickets(target_date);
```

### 5.2. Nouvelle table `jira_status_mapping`

```sql
CREATE TABLE IF NOT EXISTS public.jira_status_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_status_name TEXT NOT NULL UNIQUE,
  supabase_status TEXT NOT NULL,
  ticket_type TEXT NOT NULL, -- 'BUG', 'REQ', 'ASSISTANCE'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jira_status_mapping_jira_status ON public.jira_status_mapping(jira_status_name);
```

### 5.3. Nouvelle table `jira_priority_mapping`

```sql
CREATE TABLE IF NOT EXISTS public.jira_priority_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_priority_name TEXT NOT NULL UNIQUE,
  supabase_priority TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jira_priority_mapping_jira_priority ON public.jira_priority_mapping(jira_priority_name);
```

### 5.4. Nouvelle table `jira_feature_mapping`

```sql
CREATE TABLE IF NOT EXISTS public.jira_feature_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_feature_value TEXT NOT NULL, -- Ex: "Finance - Comptabilité Générale"
  feature_id UUID REFERENCES public.features(id) ON DELETE SET NULL,
  jira_custom_field_id TEXT NOT NULL, -- Ex: "customfield_10052"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jira_feature_value, jira_custom_field_id)
);

CREATE INDEX IF NOT EXISTS idx_jira_feature_mapping_value ON public.jira_feature_mapping(jira_feature_value);
CREATE INDEX IF NOT EXISTS idx_jira_feature_mapping_feature ON public.jira_feature_mapping(feature_id);
```

### 5.5. Extension de la table `jira_sync`

```sql
ALTER TABLE public.jira_sync
  -- Métadonnées supplémentaires
  ADD COLUMN IF NOT EXISTS jira_status TEXT,
  ADD COLUMN IF NOT EXISTS jira_priority TEXT,
  ADD COLUMN IF NOT EXISTS jira_assignee_account_id TEXT,
  ADD COLUMN IF NOT EXISTS jira_reporter_account_id TEXT,
  ADD COLUMN IF NOT EXISTS jira_resolution TEXT,
  ADD COLUMN IF NOT EXISTS jira_fix_version TEXT,
  ADD COLUMN IF NOT EXISTS jira_sprint_id TEXT,
  ADD COLUMN IF NOT EXISTS last_status_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_priority_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT '{}'::jsonb; -- Pour champs personnalisés non mappés

CREATE INDEX IF NOT EXISTS idx_jira_sync_status ON public.jira_sync(jira_status);
CREATE INDEX IF NOT EXISTS idx_jira_sync_priority ON public.jira_sync(jira_priority);
```

### 5.6. Extension de la table `contacts`

```sql
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS function TEXT, -- Fonction/Poste (customfield_10054)
  ADD COLUMN IF NOT EXISTS jira_custom_field_10053 TEXT; -- Nom Jira si différent

CREATE INDEX IF NOT EXISTS idx_contacts_function ON public.contacts(function);
```

---

## 6. Mapping des champs par produit (détails)

### 6.1. OBC - Opérations (`customfield_10297`)

Valeurs possibles :
- `Opérations - Vente`
- `Opérations - Immobilisations`
- `Opérations - AGRO`
- `Opérations - Gestion de stock`
- `Opérations - Achat`

**Mapping** : Stocker dans `tickets.custom_fields->>'operations'`

### 6.2. OBC - Finance (`customfield_10298`)

Valeurs possibles :
- `Finance - Budget`
- `Finance - Comptabilité Générale`
- `Finance - Impôts et taxes`
- `Finance - Trésorerie`
- `Finance - Comptabilité analytique`

**Mapping** : Stocker dans `tickets.custom_fields->>'finance'`

### 6.3. OBC - RH (`customfield_10300`)

Valeurs possibles :
- `RH - Salaire`
- `RH - Documents`
- `RH - Gestion employé`
- `RH - Paramétrage`
- `RH - Analytique`

**Mapping** : Stocker dans `tickets.custom_fields->>'rh'`

### 6.4. OBC - Projets (`customfield_10299`)

Valeurs possibles :
- `Projets - Feuille de temps`
- `Projets - Gérer mes projets`
- `Projets - Dashboard`
- `Projets - Gérer mes tâches`
- `Projets - Note de frais`

**Mapping** : Stocker dans `tickets.custom_fields->>'projects'`

### 6.5. OBC - CRM (`customfield_10301`)

Valeurs possibles :
- `CRM - Activités commerciales`
- `CRM - Offres`
- `CRM - Clients`
- `CRM - Analytique`
- `CRM - Pilotage commercial`

**Mapping** : Stocker dans `tickets.custom_fields->>'crm'`

---

## 7. Champs à ignorer (vides ou non pertinents)

Les champs suivants sont vides ou peu utilisés et peuvent être ignorés dans un premier temps :

- `customfield_10102`, `customfield_10331`, `customfield_10320`, `customfield_10321`, `customfield_10322`
- `customfield_10315`, `customfield_10310`, `customfield_10311`, `customfield_10312`
- `customfield_10304`, `customfield_10308`, `customfield_10309`
- `customfield_10016`, `customfield_10495`, `customfield_10133`, `customfield_10496`, `customfield_10116`
- `customfield_10002` (array vide)
- `customfield_10019` (string cryptée, non exploitable)

**Note** : Ces champs peuvent être stockés dans `jira_sync.sync_metadata` pour traçabilité future.

---

## 8. Plan d'implémentation recommandé

### Phase 1 : Champs standards (Priorité haute)
1. ✅ Extension `jira_sync` avec métadonnées de base
2. ✅ Tables de mapping statut/priorité
3. ✅ Synchronisation bidirectionnelle statut/priorité

### Phase 2 : Informations client/contact (Priorité haute)
1. ✅ Extension `contacts` avec fonction
2. ✅ Mapping canal de contact
3. ✅ Synchronisation client/entreprise

### Phase 3 : Structure produit (Priorité moyenne)
1. ✅ Table `jira_feature_mapping`
2. ✅ Script d'initialisation des mappings
3. ✅ Synchronisation module/fonctionnalité

### Phase 4 : Workflow et suivi (Priorité moyenne)
1. ✅ Extension `tickets` avec champs workflow
2. ✅ Synchronisation sprint/workflow/test status

### Phase 5 : Champs spécifiques produits (Priorité basse)
1. ✅ Extension `tickets.custom_fields` (JSONB)
2. ✅ Synchronisation champs conditionnels par produit

---

## 9. Questions ouvertes

1. **Sprints** : Créer une table dédiée `sprints` ou stocker comme texte dans `tickets.sprint_id` ?
2. **Champs conditionnels** : Tous dans `custom_fields` JSONB ou colonnes dédiées pour les plus utilisés ?
3. **Historique** : Créer une table `ticket_custom_fields_history` pour traçabilité des changements ?
4. **Performance** : Index GIN sur `custom_fields` suffisant ou besoin de colonnes dédiées ?

---

## 10. Prochaines étapes

1. **Validation** : Revue de cette proposition avec l'équipe
2. **Priorisation** : Définir les phases d'implémentation selon les besoins métier
3. **Migration** : Créer les migrations SQL pour les nouvelles colonnes/tables
4. **Scripts** : Développer les scripts de synchronisation Jira ↔ Supabase
5. **Tests** : Valider la synchronisation sur un échantillon de tickets

---

**Document créé le** : 2025-01-18  
**Dernière mise à jour** : 2025-01-18


