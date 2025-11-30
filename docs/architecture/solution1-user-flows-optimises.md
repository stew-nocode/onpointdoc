# Solution 1 : User Flows Optimisés - Basés sur l'Analyse MCP

**Date** : 2025-01-27  
**Source** : Analyse MCP Supabase + MCP Next.js  
**Base** : Structure réelle du formulaire et de la base de données

---

## 📊 État Actuel (Via MCP)

### Base de Données
- ✅ Table `tickets` avec `company_id`, `contact_user_id`, `created_by`
- ❌ Table `ticket_company_link` n'existe **PAS** encore
- ✅ Relation : `tickets.company_id` → `companies.id`
- ✅ Relation : `tickets.contact_user_id` → `profiles.id` → `profiles.company_id`

### Formulaire Actuel
- **Entreprise** : Combobox unique, optionnel, recommandé pour "Constat Interne"
- **Contact** : Combobox, désactivé si canal = "Constat Interne"
- **Logique** : `company_id` et `contact_user_id` sont indépendants

---

## 🎯 Cas 1 : Ticket pour Une Seule Entreprise

### Flow Actuel (Avant Solution 1)
```
Contact sélectionné → Entreprise déduite du contact → company_id rempli
```

### Flow Optimisé (Solution 1)

**Option A : Via Contact (le plus fréquent)**
```
1. Agent sélectionne Contact → 
2. Entreprise déduite automatiquement (profiles.company_id) →
3. Champ "Portée" pré-rempli : "Une seule entreprise" →
4. Combobox Entreprise pré-rempli (non modifiable si contact sélectionné) →
5. Validation et création
```

**Option B : Via Entreprise Directe (Constat Interne)**
```
1. Canal = "Constat Interne" →
2. Contact désactivé →
3. Agent sélectionne Entreprise directement →
4. Champ "Portée" : "Une seule entreprise" (par défaut) →
5. Validation et création
```

**Données sauvegardées** :
```sql
INSERT INTO tickets (..., company_id, affects_all_companies)
VALUES (..., 'company-uuid', false);

INSERT INTO ticket_company_link (ticket_id, company_id, is_primary, role)
VALUES ('ticket-uuid', 'company-uuid', true, 'affected');
```

**Interface proposée** :
```
┌─────────────────────────────────────────────┐
│  Créer un Ticket                            │
├─────────────────────────────────────────────┤
│  Contact *                                   │
│  [Jean Dupont - ABC Corp ✓]                 │
│  ℹ️ Entreprise déduite : ABC Corp            │
│                                              │
│  Portée du ticket                            │
│  ○ Une seule entreprise (ABC Corp)          │
│  ○ Toutes les entreprises                   │
│  ○ Plusieurs entreprises spécifiques        │
│                                              │
│  [Si "Une seule" sélectionnée :]            │
│  Entreprise concernée                        │
│  [ABC Corp ✓] (pré-rempli, modifiable)      │
└─────────────────────────────────────────────┘
```

---

## 🎯 Cas 2 : Ticket pour Toutes les Entreprises

### Flow Optimisé

```
1. Agent sélectionne Contact (optionnel) →
2. Portée : "Toutes les entreprises" →
3. Checkbox "Concernant toutes les entreprises" activée →
4. Alerte affichée : "Ce ticket sera visible par toutes les entreprises" →
5. Champ Entreprise désactivé ou vide →
6. Validation
```

**Données sauvegardées** :
```sql
INSERT INTO tickets (..., company_id, affects_all_companies)
VALUES (..., NULL, true);

-- Pas d'entrée dans ticket_company_link (car affects_all_companies=true)
-- OU entrée avec entreprise signalante si contact sélectionné :
INSERT INTO ticket_company_link (ticket_id, company_id, is_primary, role)
VALUES ('ticket-uuid', 'reporter-company-uuid', false, 'reporter');
```

