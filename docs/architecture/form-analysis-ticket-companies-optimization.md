# Analyse du Formulaire de Création de Tickets - Optimisation pour Relations Multi-Entreprises

**Date** : 2025-01-27  
**Source** : Analyse via MCP Supabase + MCP Next.js  
**Objectif** : Optimiser les user flows Solution 1 en se basant sur la structure réelle du formulaire et de la base de données

---

## 1. Structure Actuelle de la Table `tickets` (via MCP Supabase)

### 1.1. Champs Existants Liés aux Entreprises

D'après l'analyse de la table `tickets` dans Supabase :

```sql
-- Champs actuellement disponibles dans tickets
contact_user_id: uuid (nullable) -- FK vers profiles.id
company_id: uuid (nullable)      -- FK vers companies.id  
created_by: uuid (nullable)      -- FK vers profiles.id (agent support)
```

**Observation critique** :
- `contact_user_id` : Contact utilisateur (profile) qui signale le ticket
- `company_id` : Entreprise directement associée au ticket (peut être différente de celle du contact)
- `created_by` : Agent support qui a créé/enregistré le ticket

### 1.2. Relations Existantes

**Contraintes de clés étrangères** :
- `tickets_contact_user_id_fkey` : `contact_user_id` → `profiles.id`
- `tickets_company_id_fkey` : `company_id` → `companies.id`
- `tickets_created_by_fkey` : `created_by` → `profiles.id`

**Table `profiles`** :
- `company_id` : uuid (nullable) -- L'entreprise du profil contact
- `profiles.company_id` peut être différente de `tickets.company_id`

---

## 2. Structure Actuelle du Formulaire (via Code Source)

### 2.1. Composant `TicketForm`

**Localisation** : `src/components/forms/ticket-form.tsx`

**Champs du formulaire actuel** :
1. **Type et Canal** (`TicketTypeSection`)
   - Type : BUG | REQ | ASSISTANCE
   - Canal : Liste des canaux (Whatsapp, Email, Appel, etc.)

2. **Titre** (required)
   - Champ texte libre

3. **Entreprise** (`companyId`)
   - Combobox avec liste des entreprises
   - Recommandé pour "Constat Interne"
   - Optionnel

4. **Contact** (`contactUserId`)
   - Combobox avec liste des contacts (profiles)
   - Requis si canal ≠ "Constat Interne"
   - Désactivé si canal = "Constat Interne"

5. **Description**
   - Éditeur de texte riche

6. **Type de bug** (si type = BUG)
   - Combobox avec liste des types de bugs

7. **Produit**
   - RadioGroup avec produits disponibles

8. **Module / Sous-module / Fonctionnalité**
   - Combobox en cascade (Module → Sous-module → Fonctionnalité)

9. **Priorité**
   - RadioGroup : Low | Medium | High | Critical

10. **Durée** (minutes)
    - Champ numérique (obligatoire pour ASSISTANCE)

11. **Contexte client**
    - Textarea libre

12. **Pièces jointes**
    - Zone de drag & drop

### 2.2. Validation Zod

**Schéma** : `src/lib/validators/ticket.ts`

```typescript
contactUserId: z.union([z.string().uuid(), z.literal('')]).optional()
companyId: z.union([z.string().uuid(), z.literal('')]).optional()
```

**Règles actuelles** :
- `contactUserId` : Optionnel (vide si "Constat Interne")
- `companyId` : Optionnel (recommandé si "Constat Interne")

---

## 3. Analyse de Solution 1 : Many-to-Many avec Liaison Table

### 3.1. Modifications Nécessaires

**Nouvelle table à créer** :
```sql
CREATE TABLE ticket_company_link (
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (ticket_id, company_id)
);

CREATE INDEX idx_ticket_company_link_ticket ON ticket_company_link(ticket_id);
CREATE INDEX idx_ticket_company_link_company ON ticket_company_link(company_id);
```

**Nouveau champ dans `tickets`** :
```sql
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS affects_all_companies boolean DEFAULT false;
```

### 3.2. Impact sur le Formulaire

**Champs à ajouter/modifier** :

1. **Remplacement du champ "Entreprise" unique** par :
   - [ ] RadioGroup : "Portée du ticket"
     - Option 1 : "Une seule entreprise"
     - Option 2 : "Toutes les entreprises"
     - Option 3 : "Plusieurs entreprises spécifiques"
   
2. **Nouveau composant conditionnel** :
   - [ ] Si "Une seule entreprise" → Combobox existant (`companyId`)
   - [ ] Si "Toutes les entreprises" → Checkbox "Concernant toutes les entreprises" (`affects_all_companies`)
   - [ ] Si "Plusieurs entreprises spécifiques" → MultiSelect avec liste des entreprises

3. **Logique de validation** :
   - Si `affects_all_companies = true` → `companyId` doit être null, pas de `ticket_company_link`
   - Si "Une seule entreprise" → `companyId` renseigné, 1 entrée dans `ticket_company_link`
   - Si "Plusieurs entreprises" → `companyId` null, plusieurs entrées dans `ticket_company_link`

