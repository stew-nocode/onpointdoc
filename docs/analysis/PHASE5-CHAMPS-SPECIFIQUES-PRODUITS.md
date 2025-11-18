# Phase 5 : Champs Spécifiques par Produit - Mapping Jira → Supabase

**Date**: 2025-01-18  
**Contexte**: Extension de la synchronisation Jira pour inclure les champs conditionnels par produit/module  
**Objectif**: Mapper les champs Jira spécifiques à chaque produit dans un format JSONB flexible

---

## 1. Vue d'ensemble

### 1.1. Problématique

Certains champs Jira sont **conditionnels** selon le produit/module :
- `customfield_10297` : OBC - Opérations (Vente, Immobilisations, AGRO, etc.)
- `customfield_10298` : OBC - Finance (Budget, Comptabilité, Impôts, etc.)
- `customfield_10300` : OBC - RH (Salaire, Documents, Gestion employé, etc.)
- `customfield_10299` : OBC - Projets (Feuille de temps, Dashboard, etc.)
- `customfield_10301` : OBC - CRM (Activités commerciales, Offres, Clients, etc.)
- `customfield_10313` : Finance (Traitements comptables, Paramétrage, etc.)
- `customfield_10324` : RH (Gestion de temps, Contrat employé, etc.)
- `customfield_10364` : Paramétrage admin (Workflow, Gestion des utilisateurs, etc.)

### 1.2. Solution

Stocker ces champs dans `tickets.custom_fields` (JSONB) avec une structure flexible :

```json
{
  "product_specific": {
    "customfield_10297": "Opérations - Vente",
    "customfield_10298": "Finance - Comptabilité Générale",
    "customfield_10300": "RH - Salaire",
    "customfield_10299": "Projets - Feuille de temps",
    "customfield_10301": "CRM - Activités commerciales",
    "customfield_10313": "Finance - Traitements comptables",
    "customfield_10324": "RH - Gestion de temps",
    "customfield_10364": "Paramétrage admin - Workflow"
  }
}
```

---

## 2. Migration SQL

### 2.1. Extension de la table `tickets`

```sql
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Index GIN pour recherche efficace dans JSONB
CREATE INDEX IF NOT EXISTS idx_tickets_custom_fields_gin ON public.tickets USING GIN (custom_fields);

-- Commentaire
COMMENT ON COLUMN public.tickets.custom_fields IS 'Champs personnalisés Jira spécifiques par produit (JSONB)';
```

---

## 3. Service de Synchronisation

### 3.1. Extension de `syncJiraToSupabase`

Le service doit mapper les champs conditionnels dans `custom_fields` :

```typescript
// Liste des customfields spécifiques produits
const productSpecificFields = [
  'customfield_10297', // OBC - Opérations
  'customfield_10298', // OBC - Finance
  'customfield_10300', // OBC - RH
  'customfield_10299', // OBC - Projets
  'customfield_10301', // OBC - CRM
  'customfield_10313', // Finance
  'customfield_10324', // RH
  'customfield_10364'  // Paramétrage admin
];

// Construire l'objet custom_fields
const customFields: Record<string, any> = {
  product_specific: {}
};

for (const fieldId of productSpecificFields) {
  const fieldValue = jiraData.fields[fieldId];
  if (fieldValue) {
    // Extraire la valeur (peut être string, object avec value/name, ou array)
    let value: string | null = null;
    
    if (typeof fieldValue === 'string') {
      value = fieldValue;
    } else if (Array.isArray(fieldValue)) {
      value = fieldValue.map(v => 
        typeof v === 'string' ? v : v?.value || v?.name || null
      ).filter(Boolean).join(', ');
    } else if (fieldValue && typeof fieldValue === 'object') {
      value = fieldValue.value || fieldValue.name || null;
    }
    
    if (value) {
      customFields.product_specific[fieldId] = value;
    }
  }
}

// Ajouter custom_fields au ticketUpdate si non vide
if (Object.keys(customFields.product_specific).length > 0) {
  ticketUpdate.custom_fields = customFields;
}
```

