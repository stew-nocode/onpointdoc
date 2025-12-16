# Clarifications Avant Import des Tickets d'Assistance

**Date:** 2025-12-09  
**Statut:** ⚠️ En attente de clarifications

---

## ✅ Points Validés

1. ✅ **Clé JIRA:** `OBCS-XXXXX`
2. ✅ **Type:** "Interaction" → `ASSISTANCE`
3. ✅ **Statut:** "Terminé" → `Resolue` (enum standard)
4. ✅ **Priorité:** "Priorité 3" → `Low`
5. ✅ **Entreprises:** `affects_all_companies = false` pour tous
6. ✅ **Canaux:** Mapping validé
7. ✅ **Action menée:** Ignorer
8. ✅ **Date d'enregistrement:** Utiliser comme fallback pour `created_at`
9. ✅ **Origine:** `origin = 'jira'`

---

## ❓ Points à Clarifier AVANT Import

### 1. 🔴 Champ "Durée" (IMPÉRATIF)

**Problème:** Le champ `duration` n'existe pas dans la table `tickets` de Supabase.

**Question:** Comment ajouter ce champ ?

**Options:**
- **Option A:** Ajouter une colonne `duration_minutes INTEGER` à la table `tickets`
- **Option B:** Ajouter une colonne `duration_minutes DECIMAL(10,2)` (pour gérer les décimales comme "4.11")
- **Option C:** Créer une table séparée `ticket_metadata` pour les champs spécifiques aux assistances

**Recommandation:** Option B (`DECIMAL(10,2)`) pour gérer les durées avec décimales.

**Question:** Valider Option B ?

---

### 2. 🔴 Création Automatique des Utilisateurs

**Problème:** Si un utilisateur (Interlocuteur ou Rapporteur) n'existe pas, il faut le créer.

**Questions:**
- **Quel rôle assigner ?**
  - `client` pour les Interlocuteurs (contacts clients) ?
  - `agent` pour les Rapporteurs (agents internes) ?
  - Comment différencier ?

- **Quels champs sont obligatoires ?**
  - `full_name` ✅ (disponible dans CSV)
  - `email` ❓ (pas dans CSV) → Générer un email fictif ?
  - `role` ❓ (à déterminer)
  - `company_id` ✅ (disponible pour Interlocuteurs)
  - `job_title` ✅ (disponible dans CSV pour Interlocuteurs)
  - `is_active` → `true` par défaut ?

- **Email fictif:**
  - Format proposé: `{full_name_normalise}@assistance.onpoint.local`
  - Exemple: `taped.thibault.julien@assistance.onpoint.local`
  - **Question:** Valider ce format ?

- **Règles de création:**
  - **Interlocuteur (contact_user_id):**
    - `role = 'client'`
    - `company_id` = entreprise du ticket
    - `job_title` = "Poste" du CSV
    - `email` = généré si absent
  
  - **Rapporteur (created_by):**
    - `role = 'agent'` (tous les rapporteurs sont des agents internes)
    - `company_id = NULL` (agents internes)
    - `email` = généré si absent
  
  **Question:** Valider ces règles ?

---

### 3. 🔴 Création Automatique des Sous-Modules

**Problème:** Si un sous-module n'existe pas, il faut le créer.

**Questions:**
- **Quel `module_id` utiliser ?**
  - Le module du ticket (déjà identifié)
  
- **Quels champs sont obligatoires ?**
  - `name` ✅ (disponible dans CSV)
  - `module_id` ✅ (déjà identifié)
  - Autres champs requis ?

- **Gestion des doublons:**
  - Vérifier si le sous-module existe déjà (même nom + même module_id)
  - Si oui → utiliser l'existant
  - Si non → créer

**Question:** Valider cette approche ?

---

### 4. 🔴 Création Automatique des Modules

**Problème:** Si un module n'existe pas, il faut le créer.

**Questions:**
- **Quel `product_id` utiliser ?**
  - Tous les modules d'assistance sont pour OBC ?
  - Ou faut-il déterminer le produit selon le module ?
  