---

## 4. User Flows Optimisés (Solution 1)

### 4.1. Cas 1 : Ticket pour une seule entreprise

**Formulaire** :
```
Type/Canal → Titre → Portée: [Une seule entreprise] → Entreprise: [Combobox] → Contact → ...
```

**Données sauvegardées** :
- `tickets.company_id` = UUID de l'entreprise sélectionnée
- `tickets.affects_all_companies` = false
- `ticket_company_link` : 1 ligne (ticket_id, company_id, is_primary=true)

**Comportement** :
- Identique à l'implémentation actuelle
- Compatible avec le code existant qui utilise `company_id`

### 4.2. Cas 2 : Ticket pour toutes les entreprises

**Formulaire** :
```
Type/Canal → Titre → Portée: [Toutes les entreprises] → [✓] Concernant toutes les entreprises → Contact → ...
```

**Données sauvegardées** :
- `tickets.company_id` = null
- `tickets.affects_all_companies` = true
- `ticket_company_link` : aucune ligne (ou toutes les entreprises existantes ? À décider)

**Validation** :
- Si `affects_all_companies = true`, le champ Entreprise doit être désactivé/vidé

### 4.3. Cas 3 : Ticket pour plusieurs entreprises spécifiques

**Formulaire** :
```
Type/Canal → Titre → Portée: [Plusieurs entreprises spécifiques] → 
Entreprises: [MultiSelect avec liste] → Contact → ...
```

**Données sauvegardées** :
- `tickets.company_id` = null (ou première entreprise pour compatibilité ?)
- `tickets.affects_all_companies` = false
- `ticket_company_link` : N lignes (une par entreprise sélectionnée)
  - Première entreprise : `is_primary = true`
  - Autres : `is_primary = false`

**Nouveau composant UI nécessaire** :
- MultiSelect avec recherche (similaire au Combobox actuel mais multi-sélection)

### 4.4. Cas 4 : Constat Interne (sans contact)

**Formulaire actuel** :
```
Canal: [Constat Interne] → Entreprise: [Recommandé] → Contact: [Désactivé] → ...
```

**Après Solution 1** :
```
Canal: [Constat Interne] → 
Portée: [Une seule entreprise | Toutes les entreprises | Plusieurs entreprises] → 
Entreprise(s): [Selon portée] → 
Contact: [Désactivé] → ...
```

**Données** :
- `contact_user_id` = null (déjà géré)
- `company_id` ou `ticket_company_link` selon portée

---

## 5. Modifications du Code à Prévoir

### 5.1. Schéma Zod (`src/lib/validators/ticket.ts`)

```typescript
// Nouveau schéma enrichi
export const createTicketSchema = z.object({
  // ... champs existants ...
  
  // Nouveaux champs pour Solution 1
  scope: z.enum(['single', 'all', 'multiple']).optional(), // Portée du ticket
  affectsAllCompanies: z.boolean().optional(),
  selectedCompanyIds: z.array(z.string().uuid()).optional(), // Pour "multiple"
  
  // Champs existants (à adapter)
  companyId: z.union([z.string().uuid(), z.literal('')]).optional(),
  contactUserId: z.union([z.string().uuid(), z.literal('')]).optional(),
})
.refine((data) => {
  // Validation : si scope = 'all', affectsAllCompanies doit être true
  if (data.scope === 'all') {
    return data.affectsAllCompanies === true;
  }
  return true;
}, { message: 'Si portée = toutes, le flag doit être activé', path: ['affectsAllCompanies'] })
.refine((data) => {
  // Validation : si scope = 'multiple', selectedCompanyIds doit avoir au moins 2 éléments
  if (data.scope === 'multiple') {
    return data.selectedCompanyIds && data.selectedCompanyIds.length >= 2;
  }
  return true;
}, { message: 'Sélectionnez au moins 2 entreprises', path: ['selectedCompanyIds'] })
.refine((data) => {
  // Validation : si scope = 'single', companyId doit être renseigné
  if (data.scope === 'single') {
    return data.companyId && data.companyId !== '';
  }
  return true;
}, { message: 'Sélectionnez une entreprise', path: ['companyId'] });
```

### 5.2. Service de Création (`src/services/tickets/index.ts`)

```typescript
export const createTicket = async (payload: CreateTicketInput) => {
  // ... récupération du profil créateur ...
  
  // Déterminer company_id selon scope
  let companyId: string | null = null;
  if (payload.scope === 'single') {
    companyId = payload.companyId || null;
  } else if (payload.scope === 'multiple') {
    // Prendre la première entreprise pour compatibilité
    companyId = payload.selectedCompanyIds?.[0] || null;
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
  
  // Créer les liens dans ticket_company_link
  if (payload.scope === 'single' && companyId) {
    await supabase.from('ticket_company_link').insert({
      ticket_id: data.id,
      company_id: companyId,
      is_primary: true,
    });
  } else if (payload.scope === 'multiple' && payload.selectedCompanyIds) {
    const links = payload.selectedCompanyIds.map((compId, index) => ({
      ticket_id: data.id,
      company_id: compId,
      is_primary: index === 0, // Première = primaire
    }));
    await supabase.from('ticket_company_link').insert(links);
  }
  // Si scope = 'all', pas de liens (ou tous les liens ? À décider)
  
  return data;
};
```