**Interface proposée** :
```
┌─────────────────────────────────────────────┐
│  Créer un Ticket                            │
├─────────────────────────────────────────────┤
│  Contact (optionnel)                         │
│  [Jean Dupont - ABC Corp]                   │
│  ℹ️ Signalé par : ABC Corp                   │
│                                              │
│  Portée du ticket *                          │
│  ○ Une seule entreprise                     │
│  ● Toutes les entreprises                   │
│  ○ Plusieurs entreprises spécifiques        │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ☑ Concernant toutes les entreprises  │   │
│  │                                      │   │
│  │ ⚠️ Ce ticket sera visible par       │   │
│  │    toutes les entreprises            │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🎯 Cas 3 : Ticket pour Plusieurs Entreprises Spécifiques

### Flow Optimisé

```
1. Agent sélectionne Contact (optionnel) →
2. Portée : "Plusieurs entreprises spécifiques" →
3. MultiSelect s'affiche avec :
   - Entreprise du contact (pré-cochée si contact)
   - Liste complète des entreprises
4. Agent ajoute/supprime des entreprises →
5. Validation
```

**Données sauvegardées** :
```sql
INSERT INTO tickets (..., company_id, affects_all_companies)
VALUES (..., 'first-company-uuid', false); -- Première entreprise pour compatibilité

INSERT INTO ticket_company_link (ticket_id, company_id, is_primary, role) VALUES
  ('ticket-uuid', 'company-1-uuid', true, 'affected'),
  ('ticket-uuid', 'company-2-uuid', false, 'affected'),
  ('ticket-uuid', 'company-3-uuid', false, 'affected');
```

**Interface proposée** :
```
┌─────────────────────────────────────────────┐
│  Créer un Ticket                            │
├─────────────────────────────────────────────┤
│  Contact (optionnel)                         │
│  [Jean Dupont - ABC Corp]                   │
│                                              │
│  Portée du ticket *                          │
│  ○ Une seule entreprise                     │
│  ○ Toutes les entreprises                   │
│  ● Plusieurs entreprises spécifiques        │
│                                              │
│  Entreprises concernées *                    │
│  ┌──────────────────────────────────────┐   │
│  │  ☑ ABC Corp (signalante)            │   │
│  │  ☑ XYZ Ltd                           │   │
│  │  ☐ DEF Inc                           │   │
│  │                                      │   │
│  │  [+ Ajouter une entreprise]          │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 🎯 Cas 4 : Constat Interne (Sans Contact)

### Flow Optimisé

```
1. Canal = "Constat Interne" →
2. Contact désactivé →
3. Portée : Choix obligatoire entre :
   - Une seule entreprise
   - Toutes les entreprises
   - Plusieurs entreprises spécifiques
4. Selon portée → affichage conditionnel
5. Validation
```

**Interface proposée** :
```
┌─────────────────────────────────────────────┐
│  Créer un Ticket                            │
├─────────────────────────────────────────────┤
│  Canal : [Constat Interne ✓]                │
│  ℹ️ Contact non disponible pour constat     │
│                                              │
│  Portée du ticket *                          │
│  ● Une seule entreprise                     │
│  ○ Toutes les entreprises                   │
│  ○ Plusieurs entreprises spécifiques        │
│                                              │
│  Entreprise concernée *                      │
│  [Sélectionner une entreprise ▼]            │
└─────────────────────────────────────────────┘
```

---

## 🔧 Modifications Techniques Nécessaires

### 1. Migration Base de Données

```sql
-- Créer la table de liaison
CREATE TABLE ticket_company_link (
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  role text CHECK (role IN ('reporter', 'affected')) DEFAULT 'affected',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (ticket_id, company_id)
);

CREATE INDEX idx_ticket_company_link_ticket ON ticket_company_link(ticket_id);
CREATE INDEX idx_ticket_company_link_company ON ticket_company_link(company_id);

-- Ajouter le champ affects_all_companies
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS affects_all_companies boolean DEFAULT false;

-- Migrer les données existantes
INSERT INTO ticket_company_link (ticket_id, company_id, is_primary, role)
SELECT id, company_id, true, 'affected'
FROM tickets
WHERE company_id IS NOT NULL;
```

