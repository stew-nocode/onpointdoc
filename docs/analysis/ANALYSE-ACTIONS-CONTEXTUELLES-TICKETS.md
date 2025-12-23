# Analyse : Actions Contextuelles (Menu Clic Droit) - Tableau Tickets

**Date** : 2025-01-27  
**Objectif** : Implémenter un menu contextuel (clic droit) sur les lignes du tableau de tickets avec les actions suivantes :
- Voir les détails
- Éditer
- Changer le statut
- Réassigner
- Transférer vers Jira
- Dupliquer
- Supprimer (si permissions)
- Copier le lien
- Exporter

---

## 1. POINTS D'ATTENTION CRITIQUES

### 1.1. Architecture et Séparation des Responsabilités

⚠️ **NE PAS MÉLANGER** :
- **Services (`src/services/`)** : Logique métier pure, pas de UI
- **Composants (`src/components/`)** : UI uniquement, pas de logique métier
- **Routes API (`src/app/api/`)** : DOIVENT utiliser les services (pas de duplication)
- **Server Actions** : Dans les pages Server Components, marquées `'use server'`

✅ **Pattern à suivre** :
```
Composant Client (UI) 
  → Appelle Server Action (dans page.tsx)
    → Appelle Service (src/services/tickets/)
      → Utilise Supabase Client
```

### 1.2. Gestion des Permissions (RLS)

⚠️ **CRITIQUE** : Respecter les règles RLS définies dans `supabase/migrations/2025-11-16-rls-phase1.sql`

**Règles à respecter** :
- **Lecture** : `created_by`, `assigned_to`, managers, direction
- **Mise à jour** : `created_by`, `assigned_to`, managers uniquement
- **Suppression** : Managers uniquement
- **Création** : Support uniquement (`agent_support`, `manager_support`)

**Vérifications nécessaires** :
- Vérifier le rôle de l'utilisateur avant d'afficher les actions
- Vérifier les permissions avant d'exécuter les actions
- Gérer les erreurs RLS gracieusement

### 1.3. Types de Tickets et Statuts

⚠️ **NE PAS OUBLIER** :
- **BUG/REQ** : Utilisent les statuts JIRA (`Sprint Backlog`, `Traitement en Cours`, etc.)
- **ASSISTANCE** : 
  - Avant transfert : Statuts locaux (`Nouveau`, `En_cours`, `Resolue`)
  - Après transfert : Statuts JIRA
- **Transfert** : Uniquement ASSISTANCE en statut `En_cours` → `Transfere`

**Fichiers de référence** :
- `src/lib/constants/tickets.ts` : Constantes des statuts
- `src/lib/utils/ticket-status.ts` : Utilitaires pour gérer les statuts
- `src/services/tickets/jira-transfer.ts` : Logique de transfert

### 1.4. Intégration JIRA

⚠️ **ATTENTION** :
- Les tickets BUG/REQ sont créés directement dans JIRA
- Les tickets ASSISTANCE ne partent dans JIRA qu'après transfert
- Ne pas créer de doublons dans JIRA
- Vérifier `jira_issue_key` avant toute action JIRA

**Fichiers de référence** :
- `src/services/jira/client.ts` : Appels API JIRA
- `src/services/tickets/jira-transfer.ts` : Transfert ASSISTANCE → JIRA

### 1.5. Hydratation et SSR

⚠️ **CRITIQUE** : Le composant `TicketsInfiniteScroll` a déjà un système d'hydratation complexe

**Points à respecter** :
- Ne pas casser l'hydratation existante
- Le menu contextuel doit être un composant Client (`'use client'`)
- Initialiser les colonnes visibles correctement (voir lignes 64-76 de `tickets-infinite-scroll.tsx`)

### 1.6. Infinite Scroll

⚠️ **NE PAS CASSER** :
- L'infinite scroll utilise `IntersectionObserver` (lignes 167-187)
- Le système de pagination avec `ticketsLengthRef`
- La gestion des filtres et recherche

**Précaution** : Le menu contextuel ne doit pas interférer avec le scroll ou la détection d'intersection

---

## 2. COMPOSANTS SHADCN UI À UTILISER

### 2.1. Menu Contextuel

**Composant à installer** : `ContextMenu` de ShadCN UI

```bash
npx shadcn@latest add context-menu
```

**Documentation** : https://ui.shadcn.com/docs/components/context-menu

