# Phase 4 : Workflow et Suivi - Mapping Jira → Supabase

**Date**: 2025-01-18  
**Contexte**: Extension de la synchronisation Jira pour inclure les champs de workflow et de suivi  
**Objectif**: Mapper les champs Jira liés aux sprints, workflow, tests et dates cibles

---

## 1. Vue d'ensemble

### 1.1. Champs à mapper

| Champ Jira | Type | Mapping Supabase | Description |
|------------|------|------------------|-------------|
| `customfield_10020` | Object | `tickets.sprint_id` | Sprint (ex: "Sprint 1 - Janvier 2024") |
| `customfield_10083` | Object | `tickets.workflow_status` | Statut workflow (ex: "Analyse terminée") |
| `customfield_10084` | Object | `tickets.test_status` | Statut test (ex: "Test Concluant") |
| `customfield_10021` | Object | `tickets.issue_type` | Type d'issue (Bug, Impediment, etc.) |
| `customfield_10057` | String | `tickets.related_ticket_id` | Ticket lié (ex: "B-OD-029") |
| `customfield_10111` | Date | `tickets.target_date` | Date cible de résolution |
| `customfield_10115` | Date | `tickets.resolved_at` | Date de résolution effective |

### 1.2. Structure proposée

- **Sprint** : Stocké comme `TEXT` (peut être migré vers table `sprints` plus tard)
- **Workflow/Test Status** : Stockés comme `TEXT` (valeurs libres de Jira)
- **Issue Type** : Stocké comme `TEXT` (Bug, Impediment, Task, etc.)
- **Related Ticket** : Référence vers `tickets.id` (UUID) ou `TEXT` si clé Jira
- **Dates** : Stockées comme `DATE` ou `TIMESTAMPTZ`

---

## 2. Migration SQL

### 2.1. Extension de la table `tickets`

```sql
ALTER TABLE public.tickets
  -- Champs workflow
  ADD COLUMN IF NOT EXISTS workflow_status TEXT,
  ADD COLUMN IF NOT EXISTS test_status TEXT,
  ADD COLUMN IF NOT EXISTS issue_type TEXT, -- 'Bug', 'Impediment', 'Task', etc.
  
  -- Champs de suivi
  ADD COLUMN IF NOT EXISTS sprint_id TEXT, -- Ex: "Sprint 1 - Janvier 2024"
  ADD COLUMN IF NOT EXISTS related_ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS related_ticket_key TEXT, -- Clé Jira si ticket non dans Supabase (ex: "B-OD-029")
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
  
-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_tickets_workflow_status ON public.tickets(workflow_status);
CREATE INDEX IF NOT EXISTS idx_tickets_test_status ON public.tickets(test_status);
CREATE INDEX IF NOT EXISTS idx_tickets_sprint_id ON public.tickets(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tickets_target_date ON public.tickets(target_date);
CREATE INDEX IF NOT EXISTS idx_tickets_resolved_at ON public.tickets(resolved_at);
CREATE INDEX IF NOT EXISTS idx_tickets_related_ticket ON public.tickets(related_ticket_id);
```

### 2.2. Extension de la table `jira_sync`

```sql
ALTER TABLE public.jira_sync
  ADD COLUMN IF NOT EXISTS jira_sprint_id TEXT,
  ADD COLUMN IF NOT EXISTS jira_workflow_status TEXT,
  ADD COLUMN IF NOT EXISTS jira_test_status TEXT,
  ADD COLUMN IF NOT EXISTS jira_issue_type TEXT,
  ADD COLUMN IF NOT EXISTS jira_related_ticket_key TEXT,
  ADD COLUMN IF NOT EXISTS jira_target_date DATE,
  ADD COLUMN IF NOT EXISTS jira_resolved_at TIMESTAMPTZ;
  
CREATE INDEX IF NOT EXISTS idx_jira_sync_sprint ON public.jira_sync(jira_sprint_id);
CREATE INDEX IF NOT EXISTS idx_jira_sync_workflow_status ON public.jira_sync(jira_workflow_status);
```

---

## 3. Service de Synchronisation

### 3.1. Extension de `syncJiraToSupabase`

Le service `src/services/jira/sync.ts` doit être étendu pour mapper ces nouveaux champs :

