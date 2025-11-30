# Solution 1 : User Flows d'Enregistrement des Tickets

## 📋 Vue d'Ensemble

Avec la **Solution 1 (Many-to-Many)**, voici comment fonctionnent les différents cas d'enregistrement de tickets selon le contexte métier.

---

## 🎯 Cas d'Usage 1 : Ticket Signalé par une Entreprise, Concerne Cette Entreprise Seule

**Scénario** : L'entreprise "ABC Corp" signale un bug spécifique à leur configuration.

### User Flow

```
1. Agent Support reçoit un appel/WhatsApp de l'utilisateur de ABC Corp
   ↓
2. Agent clique sur "Enregistrer BUG/REQ" ou "Enregistrer Assistance"
   ↓
3. Formulaire s'ouvre
   - Champ "Contact" : Recherche et sélectionne l'utilisateur (ex: "Jean Dupont - ABC Corp")
   - Champ "Type" : Sélectionne BUG/REQ/ASSISTANCE
   - Champ "Module" : Sélectionne le module concerné
   - Champ "Entreprises concernées" : 
     * Par défaut : "ABC Corp" (déduit du contact)
     * Option : Case à cocher "Cette entreprise uniquement" (cochée par défaut)
   ↓
4. Agent clique sur "Créer le ticket"
   ↓
5. Actions en base de données :
   a. INSERT dans tickets (created_by, contact_user_id, ...)
   b. INSERT dans ticket_company_link (ticket_id, company_id, role='reporter')
      - company_id déduit de contact_user_id → profiles.company_id
   c. INSERT dans ticket_company_link (ticket_id, company_id, role='affected')
      - même company_id que reporter
   ↓
6. Ticket créé et visible pour :
   - L'agent qui l'a créé
   - Les autres agents support
   - Les utilisateurs de ABC Corp
   - Les managers du département Support
```

### Interface Utilisateur

```
┌─────────────────────────────────────────────┐
│  Créer un Ticket                            │
├─────────────────────────────────────────────┤
│                                              │
│  Contact *                                   │
│  [🔍 Rechercher utilisateur...]             │
│  ➜ Jean Dupont - ABC Corp                   │
│                                              │
│  Type de ticket *                            │
│  ○ Assistance  ○ BUG  ● Requête             │
│                                              │
│  Module *                                    │
│  [Sélectionner... ▼] Finance                │
│                                              │
│  Entreprises concernées                      │
│  ┌──────────────────────────────────────┐   │
│  │ ☑ ABC Corp (signalante)              │   │
│  │ ☐ Toutes les entreprises             │   │
│  └──────────────────────────────────────┘   │
│  ℹ️ Cette entreprise uniquement par défaut   │
│                                              │
│  [Annuler]              [Créer le ticket]   │
└─────────────────────────────────────────────┘
```

---

## 🎯 Cas d'Usage 2 : Ticket Signalé par une Entreprise, Concerne TOUTES les Entreprises

**Scénario** : ABC Corp signale un bug global dans le module Finance qui affecte tous les clients.

### User Flow

```
1. Agent Support reçoit un appel de ABC Corp signalant un bug systémique
   ↓
2. Agent identifie que le problème affecte potentiellement tous les clients
   ↓
3. Formulaire s'ouvre
   - Champ "Contact" : Sélectionne l'utilisateur de ABC Corp
   - Champ "Type" : Sélectionne BUG
   - Champ "Module" : Finance
   - Champ "Entreprises concernées" :
     * "ABC Corp" apparaît (signalante)
     * Agent coche "☐ Toutes les entreprises"
     * Quand "Toutes les entreprises" est cochée :
       - La case "ABC Corp" reste visible mais devient informatif
       - Une alerte s'affiche : "⚠️ Ce ticket sera visible par toutes les entreprises"
   ↓
4. Agent clique sur "Créer le ticket"
   ↓
5. Actions en base de données :
   a. INSERT dans tickets (..., affects_all_companies=true)
   b. INSERT dans ticket_company_link (ticket_id, company_id_abc, role='reporter')
      - Pour garder la trace de qui a signalé
   c. PAS d'insert avec role='affected' (car affects_all_companies=true)
   ↓
6. Ticket créé et visible pour :
   - Tous les utilisateurs de toutes les entreprises
   - Tous les agents support
   - Tous les managers
```

### Interface Utilisateur