**Structure attendue** :
```tsx
<ContextMenu>
  <ContextMenuTrigger>
    {/* Ligne du tableau */}
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Action 1</ContextMenuItem>
    <ContextMenuItem>Action 2</ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>Action 3</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### 2.2. Composants UI Existants à Réutiliser

✅ **Déjà disponibles** :
- `Button` : `src/ui/button.tsx`
- `Dialog` : `src/ui/dialog.tsx` (pour les modales de confirmation)
- `Alert` : `src/ui/alert.tsx` (pour les erreurs)
- `Badge` : `src/ui/badge.tsx`
- `Tooltip` : `src/ui/tooltip.tsx`

✅ **Composants tickets existants** :
- `TransferTicketButton` : `src/components/tickets/transfer-ticket-button.tsx`
- `bulk-change-status-dialog.tsx` : Pattern pour changer le statut
- `bulk-reassign-dialog.tsx` : Pattern pour réassigner

---

## 3. STRUCTURE DE FICHIERS À CRÉER

### 3.1. Nouveaux Fichiers

```
src/components/tickets/
  ├── ticket-context-menu.tsx          # Composant menu contextuel
  ├── ticket-edit-dialog.tsx          # Dialog pour éditer un ticket
  ├── ticket-status-change-dialog.tsx   # Dialog pour changer le statut (réutiliser pattern bulk)
  ├── ticket-reassign-dialog.tsx       # Dialog pour réassigner (réutiliser pattern bulk)
  ├── ticket-duplicate-dialog.tsx      # Dialog pour dupliquer
  └── ticket-delete-dialog.tsx         # Dialog pour supprimer (avec confirmation)

src/services/tickets/
  ├── update-ticket.ts                 # Service pour mettre à jour un ticket
  ├── duplicate-ticket.ts              # Service pour dupliquer un ticket
  └── delete-ticket.ts                 # Service pour supprimer un ticket

src/app/api/tickets/
  ├── [id]/route.ts                    # GET, PUT, DELETE (si nécessaire)
  └── [id]/duplicate/route.ts          # Route pour dupliquer (optionnel)
```

### 3.2. Modifications de Fichiers Existants

**`src/components/tickets/tickets-infinite-scroll.tsx`** :
- Ajouter `<ContextMenu>` autour de chaque `<tr>`
- Importer et utiliser `TicketContextMenu`

**`src/app/(main)/gestion/tickets/[id]/page.tsx`** :
- Ajouter Server Actions pour les nouvelles opérations :
  - `handleEditTicket`
  - `handleChangeStatus`
  - `handleReassign`
  - `handleDuplicate`
  - `handleDelete`

---

## 4. CONVENTIONS DE CODE À RESPECTER

### 4.1. TypeScript

✅ **Obligatoire** :
- Types stricts, pas de `any` sauf cas exceptionnels documentés
- Toutes les Promises doivent être `await`ées
- Utiliser les types existants : `Ticket`, `TicketType`, `TicketStatus`, etc.

**Types à utiliser** :
```typescript
// src/types/ticket.ts
type Ticket = {
  id: string;
  title: string;
  ticket_type: 'BUG' | 'REQ' | 'ASSISTANCE';
  status: string;
  // ...
};
```

### 4.2. Nommage

✅ **Conventions** :
- Composants : PascalCase (`TicketContextMenu`)
- Fonctions : camelCase (`handleEditTicket`)
- Fichiers : kebab-case (`ticket-context-menu.tsx`)
- Services : kebab-case (`update-ticket.ts`)

### 4.3. Documentation

✅ **Obligatoire** :
- Toutes les fonctions exportées doivent avoir une JSDoc
- Documenter les paramètres, retours, et exceptions possibles
- Exemple :
```typescript
/**
 * Met à jour un ticket dans Supabase
 * 
 * @param ticketId - UUID du ticket à mettre à jour
 * @param updates - Objet contenant les champs à mettre à jour
 * @returns Le ticket mis à jour
 * @throws Error si le ticket n'existe pas ou si l'utilisateur n'a pas les permissions
 */
