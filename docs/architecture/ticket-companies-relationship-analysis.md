# Analyse : Gestion des Tickets Multi-Entreprises

## 📋 Situation Actuelle

### Structure Actuelle

1. **Table `tickets`** :
   - `contact_user_id` → référence `profiles.id` (utilisateur externe/client qui signale)
   - `created_by` → référence `profiles.id` (agent support qui enregistre)
   - Pas de champ direct pour l'entreprise

2. **Table `profiles`** :
   - `company_id` → référence `companies.id`
   - Un utilisateur appartient à une entreprise

3. **Relation actuelle** :
   ```
   Ticket → contact_user_id → Profile → company_id → Company
   ```
   **Problème** : Un ticket est implicitement lié à UNE SEULE entreprise (celle du contact_user_id)

### Problème Identifié

**Cas métier** : Un ticket peut être :
- ✅ **Signalé par** une entreprise (via un utilisateur de cette entreprise)
- ❓ **Concerner** toutes les entreprises OU plusieurs entreprises spécifiques

**Exemples concrets** :
- Un bug global dans le module Finance qui affecte tous les clients
- Une requête d'amélioration qui bénéficierait à toutes les entreprises
- Un problème de sécurité systémique

---

## 🎯 Solutions Proposées

### Solution 1 : Relation Many-to-Many avec Table de Liaison ⭐ (RECOMMANDÉE)

**Principe** : Séparer "entreprise signalante" et "entreprises concernées"

#### Structure proposée :

```sql
-- Table de liaison tickets ↔ companies
CREATE TABLE ticket_company_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reporter', 'affected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, company_id, role)
);

-- Index pour performance
CREATE INDEX idx_ticket_company_link_ticket ON ticket_company_link(ticket_id);
CREATE INDEX idx_ticket_company_link_company ON ticket_company_link(company_id);
```

#### Avantages :
- ✅ **Séparation claire** : entreprise signalante vs entreprises concernées
- ✅ **Flexibilité** : un ticket peut concerner 1, plusieurs ou toutes les entreprises
- ✅ **Traçabilité** : on sait qui a signalé et qui est concerné
- ✅ **Extensible** : facile d'ajouter d'autres rôles (`notified`, `validated`, etc.)
- ✅ **RLS simple** : règles de sécurité basées sur les entreprises de l'utilisateur

#### Utilisation :
- **Ticket signalé par Entreprise A, concerne toutes** :
  ```sql
  -- Entreprise signalante
  INSERT INTO ticket_company_link (ticket_id, company_id, role) 
  VALUES (ticket_id, 'company-a-id', 'reporter');
  ```
  
- **Ticket concerne toutes les entreprises** :
  ```sql
  -- Pas d'entrée avec role='affected' OU une entrée spéciale
  -- Option A : Pas d'entrée = concerne toutes
  -- Option B : Flag spécial dans tickets.is_global
  ```

#### Migration :
- Créer la table `ticket_company_link`
- Migrer les données existantes : 
  ```sql
  INSERT INTO ticket_company_link (ticket_id, company_id, role)
  SELECT 
    t.id, 
    p.company_id, 
    'reporter'
  FROM tickets t
  JOIN profiles p ON t.contact_user_id = p.id
  WHERE p.company_id IS NOT NULL;
  ```

---

### Solution 2 : Champ `is_global` + Table de Liaison Optionnelle

**Principe** : Flag global + table pour exceptions

#### Structure :

```sql
ALTER TABLE tickets ADD COLUMN is_global BOOLEAN DEFAULT false;
ALTER TABLE tickets ADD COLUMN reporter_company_id UUID REFERENCES companies(id);

-- Table optionnelle pour exceptions
CREATE TABLE ticket_affected_companies (
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, company_id)
);
```

#### Logique :
- `is_global = true` → concerne toutes les entreprises
- `is_global = false` → voir `ticket_affected_companies` OU `reporter_company_id` uniquement

#### Avantages :
- ✅ Simple pour les cas courants (1 entreprise)
- ✅ Performant (pas de jointure nécessaire pour cas simple)
- ✅ Flexible pour exceptions

#### Inconvénients :
- ⚠️ Logique conditionnelle plus complexe
- ⚠️ Deux façons de représenter la même chose

---

### Solution 3 : Colonnes Directes + Flag Global

**Principe** : Champ direct pour reporter + flag global

#### Structure :

```sql
ALTER TABLE tickets ADD COLUMN reporter_company_id UUID REFERENCES companies(id);
ALTER TABLE tickets ADD COLUMN is_global BOOLEAN DEFAULT false;

-- Si is_global = false, le ticket concerne uniquement reporter_company_id
-- Si is_global = true, le ticket concerne toutes les entreprises
```

#### Avantages :
- ✅ Très simple
- ✅ Performant (une seule table)
- ✅ Facile à comprendre

#### Inconvénients :
- ❌ Pas de support pour "concerner plusieurs entreprises spécifiques" (sauf toutes)
- ❌ Limite la flexibilité future

---

### Solution 4 : Table de Liaison + Company Virtuelle "ALL"