```
┌─────────────────────────────────────────────┐
│  Créer un Ticket                            │
├─────────────────────────────────────────────┤
│                                              │
│  Contact *                                   │
│  [Jean Dupont - ABC Corp ✓]                 │
│                                              │
│  Type de ticket *                            │
│  ○ Assistance  ● BUG  ○ Requête             │
│                                              │
│  Module *                                    │
│  [Finance ▼]                                 │
│                                              │
│  Entreprises concernées                      │
│  ┌──────────────────────────────────────┐   │
│  │ ℹ️ ABC Corp (signalante)             │   │
│  │                                      │   │
│  │ ☑ Toutes les entreprises            │   │
│  │                                      │   │
│  │ ⚠️ Ce ticket sera visible par       │   │
│  │    toutes les entreprises            │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Annuler]              [Créer le ticket]   │
└─────────────────────────────────────────────┘
```

---

## 🎯 Cas d'Usage 3 : Ticket Signalé par une Entreprise, Concerne Plusieurs Entreprises Spécifiques

**Scénario** : ABC Corp signale un problème qui affecte également XYZ Ltd et DEF Inc (même configuration, même module).

### User Flow

```
1. Agent Support reçoit un signalement de ABC Corp
   ↓
2. Agent identifie que d'autres entreprises sont également concernées
   (soit par expérience, soit après vérification)
   ↓
3. Formulaire s'ouvre
   - Champ "Contact" : Sélectionne utilisateur ABC Corp
   - Champ "Type" : BUG
   - Champ "Module" : Finance
   - Champ "Entreprises concernées" :
     * "ABC Corp" apparaît (signalante)
     * Agent clique sur "Ajouter une entreprise concernée"
     * Recherche et ajoute "XYZ Ltd"
     * Recherche et ajoute "DEF Inc"
   ↓
4. Agent clique sur "Créer le ticket"
   ↓
5. Actions en base de données :
   a. INSERT dans tickets (..., affects_all_companies=false)
   b. INSERT dans ticket_company_link (ticket_id, company_id_abc, role='reporter')
   c. INSERT dans ticket_company_link (ticket_id, company_id_abc, role='affected')
   d. INSERT dans ticket_company_link (ticket_id, company_id_xyz, role='affected')
   e. INSERT dans ticket_company_link (ticket_id, company_id_def, role='affected')
   ↓
6. Ticket créé et visible pour :
   - Les utilisateurs de ABC Corp, XYZ Ltd, DEF Inc
   - Tous les agents support
   - Tous les managers
```

### Interface Utilisateur

```
┌─────────────────────────────────────────────┐
│  Créer un Ticket                            │
├─────────────────────────────────────────────┤
│                                              │
│  Contact *                                   │
│  [Jean Dupont - ABC Corp ✓]                 │
│                                              │
│  Type de ticket *                            │
│  ○ Assistance  ● BUG  ○ Requête             │
│                                              │
│  Module *                                    │
│  [Finance ▼]                                 │
│                                              │
│  Entreprises concernées                      │
│  ┌──────────────────────────────────────┐   │
│  │ ℹ️ Signalé par : ABC Corp            │   │
│  │                                      │   │
│  │ Entreprises concernées :             │   │
│  │  [×] ABC Corp                        │   │
│  │  [×] XYZ Ltd                         │   │
│  │  [×] DEF Inc                         │   │
│  │                                      │   │
│  │ [+ Ajouter une entreprise]           │   │
│  │                                      │   │
│  │ ☐ Toutes les entreprises             │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Annuler]              [Créer le ticket]   │
└─────────────────────────────────────────────┘
```

---

## 🎯 Cas d'Usage 4 : Ticket Créé en Interne (Sans Contact Utilisateur)

**Scénario** : Un agent Support découvre un bug lors d'un test interne, pas de contact utilisateur.

### User Flow

```
1. Agent Support découvre un bug en interne
   ↓
2. Formulaire s'ouvre
   - Champ "Contact" : 
     * Option "Pas de contact utilisateur" sélectionnée
     * Ou champ laissé vide (nullable)
   - Champ "Type" : BUG
   - Champ "Module" : Finance
   - Champ "Entreprises concernées" :
     * Agent doit choisir :
       - ☑ Toutes les entreprises (bug systémique)
       - OU Sélectionner des entreprises spécifiques
       - OU Laisser vide si non déterminé (à compléter plus tard)
   ↓
3. Agent clique sur "Créer le ticket"
   ↓
4. Actions en base de données :
   a. INSERT dans tickets (created_by, contact_user_id=NULL, affects_all_companies=true/false)
   b. PAS d'insert avec role='reporter' (pas de contact_user_id)
   c. INSERT dans ticket_company_link avec role='affected' selon le choix
   ↓
5. Ticket créé comme "bug interne" visible pour :
   - Tous les agents support
   - Tous les managers
   - Les entreprises concernées (si spécifiées)
```

