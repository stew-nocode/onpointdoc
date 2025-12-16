# Décisions Finales - Mapping CSV → Supabase

## ✅ Décisions Confirmées

### 1. Clé JIRA
- **Utiliser** : "Clé Ticket IT" (OD-XXXX) comme `jira_issue_key`
- **Exemple** : `OD-2953` → `jira_issue_key = 'OD-2953'`

---

### 2. Module/Sous-Module "Global"
- **Module Global** : Utiliser le module Global existant
  - ID : `98ce1c5f-e53c-4baf-9af1-52255d499378`
  - Nom : "Global"
- **Sous-module Global** : Si Module = "Global", alors `submodule_id = NULL`
  - **Raison** : Le module Global impacte déjà tout le logiciel, pas besoin de sous-module

---

### 3. Tickets Existants
- **Stratégie** : **UPSERT**
  - Si `jira_issue_key` existe → **Mettre à jour** le ticket
  - Si `jira_issue_key` n'existe pas → **Créer** un nouveau ticket

---

### 4. Mapping des Priorités
**Recommandation appliquée** :
- `Priorité 1` → `Critical`
- `Priorité 2` → `High`
- `Priorité 3` → `Medium`
- `Priorité 4` → `Low`

---

### 5. Mapping des Statuts
**Stratégie** : Utiliser les statuts JIRA dynamiques (conservation)
- `À faire` → `Sprint Backlog` (ou conserver tel quel)
- `En cours` → `Traitement en Cours` (ou conserver tel quel)
- `Terminé(e)` → `Terminé(e)` ✅ (déjà utilisé massivement)
- **Autres statuts** : Conserver tel quel (statuts JIRA dynamiques)

**Justification** : Après la synchronisation, les statuts JIRA seront utilisés.

---

### 6. Rapporteur/Utilisateurs
- **Rapporteur** (`created_by`) :
  - Rechercher par nom complet dans `profiles`
  - Si trouvé → utiliser l'ID
  - Si non trouvé → `created_by = NULL`
  - **Ne pas créer** de profil

- **Utilisateurs clients** (`contact_user_id`) :
  - Rechercher par nom complet dans `profiles` (role = 'client')
  - Si trouvé → utiliser l'ID
  - Si non trouvé → `contact_user_id = NULL`
  - **Ne pas créer** de profil

---

### 7. Entreprises
- **Tous les tickets** : `affects_all_companies = true`
- **`company_id`** : `NULL` (portée globale)

---

### 8. Fonctionnalité "Global"
- Si Fonctionnalité = "Global" → `feature_id = NULL`
- Sinon → Rechercher la fonctionnalité par nom

---

### 9. Canal
- Mapper vers l'enum `canal_t` existant
- Si non trouvé → Utiliser `'Autre'` (valeur par défaut)

---

### 10. Type de Bug
- Mapper vers l'enum `bug_type_enum` existant
- Si non trouvé → `bug_type = NULL`

---

### 11. Dates
- Parser les formats de dates (ISO et français)
- Format français : "3/11/2025 11:30" (jour/mois/année)
- Si conflit avec JIRA → Utiliser le format français
- Convertir en `timestamptz` PostgreSQL

---

### 12. Description
- **Conserver le formatage JIRA tel quel** (h3, *, !image, etc.)
- Pas de conversion en Markdown
- Stocker tel quel dans `description`

---

## 📋 Récapitulatif du Mapping

| Champ CSV | Champ Supabase | Mapping |
|-----------|----------------|---------|
| `Clé Ticket IT` | `jira_issue_key` | Direct (OD-XXXX) |
| `Résumé` | `title` | Direct |
| `Description` | `description` | Direct (conserver formatage JIRA) |
| `Rapporteur` | `created_by` | Recherche par nom → ID profil |
| `Utilisateurs` | `contact_user_id` | Recherche par nom → ID profil client |
| `Entreprises` | `affects_all_companies` | Toujours `true` |
| `Entreprises` | `company_id` | Toujours `NULL` |
| `Module` | `module_id` | Mapping nom → UUID (Global = `98ce1c5f-...`) |
| `Sous-Module(s)` | `submodule_id` | Mapping nom → UUID (NULL si Module = Global) |
| `Type_Ticket` | `ticket_type` | Bug → BUG, Requêtes → REQ |
| `Type de bug` | `bug_type` | Mapping enum ou NULL |
| `Priorité` | `priority` | Priorité 1→Critical, 2→High, 3→Medium, 4→Low |
| `Etat` | `status` | Conserver statut JIRA dynamique |
| `Canal` | `canal` | Mapping enum `canal_t` (défaut: 'Autre') |
| `Date de creation de Jira` | `created_at` | Parser et convertir en timestamptz |
| `Date de mise à jour Jira` | `updated_at` | Parser et convertir en timestamptz |
| `Date de résolution` | `resolved_at` | Parser et convertir en timestamptz |
| `Fonctionnalité` | `feature_id` | Mapping nom → UUID (NULL si Global) |

---

## ✅ Prêt pour l'implémentation

Toutes les décisions sont prises. Le script peut être créé.
