# Référence Complète des Champs de la Table `tickets` dans Supabase

## Objectif

Documenter tous les champs de la table `tickets` avec leurs explications pour l'import depuis JIRA.

---

## Champs Obligatoires (NOT NULL)

### 1. `id` (uuid)
- **Type** : UUID (généré automatiquement)
- **Description** : Identifiant unique Supabase du ticket
- **Source JIRA** : Généré automatiquement (pas de correspondance JIRA)
- **Import** : Auto-généré lors de l'insertion

### 2. `title` (text)
- **Type** : Text (obligatoire)
- **Description** : Titre du ticket
- **Source JIRA** : `fields.summary`
- **Import** : Direct (copier `fields.summary`)

### 3. `ticket_type` (enum)
- **Type** : Enum `ticket_type_t` (obligatoire)
- **Valeurs possibles** : `BUG`, `REQ`, `ASSISTANCE`
- **Description** : Type de ticket
- **Source JIRA** : `fields.issuetype.name`
- **Mapping** : Bug → `BUG`, Requêtes/Task/Story → `REQ`, Assistance → `ASSISTANCE`
- **Import** : Transformer selon le mapping

### 4. `status` (text)
- **Type** : Text (obligatoire, défaut: `'Nouveau'`)
- **Description** : Statut du ticket (dynamique, peut être un statut JIRA brut)
- **Source JIRA** : `fields.status.name`
- **Valeurs possibles** : 
  - Statuts locaux : "Nouveau", "En_cours", "Resolue", "Transfere"
  - Statuts JIRA : "Sprint Backlog", "Traitement en Cours", "Terminé(e)", etc.
- **Import** : Copier directement `fields.status.name` (garder brut JIRA)

---

## Champs Optionnels (NULLABLE)

### 5. `description` (text)
- **Type** : Text (optionnel)
- **Description** : Description détaillée du ticket
- **Source JIRA** : `fields.description`
- **Format JIRA** : Peut être en format ADF (Atlassian Document Format) ou texte
- **Import** : Convertir ADF → texte si nécessaire, sinon copier directement

### 6. `priority` (enum)
- **Type** : Enum `priority_t` (optionnel, défaut: `'Medium'`)
- **Valeurs possibles** : `Low`, `Medium`, `High`, `Critical`
- **Description** : Priorité du ticket
- **Source JIRA** : `fields.priority.name`
- **Mapping** : Priorité 1 → `Critical`, Priorité 2 → `High`, Priorité 3 → `Medium`, Priorité 4 → `Low`
- **Import** : Transformer selon le mapping via `jira_priority_mapping`

### 7. `canal` (enum)
- **Type** : Enum `canal_t` (optionnel)
- **Valeurs possibles** : 
  - `Whatsapp`, `Email`, `Appel`, `Autre`
  - `Appel Téléphonique`, `Appel WhatsApp`
  - `Chat SMS`, `Chat WhatsApp`
  - `Constat Interne`
  - `E-mail`, `En présentiel`, `En prsentiel` (typo)
  - `Non enregistré`
  - `Online (Google Meet, Teams...)`
- **Description** : Canal de contact utilisé pour créer le ticket
- **Source JIRA** : `customfield_10055` (tableau avec valeur)
- **Format JIRA** : `[{value: "En présentiel"}]` → extraire `"En présentiel"`
- **Import** : Extraire la valeur du tableau et mapper vers l'enum

### 8. `product_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID du produit associé (OBC, SNI, Credit Factory, etc.)
- **Relation** : `tickets.product_id` → `products.id`
- **Source JIRA** : À déterminer (components ? labels ? custom field ?)
- **Import** : Chercher dans `products` par nom ou ID JIRA

### 9. `module_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID du module associé (ex: CRM, Finance, Opérations)
- **Relation** : `tickets.module_id` → `modules.id`
- **Source JIRA** : `customfield_10046` (Module) ou autre ?
- **Import** : Chercher dans `modules` via `modules.id_module_jira` ou par nom