---

## 🔄 Cas d'Usage 5 : Modification Post-Création (Ajout/Retrait d'Entreprises)

**Scénario** : Après création, on découvre qu'une autre entreprise est concernée.

### User Flow

```
1. Ticket existant : OD-1234 concernant ABC Corp
   ↓
2. Agent/Manager ouvre le ticket
   ↓
3. Dans l'onglet "Détails", section "Entreprises concernées" :
   - Affiche actuellement : ABC Corp
   - Bouton "Modifier les entreprises concernées"
   ↓
4. Modal s'ouvre avec la liste actuelle :
   - [×] ABC Corp
   - [+ Ajouter une entreprise]
   - ☐ Toutes les entreprises
   ↓
5. Agent ajoute "XYZ Ltd"
   ↓
6. Actions en base de données :
   a. UPDATE tickets SET affects_all_companies=false (si true avant)
   b. INSERT INTO ticket_company_link (ticket_id, company_id_xyz, role='affected')
   c. INSERT dans ticket_status_history (changement documenté)
   ↓
7. Notification envoyée à XYZ Ltd (si système de notifications)
   ↓
8. Ticket maintenant visible pour ABC Corp ET XYZ Ltd
```

### Interface Utilisateur (Modal de Modification)

```
┌─────────────────────────────────────────────┐
│  Modifier les entreprises concernées        │
├─────────────────────────────────────────────┤
│                                              │
│  Ticket : OD-1234 - Bug Finance             │
│                                              │
│  Entreprises concernées :                   │
│  ┌──────────────────────────────────────┐   │
│  │  [×] ABC Corp                        │   │
│  │  [×] XYZ Ltd                         │   │
│  │                                      │   │
│  │  [+ Ajouter une entreprise]          │   │
│  │                                      │   │
│  │  ☐ Toutes les entreprises            │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ⚠️ Les entreprises ajoutées pourront      │
│     voir ce ticket                          │
│                                              │
│  [Annuler]              [Enregistrer]       │
└─────────────────────────────────────────────┘
```

---

## 📊 Logique de Validation et Contraintes

### Règles Métier

1. **Toujours une entreprise signalante** (sauf ticket interne) :
   - Si `contact_user_id` est renseigné → `reporter` est obligatoire
   - Si `contact_user_id` est NULL → pas de `reporter` nécessaire

2. **Au moins une entreprise concernée** :
   - Soit `affects_all_companies = true`
   - Soit au moins une entrée avec `role='affected'`
   - Les deux ne peuvent pas être vrais en même temps (contrainte logique)

3. **Cas "Toutes les entreprises"** :
   - Si `affects_all_companies = true` → pas d'entrées `role='affected'`
   - Si des entreprises spécifiques sont sélectionnées → `affects_all_companies = false`

4. **L'entreprise signalante est toujours concernée** :
   - Si une entreprise signale, elle est automatiquement ajoutée en `affected`
   - Sauf si "Toutes les entreprises" est sélectionné (alors elle est incluse dans le tout)

### Validation dans le Formulaire

```typescript
// Logique de validation
if (!contact_user_id && !selectedCompanies.length && !affectsAll) {
  error: "Veuillez sélectionner au moins une entreprise concernée"
}

if (affectsAll && selectedCompanies.length > 0) {
  error: "Vous ne pouvez pas sélectionner 'Toutes les entreprises' et des entreprises spécifiques"
}

if (contact_user_id && !reporterCompanyId) {
  error: "Impossible de déterminer l'entreprise signalante"
}
```

---

## 🎨 Exemples d'Affichage dans la Liste des Tickets

### Ticket avec une entreprise

```
┌──────────────────────────────────────────────┐
│ OD-1234 | Bug Finance                        │
│ Signalé par : ABC Corp                       │
│ Concerné : ABC Corp                          │
└──────────────────────────────────────────────┘
```

### Ticket concernant toutes les entreprises

```
┌──────────────────────────────────────────────┐
│ OD-1235 | Bug Système                        │
│ Signalé par : ABC Corp                       │
│ Concerné : 🌍 Toutes les entreprises         │
└──────────────────────────────────────────────┘
```

### Ticket concernant plusieurs entreprises

```
┌──────────────────────────────────────────────┐
│ OD-1236 | Requête Finance                    │
│ Signalé par : ABC Corp                       │
│ Concerné : ABC Corp, XYZ Ltd, DEF Inc        │
│              (+2 autres)                     │
└──────────────────────────────────────────────┘
```

---

## 🔍 Requêtes SQL d'Exemple