- **Mapping Module → Produit:**
  - `Finance` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  - `RH` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  - `Opérations` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  - `Projets` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  - `Support` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  - `CRM` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  - `Paiement` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  - `Global` → OBC (ID: `11111111-1111-1111-1111-111111111111`)
  
  **Question:** Tous les modules d'assistance sont pour OBC ? (ID: `11111111-1111-1111-1111-111111111111`)

- **Quels champs sont obligatoires ?**
  - `name` ✅ (disponible dans CSV)
  - `product_id` ❓ (à déterminer)
  - Autres champs requis ?

- **Gestion des doublons:**
  - Vérifier si le module existe déjà (même nom)
  - Si oui → utiliser l'existant
  - Si non → créer

**Question:** Valider cette approche ?

---

### 5. 🔴 Gestion du Module "Global"

**Question:** Si le module dans le CSV est "Global", faut-il :
- Utiliser le module Global existant (ID: `98ce1c5f-e53c-4baf-9af1-52255d499378`) ?
- Ou créer un nouveau module "Global" ?

**Recommandation:** Utiliser le module Global existant.

**Question:** Valider ?

---

### 6. 🔴 Gestion des Entreprises Non Trouvées

**Question:** Si une entreprise (Client) n'existe pas dans Supabase :
- Créer automatiquement l'entreprise ?
- Ou laisser `company_id = NULL` et log d'avertissement ?

**Recommandation:** Créer automatiquement avec :
- `name` = nom du client (CSV)
- `country_id = NULL`
- `focal_user_id = NULL`
- `jira_company_id = NULL`

**Question:** Valider cette approche ?

---

### 7. 🔴 Format de la Durée dans le CSV

**Observation:** Le CSV contient des durées comme :
- `4.11` (minutes)
- `5.4` (minutes)
- `08.08` (minutes)
- `0.44` (minutes)

**Question:** Le format est-il toujours en minutes avec décimales ?

**Validation:** Oui, format `DECIMAL(10,2)` pour `duration_minutes`.

---

## 📋 Checklist de Clarification

### Avant de créer le script, valider :

- [ ] **Durée:** Format `DECIMAL(10,2)` pour `duration_minutes` ✅
- [ ] **Migration SQL:** Ajouter la colonne `duration_minutes` à `tickets`
- [ ] **Utilisateurs - Rôle Interlocuteur:** `client` ✅
- [ ] **Utilisateurs - Rôle Rapporteur:** `agent` ✅
- [ ] **Utilisateurs - Email:** Format `{nom_normalise}@assistance.onpoint.local` ✅
- [ ] **Sous-modules:** Créer si n'existe pas ✅
- [ ] **Modules:** Créer si n'existe pas ✅
- [ ] **Modules - Produit:** Tous pour OBC ? ❓
- [ ] **Module Global:** Utiliser l'existant ✅
- [ ] **Entreprises:** Créer si n'existe pas ✅

---

## 🎯 Plan d'Action Après Clarifications

### Étape 1: Migration SQL pour `duration_minutes`
```sql
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS duration_minutes DECIMAL(10,2);

COMMENT ON COLUMN tickets.duration_minutes IS 'Durée de l''assistance en minutes (pour tickets ASSISTANCE uniquement)';
```

### Étape 2: Script de Synchronisation
- Créer `scripts/sync-assistance-tickets-from-google-sheet.mjs`
- Implémenter la création automatique des utilisateurs
- Implémenter la création automatique des modules/sous-modules
- Implémenter la création automatique des entreprises
- Mapper la durée

### Étape 3: Génération SQL
- Générer la migration SQL complète
- Tester sur un échantillon

### Étape 4: Application
- Appliquer la migration
- Vérifier les résultats

---

## ❓ Questions Finales à Répondre

1. **Durée:** Format `DECIMAL(10,2)` pour `duration_minutes` → ✅ Valider ?
2. **Utilisateurs - Email:** Format `{nom_normalise}@assistance.onpoint.local` → ✅ Valider ?
3. **Modules - Produit:** Tous les modules d'assistance sont pour OBC ? → ❓ À confirmer
4. **Entreprises:** Créer automatiquement si n'existe pas → ✅ Valider ?

---

**En attente de vos réponses pour finaliser le script !** 🚀