export async function updateTicket(ticketId: string, updates: Partial<Ticket>) {
  // ...
}
```

### 4.4. Gestion d'Erreurs

✅ **Pattern à suivre** :
```typescript
try {
  await action();
  router.refresh(); // Rafraîchir la page après succès
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  setError(errorMessage);
  // Afficher l'erreur dans l'UI (Alert, toast, etc.)
}
```

### 4.5. Accessibilité (a11y)

✅ **Obligatoire** :
- `aria-label` sur les boutons d'action
- `role` approprié pour les menus
- Navigation au clavier (Tab, Enter, Escape)
- Contraste des couleurs (respecter le design system)

---

## 5. LOGIQUE MÉTIER PAR ACTION

### 5.1. Voir les Détails

**Action** : Navigation vers `/gestion/tickets/[id]`

**Implémentation** :
- Utiliser `Link` de Next.js (déjà présent dans le tableau)
- Pas de logique métier nécessaire

### 5.2. Éditer

**Action** : Ouvrir un dialog avec formulaire pré-rempli

**Logique** :
1. Récupérer le ticket complet (via `getTicketById`)
2. Afficher un formulaire similaire à `TicketForm` mais en mode édition
3. Valider avec Zod (`updateTicketSchema`)
4. Appeler `updateTicket` service
5. Rafraîchir la page

**Permissions** :
- Vérifier : `created_by === currentUser` OU `assigned_to === currentUser` OU manager

**Fichiers à créer** :
- `src/components/tickets/ticket-edit-dialog.tsx`
- `src/services/tickets/update-ticket.ts`
- `src/lib/validators/ticket.ts` : Ajouter `updateTicketSchema`

### 5.3. Changer le Statut

**Action** : Ouvrir un dialog avec liste de statuts disponibles

**Logique** :
1. Déterminer les statuts disponibles selon le type de ticket :
   - BUG/REQ : Statuts JIRA
   - ASSISTANCE non transféré : Statuts locaux
   - ASSISTANCE transféré : Statuts JIRA
2. Afficher un `Combobox` ou `Select` avec les statuts
3. Valider le changement
4. Appeler `updateTicket` avec le nouveau statut
5. Enregistrer dans `ticket_status_history`

**Permissions** :
- Vérifier : `created_by === currentUser` OU `assigned_to === currentUser` OU manager

**Réutiliser** : Pattern de `bulk-change-status-dialog.tsx`

### 5.4. Réassigner

**Action** : Ouvrir un dialog avec liste des utilisateurs disponibles

**Logique** :
1. Récupérer les utilisateurs du même département/module
2. Filtrer selon les permissions (agents peuvent réassigner aux mêmes modules)
3. Afficher un `Combobox` avec les utilisateurs
4. Valider l'assignation
5. Appeler `updateTicket` avec `assigned_to`

**Permissions** :
- Agents : Peuvent réassigner aux collaborateurs du même module
- Managers : Peuvent réassigner à n'importe quel agent de leur département

**Réutiliser** : Pattern de `bulk-reassign-dialog.tsx`

### 5.5. Transférer vers Jira

**Action** : Transférer un ticket ASSISTANCE vers JIRA

**Logique** :
1. Vérifier : `ticket_type === 'ASSISTANCE'` ET `status === 'En_cours'`
2. Afficher une confirmation
3. Appeler `transferTicketToJira` (service existant)
4. Rafraîchir la page

**Permissions** :
- Support uniquement (agents et managers)

**Réutiliser** : `src/services/tickets/jira-transfer.ts` et `TransferTicketButton`

### 5.6. Dupliquer

**Action** : Créer une copie du ticket avec les mêmes données (sauf ID, dates, statut)

**Logique** :
1. Récupérer le ticket complet
2. Créer un nouveau ticket avec :
   - Même titre (préfixé "Copie de " ou suffixé " (Copie)")
   - Même description
   - Même type, priorité, canal, produit, module
   - Statut initial selon le type (`getInitialStatus`)
   - `created_by` = utilisateur actuel
   - `assigned_to` = null (non assigné)
   - `jira_issue_key` = null (pas encore dans JIRA)
3. Si BUG/REQ : Créer dans JIRA (comme pour création normale)
4. Rediriger vers le nouveau ticket

**Permissions** :
- Support uniquement (agents et managers)

**Fichiers à créer** :
- `src/services/tickets/duplicate-ticket.ts`

### 5.7. Supprimer

**Action** : Supprimer un ticket (avec confirmation)

**Logique** :
1. Vérifier les permissions (managers uniquement)
2. Afficher une confirmation avec avertissement
3. Supprimer le ticket (cascade sur les relations)
4. Si `jira_issue_key` existe : Optionnellement supprimer dans JIRA (à discuter)
5. Rediriger vers la liste des tickets

**Permissions** :
- Managers uniquement (selon RLS)

**Fichiers à créer** :
- `src/services/tickets/delete-ticket.ts`
- `src/components/tickets/ticket-delete-dialog.tsx`

### 5.8. Copier le Lien

**Action** : Copier l'URL du ticket dans le presse-papiers

**Logique** :
1. Construire l'URL : `${window.location.origin}/gestion/tickets/${ticketId}`
2. Utiliser `navigator.clipboard.writeText()`
3. Afficher un feedback (toast ou tooltip)

**Pas de logique métier** : Action purement UI

### 5.9. Exporter

**Action** : Exporter les données du ticket (JSON, CSV, etc.)

**Logique** :
1. Récupérer le ticket complet avec toutes les relations
2. Formater les données (JSON ou CSV)
3. Télécharger le fichier

**Format suggéré** : JSON (plus simple à implémenter)

---

## 6. VALIDATION AVEC ZOD

### 6.1. Schémas à Créer/Modifier

**`src/lib/validators/ticket.ts`** :

```typescript
// Schéma pour la mise à jour d'un ticket
export const updateTicketSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  // ... autres champs optionnels
});