### Créer un ticket concernant une entreprise

```sql
-- 1. Créer le ticket
INSERT INTO tickets (title, description, ticket_type, contact_user_id, created_by, affects_all_companies)
VALUES ('Bug Finance', 'Description...', 'BUG', 'user-abc-id', 'agent-id', false)
RETURNING id;

-- 2. Ajouter l'entreprise signalante
INSERT INTO ticket_company_link (ticket_id, company_id, role)
VALUES ('ticket-id', 'abc-company-id', 'reporter');

-- 3. Ajouter l'entreprise concernée
INSERT INTO ticket_company_link (ticket_id, company_id, role)
VALUES ('ticket-id', 'abc-company-id', 'affected');
```

### Créer un ticket concernant toutes les entreprises

```sql
-- 1. Créer le ticket
INSERT INTO tickets (title, description, ticket_type, contact_user_id, created_by, affects_all_companies)
VALUES ('Bug Global', 'Description...', 'BUG', 'user-abc-id', 'agent-id', true)
RETURNING id;

-- 2. Ajouter uniquement l'entreprise signalante
INSERT INTO ticket_company_link (ticket_id, company_id, role)
VALUES ('ticket-id', 'abc-company-id', 'reporter');
-- Pas d'insert avec role='affected' car affects_all_companies=true
```

### Créer un ticket concernant plusieurs entreprises

```sql
-- 1. Créer le ticket
INSERT INTO tickets (title, description, ticket_type, contact_user_id, created_by, affects_all_companies)
VALUES ('Bug Multi', 'Description...', 'BUG', 'user-abc-id', 'agent-id', false)
RETURNING id;

-- 2. Ajouter l'entreprise signalante
INSERT INTO ticket_company_link (ticket_id, company_id, role)
VALUES ('ticket-id', 'abc-company-id', 'reporter');

-- 3. Ajouter toutes les entreprises concernées
INSERT INTO ticket_company_link (ticket_id, company_id, role) VALUES
  ('ticket-id', 'abc-company-id', 'affected'),
  ('ticket-id', 'xyz-company-id', 'affected'),
  ('ticket-id', 'def-company-id', 'affected');
```

### Récupérer les tickets visibles pour un utilisateur

```sql
SELECT DISTINCT t.*
FROM tickets t
WHERE 
  -- Ticket signalé par l'entreprise de l'utilisateur
  EXISTS (
    SELECT 1 FROM ticket_company_link tcl
    JOIN profiles p ON p.company_id = tcl.company_id
    WHERE tcl.ticket_id = t.id
      AND tcl.role = 'reporter'
      AND p.id = :user_profile_id
  )
  OR
  -- Ticket qui concerne toutes les entreprises
  t.affects_all_companies = true
  OR
  -- Ticket qui concerne l'entreprise de l'utilisateur
  EXISTS (
    SELECT 1 FROM ticket_company_link tcl
    JOIN profiles p ON p.company_id = tcl.company_id
    WHERE tcl.ticket_id = t.id
      AND tcl.role = 'affected'
      AND p.id = :user_profile_id
  )
  OR
  -- Ticket créé par un agent (toujours visible pour les agents)
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = :user_profile_id
      AND p.role LIKE '%support%'
      AND t.created_by = p.id
  );
```

---

## 📝 Questions de Détail à Valider

1. **Dans le formulaire, par défaut** :
   - Quand un contact est sélectionné, l'entreprise concernée = l'entreprise du contact ?
   - Ou faut-il toujours demander explicitement ?

2. **Modification post-création** :
   - Qui peut modifier les entreprises concernées ?
   - Les managers uniquement ? Les agents aussi ?

3. **Notifications** :
   - Faut-il notifier les entreprises quand elles sont ajoutées à un ticket existant ?
   - Notification automatique à la création ?

4. **Historique** :
   - Faut-il tracer les changements d'entreprises concernées dans `ticket_status_history` ?
   - Ou créer une table dédiée `ticket_company_history` ?

5. **Filtres** :
   - Dans la liste des tickets, filtres par entreprise concernée ?
   - Filtre "Tous mes tickets" vs "Tous les tickets de mon entreprise" ?

---

## ✅ Prochaines Étapes (Après Validation)

1. ✅ Valider ces user flows
2. 🔲 Créer les migrations SQL
3. 🔲 Adapter les types TypeScript
4. 🔲 Créer les composants UI (formulaire avec multi-select)
5. 🔲 Adapter les services (createTicket, updateTicket)
6. 🔲 Mettre à jour les RLS policies
7. 🔲 Tester tous les cas d'usage