```typescript
// Mapping des champs workflow
if (jiraData.fields.customfield_10020) {
  // Sprint (peut être un objet avec name/id)
  const sprint = jiraData.fields.customfield_10020;
  ticketData.sprint_id = typeof sprint === 'string' 
    ? sprint 
    : sprint?.name || sprint?.value || null;
}

if (jiraData.fields.customfield_10083) {
  // Workflow status
  const workflowStatus = jiraData.fields.customfield_10083;
  ticketData.workflow_status = typeof workflowStatus === 'string'
    ? workflowStatus
    : workflowStatus?.value || workflowStatus?.name || null;
}

if (jiraData.fields.customfield_10084) {
  // Test status
  const testStatus = jiraData.fields.customfield_10084;
  ticketData.test_status = typeof testStatus === 'string'
    ? testStatus
    : testStatus?.value || testStatus?.name || null;
}

if (jiraData.fields.customfield_10021) {
  // Issue type (Bug, Impediment, etc.)
  const issueType = jiraData.fields.customfield_10021;
  ticketData.issue_type = typeof issueType === 'string'
    ? issueType
    : issueType?.value || issueType?.name || null;
}

if (jiraData.fields.customfield_10057) {
  // Related ticket (clé Jira)
  ticketData.related_ticket_key = jiraData.fields.customfield_10057;
  // Tenter de trouver le ticket dans Supabase
  const relatedTicket = await findTicketByJiraKey(jiraData.fields.customfield_10057);
  if (relatedTicket) {
    ticketData.related_ticket_id = relatedTicket.id;
  }
}

if (jiraData.fields.customfield_10111) {
  // Target date
  ticketData.target_date = jiraData.fields.customfield_10111;
}

if (jiraData.fields.customfield_10115) {
  // Resolved at
  ticketData.resolved_at = jiraData.fields.customfield_10115;
}
```

### 3.2. Mise à jour de `jira_sync`

```typescript
const jiraSyncData = {
  // ... champs existants
  jira_sprint_id: ticketData.sprint_id,
  jira_workflow_status: ticketData.workflow_status,
  jira_test_status: ticketData.test_status,
  jira_issue_type: ticketData.issue_type,
  jira_related_ticket_key: ticketData.related_ticket_key,
  jira_target_date: ticketData.target_date,
  jira_resolved_at: ticketData.resolved_at
};
```

---

## 4. Types TypeScript

### 4.1. Extension de `Ticket`

```typescript
// src/types/ticket.ts
export interface Ticket {
  // ... champs existants
  workflow_status?: string | null;
  test_status?: string | null;
  issue_type?: string | null;
  sprint_id?: string | null;
  related_ticket_id?: string | null;
  related_ticket_key?: string | null;
  target_date?: Date | string | null;
  resolved_at?: Date | string | null;
}
```

---

## 5. Gestion des Tickets Liés

### 5.1. Fonction de recherche

```typescript
async function findTicketByJiraKey(jiraKey: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('jira_sync')
    .select('ticket_id, tickets(*)')
    .eq('jira_issue_key', jiraKey)
    .single();
    
  if (error || !data) return null;
  return data.tickets as Ticket;
}
```

### 5.2. Cas d'usage

- **Ticket lié dans Supabase** : Utiliser `related_ticket_id` (UUID)
- **Ticket lié uniquement dans Jira** : Utiliser `related_ticket_key` (TEXT)
- **Les deux** : Stocker les deux pour flexibilité

---

## 6. Exemples de Valeurs

### 6.1. Sprint
- `"Sprint 1 - Janvier 2024"`
- `"Sprint Backlog"`
- `"Sprint 2 - Février 2024"`

### 6.2. Workflow Status
- `"Analyse terminée"`
- `"En développement"`
- `"En test"`
- `"Prêt pour déploiement"`

### 6.3. Test Status
- `"Test Concluant"`
- `"Test en cours"`
- `"Test échoué"`
- `"Test validé"`

### 6.4. Issue Type
- `"Bug"`
- `"Impediment"`
- `"Task"`
- `"Story"`

---

## 7. Tests

### 7.1. Script de test

Créer `scripts/test-phase4-jira-workflow.js` pour valider :
1. Présence des colonnes dans `tickets`
2. Présence des colonnes dans `jira_sync`
3. Mapping correct des champs workflow
4. Gestion des tickets liés
5. Synchronisation complète

---

## 8. Prochaines Étapes

1. ✅ Créer la migration SQL
2. ✅ Étendre le service `syncJiraToSupabase`
3. ✅ Mettre à jour les types TypeScript
4. ✅ Créer le script de test
5. ⏳ Valider avec un échantillon de tickets Jira

---

**Note** : Les champs workflow/test status sont des valeurs libres de Jira. Il n'est pas nécessaire de créer des tables de mapping (contrairement aux statuts/priorités) car ils sont spécifiques au workflow Jira.

