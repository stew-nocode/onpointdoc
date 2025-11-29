# Stratégie de Mapping JIRA → Supabase pour Import Ponctuel

## Objectif

Définir le mapping exact entre les champs JIRA et Supabase pour un import ponctuel des tickets OD depuis JIRA.

---

## Tableau de Mapping

### Champs Directs (1:1)

| Champ Supabase | Type | Champ JIRA | Transformation | Notes |
|----------------|------|------------|-----------------|-------|
| `jira_issue_key` | text | `key` | Direct | Ex: "OD-2373" |
| `jira_issue_id` | text | `id` | Direct | Ex: "31102" |
| `title` | text | `fields.summary` | Direct | Titre du ticket |
| `description` | text | `fields.description` | Convertir ADF → texte si nécessaire | Description |
| `status` | text | `fields.status.name` | Direct (garder brut JIRA) | Ex: "Terminé(e)", "Sprint Backlog" |
| `created_at` | timestamptz | `fields.created` | Parser ISO 8601 → timestamptz | Date de création |
| `updated_at` | timestamptz | `fields.updated` | Parser ISO 8601 → timestamptz | Date de mise à jour |
| `resolved_at` | timestamptz | `fields.resolutiondate` | Parser ISO 8601 → timestamptz | Date de résolution (si existe) |
| `target_date` | date | `fields.duedate` OU `customfield_10115` | Parser ISO 8601 → date | Date cible (priorité à `duedate`) |
| `origin` | enum | - | Toujours `'jira'` | Pour les tickets importés depuis JIRA |

### Champs avec Mapping/Transformation

| Champ Supabase | Type | Champ JIRA | Transformation | Notes |
|----------------|------|------------|-----------------|-------|
| `ticket_type` | enum | `fields.issuetype.name` | **À DÉFINIR** | Bug → BUG ? Requêtes → REQ ? Task → REQ ? |
| `priority` | enum | `fields.priority.name` | **À DÉFINIR** | Priorité 1 → Critical ? Priorité 2 → High ? Priorité 3 → Medium ? Priorité 4 → Low ? |
| `canal` | enum | `customfield_10055` | Extraire valeur du tableau | Ex: [{value: "En présentiel"}] → "En présentiel" |
| `bug_type` | enum | `customfield_10056` | Extraire valeur du tableau | Ex: [{value: "Page d'erreur"}] → "Page d'erreur" |
| `resolution` | text | `fields.resolution.name` | Direct | Ex: "Terminé" |
| `fix_version` | text | `fields.fixVersions[0].name` | Prendre le premier élément | Ex: "OBC V T1 2024" |
| `workflow_status` | text | `customfield_10083` | Extraire valeur du tableau | Ex: [{value: "Analyse terminée"}] → "Analyse terminée" |
| `test_status` | text | `customfield_10084` | Extraire valeur du tableau | Ex: [{value: "Test Concluant"}] → "Test Concluant" |
| `issue_type` | text | `fields.issuetype.name` | Direct | Ex: "Bug", "Task", "Story" |
| `sprint_id` | text | `customfield_10020` | Extraire ID du sprint | Ex: [{id: "54", name: "Sprint 34"}] → "54" |

### Relations (Requièrent Recherche dans Supabase)