### 5.3. Composant UI (`src/components/forms/ticket-form.tsx`)

**Nouveau composant à créer** : `TicketScopeSection`

```tsx
// Nouveau composant pour gérer la portée
<TicketScopeSection form={form} companies={companies} />

// Structure interne :
// - RadioGroup pour choisir la portée
// - Conditionnel selon portée :
//   - Single → Combobox existant (réutilisable)
//   - All → Checkbox
//   - Multiple → MultiSelect (nouveau composant)
```

**Modifications du formulaire principal** :
- Remplacer la section "Entreprise" actuelle par `TicketScopeSection`
- Adapter la logique de désactivation du Contact selon le canal (déjà géré)

---

## 6. Compatibilité avec le Code Existant

### 6.1. Lecture des Tickets

**Code actuel** utilise `tickets.company_id` directement :
- `src/services/tickets/utils/ticket-transformer.ts` : Transforme `company_id` depuis `contact_user.company_id`
- `src/components/tickets/tickets-infinite-scroll/ticket-row.tsx` : Affiche la colonne "company"

**Adaptation nécessaire** :
- Si `affects_all_companies = true` → Afficher "Toutes les entreprises"
- Sinon, si `ticket_company_link` existe → Joindre et afficher toutes les entreprises liées
- Sinon → Utiliser `company_id` (rétrocompatibilité)

### 6.2. Filtrage des Tickets

**Filtres actuels** par entreprise :
- Les filtres devront être adaptés pour prendre en compte `ticket_company_link`
- Une entreprise doit voir ses tickets ET les tickets avec `affects_all_companies = true`

**RLS (Row Level Security)** :
- Les policies devront être mises à jour pour inclure `ticket_company_link`
- Vérifier que les clients voient leurs tickets même si `affects_all_companies = true`

---

## 7. Recommandations d'Implémentation

### 7.1. Phase 1 : Migration de la Base

1. Créer la table `ticket_company_link`
2. Ajouter le champ `affects_all_companies` dans `tickets`
3. Migrer les données existantes :
   ```sql
   -- Pour chaque ticket avec company_id non null
   INSERT INTO ticket_company_link (ticket_id, company_id, is_primary)
   SELECT id, company_id, true
   FROM tickets
   WHERE company_id IS NOT NULL;
   ```

### 7.2. Phase 2 : Backend

1. Mettre à jour le schéma Zod
2. Modifier `createTicket` pour gérer les 3 cas
3. Créer une fonction utilitaire pour lire les entreprises d'un ticket :
   ```typescript
   async function getTicketCompanies(ticketId: string): Promise<Company[]>
   ```

### 7.3. Phase 3 : Frontend

1. Créer le composant `TicketScopeSection`
2. Créer un composant `MultiSelect` réutilisable (ou utiliser une lib existante)
3. Modifier `TicketForm` pour intégrer `TicketScopeSection`
4. Mettre à jour l'affichage des tickets dans la liste

### 7.4. Phase 4 : Tests et Validation

1. Tester les 3 cas de portée
2. Vérifier la rétrocompatibilité avec les tickets existants
3. Valider les RLS policies
4. Tester les filtres par entreprise

---

## 8. Questions Ouvertes

1. **Cas "Toutes les entreprises"** :
   - Créer une ligne dans `ticket_company_link` pour chaque entreprise existante ?
   - Ou laisser vide et gérer en logique (`affects_all_companies = true`) ?

2. **Rétrocompatibilité** :
   - Les tickets existants avec `company_id` doivent-ils être migrés automatiquement ?
   - Ou garder les deux systèmes en parallèle ?

3. **Affichage dans la liste** :
   - Si plusieurs entreprises, afficher toutes ou un badge "N entreprises" ?
   - Si "toutes", afficher "Toutes" ou la liste complète ?

4. **Performance** :
   - Avec plusieurs entreprises, faut-il un index composite sur `ticket_company_link` ?
   - Doit-on limiter le nombre d'entreprises par ticket ?

---

## 9. Conclusion

L'analyse du formulaire actuel et de la base de données via MCP Supabase montre que :

✅ **Le champ `company_id` existe déjà** et peut être utilisé comme "entreprise primaire"  
✅ **Le formulaire actuel est bien structuré** et peut être étendu facilement  
✅ **Solution 1 (Many-to-Many) est compatible** avec l'architecture existante  

**Prochaines étapes recommandées** :
1. Valider les user flows détaillés avec l'équipe
2. Décider des questions ouvertes (section 8)
3. Créer les migrations SQL
4. Implémenter progressivement (Phases 1 → 4)

---

**Document généré via MCP Supabase + MCP Next.js**  
**Structure de la base analysée** : 2025-01-27  
**Projet Supabase** : ONPOINT CENTRAL (xjcttqaiplnoalolebls)