### 10. `submodule_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID du sous-module associé
- **Relation** : `tickets.submodule_id` → `submodules.id`
- **Source JIRA** : 
  - `customfield_10052` (Sous-Module ancien)
  - `customfield_10297` (Opérations)
  - `customfield_10298` (Finance)
  - `customfield_10299` (Projet)
  - `customfield_10300` (RH)
  - `customfield_10301` (CRM)
  - `customfield_10302` (Paiement)
- **Import** : Tester tous les custom fields et prendre le premier non-null, chercher via `submodules.id_module_jira`

### 11. `feature_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID de la fonctionnalité associée
- **Relation** : `tickets.feature_id` → `features.id`
- **Source JIRA** : Custom field à déterminer ou `jira_feature_mapping`
- **Import** : Chercher via `features.jira_feature_id` ou `jira_feature_mapping`

### 12. `created_by` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID du profil qui a créé le ticket (agent/manager)
- **Relation** : `tickets.created_by` → `profiles.id`
- **Source JIRA** : `fields.reporter.accountId`
- **Format JIRA** : `"712020:5c9548c8-e063-4cc7-b9e3-98eb370e0d9e"`
- **Import** : Chercher dans `profiles.jira_user_id` ou `profiles.account` par accountId

### 13. `assigned_to` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID du profil assigné au ticket (agent)
- **Relation** : `tickets.assigned_to` → `profiles.id`
- **Source JIRA** : `fields.assignee.accountId`
- **Format JIRA** : `"712020:5c9548c8-e063-4cc7-b9e3-98eb370e0d9e"`
- **Import** : Chercher dans `profiles.jira_user_id` ou `profiles.account` par accountId

### 14. `contact_user_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID du profil client contact (utilisateur final)
- **Relation** : `tickets.contact_user_id` → `profiles.id` (role='client')
- **Source JIRA** : `customfield_10053` (Interlocuteur)
- **Format JIRA** : `"M.SANANKOUA"` (nom complet)
- **Import** : Chercher dans `profiles.full_name` (role='client') par nom (gérer accents, variations)

### 15. `company_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID de l'entreprise associée au ticket
- **Relation** : `tickets.company_id` → `companies.id`
- **Source JIRA** : `customfield_10045` (Client(s))
- **Format JIRA** : `[{value: "ONPOINT"}]` (tableau avec valeur)
- **Import** : Extraire la valeur, chercher dans `companies.name` (ilike, gérer variations)

### 16. `origin` (enum)
- **Type** : Enum `origin_t` (optionnel, défaut: `'supabase'`)
- **Valeurs possibles** : `supabase`, `jira`
- **Description** : Origine du ticket (créé dans Supabase ou importé depuis JIRA)
- **Source JIRA** : Toujours `'jira'` pour les tickets importés
- **Import** : Toujours mettre `'jira'`

### 17. `last_update_source` (text)
- **Type** : Text (optionnel)
- **Description** : Source de la dernière mise à jour (pour éviter les boucles de synchronisation)
- **Source JIRA** : `'jira'` lors de l'import
- **Import** : Mettre `'jira'` lors de l'import initial

### 18. `jira_issue_key` (text)
- **Type** : Text (optionnel, UNIQUE)
- **Description** : Clé du ticket JIRA (ex: "OD-2373")
- **Source JIRA** : `key`
- **Import** : Copier directement `key`

### 19. `jira_issue_id` (text)
- **Type** : Text (optionnel, UNIQUE)
- **Description** : ID numérique du ticket JIRA (ex: "31102")
- **Source JIRA** : `id`
- **Import** : Copier directement `id`

### 20. `jira_metadata` (jsonb)
- **Type** : JSONB (optionnel)
- **Description** : Métadonnées JIRA brutes complètes (pour référence future)
- **Source JIRA** : Tous les champs JIRA bruts
- **Import** : Stocker l'objet JIRA complet (fields, etc.)

