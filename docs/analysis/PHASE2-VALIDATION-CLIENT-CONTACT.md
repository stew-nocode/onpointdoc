# Phase 2 : Validation - Informations Client/Contact

**Date** : 2025-01-18  
**Statut** : ⏳ **EN ATTENTE DE VALIDATION**

---

## Vue d'ensemble

La Phase 2 concerne la synchronisation des informations client/contact depuis Jira vers Supabase. Les contacts sont stockés dans la table `profiles` avec `role='client'`.

---

## Champs Jira à mapper

### Tableau de mapping proposé

| # | Champ Jira | Type Jira | Colonne Supabase | Table | Statut Actuel | Action Requise | Notes |
|---|------------|-----------|------------------|-------|---------------|----------------|-------|
| 1 | `customfield_10053` | String | `full_name` | `profiles` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | Nom du client (224 valeurs uniques). Mapping via recherche par nom |
| 2 | `customfield_10054` | Object | `job_title` | `profiles` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | Fonction/Poste (46 valeurs uniques). Ex: "Assistant(e) Comptable", "Chef Comptable" |
| 3 | `customfield_10045` | Object | `company_id` | `profiles` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | Entreprise (38 valeurs uniques). Mapping via `companies.name` ou `companies.jira_company_id` |
| 4 | `customfield_10055` | Object | `canal` | `tickets` | ✅ **Existant** | ⚠️ **Mapping nécessaire** | Canal de contact (8 valeurs uniques). Mapping vers enum Supabase |

---

## Détails des mappings

### 1. Mapping Nom du client (`customfield_10053`)

**Champ Jira** : `customfield_10053` (String)  
**Colonne Supabase** : `profiles.full_name`  
**Type** : TEXT (nullable)

**Stratégie de mapping** :
- Recherche par nom exact dans `profiles` (role='client')
- Si trouvé : utiliser le `profile_id` existant
- Si non trouvé : créer un nouveau profil client (sans Auth) avec `role='client'`

**Exemples de valeurs** :
- "KONE Mariam"
- "MONSIEUR KOUADIO"
- "DORIS N'GBRA"
- "Edwige KOUASSI"
- "Michel TETE"

**Action** : Aucune modification de schéma nécessaire. Logique de mapping dans le service de synchronisation.

---

### 2. Mapping Fonction/Poste (`customfield_10054`)

**Champ Jira** : `customfield_10054` (Object avec value)  
**Colonne Supabase** : `profiles.job_title`  
**Type** : TEXT (nullable) - ✅ **DÉJÀ EXISTANT**

**Stratégie de mapping** :
- Extraire la valeur depuis l'objet Jira : `customfield_10054.value`
- Stocker directement dans `profiles.job_title`

**Exemples de valeurs** :
- "Assistant(e) / Stagiaire"
- "Contrôleur de Gestion"
- "Assistant(e) Comptable"
- "Activation Specialist"
- "Chef Comptable"

**Action** : Aucune modification de schéma nécessaire. Logique de mapping dans le service de synchronisation.

---

### 3. Mapping Entreprise (`customfield_10045`)

**Champ Jira** : `customfield_10045` (Object avec value)  
**Colonne Supabase** : `profiles.company_id`  
**Type** : UUID (nullable, FK vers `companies.id`) - ✅ **DÉJÀ EXISTANT**

