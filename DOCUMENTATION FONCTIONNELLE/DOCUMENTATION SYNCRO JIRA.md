# Documentation Complète - Synchronisation JIRA

> **Objectif** : Permettre à un autre développeur de comprendre et continuer le travail sur la synchronisation JIRA sans se perdre.

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Structure de la Base de Données](#structure-de-la-base-de-données)
4. [Flux de Synchronisation](#flux-de-synchronisation)
5. [Services et Fonctions](#services-et-fonctions)
6. [Webhooks et API](#webhooks-et-api)
7. [Mapping des Données](#mapping-des-données)
8. [Gestion des Erreurs](#gestion-des-erreurs)
9. [Tests et Débogage](#tests-et-débogage)
10. [Maintenance](#maintenance)

---

## Vue d'Ensemble

### Objectif

La synchronisation JIRA permet de :
- **Transférer** des tickets ASSISTANCE depuis Supabase vers JIRA pour traitement IT
- **Synchroniser** les mises à jour JIRA (statuts, commentaires, assignations) vers Supabase
- **Maintenir** la cohérence bidirectionnelle entre les deux systèmes

### Types de Tickets Concernés

| Type de Ticket | Comportement |
|----------------|--------------|
| **ASSISTANCE** | Peut être transféré vers JIRA. Après transfert, utilise les statuts JIRA directement. |
| **BUG** | Créé directement dans JIRA ou synchronisé depuis JIRA. Utilise les statuts JIRA bruts. |
| **REQ** | Créé directement dans JIRA ou synchronisé depuis JIRA. Utilise les statuts JIRA bruts. |

### Principe de Source de Vérité

- **Avant transfert** : Supabase est la source de vérité pour les tickets ASSISTANCE
- **Après transfert** : JIRA devient la source de vérité pour les tickets transférés
- **BUG/REQ** : JIRA est toujours la source de vérité

---

## Architecture

### Schéma Global

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Supabase  │ ◄─────► │  Next.js    │ ◄─────► │    JIRA     │
│  (PostgreSQL)│         │  (API)      │         │  (API/Webhook)│
└─────────────┘         └─────────────┘         └─────────────┘
       ▲                        │                       │
       │                        │                       │
       └────────────────────────┴───────────────────────┘
                    (Synchronisation Bidirectionnelle)
```

### Composants Principaux

1. **Next.js Application** (`src/app/api/webhooks/jira/route.ts`)
   - Reçoit les webhooks JIRA
   - Appelle les services de synchronisation

2. **Services JIRA** (`src/services/jira/`)
   - `sync.ts` : Synchronisation JIRA → Supabase
   - `client.ts` : Client API JIRA (création de tickets)
   - `mapping.ts` : Mapping statuts/priorités
   - `comments/sync.ts` : Synchronisation des commentaires
   - `sync-manual.ts` : Synchronisation manuelle

3. **Transfert de Tickets** (`src/services/tickets/jira-transfer.ts`)
   - Transfert ASSISTANCE → JIRA

4. **Base de Données Supabase**
   - Tables : `tickets`, `jira_sync`, `ticket_status_history`, `ticket_comments`
   - Tables de mapping : `jira_status_mapping`, `jira_priority_mapping`

---

## Structure de la Base de Données

### Table `tickets`

Champs clés pour la synchronisation JIRA :

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique du ticket |
| `jira_issue_key` | TEXT | Clé JIRA (ex: "OD-2991") - **Clé de liaison** |
| `ticket_type` | ENUM | 'BUG', 'REQ', 'ASSISTANCE' |
| `status` | TEXT | Statut du ticket (JIRA brut pour BUG/REQ, mappé pour ASSISTANCE) |
| `priority` | ENUM | 'Low', 'Medium', 'High', 'Critical' |
| `last_update_source` | TEXT | 'jira' ou 'supabase' - **Anti-boucle** |
| `origin` | ENUM | 'supabase' ou 'jira' - Origine de création |
| `resolution` | TEXT | Résolution JIRA (ex: "Terminé") |
| `fix_version` | TEXT | Version de correction JIRA |
| `workflow_status` | TEXT | Statut workflow JIRA (customfield_10083) |
| `test_status` | TEXT | Statut test JIRA (customfield_10084) |
| `issue_type` | TEXT | Type d'issue JIRA (customfield_10021) |
| `sprint_id` | TEXT | ID du sprint JIRA (customfield_10020) |
| `related_ticket_key` | TEXT | Clé du ticket lié (customfield_10057) |
| `target_date` | DATE | Date cible (customfield_10111) |
| `resolved_at` | TIMESTAMPTZ | Date de résolution (customfield_10115) |
| `custom_fields` | JSONB | Champs spécifiques produits (Phase 5) |

### Table `jira_sync`

Table de tracking de la synchronisation (relation 1:1 avec `tickets`) :

| Champ | Type | Description |
|-------|------|-------------|
| `ticket_id` | UUID | FK vers `tickets.id` (UNIQUE) |
| `jira_issue_key` | TEXT | Clé JIRA (UNIQUE) |
| `origin` | ENUM | 'supabase' ou 'jira' |
| `last_synced_at` | TIMESTAMPTZ | Dernière synchronisation |
| `sync_error` | TEXT | Erreur de synchronisation (si échec) |
| `jira_status` | TEXT | Statut JIRA original |
| `jira_priority` | TEXT | Priorité JIRA original |
| `jira_assignee_account_id` | TEXT | AccountId JIRA de l'assigné |
| `jira_reporter_account_id` | TEXT | AccountId JIRA du reporter |
| `jira_resolution` | TEXT | Résolution JIRA |
| `jira_fix_version` | TEXT | Version de correction JIRA |
| `jira_sprint_id` | TEXT | ID du sprint JIRA |
| `jira_workflow_status` | TEXT | Statut workflow JIRA |
| `jira_test_status` | TEXT | Statut test JIRA |
| `jira_issue_type` | TEXT | Type d'issue JIRA |
| `jira_related_ticket_key` | TEXT | Clé du ticket lié |
| `jira_target_date` | DATE | Date cible |
| `jira_resolved_at` | TIMESTAMPTZ | Date de résolution |
| `last_status_sync` | TIMESTAMPTZ | Dernière sync du statut |
| `last_priority_sync` | TIMESTAMPTZ | Dernière sync de la priorité |
| `sync_metadata` | JSONB | Métadonnées supplémentaires (labels, components, etc.) |

### Table `ticket_status_history`

Historique des changements de statut :

| Champ | Type | Description |
|-------|------|-------------|
| `ticket_id` | UUID | FK vers `tickets.id` |
| `status_from` | TEXT | Statut précédent |
| `status_to` | TEXT | Nouveau statut |
| `source` | ENUM | 'supabase' ou 'jira' - **Origine du changement** |
| `changed_at` | TIMESTAMPTZ | Date du changement |

### Table `ticket_comments`

Commentaires sur les tickets :

| Champ | Type | Description |
|-------|------|-------------|
| `ticket_id` | UUID | FK vers `tickets.id` |
| `content` | TEXT | Contenu du commentaire |
| `origin` | ENUM | 'supabase' ou 'jira' - **Origine du commentaire** |
| `user_id` | UUID | FK vers `profiles.id` (null si origine JIRA) |
| `comment_type` | ENUM | 'comment', 'relance', etc. |

### Tables de Mapping

#### `jira_status_mapping`

Mapping dynamique des statuts JIRA → Supabase :

| Champ | Type | Description |
|-------|------|-------------|
| `jira_status_name` | TEXT | Nom du statut JIRA (ex: "Sprint Backlog") |
| `supabase_status` | TEXT | Statut Supabase correspondant |
| `ticket_type` | ENUM | 'BUG', 'REQ', 'ASSISTANCE' |
| UNIQUE(`jira_status_name`, `ticket_type`) | | |

**Note** : Pour BUG/REQ, les statuts JIRA sont stockés directement (pas de mapping).

#### `jira_priority_mapping`

Mapping dynamique des priorités JIRA → Supabase :

| Champ | Type | Description |
|-------|------|-------------|
| `jira_priority_name` | TEXT | Nom de la priorité JIRA (ex: "Priorité 1") |
| `supabase_priority` | ENUM | 'Low', 'Medium', 'High', 'Critical' |
| UNIQUE(`jira_priority_name`) | | |

---

## Flux de Synchronisation

### Flux 1 : Transfert ASSISTANCE → JIRA

**Déclencheur** : Utilisateur clique sur "Transférer vers JIRA" dans l'interface

**Fichier** : `src/services/tickets/jira-transfer.ts`

**Étapes** :

1. **Vérification** : Ticket ASSISTANCE en statut "En_cours"
2. **Mise à jour statut** : `status = 'Transfere'` dans Supabase
3. **Historique** : Insert dans `ticket_status_history`
4. **Création JIRA** : Appel à `createJiraIssue()` (API JIRA directe)
5. **Mise à jour** : `jira_issue_key` renseigné dans `tickets`
6. **Tracking** : Insert/Upsert dans `jira_sync`
7. **Pièces jointes** : Upload des pièces jointes vers JIRA (si présentes)

**Code clé** :

```typescript
// src/services/tickets/jira-transfer.ts
export const transferTicketToJira = async (ticketId: string) => {
  // 1. Vérifier le ticket
  // 2. Mettre à jour le statut
  // 3. Créer le ticket JIRA
  // 4. Mettre à jour jira_issue_key
  // 5. Enregistrer dans jira_sync
}
```

### Flux 2 : Synchronisation JIRA → Supabase

**Déclencheur** : Webhook JIRA reçu sur `/api/webhooks/jira`

**Fichier** : `src/app/api/webhooks/jira/route.ts`

**Étapes** :

1. **Réception webhook** : Format JIRA natif ou format simplifié
2. **Filtrage** : Ignorer les tickets non-OD (seulement `OD-*`)
3. **Recherche ticket** : Par `jira_issue_key` dans `tickets`
4. **Synchronisation** : Appel à `syncJiraToSupabase()`
5. **Création si absent** : Si ticket non trouvé, création depuis JIRA

**Formats supportés** :

1. **Format webhook JIRA natif** :
```json
{
  "webhookEvent": "jira:issue_updated",
  "issue": {
    "key": "OD-2991",
    "fields": { ... }
  }
}
```

2. **Format simplifié (legacy)** :
```json
{
  "event_type": "status_changed",
  "jira_issue_key": "OD-2991",
  "updates": { ... }
}
```

3. **Format complet (Phase 1)** :
```json
{
  "ticket_id": "uuid",
  "jira_data": { ... }
}
```

### Flux 3 : Synchronisation Complète (syncJiraToSupabase)

**Fichier** : `src/services/jira/sync.ts`

**Fonction** : `syncJiraToSupabase(ticketId, jiraData, supabaseClient)`

**Étapes** :

1. **Déterminer le type** : BUG, REQ, ou ASSISTANCE
2. **Mapper le statut** : Via `getSupabaseStatusFromJira()`
3. **Mapper la priorité** : Via `getSupabasePriorityFromJira()`
4. **Mapper les utilisateurs** : Reporter et assigné (via `jira_user_id` dans `profiles`)
5. **Mapper le client/contact** : Via custom fields JIRA (Phase 2)
6. **Mapper le canal** : Via custom field `customfield_10055`
7. **Mapper la fonctionnalité** : Via custom field `customfield_10052` (Phase 3)
8. **Mapper les champs workflow** : Workflow status, test status, etc. (Phase 4)
9. **Mapper les champs produits** : Champs spécifiques produits (Phase 5)
10. **Mettre à jour le ticket** : Update dans `tickets`
11. **Mettre à jour jira_sync** : Upsert avec métadonnées
12. **Historique** : Insert dans `ticket_status_history` si changement
13. **Pièces jointes** : Téléchargement depuis JIRA vers Supabase Storage

**Code clé** :

```typescript
// src/services/jira/sync.ts
export async function syncJiraToSupabase(
  ticketId: string,
  jiraData: JiraIssueData,
  supabaseClient?: SupabaseClient
): Promise<void> {
  // 1. Mapper statut/priorité
  // 2. Mapper utilisateurs
  // 3. Mapper client/contact/entreprise
  // 4. Mapper fonctionnalité/module
  // 5. Mapper champs workflow
  // 6. Mettre à jour ticket
  // 7. Mettre à jour jira_sync
  // 8. Historique
  // 9. Pièces jointes
}
```

---

## Services et Fonctions

### Service Principal : `src/services/jira/sync.ts`

#### `syncJiraToSupabase()`

Synchronise un ticket JIRA vers Supabase.

**Paramètres** :
- `ticketId` : UUID du ticket Supabase
- `jiraData` : Données du ticket JIRA (format `JiraIssueData`)
- `supabaseClient` : Client Supabase (optionnel, utilise Service Role par défaut)

**Retour** : `Promise<void>`

**Gestion d'erreur** : Lance une erreur si la mise à jour échoue

#### `mapJiraIssueTypeToTicketType()`

Mappe le type d'issue JIRA vers le type de ticket Supabase.

**Mapping** :
- "BUG" → `'BUG'`
- "REQ", "REQUEST", "STORY" → `'REQ'`
- Autres → `'ASSISTANCE'`

### Service Client JIRA : `src/services/jira/client.ts`

#### `createJiraIssue()`

Crée un ticket JIRA depuis Supabase.

**Paramètres** :
- `input` : `CreateJiraIssueInput` (ticketId, title, description, etc.)

**Retour** : `Promise<CreateJiraIssueResponse>`

**Fonctionnalités** :
- Mapping des priorités (Low → Priorité 4, etc.)
- Enrichissement de la description (contexte client, canal, produit, module)
- Conversion description en format ADF (requis par JIRA API v3)
- Ajout de labels (canal, produit, module)
- Stockage de l'ID Supabase dans un custom field

#### `updateJiraIssueStatus()`

Met à jour le statut d'un ticket JIRA.

**Paramètres** :
- `jiraIssueKey` : Clé du ticket JIRA
- `statusName` : Nom du nouveau statut

**Retour** : `Promise<boolean>`

### Service Mapping : `src/services/jira/mapping.ts`

#### `getSupabaseStatusFromJira()`

Récupère le statut Supabase correspondant à un statut JIRA.

**Comportement** :
- **BUG/REQ** : Retourne directement le statut JIRA brut (pas de mapping)
- **ASSISTANCE** : Utilise le mapping depuis `jira_status_mapping`, ou retourne le statut JIRA brut si transféré

#### `getSupabasePriorityFromJira()`

Récupère la priorité Supabase correspondante à une priorité JIRA.

**Comportement** : Utilise le mapping depuis `jira_priority_mapping`

### Service Transfert : `src/services/tickets/jira-transfer.ts`

#### `transferTicketToJira()`

Transfère un ticket ASSISTANCE vers JIRA.

**Prérequis** :
- Ticket type = `'ASSISTANCE'`
- Statut = `'En_cours'`

**Actions** :
1. Met à jour le statut à `'Transfere'`
2. Crée le ticket JIRA
3. Met à jour `jira_issue_key`
4. Enregistre dans `jira_sync`
5. Upload des pièces jointes

### Service Synchronisation Manuelle : `src/services/jira/sync-manual.ts`

#### `syncTicketFromJira()`

Synchronise manuellement un ticket depuis JIRA.

**Paramètres** :
- `jiraIssueKey` : Clé du ticket JIRA

**Retour** : `Promise<boolean>`

**Usage** : Utile pour tester ou corriger des tickets non synchronisés

#### `syncAllTicketsFromJira()`

Synchronise tous les tickets avec `jira_issue_key` depuis JIRA.

**Paramètres** :
- `limit` : Nombre maximum de tickets (défaut: 50)

**Retour** : `Promise<number>` (nombre de tickets synchronisés)

---

## Webhooks et API

### Route Webhook JIRA

**Fichier** : `src/app/api/webhooks/jira/route.ts`

**Endpoint** : `POST /api/webhooks/jira`

**Sécurité** : ⚠️ **À sécuriser en production** (authentification, validation)

**Formats supportés** :

1. **Format webhook JIRA natif** (recommandé)
2. **Format simplifié** (legacy)
3. **Format complet** (Phase 1)

**Filtrage** : Ignore automatiquement les tickets non-OD (seulement `OD-*`)

**Logique** :

```typescript
// 1. Recevoir le webhook
// 2. Transformer en format JiraIssueData
// 3. Chercher le ticket par jira_issue_key
// 4. Si trouvé : synchroniser
// 5. Si non trouvé : créer depuis JIRA
```

### Configuration JIRA Webhook

Dans JIRA, configurer un webhook pointant vers :

```
https://votre-domaine.com/api/webhooks/jira
```

**Événements à écouter** :
- `jira:issue_created`
- `jira:issue_updated`
- `comment_created`

### Variables d'Environnement

**Application Next.js** :

```env
JIRA_URL=https://votre-entreprise.atlassian.net
JIRA_USERNAME=votre-email@example.com
JIRA_TOKEN=votre-api-token
JIRA_SUPABASE_TICKET_ID_FIELD=customfield_10001  # Optionnel
```

**Supabase** :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

---

## Mapping des Données

### Mapping Statuts

#### BUG/REQ

Les statuts JIRA sont **stockés directement** dans Supabase (pas de mapping).

Exemples :
- "Sprint Backlog" → stocké tel quel
- "Traitement en Cours" → stocké tel quel
- "Terminé(e)" → stocké tel quel

#### ASSISTANCE

Les statuts ASSISTANCE utilisent un **mapping dynamique** via `jira_status_mapping`.

**Avant transfert** : Statuts locaux (Nouveau, En_cours, Resolue, etc.)
**Après transfert** : Statuts JIRA bruts (comme BUG/REQ)

**Mapping par défaut** :
- "Sprint Backlog" → "Nouveau"
- "Traitement en Cours" → "En_cours"
- "Terminé(e)" → "Resolue"

### Mapping Priorités

Tous les types de tickets utilisent le mapping via `jira_priority_mapping`.

**Mapping par défaut** :
- "Priorité 1" → "Critical"
- "Priorité 2" → "High"
- "Priorité 3" → "Medium"
- "Priorité 4" → "Low"

### Mapping Custom Fields JIRA

#### Phase 2 : Client/Contact

| Custom Field JIRA | Champ Supabase | Description |
|-------------------|----------------|-------------|
| `customfield_10053` | `contact_user_id` | Nom du client (mappé vers `profiles`) |
| `customfield_10054` | `profiles.job_title` | Fonction/Poste du client |
| `customfield_10045` | `companies.id` | Entreprise (mappé vers `companies`) |
| `customfield_10055` | `tickets.canal` | Canal de contact |

#### Phase 3 : Fonctionnalité/Module

| Custom Field JIRA | Champ Supabase | Description |
|-------------------|----------------|-------------|
| `customfield_10052` | `feature_id`, `submodule_id` | Module/Fonctionnalité (mappé vers `features`/`submodules`) |

#### Phase 4 : Workflow et Suivi

| Custom Field JIRA | Champ Supabase | Description |
|-------------------|----------------|-------------|
| `customfield_10083` | `workflow_status` | Statut workflow |
| `customfield_10084` | `test_status` | Statut test |
| `customfield_10021` | `issue_type` | Type d'issue (Bug, Impediment, etc.) |
| `customfield_10020` | `sprint_id` | ID du sprint |
| `customfield_10057` | `related_ticket_key`, `related_ticket_id` | Ticket lié |
| `customfield_10111` | `target_date` | Date cible |
| `customfield_10115` | `resolved_at` | Date de résolution |

#### Phase 5 : Champs Spécifiques Produits

Stockés dans `tickets.custom_fields` (JSONB) :

| Custom Field JIRA | Produit | Description |
|-------------------|---------|-------------|
| `customfield_10297` | OBC | Opérations |
| `customfield_10298` | OBC | Finance |
| `customfield_10300` | OBC | RH |
| `customfield_10299` | OBC | Projets |
| `customfield_10301` | OBC | CRM |
| `customfield_10313` | - | Finance |
| `customfield_10324` | - | RH |
| `customfield_10364` | - | Paramétrage admin |

---

## Gestion des Erreurs

### Règles Anti-Boucle

Pour éviter les boucles infinies de synchronisation :

1. **Champ `last_update_source`** dans `tickets`
   - `'supabase'` : Dernière mise à jour depuis l'application
   - `'jira'` : Dernière mise à jour depuis JIRA

2. **Logique de synchronisation**
   - Si `last_update_source='jira'` et mise à jour depuis Supabase → Ne pas renvoyer vers JIRA
   - Si `last_update_source='supabase'` et mise à jour depuis JIRA → Ne pas renvoyer vers Supabase

3. **Champ `origin`** dans `ticket_status_history` et `ticket_comments`
   - Permet de distinguer l'origine des données dans l'UI

### Gestion des Erreurs de Synchronisation

**Erreurs silencieuses** (ne font pas échouer la synchronisation) :
- Échec du téléchargement des pièces jointes
- Échec de la mise à jour de `jira_sync` (non bloquant)

**Erreurs bloquantes** :
- Échec de la mise à jour du ticket principal
- Erreur de mapping critique (statut, priorité)

**Enregistrement des erreurs** :
- `jira_sync.sync_error` : Stocke l'erreur pour diagnostic
- Logs console pour débogage

### Erreurs Courantes

#### Ticket non trouvé

**Symptôme** : Webhook reçu mais ticket Supabase non trouvé

**Causes** :
- Ticket créé directement dans JIRA (non lié à Supabase)
- `jira_issue_key` incorrect ou manquant

**Solution** : Le webhook crée automatiquement le ticket depuis JIRA si non trouvé

#### Mapping manquant

**Symptôme** : Statut ou priorité non mappé

**Comportement** :
- **BUG/REQ** : Utilise le statut JIRA brut (pas de mapping requis)
- **ASSISTANCE** : Utilise le statut JIRA brut si transféré, sinon utilise le mapping

**Solution** : Ajouter le mapping dans `jira_status_mapping` ou `jira_priority_mapping`

#### Utilisateur non trouvé

**Symptôme** : Reporter ou assigné non mappé

**Comportement** : `created_by` ou `assigned_to` reste `null`

**Solution** : Ajouter `jira_user_id` dans `profiles` pour lier les utilisateurs

---

## Tests et Débogage

### Test du Transfert ASSISTANCE → JIRA

1. **Créer un ticket ASSISTANCE** en statut "En_cours"
2. **Cliquer sur "Transférer vers JIRA"**
3. **Vérifier** :
   - Statut = `'Transfere'` dans Supabase
   - Entrée dans `ticket_status_history`
   - Ticket créé dans JIRA avec le bon mapping
   - `jira_issue_key` renseigné dans Supabase
   - Entrée dans `jira_sync`

### Test de la Synchronisation JIRA → Supabase

1. **Modifier le statut d'un ticket dans JIRA**
2. **Vérifier** :
   - Statut mis à jour dans Supabase
   - Entrée dans `ticket_status_history` avec `origin='jira'`
   - `last_synced_at` mis à jour dans `jira_sync`

### Test de Synchronisation Manuelle

```typescript
import { syncTicketFromJira } from '@/services/jira/sync-manual';

// Synchroniser un ticket spécifique
await syncTicketFromJira('OD-2991');

// Synchroniser tous les tickets (limite 50)
await syncAllTicketsFromJira(50);
```

### Débogage

#### Logs Console

Les services loggent les erreurs et warnings :
- Mapping manquant
- Utilisateur non trouvé
- Erreurs de synchronisation

#### Vérification dans Supabase

```sql
-- Vérifier les tickets synchronisés
SELECT t.id, t.jira_issue_key, t.status, js.last_synced_at, js.sync_error
FROM tickets t
LEFT JOIN jira_sync js ON js.ticket_id = t.id
WHERE t.jira_issue_key IS NOT NULL;

-- Vérifier les erreurs de synchronisation
SELECT * FROM jira_sync WHERE sync_error IS NOT NULL;

-- Vérifier l'historique des statuts
SELECT * FROM ticket_status_history 
WHERE source = 'jira' 
ORDER BY changed_at DESC 
LIMIT 10;
```

#### Test du Webhook

```bash
# Tester le webhook avec curl
curl -X POST https://votre-domaine.com/api/webhooks/jira \
  -H "Content-Type: application/json" \
  -d '{
    "webhookEvent": "jira:issue_updated",
    "issue": {
      "key": "OD-2991",
      "fields": {
        "status": { "name": "Traitement en Cours" }
      }
    }
  }'
```

---

## Maintenance

### Ajout de Nouveaux Champs

1. **Ajouter le champ dans `tickets`** (migration Supabase)
2. **Ajouter le mapping dans `syncJiraToSupabase()`** (`src/services/jira/sync.ts`)
3. **Ajouter le champ dans `jira_sync`** si nécessaire (métadonnées)
4. **Tester** avec un ticket réel

### Ajout de Nouveaux Statuts

1. **Ajouter le mapping dans `jira_status_mapping`** :
```sql
INSERT INTO jira_status_mapping (jira_status_name, supabase_status, ticket_type)
VALUES ('Nouveau Statut', 'Statut Supabase', 'BUG');
```

2. **Pour BUG/REQ** : Pas besoin de mapping, les statuts JIRA sont stockés directement

### Ajout de Nouvelles Priorités

1. **Ajouter le mapping dans `jira_priority_mapping`** :
```sql
INSERT INTO jira_priority_mapping (jira_priority_name, supabase_priority)
VALUES ('Priorité 5', 'Low');
```

### Monitoring

#### Indicateurs à Surveiller

- `jira_sync.sync_error` : Erreurs de synchronisation récurrentes
- `jira_sync.last_synced_at` : Tickets non synchronisés depuis longtemps
- `ticket_status_history` : Vérifier la cohérence des transitions

#### Requêtes de Monitoring

```sql
-- Tickets avec erreurs de synchronisation
SELECT t.id, t.jira_issue_key, js.sync_error, js.last_synced_at
FROM tickets t
JOIN jira_sync js ON js.ticket_id = t.id
WHERE js.sync_error IS NOT NULL;

-- Tickets non synchronisés depuis plus de 24h
SELECT t.id, t.jira_issue_key, js.last_synced_at
FROM tickets t
JOIN jira_sync js ON js.ticket_id = t.id
WHERE js.last_synced_at < NOW() - INTERVAL '24 hours'
  AND t.jira_issue_key IS NOT NULL;
```

### Mises à Jour

#### Changement de Statuts JIRA

1. Mettre à jour les mappings dans `jira_status_mapping`
2. Pour BUG/REQ : Aucune action (statuts stockés directement)

#### Changement de Priorités JIRA

1. Mettre à jour les mappings dans `jira_priority_mapping`

#### Nouveaux Produits/Modules

1. Vérifier que les labels JIRA sont correctement générés lors du transfert
2. Vérifier le mapping des fonctionnalités dans `customfield_10052`

---

## Fichiers Clés

### Services

- `src/services/jira/sync.ts` : Synchronisation principale JIRA → Supabase
- `src/services/jira/client.ts` : Client API JIRA (création, mise à jour)
- `src/services/jira/mapping.ts` : Mapping statuts/priorités
- `src/services/jira/comments/sync.ts` : Synchronisation des commentaires
- `src/services/jira/sync-manual.ts` : Synchronisation manuelle
- `src/services/tickets/jira-transfer.ts` : Transfert ASSISTANCE → JIRA

### API Routes

- `src/app/api/webhooks/jira/route.ts` : Route webhook JIRA

### Types

- `src/types/jira-data.ts` : Types pour les données JIRA
- `src/types/jira-sync.ts` : Types pour la table `jira_sync`

### Migrations

- `supabase/migrations/2025-01-18-phase1-jira-sync-mapping.sql` : Structure de base
- `supabase/migrations/2025-01-18-phase2-jira-contact-mapping.sql` : Mapping client/contact
- `supabase/migrations/2025-01-18-phase3-jira-feature-mapping.sql` : Mapping fonctionnalité
- `supabase/migrations/2025-01-18-phase4-jira-workflow-tracking.sql` : Tracking workflow
- `supabase/migrations/2025-01-18-phase5-jira-custom-fields.jsonb.sql` : Champs produits

---

## Conclusion

Cette documentation couvre l'ensemble de la synchronisation JIRA dans OnpointDoc. Pour toute question ou problème, se référer aux fichiers sources mentionnés ou consulter les logs de synchronisation dans `jira_sync.sync_error`.

**Points Clés à Retenir** :
- JIRA est la source de vérité pour BUG/REQ et ASSISTANCE transférés
- Les statuts BUG/REQ sont stockés directement (pas de mapping)
- Les statuts ASSISTANCE utilisent un mapping dynamique
- Le champ `last_update_source` évite les boucles de synchronisation
- Les erreurs sont enregistrées dans `jira_sync.sync_error` pour diagnostic

