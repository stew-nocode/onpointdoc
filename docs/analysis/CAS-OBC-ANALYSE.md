# Analyse du Cas "OBC" dans les Mappings Jira → Supabase

**Date**: 2025-01-18  
**Contexte**: 124 tickets Jira ont `customfield_10052 = "OBC"`  
**Problème**: Aucun mapping possible avec la structure actuelle  
**Statut**: ✅ **RÉSOLU** - Feature générique créée le 2025-01-18

---

## 1. Le Problème

### 1.1. Données Jira

Dans Jira, **124 tickets** ont la valeur `"OBC"` dans le champ `customfield_10052` (Module/Fonctionnalité).

### 1.2. Structure Supabase

Dans Supabase, la hiérarchie est :
```
Product (OBC, SNI, CREDIT FACTORY)
  └── Module (Finance, RH, CRM, Opérations, Projets, etc.)
      └── SubModule (Comptabilité Générale, Salaire, etc.)
          └── Feature (Comptabilité, Calcul de salaire, etc.)
```

### 1.3. Le Conflit

**"OBC" dans Jira** peut signifier :
1. **Le produit OBC** (niveau le plus haut de la hiérarchie)
2. **Une fonctionnalité générique** quand le module/fonctionnalité spécifique n'est pas renseigné
3. **Un placeholder** utilisé par défaut quand l'information n'est pas disponible

**Dans Supabase**, "OBC" est un **produit**, pas une feature. Il ne peut donc pas être mappé directement à `features.id` car :
- Une feature doit appartenir à un submodule
- Un submodule doit appartenir à un module
- Un module doit appartenir à un produit

---

## 2. Pourquoi C'est Problématique

### 2.1. Structure de Mapping Actuelle

Le mapping Jira → Supabase fonctionne ainsi :
```
Jira: customfield_10052 = "Finance - Comptabilité Générale"
  ↓
jira_feature_mapping: "Finance - Comptabilité Générale" → feature_id (UUID)
  ↓
Supabase: tickets.feature_id = UUID
```

### 2.2. Cas "OBC"

```
Jira: customfield_10052 = "OBC"
  ↓
❌ Aucune feature correspondante (OBC est un produit, pas une feature)
  ↓
❌ Impossible de mapper vers tickets.feature_id
```

---

## 3. Solutions Possibles

### Solution 1 : Créer une Feature Générique "OBC" ⭐ **RECOMMANDÉE**

**Principe** : Créer une feature générique "OBC" dans un submodule existant (ex: un submodule "Général" ou "Autres").

**Avantages** :
- ✅ Simple à implémenter
- ✅ Permet de mapper les 124 tickets
- ✅ Pas de changement de structure

**Inconvénients** :
- ⚠️ Perte de granularité (on ne sait pas quel module/fonctionnalité exact)
- ⚠️ Moins précis pour le reporting

**Implémentation** :
```sql
-- Créer un submodule "Général" dans un module existant (ex: Finance ou Opérations)
-- Puis créer une feature "OBC" dans ce submodule
-- Mapper "OBC" → cette feature
```

### Solution 2 : Analyser les Tickets pour Déduire le Module

**Principe** : Analyser les 124 tickets avec `customfield_10052 = "OBC"` pour voir s'ils ont d'autres informations (labels, description, autres customfields) qui permettraient de déduire le module réel.

**Avantages** :
- ✅ Plus précis si on peut déduire le module
- ✅ Mappings plus granulaires

**Inconvénients** :
- ⚠️ Complexe à implémenter
- ⚠️ Nécessite une analyse manuelle ou heuristique
- ⚠️ Peut ne pas fonctionner pour tous les tickets

**Implémentation** :
```javascript
// Analyser chaque ticket avec "OBC"
// Chercher dans les labels, description, autres customfields
// Déduire le module (Finance, RH, CRM, etc.)
// Créer le mapping vers la feature appropriée
```

### Solution 3 : Mapper vers le Produit (Non Recommandé)

**Principe** : Stocker `product_id` au lieu de `feature_id` pour ces tickets.

**Avantages** :
- ✅ Conceptuellement correct (OBC = produit)

**Inconvénients** :
- ❌ Nécessite de modifier la structure (`tickets.feature_id` devient optionnel)
- ❌ Incohérent avec les autres tickets (qui ont une feature)
- ❌ Perte de granularité importante