**Stratégie de mapping** :
- Extraire la valeur depuis l'objet Jira : `customfield_10045.value` (nom de l'entreprise)
- Extraire l'ID depuis l'objet Jira : `customfield_10045.id` (ID de l'option Jira)
- Rechercher d'abord via `companies.jira_company_id` avec l'ID Jira (mapping direct)
- Si non trouvé : rechercher dans `companies.name` (correspondance exacte)
- Si toujours non trouvé : créer une nouvelle entreprise avec `jira_company_id` = ID Jira

**Exemples de valeurs** :
- "ETS MAB" (ID Jira: 11057)
- "SIT BTP" (ID Jira: 10376)
- "FALCON" (ID Jira: 10051)
- "SIE-TRAVAUX" (ID Jira: 10461)
- "ALL" (ID Jira: 10148)

**Action** : Aucune modification de schéma nécessaire. Logique de mapping dans le service de synchronisation.

**Note** : La table `companies` a déjà un champ `jira_company_id` (INTEGER) qui sera utilisé pour le mapping direct via l'ID de l'option Jira.

---

### 4. Mapping Canal de contact (`customfield_10055`)

**Champ Jira** : `customfield_10055` (Object avec value)  
**Colonne Supabase** : `tickets.canal`  
**Type** : ENUM (`Whatsapp`, `Email`, `Appel`, `Autre`) - ✅ **DÉJÀ EXISTANT**

**Stratégie de mapping** : Créer une table `jira_channel_mapping` pour gérer les correspondances

| Canal Jira | Canal Supabase | Valeur DB |
|------------|----------------|------------|
| `Appel Téléphonique` | `Appel` | `'Appel'` |
| `Appel WhatsApp` | `Whatsapp` | `'Whatsapp'` |
| `En présentiel` | `Autre` | `'Autre'` |
| `Online (Google Meet, Teams...)` | `Autre` | `'Autre'` |
| `Constat Interne` | `Autre` | `'Autre'` |

**Action** : 
- Créer table `jira_channel_mapping`
- Insérer les mappings initiaux
- Utiliser dans le service de synchronisation

---

## Modifications de schéma proposées

### 1. Nouvelle table `jira_channel_mapping`

```sql
CREATE TABLE IF NOT EXISTS public.jira_channel_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jira_channel_value TEXT NOT NULL UNIQUE,
  supabase_channel TEXT NOT NULL CHECK (supabase_channel IN ('Whatsapp', 'Email', 'Appel', 'Autre')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Données initiales** :
- `Appel Téléphonique` → `Appel`
- `Appel WhatsApp` → `Whatsapp`
- `En présentiel` → `Autre`
- `Online (Google Meet, Teams...)` → `Autre`
- `Constat Interne` → `Autre`

---

### 2. Extension `profiles` (optionnel)

**Champ proposé** : `jira_custom_field_10053` (TEXT, nullable)
- Stocker le nom Jira original si différent de `full_name`
- Utile pour le débogage et la traçabilité

**Question** : Est-ce nécessaire ou `full_name` suffit-il ?

---

## Services à créer/modifier

### 1. Service de mapping client/contact

**Fichier** : `src/services/jira/contact-mapping.ts`

Fonctions à créer :
- `mapJiraClientNameToProfile(jiraName: string)` : Recherche/création profil
- `mapJiraCompanyToCompanyId(jiraCompanyName: string)` : Recherche/création entreprise
- `mapJiraChannelToSupabase(jiraChannel: string)` : Mapping canal

### 2. Extension service de synchronisation

**Fichier** : `src/services/jira/sync.ts` (modifier)

Modifier `syncJiraToSupabase()` pour :
- Mapper le client depuis `customfield_10053`
- Mapper l'entreprise depuis `customfield_10045`
- Mapper le canal depuis `customfield_10055`
- Mettre à jour `contact_user_id` du ticket

---

## Questions de validation

### 1. Gestion des contacts non trouvés
- **Option A** : Créer automatiquement un nouveau profil client (sans Auth)
- **Option B** : Laisser `contact_user_id = NULL` et logger un avertissement
- **Option C** : Demander confirmation avant création

**Recommandation** : Option A (création automatique) pour éviter les tickets orphelins.

### 2. Gestion des entreprises non trouvées
- **Option A** : Créer automatiquement une nouvelle entreprise
- **Option B** : Laisser `company_id = NULL`
- **Option C** : Utiliser une entreprise par défaut (ex: "ONPOINT AFRICA GROUP")

**Recommandation** : Option A avec validation du nom (éviter doublons).

### 3. Champ `jira_custom_field_10053` dans profiles
- **Question** : Faut-il ajouter ce champ pour stocker le nom Jira original ?
- **Recommandation** : Non nécessaire si `full_name` correspond exactement.

### 4. Mapping des fonctions/poste
- **Question** : Les valeurs Jira (`customfield_10054`) doivent-elles être normalisées ou stockées telles quelles ?
- **Recommandation** : Stocker telles quelles (46 valeurs uniques, pas de normalisation nécessaire).

---

## Récapitulatif des actions Phase 2

### ✅ Aucune modification de schéma requise pour :
- `profiles.full_name` (existant)
- `profiles.job_title` (existant)
- `profiles.company_id` (existant)
- `tickets.canal` (existant)

### ➕ Nouvelle table à créer :
- `jira_channel_mapping` (5 mappings initiaux)

### ➕ Services à créer/modifier :
- `src/services/jira/contact-mapping.ts` (nouveau)
- `src/services/jira/sync.ts` (modifier pour intégrer les mappings client/contact)

### ➕ Types TypeScript à mettre à jour :
- Interface `JiraIssueData` pour inclure les customfields client/contact

---

## Validation requise

Avant d'implémenter la Phase 2, merci de valider :

1. ✅ **Stratégie de création automatique** : Créer automatiquement les contacts/entreprises non trouvés ?
2. ✅ **Champ jira_custom_field_10053** : Nécessaire ou non ?
3. ✅ **Mapping des canaux** : Les 5 mappings proposés sont-ils corrects ?
4. ✅ **Gestion des doublons** : Comment gérer les contacts avec le même nom mais entreprises différentes ?

---

**Document créé le** : 2025-01-18  
**En attente de validation avant implémentation**