| Champ Supabase | Type | Champ JIRA | Méthode de Recherche | Notes |
|----------------|------|------------|----------------------|-------|
| `product_id` | uuid | `fields.components[]` OU `fields.labels[]` OU `customfield_XXXXX` | **À DÉFINIR** | Comment identifier le produit ? |
| `module_id` | uuid | `customfield_XXXXX` OU `fields.components[]` | Chercher via `modules.id_module_jira` | **Quel custom field pour le module ?** |
| `submodule_id` | uuid | `customfield_10052` OU `customfield_10297-10302` | Chercher via `submodules.id_module_jira` OU `jira_feature_mapping` | **Quel custom field selon le produit ?** |
| `feature_id` | uuid | `customfield_XXXXX` | Chercher via `features.jira_feature_id` OU `jira_feature_mapping` | **Quel custom field pour la fonctionnalité ?** |
| `company_id` | uuid | `customfield_10045` | Chercher par nom dans `companies` (ilike) | Ex: [{value: "ONPOINT"}] → chercher "ONPOINT" |
| `contact_user_id` | uuid | `customfield_10053` | Chercher par nom dans `profiles` (role='client', ilike) | Ex: "M.SANANKOUA" → chercher "M.SANANKOUA" |
| `created_by` | uuid | `fields.reporter.accountId` | Chercher `profiles.jira_user_id` OU `profiles.account` | **Format accountId ?** |
| `assigned_to` | uuid | `fields.assignee.accountId` | Chercher `profiles.jira_user_id` OU `profiles.account` | **Format accountId ?** |

### Champs Personnalisés (JSONB)

| Champ Supabase | Type | Contenu JSONB | Notes |
|----------------|------|---------------|-------|
| `custom_fields` | jsonb | Tous les custom fields non mappés + métadonnées | Structure: `{product_specific: {...}, metadata: {...}}` |
| `jira_metadata` | jsonb | Données JIRA brutes complètes | Pour référence future |

### Issue Links (Liens vers OBCS)

| Champ Supabase | Type | Champ JIRA | Transformation | Notes |
|----------------|------|------------|-----------------|-------|
| `custom_fields.metadata.obcs_duplicate` | jsonb | `fields.issuelinks[]` (type="Duplicate", outwardIssue) | Extraire clé OBCS | Ex: "OBCS-8648" |

---

## Questions à Résoudre Ensemble

### 1. Mapping des Types de Tickets

**Question :** Comment mapper `fields.issuetype.name` vers `ticket_type` ?

| JIRA `issuetype.name` | → | Supabase `ticket_type` |
|----------------------|---|------------------------|
| "Bug" | → | `BUG` ? |
| "Requêtes" | → | `REQ` ? |
| "Task" | → | `REQ` ? |
| "Story" | → | `REQ` ? |
| Autre ? | → | ? |

**Votre réponse :** [À COMPLÉTER]

---

### 2. Mapping des Priorités

**Question :** Comment mapper `fields.priority.name` vers `priority` ?

| JIRA `priority.name` | → | Supabase `priority` |
|---------------------|---|---------------------|
| "Priorité 1" | → | `Critical` ? |
| "Priorité 2" | → | `High` ? |
| "Priorité 3" | → | `Medium` ? |
| "Priorité 4" | → | `Low` ? |
| Autre ? | → | ? |

**Votre réponse :** [À COMPLÉTER]

---

### 3. Identification du Produit

**Question :** Comment identifier le produit (`product_id`) depuis JIRA ?

Options possibles :
- A. Via `fields.components[]` (chercher par nom dans `products`)
- B. Via `fields.labels[]` (chercher par label dans `products`)
- C. Via un custom field spécifique (lequel ?)
- D. Via le projet JIRA (project = "OD" → quel produit ?)
- E. Autre méthode ?

**Votre réponse :** [À COMPLÉTER]

---

### 4. Identification du Module

**Question :** Quel custom field JIRA contient le module ?

Options possibles :
- A. `customfield_10046` (Module) - vu dans l'analyse
- B. `fields.components[]` (chercher par nom)
- C. Un autre custom field ?
- D. Déduire depuis le sous-module ?

**Votre réponse :** [À COMPLÉTER]

---

### 5. Identification du Sous-Module

**Question :** Quel custom field utiliser selon le produit ?

D'après l'analyse, il y a plusieurs custom fields pour les sous-modules :
- `customfield_10052` : Sous-Module(s) (ancien)
- `customfield_10297` : Sous-Module(s) Opérations
- `customfield_10298` : Sous-Module(s) Finance
- `customfield_10299` : Sous-Module(s) Projet
- `customfield_10300` : Sous-Module(s) RH
- `customfield_10301` : Sous-Module(s) CRM
- `customfield_10302` : Sous-Module(s) Paiement