**Principe** : Créer une entreprise spéciale "Toutes les entreprises"

#### Structure :

```sql
-- Créer une entreprise spéciale
INSERT INTO companies (id, name, is_system) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Toutes les entreprises', true);

-- Table de liaison standard
CREATE TABLE ticket_company_link (
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('reporter', 'affected')),
  PRIMARY KEY (ticket_id, company_id)
);
```

#### Utilisation :
- **Ticket global** → lier à l'entreprise "Toutes les entreprises"
- **Ticket spécifique** → lier aux entreprises concernées

#### Avantages :
- ✅ Uniformité : même structure pour tous les cas
- ✅ Cohérent avec le modèle de données existant

#### Inconvénients :
- ⚠️ Nécessite une logique spéciale pour "Toutes les entreprises"
- ⚠️ Peut être confus dans les rapports/filtres

---

## 📊 Comparaison des Solutions

| Critère | Solution 1 (Many-to-Many) | Solution 2 (Flag + Table) | Solution 3 (Colonnes simples) | Solution 4 (Company virtuelle) |
|---------|---------------------------|---------------------------|-------------------------------|--------------------------------|
| **Flexibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Simplicité** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Extensibilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Maintenance** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Recommandation : Solution 1 (Many-to-Many)

### Raisons :

1. **Séparation des concepts** : Reporter vs Affected est clair
2. **Flexibilité maximale** : Supporte tous les cas d'usage
3. **Évolutivité** : Facile d'ajouter des rôles (`notified`, `validated`, etc.)
4. **RLS cohérente** : Les règles de sécurité peuvent être basées sur les rôles
5. **Standard** : Pattern classique en base de données relationnelle

### Implémentation recommandée :

```sql
-- 1. Table de liaison
CREATE TABLE ticket_company_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('reporter', 'affected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ticket_id, company_id, role)
);

-- 2. Pour représenter "toutes les entreprises"
-- Option A : Pas d'entrée avec role='affected'
-- Option B : Flag dans tickets
ALTER TABLE tickets ADD COLUMN affects_all_companies BOOLEAN DEFAULT false;

-- 3. Index
CREATE INDEX idx_ticket_company_link_ticket ON ticket_company_link(ticket_id);
CREATE INDEX idx_ticket_company_link_company ON ticket_company_link(company_id);
CREATE INDEX idx_ticket_company_link_role ON ticket_company_link(role);
```

### Logique d'interprétation :

- **Ticket concerne une entreprise** :
  - `affects_all_companies = false`
  - Entrée dans `ticket_company_link` avec `role='affected'`

- **Ticket concerne toutes les entreprises** :
  - `affects_all_companies = true`
  - Pas d'entrées dans `ticket_company_link` avec `role='affected'`

- **Ticket concerne plusieurs entreprises spécifiques** :
  - `affects_all_companies = false`
  - Plusieurs entrées dans `ticket_company_link` avec `role='affected'`

---

## 🔒 Impact sur les RLS (Row Level Security)

### Règles à adapter :

```sql
-- Les utilisateurs d'une entreprise voient :
-- 1. Les tickets signalés par leur entreprise (role='reporter')
-- 2. Les tickets qui concernent leur entreprise (role='affected' OU affects_all_companies=true)

CREATE POLICY tickets_read_by_company
ON tickets FOR SELECT
TO authenticated
USING (
  -- Ticket signalé par l'entreprise de l'utilisateur
  EXISTS (
    SELECT 1 FROM ticket_company_link tcl
    JOIN profiles p ON p.company_id = tcl.company_id
    WHERE tcl.ticket_id = tickets.id
      AND tcl.role = 'reporter'
      AND p.id = auth.uid()
  )
  OR
  -- Ticket qui concerne l'entreprise de l'utilisateur
  (
    tickets.affects_all_companies = true
    OR EXISTS (
      SELECT 1 FROM ticket_company_link tcl
      JOIN profiles p ON p.company_id = tcl.company_id
      WHERE tcl.ticket_id = tickets.id
        AND tcl.role = 'affected'
        AND p.id = auth.uid()
    )
  )
);
```

---

## 📝 Questions à Clarifier

1. **Fréquence du cas "toutes les entreprises"** ?
   - Si rare → Solution 3 pourrait suffire
   - Si fréquent → Solution 1 recommandée

2. **Besoin de "plusieurs entreprises spécifiques"** ?
   - Si oui → Solution 1 ou 2
   - Si non → Solution 3 suffit

3. **Besoin de notifier/impliquer plusieurs entreprises** ?
   - Si oui → Solution 1 avec rôles additionnels

4. **Impact sur les rapports/dashboards** ?
   - Comment compter les tickets par entreprise ?
   - Les tickets globaux comptent-ils pour toutes les entreprises ?

---

## 🚀 Prochaines Étapes (Après validation)

1. Valider la solution choisie
2. Créer la migration SQL
3. Adapter les RLS policies
4. Mettre à jour les services/types TypeScript
5. Adapter l'interface utilisateur (formulaires, filtres, listes)
6. Migrer les données existantes
7. Tester les différents cas d'usage