export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
```

---

## 7. TESTS ET VALIDATION

### 7.1. Checklist de Tests

**Avant de pousser le code** :

- [ ] TypeScript : `npm run type-check` (pas d'erreurs)
- [ ] Linting : `npm run lint` (pas d'erreurs)
- [ ] Build : `npm run build` (pas d'erreurs)
- [ ] Hydratation : Vérifier qu'il n'y a pas d'erreurs d'hydratation dans la console
- [ ] Permissions : Tester avec différents rôles (agent, manager, direction)
- [ ] RLS : Vérifier que les règles RLS sont respectées
- [ ] Actions : Tester chaque action du menu contextuel
- [ ] Responsive : Vérifier sur mobile/tablette
- [ ] Accessibilité : Navigation au clavier, lecteurs d'écran

### 7.2. Scénarios de Test

1. **Agent Support** :
   - Peut voir, éditer, changer statut, réassigner ses tickets
   - Peut transférer ASSISTANCE en cours
   - Ne peut pas supprimer

2. **Manager Support** :
   - Peut tout faire (y compris supprimer)
   - Peut réassigner à n'importe quel agent de son département

3. **Direction** :
   - Peut voir tous les tickets
   - Ne peut pas modifier/supprimer

---

## 8. ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Phase 1 : Infrastructure
1. Installer `ContextMenu` de ShadCN UI
2. Créer `TicketContextMenu` avec structure de base
3. Intégrer dans `TicketsInfiniteScroll`

### Phase 2 : Actions Simples
4. "Voir les détails" (navigation)
5. "Copier le lien" (clipboard)

### Phase 3 : Actions avec Services
6. "Changer le statut" (réutiliser pattern bulk)
7. "Réassigner" (réutiliser pattern bulk)
8. "Transférer vers Jira" (réutiliser service existant)

### Phase 4 : Actions Complexes
9. "Éditer" (formulaire complet)
10. "Dupliquer" (création avec copie)
11. "Exporter" (format JSON)

### Phase 5 : Action Critique
12. "Supprimer" (avec toutes les précautions)

---

## 9. RÉFÉRENCES ET FICHIERS CLÉS

### 9.1. Fichiers à Consulter

**Architecture** :
- `.cursor/rules/master.mdc` : Règles globales
- `.cursor/rules/architecture-frontend-interface-utilisateur.mdc` : Standards UI
- `.cursor/rules/clean-code-methodology.mdc` : Qualité de code (remplace qualite-de-code-typage-modularite.mdc)

**Composants existants** :
- `src/components/tickets/tickets-infinite-scroll.tsx` : Tableau principal
- `src/components/tickets/transfer-ticket-button.tsx` : Pattern pour actions
- `src/components/tickets/bulk-*.tsx` : Patterns pour dialogs

**Services existants** :
- `src/services/tickets/index.ts` : Services principaux
- `src/services/tickets/jira-transfer.ts` : Transfert JIRA
- `src/services/jira/client.ts` : API JIRA

**Permissions** :
- `supabase/migrations/2025-11-16-rls-phase1.sql` : Règles RLS

**Types** :
- `src/types/ticket.ts` : Types TypeScript
- `src/lib/constants/tickets.ts` : Constantes
- `src/lib/utils/ticket-status.ts` : Utilitaires statuts

---

## 10. POINTS DE VIGILANCE FINAUX

⚠️ **NE JAMAIS** :
- Mélanger logique métier et UI
- Ignorer les règles RLS
- Créer des doublons dans JIRA
- Casser l'infinite scroll
- Oublier la gestion d'erreurs
- Utiliser `any` en TypeScript
- Oublier la documentation

✅ **TOUJOURS** :
- Vérifier les permissions avant d'afficher/exécuter
- Utiliser les services existants
- Respecter les conventions de nommage
- Tester avec différents rôles
- Documenter les fonctions exportées
- Gérer les erreurs gracieusement
- Respecter l'accessibilité

---

**Prochaine étape** : Valider cette analyse avec l'utilisateur avant de commencer l'implémentation.

