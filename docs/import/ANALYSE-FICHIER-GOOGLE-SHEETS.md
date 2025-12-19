# 📊 Analyse du Fichier Google Sheets - Import Tickets JIRA

**Date**: 2025-01-16  
**Source**: [Google Sheets - Tous les tickets Bug et requêtes support](https://docs.google.com/spreadsheets/d/1M3FraNFTqqanqEjaVA0r957KfNUuNARU6mZBERGpnq8/edit?gid=701656857#gid=701656857)  
**Objectif**: Analyser la structure et préparer l'import vers Supabase avec synchronisation JIRA

---

## 📋 Structure du Fichier

### Colonnes Identifiées

| Colonne | Type | Mapping Supabase | Notes |
|---------|------|------------------|-------|
| **A - Clé de ticket** | `OBCS-11496` | `tickets.jira_issue_key` | ✅ Clé unique JIRA |
| **B - Résumé** | Texte | `tickets.title` | ✅ Titre du ticket |
| **C - ID Jira Clé de ticket** | `31102` | `jira_sync.jira_issue_id` | ✅ ID numérique JIRA |
| **D - Description** | Texte (long) | `tickets.description` | ✅ Description complète |
| **E - ID Module** | `10032` | `tickets.module_id` | ⚠️ ID JIRA custom field → besoin mapping |
| **F - Date de creation de Jira** | `2025-10-24 09:34` | `tickets.created_at` | ✅ Date de création |
| **G - Date de résolution** | `2025-07-21 07:57` | `tickets.resolved_at` | ⚠️ Champ à vérifier dans schema |
| **H - Type de bug** | `Autres`, `Duplication anormale` | `tickets.ticket_type` | ⚠️ Mapping nécessaire |
| **I - Projet** | `OBC Customer Support` | `products.name` → `tickets.product_id` | ⚠️ Lookup nécessaire |
| **J - Entreprises** | `ALL`, `ECORIGINE`, `KOFFI & DIABATE` | `companies.name` → `tickets.company_id` | ⚠️ Lookup nécessaire |
| **K - Rapporteur** | `Edwige KOUASSI` | `profiles.full_name` → `tickets.created_by` | ⚠️ Lookup nécessaire |
| **L - Ancien ID Jira Agent** | `Pas d'ancien ID` | - | ℹ️ Historique |
| **M - accountID (from Rapporteur)** | `5fb4dd9e2730d800765b5774` | `profiles.jira_user_id` | ✅ ID JIRA utilisateur |
| **N - Poste** | `Activation Specialist` | `profiles.job_title` | ✅ Poste |
| **O - Utilisateurs** | `Edwige KOUASSI`, `MICHEL TETE` | `profiles.full_name` → `tickets.assigned_to` | ⚠️ Lookup nécessaire |
| **P - Canal** | `Constat Interne`, `Online (Google Meet, Teams...)` | `tickets.canal` | ⚠️ Mapping nécessaire |
| **Q - Module** | `Projets`, `Finance` | `modules.name` → `tickets.module_id` | ⚠️ Lookup nécessaire |
| **R - Sous-Module(s)** | `Feuille de temps`, `Comptabilité Générale` | `submodules.name` → `tickets.submodule_id` | ⚠️ Lookup nécessaire |
| **S - Fonctionnalités** | `Enregistrer mes heures travaillés`, `Paramétrage` | `features.name` → `tickets.feature_id` | ⚠️ Lookup nécessaire |
| **T - Type_Ticket** | `Bug` | `tickets.ticket_type` | ✅ Direct (BUG/REQ) |
| **U - Priorité** | `Priorité 1` | `tickets.priority` | ⚠️ Mapping nécessaire |
| **V - Images** | URL JIRA | `ticket_attachments` | ⚠️ Téléchargement nécessaire |
| **W - Etat** | `En cours`, `Terminé(e)`, `Annulé` | `tickets.status` | ⚠️ Mapping nécessaire |
| **X - Date d'enregistrement Jira** | `23/10/2025 22:00` | `tickets.created_at` | ✅ Date (format à convertir) |
| **Y - Date de mise à jour Jira** | `3/11/2025 11:30` | `tickets.updated_at` | ✅ Date (format à convertir) |
| **Z - ID Canal** | `10370` | Custom field JIRA | ⚠️ ID JIRA custom field |
| **AA - ID Poste** | `10278` | Custom field JIRA | ⚠️ ID JIRA custom field |
| **AB - ID Entreprise** | `10148`, `Non enregistré` | Custom field JIRA → `companies.jira_company_id` | ⚠️ Mapping nécessaire |
| **AC - ID Sous-Module(s)** | `Non enregistré` | Custom field JIRA | ⚠️ Mapping nécessaire |
| **AD - ID Fonctionnalités** | `10018` | Custom field JIRA → `features.jira_feature_id` | ⚠️ Mapping nécessaire |
| **AE - ID Projet** | `10005` | Custom field JIRA → `products.jira_product_id` | ⚠️ Mapping nécessaire |
| **AF - ID Type ticket** | Vide | Custom field JIRA | ℹ️ Non utilisé |

---

## 🔗 Table de Correspondance OD ↔ OBCS

**Table créée** : `od_obcs_mapping`

Cette table permet de mapper les tickets OBCS vers les tickets OD pour éviter les doublons lors de l'import.

**Structure** :
- `obcs_issue_key` : Clé du ticket OBCS (ex: `OBCS-11496`)
- `od_issue_key` : Clé du ticket OD correspondant (ex: `OD-2953`)
- `created_at` / `updated_at` : Timestamps

**Stratégie d'import** :
1. Pour chaque ticket OBCS du fichier, chercher le ticket OD correspondant via `od_obcs_mapping`
2. Si trouvé : mettre à jour le ticket OD avec les données du fichier OBCS
3. Si non trouvé : créer un nouveau ticket OD (cas rare)
4. **Important** : Ne jamais créer de tickets OBCS dans Supabase, seulement des tickets OD

**Source de la correspondance** : [Fichier Google Sheets de correspondance](https://docs.google.com/spreadsheets/d/1Q5baUckdcix_jIau4NNEul4Wm5CYgpR8LgQ_seB2Sjw/edit?gid=713492122#gid=713492122)

---

## ✅ Informations de la Base de Données (via MCP Supabase)

### État Actuel

- **Tickets existants** : 2105 tickets avec `jira_issue_key` (tous uniques)
- **Tickets OBCS** : 0 ticket OBCS dans la base (seulement OD-*)
- **Produits** : 3 produits (OBC, SNI, CREDIT FACTORY) - `jira_product_id` = NULL pour tous
- **Entreprises** : 76 entreprises - **Toutes ont un `jira_company_id`** ✅
- **Modules** : 7 modules - Tous ont un `id_module_jira` (numeric) ✅
- **Fonctionnalités** : 79 fonctionnalités - 37 ont un `jira_feature_id` ✅
- **Utilisateurs** : 643 profils - 16 ont un `jira_user_id` ⚠️

### Tables de Mapping Existantes ✅

1. **`jira_priority_mapping`** : ✅ DÉJÀ CONFIGURÉ
   - Priorité 1 → Critical
   - Priorité 2 → High
   - Priorité 3 → Medium
   - Priorité 4 → Low

2. **`jira_channel_mapping`** : ✅ DÉJÀ CONFIGURÉ
   - Appel Téléphonique → Appel
   - Appel WhatsApp → Whatsapp
   - Constat Interne → Autre
   - En présentiel → Autre
   - Online (Google Meet, Teams...) → Autre

3. **`jira_feature_mapping`** : ✅ DÉJÀ CONFIGURÉ (57 mappings)
   - Exemple : "Finance - Comptabilité Générale" → feature_id avec jira_feature_id = "10088"

4. **`jira_status_mapping`** : ✅ EXISTE (15 mappings)

---

## ⚠️ Points d'Attention et Questions

### 1. **Mapping des Statuts** ✅ RÉSOLU

**Valeurs trouvées dans le fichier** :
- `En cours` → doit mapper vers `En cours` (✅ Status est TEXT, pas ENUM)
- `Terminé(e)` → doit mapper vers `Terminé(e)` (✅ Status est TEXT, accepte les statuts JIRA bruts)
- `Annulé` → doit mapper vers `Annulé` (✅ Status est TEXT, peut accepter n'importe quel statut)

**Réponse** : Le champ `tickets.status` est de type **TEXT** (pas ENUM), donc il peut accepter n'importe quel statut JIRA. On peut donc utiliser les statuts tels quels du fichier.

### 2. **Mapping des Priorités** ✅ RÉSOLU

**Valeurs valides dans Supabase** : `['Low', 'Medium', 'High', 'Critical']`

**Mapping déjà configuré dans `jira_priority_mapping`** :
- ✅ `Priorité 1` → `Critical`
- ✅ `Priorité 2` → `High`
- ✅ `Priorité 3` → `Medium`
- ✅ `Priorité 4` → `Low`

**Réponse** : Le mapping est déjà configuré dans la base de données. On peut utiliser directement la table `jira_priority_mapping` pour mapper les priorités.

### 3. **Mapping des Canaux** ✅ RÉSOLU

**Valeurs valides dans Supabase** : `['Whatsapp', 'Email', 'Appel', 'Autre']`

**Mapping déjà configuré dans `jira_channel_mapping`** :
- ✅ `Appel Téléphonique` → `Appel`
- ✅ `Appel WhatsApp` → `Whatsapp`
- ✅ `Constat Interne` → `Autre`
- ✅ `En présentiel` → `Autre`
- ✅ `Online (Google Meet, Teams...)` → `Autre`

**Réponse** : Le mapping est déjà configuré dans la base de données. On peut utiliser directement la table `jira_channel_mapping` pour mapper les canaux.

### 4. **Mapping des Types de Tickets**

**Valeurs trouvées** :
- `Bug` → `BUG` ✅
- `Requête` → `REQ` ✅ (si présent)

**Question** : Y a-t-il des tickets de type `ASSISTANCE` dans le fichier ?

### 5. **Mapping "Type de bug" (Colonne H)**

**Valeurs trouvées** :
- `Autres`
- `Duplication anormale`
- `Récupération de données impossible`
- `Enregistrement impossible`
- `Non affichage de pages/données`
- `Page d'erreur`

**Question** : Cette colonne correspond-elle à un champ spécifique dans Supabase, ou est-ce juste une catégorisation JIRA ?

### 6. **Lookups Nécessaires**

#### 6.1. Produits ⚠️ ATTENTION
- **Colonne I - Projet** : `OBC Customer Support` → lookup dans `products.name`
- **Colonne AE - ID Projet** : `10005` → lookup dans `products.jira_product_id`

**Problème** : Tous les produits ont `jira_product_id = NULL` dans la base
**Stratégie** : 
1. Lookup par `name` (OBC Customer Support → probablement "OBC")
2. Si non trouvé, créer ou mettre à jour le produit avec `jira_product_id = 10005`

#### 6.2. Entreprises ✅ BON ÉTAT
- **Colonne J - Entreprises** : `ALL`, `ECORIGINE`, `KOFFI & DIABATE` → lookup dans `companies.name`
- **Colonne AB - ID Entreprise** : `10148`, `Non enregistré` → lookup dans `companies.jira_company_id`

**État** : Toutes les entreprises (76) ont un `jira_company_id` ✅
**Exemples vérifiés** :
- ALL → jira_company_id = 10148 ✅
- ECORIGINE → jira_company_id = 10460 ✅
- KOFFI & DIABATE → jira_company_id = 10375 ✅

**Stratégie** : Utiliser d'abord `jira_company_id`, sinon lookup par `name`

#### 6.3. Modules ✅ BON ÉTAT
- **Colonne Q - Module** : `Projets`, `Finance`, `RH` → lookup dans `modules.name` + `product_id`
- **Colonne E - ID Module** : `10032` → lookup dans `modules.id_module_jira` (numeric)

**État** : Tous les modules ont un `id_module_jira` ✅
**Exemples vérifiés** :
- Projets → id_module_jira = 10032 ✅
- Finance → id_module_jira = 10029 ✅
- RH → id_module_jira = 10031 ✅

**Stratégie** : Utiliser d'abord `id_module_jira`, sinon lookup par `name` + `product_id`

#### 6.4. Sous-Modules
- **Colonne R - Sous-Module(s)** : `Feuille de temps`, `Comptabilité Générale` → lookup dans `submodules.name` + `module_id`
- **Colonne AC - ID Sous-Module(s)** : `Non enregistré` → mapping nécessaire

**Stratégie** : Lookup par `name` + `module_id`, créer si nécessaire

#### 6.5. Fonctionnalités ✅ BON ÉTAT (partiel)
- **Colonne S - Fonctionnalités** : `Enregistrer mes heures travaillés`, `Paramétrage` → lookup dans `features.name` + `submodule_id`
- **Colonne AD - ID Fonctionnalités** : `10018` → lookup dans `features.jira_feature_id` ou `jira_feature_mapping`

**État** : 
- 79 fonctionnalités totales
- 37 ont un `jira_feature_id` ✅
- 57 mappings dans `jira_feature_mapping` ✅

**Stratégie** : 
1. Utiliser d'abord `jira_feature_mapping` (par `jira_feature_id` ou `jira_feature_value`)
2. Sinon lookup par `features.jira_feature_id`
3. Sinon lookup par `name` + `submodule_id`

#### 6.6. Utilisateurs (Rapporteur) ⚠️ ATTENTION
- **Colonne K - Rapporteur** : `Edwige KOUASSI` → lookup dans `profiles.full_name`
- **Colonne M - accountID** : `5fb4dd9e2730d800765b5774` → lookup dans `profiles.jira_user_id`

**État** : 
- 643 profils total
- Seulement 16 ont un `jira_user_id` ⚠️
- Exemples vérifiés :
  - Edwige KOUASSI → jira_user_id = "5fb4dd9e2730d800765b5774" ✅
  - Vivien DAKPOGAN → jira_user_id = "712020:5c9548c8-e063-4cc7-b9e3-98eb370e0d9e" ✅

**Stratégie** : 
1. Utiliser d'abord `jira_user_id` si disponible
2. Sinon lookup par `full_name` (tolérance sur casse/accents)
3. Si non trouvé, créer le profil avec `jira_user_id` OU laisser `created_by = NULL`

#### 6.7. Utilisateurs (Assigné)
- **Colonne O - Utilisateurs** : `Edwige KOUASSI`, `MICHEL TETE` → lookup dans `profiles.full_name` → `tickets.assigned_to`

**Stratégie** : Lookup par `full_name`, null si non trouvé

### 7. **Pièces Jointes (Images)**

**Colonne V - Images** : URLs JIRA comme `https://onpointdigital.atlassian.net/rest/api/2/attachment/content/14322`

**Stratégie** :
1. Télécharger les images depuis JIRA
2. Uploader vers Supabase Storage
3. Créer des entrées dans `ticket_attachments`

**Question** : Faut-il télécharger toutes les images lors de l'import, ou seulement les référencer ?

### 8. **Dates**

**Formats trouvés** :
- `2025-10-24 09:34` (format ISO partiel)
- `23/10/2025 22:00` (format français)

**Stratégie** : Parser et convertir en ISO 8601 avec timezone

### 9. **Valeurs "Non enregistré" / "Non renseigné"**

**Stratégie** :
- `Non enregistré` → `NULL` dans Supabase
- `Non renseigné` → `NULL` dans Supabase
- Créer des entrées manquantes si nécessaire (entreprises, modules, etc.)

---

## 📝 Plan d'Import Proposé

### Phase 1 : Préparation et Validation

1. **Télécharger le fichier CSV depuis Google Sheets**
2. **Valider les mappings** :
   - Statuts : `En cours` → `En_cours`, `Terminé(e)` → `Resolue`, `Annulé` → ?
   - Priorités : `Priorité 1` → ?
   - Canaux : Liste complète des canaux valides
3. **Vérifier les lookups** :
   - Produits existants dans Supabase
   - Entreprises existantes
   - Modules/Sous-modules/Fonctionnalités
   - Utilisateurs existants

### Phase 2 : Import des Données de Référence

1. **Créer les entreprises manquantes** (si `Non enregistré`)
2. **Créer les modules/sous-modules/fonctionnalités manquants**
3. **Créer les utilisateurs manquants** (si nécessaire)

### Phase 3 : Import des Tickets

1. **Pour chaque ligne du CSV** :
   - Parser les données
   - Effectuer les lookups (produit, entreprise, module, etc.)
   - Créer le ticket dans Supabase
   - Créer l'entrée dans `jira_sync`
   - Télécharger les pièces jointes (optionnel)
   - Créer l'historique de statut initial

### Phase 4 : Synchronisation JIRA

1. **Vérifier que les tickets existent dans JIRA** (par `jira_issue_key`)
2. **Mettre à jour JIRA si nécessaire** :
   - Custom fields (entreprise, module, fonctionnalité)
   - Statut
   - Priorité
   - Assigné

---

## ❓ Questions à Résoudre AVANT l'Import

### Questions Critiques

1. ✅ **Statut "Annulé"** : **RÉSOLU** - Status est TEXT, accepte n'importe quel statut JIRA
2. ✅ **Mapping Priorités** : **RÉSOLU** - Déjà configuré dans `jira_priority_mapping`
3. ✅ **Mapping Canaux** : **RÉSOLU** - Déjà configuré dans `jira_channel_mapping`
4. ✅ **Champ "Type de bug"** (Colonne H) : **RÉSOLU** - Correspond au champ `tickets.bug_type`
   - Valeurs valides : Enum `bug_type_enum` avec 24 valeurs
   - Mapping direct si la valeur correspond exactement
5. ⚠️ **Pièces jointes** : Télécharger toutes les images ou seulement les référencer ?
6. ⚠️ **Création automatique** : 
   - Entreprises : Toutes ont déjà un `jira_company_id` ✅
   - Modules : Tous ont déjà un `id_module_jira` ✅
   - Utilisateurs : Seulement 16/643 ont un `jira_user_id` ⚠️
   - Produits : `jira_product_id` = NULL pour tous ⚠️

### Questions de Configuration

7. ⚠️ **Projet JIRA** : Tous les tickets sont du projet `OBCS` (OBC Customer Support) ?
   - **État** : Aucun ticket OBCS dans la base actuellement (seulement OD-*)
   - **Question** : Faut-il créer les tickets OBCS ou les ignorer ?
8. ⚠️ **Synchronisation bidirectionnelle** : Après import, faut-il mettre à jour JIRA avec les données Supabase ?
   - Mettre à jour les custom fields JIRA (entreprise, module, fonctionnalité) ?
   - Ou seulement importer sans modifier JIRA ?
9. ⚠️ **Gestion des doublons** : Que faire si un ticket avec la même `jira_issue_key` existe déjà ?
   - **État** : 2105 tickets avec `jira_issue_key` (tous uniques)
   - **Question** : Les tickets OBCS du fichier existent-ils déjà dans JIRA ? Si oui, mettre à jour ou ignorer ?

---

## 🎯 Prochaines Étapes

1. **Répondre aux questions ci-dessus**
2. **Valider les mappings** avec vous
3. **Créer le script d'import** une fois les réponses obtenues
4. **Tester sur un échantillon** (10-20 tickets)
5. **Importer en masse** après validation

---

## 📊 Statistiques du Fichier (à compléter)

- **Nombre total de lignes** : ~100+ (d'après les exemples)
- **Tickets uniques** : À calculer
- **Entreprises** : À lister
- **Modules** : À lister
- **Utilisateurs** : À lister

---

---

## 📊 Résumé de l'Analyse

### ✅ Ce qui est PRÊT

1. **Mappings déjà configurés** :
   - ✅ Priorités : `jira_priority_mapping` (Priorité 1→Critical, etc.)
   - ✅ Canaux : `jira_channel_mapping` (tous les canaux du fichier mappés)
   - ✅ Fonctionnalités : `jira_feature_mapping` (57 mappings)
   - ✅ Statuts : `jira_status_mapping` (15 mappings)

2. **Données de référence** :
   - ✅ Entreprises : 76 entreprises, toutes ont un `jira_company_id`
   - ✅ Modules : 7 modules, tous ont un `id_module_jira`
   - ✅ Fonctionnalités : 79 fonctionnalités, 37 ont un `jira_feature_id`

3. **Structure de la base** :
   - ✅ `tickets.status` est TEXT (accepte n'importe quel statut JIRA)
   - ✅ `tickets.resolved_at` existe (timestamp)
   - ✅ `tickets.bug_type` est un enum avec 24 valeurs
   - ✅ `jira_sync` table existe avec tous les champs nécessaires

### ⚠️ Ce qui nécessite une DÉCISION

1. **Tickets OBCS** :
   - Aucun ticket OBCS dans la base actuellement (seulement OD-*)
   - **Question** : Faut-il créer les tickets OBCS du fichier ou les ignorer ?

2. **Produits** :
   - Tous les produits ont `jira_product_id = NULL`
   - **Question** : Mettre à jour les produits avec `jira_product_id = 10005` (OBC) ?

3. **Utilisateurs** :
   - Seulement 16/643 profils ont un `jira_user_id`
   - **Question** : Créer les profils manquants avec `jira_user_id` ou laisser `created_by = NULL` ?

4. **Pièces jointes** :
   - **Question** : Télécharger toutes les images depuis JIRA vers Supabase Storage ou seulement référencer les URLs ?

5. **Synchronisation JIRA** :
   - **Question** : Après import, faut-il mettre à jour JIRA avec les custom fields (entreprise, module, fonctionnalité) ?

6. **Gestion des doublons** :
   - **Question** : Si un ticket OBCS existe déjà dans JIRA, mettre à jour ou ignorer ?

---

**En attente de vos réponses pour procéder à l'import** ✅

