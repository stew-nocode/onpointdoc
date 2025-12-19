# 🎯 Widget Répartition par Entreprise - Filtres Locaux Proposés

**Date**: 2025-01-16  
**Widget**: Répartition des tickets par entreprise (basé sur "Répartition par Type")

---

## 📊 Widget Actuel (Répartition par Type)

### Filtres Actuels
- ✅ **Agents Support** (multi-sélection)
  - Filtrer par agents Support uniquement
  - Permet de voir la répartition par type pour des agents spécifiques

---

## 🎯 Widget "Répartition par Entreprise" - Filtres Proposés

### Option 1 : Filtres Essentiels (Recommandé)

| Filtre | Type | Description | Utilité |
|--------|------|-------------|---------|
| **1. Types de Tickets** | Multi-sélection | BUG, REQ, ASSISTANCE | Permet de filtrer par type de ticket |
| **2. Produits** | Multi-sélection | OBC, SNI, Credit Factory | Voir la répartition par produit |
| **3. Agents Support** | Multi-sélection | Agents Support uniquement | Voir la répartition par agent |

**Avantages** :
- ✅ Filtres les plus pertinents pour une vue entreprise
- ✅ Permet d'analyser les tickets par type et produit
- ✅ Cohérent avec le widget existant (filtre agent)

---

### Option 2 : Filtres Avancés

| Filtre | Type | Description | Utilité |
|--------|------|-------------|---------|
| **1. Types de Tickets** | Multi-sélection | BUG, REQ, ASSISTANCE | Filtrer par type |
| **2. Produits** | Multi-sélection | OBC, SNI, Credit Factory | Filtrer par produit |
| **3. Agents Support** | Multi-sélection | Agents Support | Filtrer par agent |
| **4. Statut** | Multi-sélection | Ouvert, Résolu, En cours, etc. | Voir uniquement les tickets ouverts/résolus |
| **5. Modules** | Multi-sélection | Modules des produits | Granularité plus fine |

**Avantages** :
- ✅ Plus de flexibilité
- ✅ Analyses plus détaillées
- ⚠️ Peut être plus complexe à utiliser

---

### Option 3 : Filtres Minimaux (Simple)

| Filtre | Type | Description | Utilité |
|--------|------|-------------|---------|
| **1. Produits** | Multi-sélection | OBC, SNI, Credit Factory | Principal filtre par produit |

**Avantages** :
- ✅ Très simple
- ✅ Rapide à implémenter
- ⚠️ Moins flexible

---

## 💡 Recommandation : Option 1 (Filtres Essentiels)

### Justification

1. **Types de Tickets** : Permet de voir la répartition des BUG, REQ, ASSISTANCE par entreprise
2. **Produits** : Permet de filtrer par OBC, SNI, Credit Factory (très pertinent)
3. **Agents Support** : Cohérent avec le widget existant, permet de voir la répartition par agent

### Structure Proposée

```typescript
type TicketsByCompanyFilters = {
  ticketTypes: ('BUG' | 'REQ' | 'ASSISTANCE')[];  // Multi-sélection
  products: string[];                               // IDs des produits (OBC, SNI, CF)
  agents: string[];                                 // IDs des agents Support
};
```

---

## 📋 Filtres à Implémenter

### 1. Types de Tickets (Multi-sélection)

**Composant** : Checkboxes multiples
- ✅ BUG
- ✅ REQ
- ✅ ASSISTANCE
- Boutons "Tout" / "Rien" pour sélection rapide

**Fichier** : `tickets-by-company-pie-chart-filters.tsx`

---

### 2. Produits (Multi-sélection)

**Composant** : Checkboxes multiples
- ✅ OBC (ERP)
- ✅ SNI (Notation interne)
- ✅ Credit Factory

**Source** : `src/services/products/` ou `src/lib/constants/products.ts`

**Fichier** : `tickets-by-company-pie-chart-filters.tsx`

---

### 3. Agents Support (Multi-sélection)

**Composant** : Identique au widget "Répartition par Type"
- Liste des agents Support uniquement
- Multi-sélection avec checkboxes
- Boutons "Tout" / "Rien"

**Source** : Service existant pour récupérer les agents Support
**Fichier** : `tickets-by-company-pie-chart-filters.tsx`

---

## 🎨 Interface Proposée

### Layout des Filtres

```
┌─────────────────────────────────────────┐
│  Répartition par Entreprise    [Filtres]│
├─────────────────────────────────────────┤
│                                         │
│           [Pie Chart]                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Légende des entreprises         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Total: XXX tickets                     │
└─────────────────────────────────────────┘
```

### Popover Filtres

```
┌─────────────────────────────────────┐
│ Filtres Locaux                      │
│ Filtrer par type, produit, agent    │
├─────────────────────────────────────┤
│                                     │
│ Types de Tickets                    │
│ ☑ BUG                               │
│ ☑ REQ                               │
│ ☐ ASSISTANCE                        │
│ [Tout] [Rien]                       │
│                                     │
│ Produits                            │
│ ☑ OBC (ERP)                         │
│ ☐ SNI (Notation interne)            │
│ ☐ Credit Factory                    │
│ [Tout] [Rien]                       │
│                                     │
│ Agents Support                      │
│ ☐ Agent 1                           │
│ ☐ Agent 2                           │
│ ...                                 │
│                                     │
├─────────────────────────────────────┤
│ [Annuler]        [Appliquer]        │
└─────────────────────────────────────┘
```

---

## 🔍 Données Disponibles

### Tables Supabase

- ✅ `companies` : Liste des entreprises
- ✅ `tickets` : Tickets avec `company_id` ou via `ticket_company_link`
- ✅ `ticket_company_link` : Relation many-to-many tickets ↔ entreprises
- ✅ `products` : OBC, SNI, Credit Factory
- ✅ `profiles` : Agents Support avec filtre `department = 'Support'`

### Requête SQL Approximative

```sql
SELECT 
  c.id as company_id,
  c.name as company_name,
  COUNT(t.id) as ticket_count
FROM companies c
LEFT JOIN ticket_company_link tcl ON tcl.company_id = c.id
LEFT JOIN tickets t ON t.id = tcl.ticket_id
WHERE 
  -- Filtres: période, types, produits, agents
GROUP BY c.id, c.name
ORDER BY ticket_count DESC
```

---

## ✅ Checklist Implémentation

### Filtres
- [ ] Types de Tickets (BUG, REQ, ASSISTANCE) - Multi-sélection
- [ ] Produits (OBC, SNI, Credit Factory) - Multi-sélection
- [ ] Agents Support - Multi-sélection

### Composants
- [ ] `tickets-by-company-pie-chart.tsx` (Client Component)
- [ ] `tickets-by-company-pie-chart-filters.tsx` (Filtres)
- [ ] `tickets-by-company-pie-chart-skeleton.tsx` (Loading)
- [ ] `tickets-by-company-pie-chart-server.tsx` (Server Wrapper)

### Services
- [ ] `tickets-by-company-distribution.ts` (Service de données)
- [ ] Server Action pour récupérer les données

### Palette de Couleurs
- [ ] Palette dynamique selon le nombre d'entreprises
- [ ] Couleurs distinctes et harmonieuses

---

**Recommandation Finale** : **Option 1 - Filtres Essentiels**

C'est le meilleur compromis entre :
- ✅ Simplicité d'utilisation
- ✅ Flexibilité d'analyse
- ✅ Cohérence avec le widget existant

---

**Statut**: 📝 **PROPOSITION - EN ATTENTE VALIDATION**