**Stratégie :** Tester tous ces custom fields et prendre le premier non-null ?

**Votre réponse :** [À COMPLÉTER]

---

### 6. Identification de la Fonctionnalité

**Question :** Quel custom field contient la fonctionnalité (`feature_id`) ?

Options :
- A. Un custom field spécifique (lequel ?)
- B. Déduire depuis le sous-module ?
- C. Non disponible dans JIRA ?

**Votre réponse :** [À COMPLÉTER]

---

### 7. Recherche des Utilisateurs (Reporter/Assignee)

**Question :** Comment chercher un utilisateur par `accountId` JIRA ?

Format `accountId` : `"712020:5c9548c8-e063-4cc7-b9e3-98eb370e0d9e"`

Options :
- A. Stocker dans `profiles.jira_user_id` (format complet)
- B. Stocker dans `profiles.account` (format simplifié)
- C. Créer automatiquement si non trouvé ?
- D. Ignorer si non trouvé ?

**Votre réponse :** [À COMPLÉTER]

---

### 8. Recherche du Contact (Interlocuteur)

**Question :** Comment chercher le contact par nom (`customfield_10053`) ?

Exemple : `"M.SANANKOUA"`

Options :
- A. Recherche exacte (case-insensitive) dans `profiles.full_name` (role='client')
- B. Recherche flexible (gérer accents, variations)
- C. Créer automatiquement si non trouvé ?
- D. Ignorer si non trouvé ?

**Votre réponse :** [À COMPLÉTER]

---

### 9. Recherche de l'Entreprise

**Question :** Comment chercher l'entreprise par nom (`customfield_10045`) ?

Exemple : `[{value: "ONPOINT"}]`

Options :
- A. Recherche exacte (case-insensitive) dans `companies.name`
- B. Recherche flexible (gérer typos, variations : "ONPOINT" vs "ONPOINT AFRICA GROUP")
- C. Créer automatiquement si non trouvé ?
- D. Ignorer si non trouvé ?

**Votre réponse :** [À COMPLÉTER]

---

### 10. Gestion des Champs Manquants

**Question :** Que faire si un champ requis n'est pas trouvé ?

| Champ | Si non trouvé | Action |
|-------|---------------|--------|
| `product_id` | ? | A. Ignorer (NULL) / B. Valeur par défaut / C. Erreur |
| `module_id` | ? | A. Ignorer (NULL) / B. Valeur par défaut / C. Erreur |
| `submodule_id` | ? | A. Ignorer (NULL) / B. Valeur par défaut / C. Erreur |
| `company_id` | ? | A. Ignorer (NULL) / B. Créer / C. Erreur |
| `contact_user_id` | ? | A. Ignorer (NULL) / B. Créer / C. Erreur |
| `created_by` | ? | A. Ignorer (NULL) / B. Créer / C. Erreur |
| `assigned_to` | ? | A. Ignorer (NULL) / B. Créer / C. Erreur |

**Votre réponse :** [À COMPLÉTER]

---

## Structure du JSONB `custom_fields`

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

---

## Prochaines Étapes

1. ✅ **Vous complétez ce document** avec vos réponses
2. ✅ **On corrige ensemble** les mappings
3. ✅ **Je crée le script d'import** basé sur ce mapping validé
4. ✅ **On teste** sur quelques tickets
5. ✅ **On lance l'import complet**

---

## Notes

- Ce mapping est pour un **import ponctuel**, pas une synchronisation continue
- Les champs non trouvés seront mis à `NULL` sauf indication contraire
- Les erreurs seront loggées mais n'empêcheront pas l'import des autres tickets
- Un rapport sera généré à la fin avec les tickets importés, ignorés, et les erreurs

