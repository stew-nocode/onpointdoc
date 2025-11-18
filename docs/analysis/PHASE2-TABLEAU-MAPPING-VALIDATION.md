# Phase 2 : Tableau de Mapping - Informations Client/Contact

**Date** : 2025-01-18  
**Statut** : ⏳ **EN ATTENTE DE VALIDATION**

---

## Tableau de Mapping - Champs Client/Contact Jira

| # | Champ Jira | Type Jira | Colonne Supabase | Table | Statut Actuel | Action Requise | Exemple Valeur Jira |
|---|------------|-----------|------------------|-------|---------------|----------------|---------------------|
| 1 | `customfield_10053` | String | `full_name` | `profiles` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | "KONE Mariam", "MONSIEUR KOUADIO" |
| 2 | `customfield_10054` | Object | `job_title` | `profiles` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | "Assistant(e) Comptable", "Chef Comptable" |
| 3 | `customfield_10045` | Object | `company_id` | `profiles` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | "ETS MAB" (ID: 11057), "SIT BTP" (ID: 10376) |
| 4 | `customfield_10055` | Object | `canal` | `tickets` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | "Appel Téléphonique", "Appel WhatsApp" |

---

## Détails des Mappings

### 1. Nom du client (`customfield_10053`)

**Structure Jira** : String simple  
**Exemples** : "KONE Mariam", "DORIS N'GBRA", "Edwige KOUASSI"  
**Mapping Supabase** : `profiles.full_name` (TEXT, nullable)

**Logique** :
1. Rechercher dans `profiles` où `role='client'` et `full_name = jiraValue`
2. Si trouvé → utiliser `profile_id`
3. Si non trouvé → créer nouveau profil avec `role='client'`, `full_name=jiraValue`, `auth_uid=NULL`

---

### 2. Fonction/Poste (`customfield_10054`)

**Structure Jira** : Object avec `value` et `id`  
**Exemple** : `{"value": "Assistant(e) Comptable", "id": "10283"}`  
**Mapping Supabase** : `profiles.job_title` (TEXT, nullable)

**Logique** :
1. Extraire `customfield_10054.value`
2. Stocker directement dans `profiles.job_title` lors de la création/mise à jour du profil

**Valeurs trouvées** (46 uniques) :
- "Assistant(e) / Stagiaire"
- "Contrôleur de Gestion"
- "Assistant(e) Comptable"
- "Activation Specialist"
- "Chef Comptable"
- etc.

---

### 3. Entreprise (`customfield_10045`)

**Structure Jira** : Object avec `value` (nom) et `id` (ID option)  
**Exemple** : `{"value": "ETS MAB", "id": "11057"}`  
**Mapping Supabase** : `profiles.company_id` (UUID, FK vers `companies.id`)