---

## 4. Structure JSONB

### 4.1. Format proposé

```json
{
  "product_specific": {
    "customfield_10297": "Opérations - Vente",
    "customfield_10298": "Finance - Comptabilité Générale",
    "customfield_10300": "RH - Salaire"
  },
  "metadata": {
    "jira_custom_field_ids": ["customfield_10297", "customfield_10298"],
    "last_updated": "2024-01-18T10:30:00Z"
  }
}
```

### 4.2. Avantages

- **Flexibilité** : Peut stocker n'importe quel champ personnalisé
- **Extensibilité** : Facile d'ajouter de nouveaux champs sans migration
- **Performance** : Index GIN pour recherche rapide
- **Traçabilité** : Conserve les IDs des champs Jira

---

## 5. Requêtes SQL sur JSONB

### 5.1. Recherche par champ spécifique

```sql
-- Trouver tous les tickets avec "Opérations - Vente"
SELECT * FROM tickets
WHERE custom_fields->'product_specific'->>'customfield_10297' = 'Opérations - Vente';

-- Trouver tous les tickets avec un champ Finance spécifique
SELECT * FROM tickets
WHERE custom_fields->'product_specific'->>'customfield_10298' IS NOT NULL;
```

### 5.2. Agrégations

```sql
-- Compter les tickets par valeur de customfield_10297
SELECT 
  custom_fields->'product_specific'->>'customfield_10297' as operation_type,
  COUNT(*) as count
FROM tickets
WHERE custom_fields->'product_specific'->>'customfield_10297' IS NOT NULL
GROUP BY operation_type;
```

---

## 6. Types TypeScript

### 6.1. Extension de `Ticket`

```typescript
export interface Ticket {
  // ... champs existants
  custom_fields?: {
    product_specific?: {
      customfield_10297?: string; // OBC - Opérations
      customfield_10298?: string; // OBC - Finance
      customfield_10300?: string; // OBC - RH
      customfield_10299?: string; // OBC - Projets
      customfield_10301?: string; // OBC - CRM
      customfield_10313?: string; // Finance
      customfield_10324?: string; // RH
      customfield_10364?: string; // Paramétrage admin
      [key: string]: string | undefined; // Pour extensibilité
    };
    metadata?: {
      jira_custom_field_ids?: string[];
      last_updated?: string;
    };
  } | null;
}
```

---

## 7. Exemples de Valeurs

### 7.1. OBC - Opérations (customfield_10297)
- "Opérations - Vente"
- "Opérations - Immobilisations"
- "Opérations - AGRO"
- "Opérations - Gestion de stock"
- "Opérations - Achat"

### 7.2. OBC - Finance (customfield_10298)
- "Finance - Budget"
- "Finance - Comptabilité Générale"
- "Finance - Impôts et taxes"
- "Finance - Trésorerie"
- "Finance - Comptabilité analytique"

### 7.3. OBC - RH (customfield_10300)
- "RH - Salaire"
- "RH - Documents"
- "RH - Gestion employé"
- "RH - Paramétrage"

---

## 8. Tests

### 8.1. Script de test

Créer `scripts/test-phase5-jira-custom-fields.js` pour valider :
1. Présence de la colonne `custom_fields` dans `tickets`
2. Index GIN créé
3. Mapping correct des champs conditionnels
4. Requêtes JSONB fonctionnelles

---

## 9. Prochaines Étapes

1. ✅ Créer la migration SQL
2. ✅ Étendre le service `syncJiraToSupabase`
3. ✅ Mettre à jour les types TypeScript
4. ✅ Créer le script de test
5. ⏳ Valider avec un échantillon de tickets Jira

---

**Note** : Cette approche JSONB permet une grande flexibilité pour les champs conditionnels sans nécessiter de migrations à chaque nouveau champ Jira.