### 21. `created_at` (timestamptz)
- **Type** : Timestamp with time zone (optionnel, défaut: `now()`)
- **Description** : Date de création du ticket
- **Source JIRA** : `fields.created` OU `customfield_10111` (Date d'enregistrement)
- **Format JIRA** : ISO 8601 (ex: "2025-01-29T10:30:00.000+0000")
- **Import** : Parser ISO 8601 → timestamptz (prioriser `fields.created`)

### 22. `updated_at` (timestamptz)
- **Type** : Timestamp with time zone (optionnel, défaut: `now()`)
- **Description** : Date de dernière mise à jour
- **Source JIRA** : `fields.updated`
- **Format JIRA** : ISO 8601
- **Import** : Parser ISO 8601 → timestamptz

### 23. `duration_minutes` (integer)
- **Type** : Integer (optionnel)
- **Description** : Durée de l'assistance en minutes (obligatoire pour ASSISTANCE pour KPIs)
- **Source JIRA** : Custom field à déterminer ou calculé
- **Import** : Extraire depuis custom field ou NULL

### 24. `customer_context` (text)
- **Type** : Text (optionnel)
- **Description** : Contexte client (entreprise, point focal, environnement, relance, etc.)
- **Source JIRA** : Custom field à déterminer ou description enrichie
- **Import** : Extraire depuis custom field ou NULL

### 25. `team_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID de l'équipe associée
- **Relation** : `tickets.team_id` → `teams.id`
- **Source JIRA** : Custom field ou déduire depuis département
- **Import** : Chercher ou NULL

### 26. `resolution` (text)
- **Type** : Text (optionnel)
- **Description** : Résolution JIRA (ex: "Terminé")
- **Source JIRA** : `fields.resolution.name`
- **Import** : Copier directement `fields.resolution.name` si existe

### 27. `fix_version` (text)
- **Type** : Text (optionnel)
- **Description** : Version de correction JIRA (ex: "OBC V T1 2024")
- **Source JIRA** : `fields.fixVersions[0].name` (premier élément)
- **Import** : Extraire le premier élément du tableau

### 28. `workflow_status` (text)
- **Type** : Text (optionnel)
- **Description** : Statut workflow JIRA (ex: "Analyse terminée", "En développement")
- **Source JIRA** : `customfield_10083` (Statut du traitement)
- **Format JIRA** : `[{value: "Analyse terminée"}]`
- **Import** : Extraire la valeur du tableau

### 29. `test_status` (text)
- **Type** : Text (optionnel)
- **Description** : Statut test JIRA (ex: "Test Concluant", "Test en cours")
- **Source JIRA** : `customfield_10084` (Statut des tests)
- **Format JIRA** : `[{value: "Test Concluant"}]`
- **Import** : Extraire la valeur du tableau

### 30. `issue_type` (text)
- **Type** : Text (optionnel)
- **Description** : Type d'issue JIRA (Bug, Task, Story, Impediment)
- **Source JIRA** : `fields.issuetype.name`
- **Import** : Copier directement

### 31. `sprint_id` (text)
- **Type** : Text (optionnel)
- **Description** : ID du sprint JIRA (ex: "54")
- **Source JIRA** : `customfield_10020` (Sprint)
- **Format JIRA** : `[{id: "54", name: "Sprint 34"}]`
- **Import** : Extraire l'ID du premier élément

### 32. `related_ticket_id` (uuid)
- **Type** : UUID (optionnel)
- **Description** : ID du ticket lié dans Supabase (si existe)
- **Relation** : `tickets.related_ticket_id` → `tickets.id`
- **Source JIRA** : Issue links ou custom field
- **Import** : Chercher le ticket lié dans Supabase par `jira_issue_key`

### 33. `related_ticket_key` (text)
- **Type** : Text (optionnel)
- **Description** : Clé JIRA du ticket lié (ex: "B-OD-029")
- **Source JIRA** : Issue links
- **Import** : Extraire depuis `fields.issuelinks[]`

### 34. `target_date` (date)
- **Type** : Date (optionnel)
- **Description** : Date cible de résolution
- **Source JIRA** : `fields.duedate` OU `customfield_10115` (Date cible de résolution)
- **Format JIRA** : ISO 8601 (date seulement)
- **Import** : Parser ISO 8601 → date (prioriser `fields.duedate`)

### 35. `resolved_at` (timestamptz)
- **Type** : Timestamp with time zone (optionnel)
- **Description** : Date de résolution effective
- **Source JIRA** : `fields.resolutiondate`
- **Format JIRA** : ISO 8601
- **Import** : Parser ISO 8601 → timestamptz si existe

### 36. `custom_fields` (jsonb)
- **Type** : JSONB (optionnel, défaut: `'{}'::jsonb`)
- **Description** : Champs personnalisés JIRA spécifiques par produit (JSONB)
- **Structure** : 
  ```json
  {
    "product_specific": {
      "customfield_10020": "...",  // Sprint
      "customfield_10021": "...",  // Flagged
      "customfield_10057": "...",  // Code Trello
      "customfield_10111": "...",  // Date d'enregistrement
      // ... autres custom fields non mappés
    },
    "metadata": {
      "labels": ["label1", "label2"],
      "components": [{"name": "Component1"}],
      "issuelinks": [
        {
          "type": "Duplicate",
          "outwardIssue": "OBCS-8648"
        }
      ]
    }
  }
  ```
- **Source JIRA** : Tous les custom fields non mappés + métadonnées
- **Import** : Stocker tous les custom fields non utilisés ailleurs

### 37. `bug_type` (enum)
- **Type** : Enum `bug_type_enum` (optionnel)
- **Valeurs possibles** : 
  - `Autres`, `Mauvais déversement des données`, `Dysfonctionnement sur le Calcul des salaires`
  - `Duplication anormale`, `Enregistrement impossible`, `Page d'erreur`
  - `Historique vide/non exhaustif`, `Non affichage de pages/données`, `Lenteur Système`
  - `Import de fichiers impossible`, `Suppression impossible`, `Récupération de données impossible`
  - `Edition impossible`, `Dysfonctionnement des filtres`, `Error 503`
  - `Impression impossible`, `Erreur de calcul/Erreur sur Dashboard`, `Dysfonctionnement Workflow`
  - `Erreur serveur`, `Dysfonctionnement des liens d'accès`, `Formulaire indisponible`
  - `Erreur Ajax`, `Export de données impossible`, `Connexion impossible`
- **Description** : Type de bug (uniquement pour les tickets de type BUG)
- **Source JIRA** : `customfield_10056` (Type de bugs)
- **Format JIRA** : `[{value: "Page d'erreur"}]`
- **Import** : Extraire la valeur et mapper vers l'enum (NULL si pas un bug)

### 38. `validated_by_manager` (boolean)
- **Type** : Boolean (optionnel, défaut: `false`)
- **Description** : Indique si le ticket a été validé par un manager (non bloquant, pour reporting qualité)
- **Source JIRA** : Custom field à déterminer ou toujours `false` à l'import
- **Import** : Toujours `false` à l'import initial

---

## Résumé par Catégorie

### Champs Obligatoires (4)
- `id`, `title`, `ticket_type`, `status`

### Champs Directs JIRA (8)
- `jira_issue_key`, `jira_issue_id`, `title`, `description`, `status`, `created_at`, `updated_at`, `resolved_at`

### Champs avec Mapping (4)
- `ticket_type`, `priority`, `canal`, `bug_type`

### Relations (7)
- `product_id`, `module_id`, `submodule_id`, `feature_id`, `company_id`, `contact_user_id`, `created_by`, `assigned_to`

### Champs JIRA Spécifiques (8)
- `resolution`, `fix_version`, `workflow_status`, `test_status`, `issue_type`, `sprint_id`, `target_date`, `related_ticket_key`

### Métadonnées (2)
- `jira_metadata`, `custom_fields`

### Champs Système (3)
- `origin`, `last_update_source`, `validated_by_manager`

### Champs Optionnels Métier (3)
- `duration_minutes`, `customer_context`, `team_id`, `related_ticket_id`

---

## Total : 38 champs

- **4 obligatoires** (id, title, ticket_type, status)
- **34 optionnels**