**Logique** :
1. Extraire `customfield_10045.id` (ID Jira de l'option)
2. Rechercher dans `companies.jira_company_id = id` (mapping direct)
3. Si non trouvé → rechercher dans `companies.name = value` (correspondance nom)
4. Si toujours non trouvé → créer nouvelle entreprise avec `name=value` et `jira_company_id=id`

**Valeurs trouvées** (38 uniques) :
- "ETS MAB" (ID: 11057)
- "SIT BTP" (ID: 10376)
- "FALCON" (ID: 10051)
- "SIE-TRAVAUX" (ID: 10461)
- "ALL" (ID: 10148)
- etc.

---

### 4. Canal de contact (`customfield_10055`)

**Structure Jira** : Object avec `value`  
**Exemple** : `{"value": "Appel Téléphonique", "id": "10139"}`  
**Mapping Supabase** : `tickets.canal` (ENUM: `Whatsapp`, `Email`, `Appel`, `Autre`)

**Mapping proposé** :

| Canal Jira | Canal Supabase | Valeur DB |
|------------|----------------|-----------|
| `Appel Téléphonique` | `Appel` | `'Appel'` |
| `Appel WhatsApp` | `Whatsapp` | `'Whatsapp'` |
| `En présentiel` | `Autre` | `'Autre'` |
| `Online (Google Meet, Teams...)` | `Autre` | `'Autre'` |
| `Constat Interne` | `Autre` | `'Autre'` |

**Action** : Créer table `jira_channel_mapping` pour gérer ces correspondances.

---

## Modifications de Schéma Proposées

### 1. Nouvelle table `jira_channel_mapping`

```sql
CREATE TABLE IF NOT EXISTS public.jira_channel_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_channel_value TEXT NOT NULL UNIQUE,
  supabase_channel TEXT NOT NULL CHECK (supabase_channel IN ('Whatsapp', 'Email', 'Appel', 'Autre')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jira_channel_mapping_value ON public.jira_channel_mapping(jira_channel_value);
```

**Données initiales** :
```sql
INSERT INTO public.jira_channel_mapping (jira_channel_value, supabase_channel)
VALUES
  ('Appel Téléphonique', 'Appel'),
  ('Appel WhatsApp', 'Whatsapp'),
  ('En présentiel', 'Autre'),
  ('Online (Google Meet, Teams...)', 'Autre'),
  ('Constat Interne', 'Autre')
ON CONFLICT (jira_channel_value) DO NOTHING;
```

---

## Services à Créer/Modifier

### 1. Nouveau service : `src/services/jira/contact-mapping.ts`

Fonctions à créer :
- `mapJiraClientNameToProfile(jiraName: string, companyId?: string)` : Recherche/création profil client
- `mapJiraCompanyToCompanyId(jiraCompanyValue: string, jiraCompanyId: number)` : Recherche/création entreprise
- `mapJiraChannelToSupabase(jiraChannelValue: string)` : Mapping canal

### 2. Modification : `src/services/jira/sync.ts`

Modifier `syncJiraToSupabase()` pour :
- Extraire `customfield_10053`, `customfield_10054`, `customfield_10045`, `customfield_10055`
- Appeler les fonctions de mapping
- Mettre à jour `tickets.contact_user_id` et `tickets.canal`

### 3. Extension : `src/services/jira/index.ts`

Exporter les nouvelles fonctions de mapping.

---

## Questions de Validation

### ❓ Question 1 : Création automatique des contacts
**Options** :
- **A** : Créer automatiquement un profil client (sans Auth) si non trouvé
- **B** : Laisser `contact_user_id = NULL` et logger un avertissement
- **C** : Demander confirmation avant création

**Recommandation** : **Option A** - Création automatique pour éviter les tickets orphelins.

### ❓ Question 2 : Création automatique des entreprises
**Options** :
- **A** : Créer automatiquement une entreprise si non trouvée
- **B** : Laisser `company_id = NULL`
- **C** : Utiliser entreprise par défaut

**Recommandation** : **Option A** - Création automatique avec `jira_company_id` pour traçabilité.

### ❓ Question 3 : Gestion des doublons contacts
**Scénario** : Même nom mais entreprises différentes (ex: "Jean DUPONT" chez "ETS MAB" et "Jean DUPONT" chez "FALCON")

**Options** :
- **A** : Créer un contact par entreprise (recherche sur `full_name` + `company_id`)
- **B** : Un seul contact, utiliser la dernière entreprise trouvée
- **C** : Demander confirmation

**Recommandation** : **Option A** - Un contact par entreprise (logique métier correcte).

### ❓ Question 4 : Champ `jira_custom_field_10053` dans profiles
**Question** : Faut-il ajouter un champ pour stocker le nom Jira original ?

**Recommandation** : **Non nécessaire** - `full_name` suffit si correspondance exacte.

---

## Récapitulatif Actions Phase 2

### ✅ Aucune modification de schéma requise pour :
- `profiles.full_name` ✅
- `profiles.job_title` ✅
- `profiles.company_id` ✅
- `tickets.canal` ✅

### ➕ Nouvelle table à créer :
- `jira_channel_mapping` (5 mappings initiaux)

### ➕ Services à créer :
- `src/services/jira/contact-mapping.ts` (nouveau)

### ➕ Services à modifier :
- `src/services/jira/sync.ts` (intégrer mappings client/contact)
- `src/services/jira/index.ts` (exporter nouvelles fonctions)

### ➕ Types TypeScript à mettre à jour :
- Interface `JiraIssueData` pour inclure les customfields

---

## Validation Requise

Merci de valider les choix suivants avant implémentation :

1. ✅ **Création automatique contacts** : Option A (création automatique) ?
2. ✅ **Création automatique entreprises** : Option A (création automatique) ?
3. ✅ **Gestion doublons contacts** : Option A (un contact par entreprise) ?
4. ✅ **Champ jira_custom_field_10053** : Non nécessaire ?
5. ✅ **Mapping canaux** : Les 5 mappings proposés sont-ils corrects ?

---

**Document créé le** : 2025-01-18  
**En attente de validation avant implémentation**