### 2. Schéma Zod (`src/lib/validators/ticket.ts`)

```typescript
export const createTicketSchema = z.object({
  // ... champs existants ...
  
  // Nouveaux champs
  scope: z.enum(['single', 'all', 'multiple']).optional(),
  affectsAllCompanies: z.boolean().optional(),
  selectedCompanyIds: z.array(z.string().uuid()).optional(),
  
  // Champs existants (à adapter)
  companyId: z.union([z.string().uuid(), z.literal('')]).optional(),
})
.refine((data) => {
  if (data.scope === 'all') return data.affectsAllCompanies === true;
  return true;
})
.refine((data) => {
  if (data.scope === 'multiple') {
    return data.selectedCompanyIds && data.selectedCompanyIds.length >= 2;
  }
  return true;
})
.refine((data) => {
  if (data.scope === 'single') {
    return data.companyId && data.companyId !== '';
  }
  return true;
});
```

### 3. Service de Création (`src/services/tickets/index.ts`)

```typescript
export const createTicket = async (payload: CreateTicketInput) => {
  // ... récupération profil créateur ...
  
  // Déterminer company_id selon scope
  let companyId: string | null = null;
  if (payload.scope === 'single') {
    companyId = payload.companyId || null;
  } else if (payload.scope === 'multiple' && payload.selectedCompanyIds?.[0]) {
    companyId = payload.selectedCompanyIds[0]; // Première pour compatibilité
  }
  
  // Créer le ticket
  const { data, error } = await supabase
    .from('tickets')
    .insert({
      // ... champs existants ...
      company_id: companyId,
      affects_all_companies: payload.affectsAllCompanies || false,
    })
    .select('id')
    .single();
  
  // Créer les liens
  if (payload.scope === 'single' && companyId) {
    await supabase.from('ticket_company_link').insert({
      ticket_id: data.id,
      company_id: companyId,
      is_primary: true,
      role: 'affected',
    });
  } else if (payload.scope === 'multiple' && payload.selectedCompanyIds) {
    const links = payload.selectedCompanyIds.map((compId, index) => ({
      ticket_id: data.id,
      company_id: compId,
      is_primary: index === 0,
      role: 'affected',
    }));
    await supabase.from('ticket_company_link').insert(links);
  }
  // Si scope = 'all', pas de liens (ou entreprise signalante uniquement)
  
  return data;
};
```

### 4. Composant UI (`src/components/forms/ticket-form.tsx`)

**Nouveau composant** : `TicketScopeSection`

```tsx
<TicketScopeSection 
  form={form} 
  companies={companies}
  selectedContact={form.watch('contactUserId')}
  contacts={contacts}
  channel={form.watch('channel')}
/>
```

**Logique** :
- Si contact sélectionné → entreprise déduite, scope pré-rempli à "single"
- Si canal = "Constat Interne" → scope obligatoire
- Conditionnel selon scope pour afficher les champs appropriés

---

## ✅ Validations et Règles Métier

1. **Contact + Entreprise** : Si contact sélectionné, l'entreprise du contact est pré-remplie
2. **Portée obligatoire** : Si canal = "Constat Interne", portée doit être renseignée
3. **Au moins une entreprise** : Si scope = "single" ou "multiple", au moins une entreprise requise
4. **Toutes les entreprises** : Si scope = "all", aucun MultiSelect nécessaire

---

## 📝 Questions à Valider

1. **Comportement par défaut** : Quand un contact est sélectionné, portée = "single" par défaut ?
2. **Modification post-création** : Qui peut modifier la portée après création ?
3. **Affichage liste** : Comment afficher "Toutes" ou "N entreprises" dans la liste des tickets ?

---

**Document basé sur l'analyse MCP Supabase + MCP Next.js**

