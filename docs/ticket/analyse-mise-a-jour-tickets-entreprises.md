# Analyse : Mise à jour des tickets "toutes les entreprises"

**Date** : 2025-01-27  
**Source** : Google Sheet `1xdczltq7rIRmGEF9G8ZlOAvvEmSYphwSlawK543_xNs`

---

## 📊 Résultats du Diagnostic

### Statistiques globales

- **Total de lignes** : 2121 tickets
- **Tickets avec OD vide** : 0
- **Tickets avec Clients vide** : 266
- **Tickets avec Clients renseigné** : 1855

### Valeurs identifiées

| Valeur | Nombre de tickets | Signification |
|--------|-------------------|---------------|
| **"ALL"** | **264** | ✅ **Toutes les entreprises** |
| "ONPOINT" | 270 | Entreprise spécifique |
| "KOFFI & DIABATE" | 197 | Entreprise spécifique |
| "S-TEL" | 139 | Entreprise spécifique |
| ... | ... | ... |

---

## 🎯 Plan d'Action Proposé

### Phase 1 : Tickets "ALL" (264 tickets)

**Objectif** : Mettre à jour les tickets qui concernent toutes les entreprises

**Actions à effectuer** :

1. **Mettre à jour `affects_all_companies`** :
   ```sql
   UPDATE tickets
   SET affects_all_companies = true
   WHERE jira_issue_key IN ('OD-XXXX', 'OD-YYYY', ...)
   ```

2. **Gérer `ticket_company_link`** :
   - Option A : Supprimer tous les liens existants (car "ALL" remplace les entreprises individuelles)
   - Option B : Ne rien toucher (garder les liens existants comme référence)

3. **Gérer `company_id`** :
   - Option A : Mettre `company_id = NULL` (car le ticket concerne toutes les entreprises)
   - Option B : Garder `company_id` tel quel

### Phase 2 : Tickets avec entreprises spécifiques (1855 tickets) - FUTUR

**À définir** : Comment gérer les tickets avec entreprises spécifiques dans `ticket_company_link`

---

## ❓ Questions à Clarifier

### 1. Mise à jour `affects_all_companies`

✅ **Confirmé** : Mettre à jour uniquement les 264 tickets avec "ALL"

### 2. Gestion de `ticket_company_link`

**Question** : Pour les tickets "ALL", faut-il :
- **Option A** : Supprimer tous les liens existants dans `ticket_company_link` ?
- **Option B** : Ne rien toucher (garder les liens existants) ?

**Recommandation** : **Option A** - Supprimer les liens car "ALL" signifie que le ticket ne concerne pas des entreprises spécifiques mais toutes.

### 3. Gestion de `company_id`

**Question** : Pour les tickets "ALL", faut-il :
- **Option A** : Mettre `company_id = NULL` ?
- **Option B** : Garder `company_id` tel quel ?

**Recommandation** : **Option A** - Mettre `company_id = NULL` car le ticket ne concerne pas une entreprise spécifique.

### 4. Tickets avec Clients vide (266 tickets)

**Question** : Que faire pour ces tickets ?
- Ne rien faire ?
- Mettre `affects_all_companies = false` explicitement ?

**Recommandation** : **Ne rien faire** - La valeur par défaut est déjà `false`.

### 5. Scope de l'opération

✅ **Confirmé** : On se concentre uniquement sur les 264 tickets "ALL" pour cette étape.

---

## 🔧 Structure de la Base de Données

D'après la migration créée précédemment :

```sql
-- Table tickets
ALTER TABLE tickets ADD COLUMN affects_all_companies BOOLEAN DEFAULT FALSE;

-- Table ticket_company_link (many-to-many)
CREATE TABLE ticket_company_link (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'affected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (ticket_id, company_id)
);
```

---

## 📝 Script à Créer

### Nom du script

`scripts/update-tickets-all-companies-from-sheet.mjs`

### Fonctionnalités

1. Télécharger le Google Sheet
2. Extraire les tickets avec "ALL" dans la colonne Clients
3. Trouver les tickets correspondants dans Supabase via `jira_issue_key`
4. Mettre à jour `affects_all_companies = true`
5. Mettre à jour `company_id = NULL` (si confirmé)
6. Supprimer les liens dans `ticket_company_link` (si confirmé)
7. Générer un rapport des mises à jour

---

## ⚠️ Points d'Attention

1. **Validation** : Vérifier que les 264 tickets "ALL" existent bien dans Supabase
2. **Rollback** : Avoir une stratégie de rollback si besoin
3. **Logs** : Logger toutes les modifications pour traçabilité
4. **Dry-run** : Proposer un mode `--dry-run` pour tester avant

---

**En attente de confirmation des questions avant implémentation**