### Solution 4 : Ignorer ces Tickets (Non Recommandé)

**Principe** : Laisser `tickets.feature_id = NULL` pour ces 124 tickets.

**Avantages** :
- ✅ Pas de changement nécessaire

**Inconvénients** :
- ❌ 124 tickets sans feature (6.8% des tickets)
- ❌ Perte d'information importante
- ❌ Reporting incomplet

---

## 4. Recommandation : Solution 1 (Feature Générique)

### 4.1. Implémentation Proposée

1. **Créer un submodule "Général" ou "Autres"** dans un module existant (ex: Finance ou Opérations)
2. **Créer une feature "OBC"** dans ce submodule
3. **Créer le mapping** : `"OBC"` → `feature_id` de cette feature générique

### 4.2. Code SQL

```sql
-- 1. Trouver un module approprié (ex: Finance ou Opérations)
-- 2. Créer un submodule "Général" si n'existe pas
INSERT INTO submodules (name, module_id)
SELECT 'Général', m.id
FROM modules m
JOIN products p ON m.product_id = p.id
WHERE p.name = 'OBC' AND m.name = 'Finance'
ON CONFLICT DO NOTHING;

-- 3. Créer la feature "OBC"
INSERT INTO features (name, submodule_id, jira_feature_id)
SELECT 'OBC', s.id, 10132
FROM submodules s
JOIN modules m ON s.module_id = m.id
JOIN products p ON m.product_id = p.id
WHERE p.name = 'OBC' AND m.name = 'Finance' AND s.name = 'Général'
ON CONFLICT DO NOTHING;

-- 4. Créer le mapping
INSERT INTO jira_feature_mapping (jira_feature_value, feature_id, jira_custom_field_id, jira_feature_id)
SELECT 'OBC', f.id, 'customfield_10052', '10132'
FROM features f
JOIN submodules s ON f.submodule_id = s.id
JOIN modules m ON s.module_id = m.id
JOIN products p ON m.product_id = p.id
WHERE p.name = 'OBC' AND m.name = 'Finance' AND s.name = 'Général' AND f.name = 'OBC'
ON CONFLICT (jira_feature_value, jira_custom_field_id) DO NOTHING;
```

### 4.3. Alternative : Utiliser un Submodule Existant

Si un submodule "Général" ou "Autres" existe déjà, créer directement la feature dedans.

---

## 5. Impact sur les Statistiques

### Avant
- **Mappings créés** : 30
- **Fonctionnalités sans mapping** : 27
- **Tickets non mappés** : ~124 (OBC) + autres

### Après (avec Solution 1)
- **Mappings créés** : 31 (+1)
- **Fonctionnalités sans mapping** : 26 (-1)
- **Tickets mappés** : +124 tickets

---

## 6. Questions à Clarifier

1. **Les 124 tickets "OBC" ont-ils d'autres informations** (labels, description) qui permettraient de déduire le module réel ?
2. **Faut-il créer un submodule "Général"** ou utiliser un submodule existant ?
3. **Quel module choisir** pour le submodule "Général" ? (Finance, Opérations, ou créer un module dédié ?)

---

## 7. Implémentation (2025-01-18)

### 7.1. Solution Appliquée

✅ **Solution 1 : Feature Générique "OBC"** a été implémentée.

### 7.2. Structure Créée

```
OBC (Produit)
  └── Opérations (Module)
      └── Général (Submodule) ← Créé
          └── OBC (Feature) ← Créé
```

### 7.3. Mapping Créé

- **Jira** : `customfield_10052 = "OBC"`
- **Supabase** : `feature_id = 9ea8ae5e-116a-4569-b9ab-b344e18be299`
- **Tickets mappés** : 124 tickets

### 7.4. Script Utilisé

Le script `scripts/create-obc-generic-feature.js` a été créé et exécuté avec succès.

### 7.5. Résultat

✅ **124 tickets peuvent maintenant être synchronisés** avec Supabase via la feature générique "OBC".

---

**Note** : Ce cas illustre une incohérence entre la structure Jira (où "OBC" peut être utilisé comme placeholder) et la structure Supabase (hiérarchie stricte Product → Module → SubModule → Feature). La solution de feature générique permet de mapper ces tickets tout en conservant la structure hiérarchique.

