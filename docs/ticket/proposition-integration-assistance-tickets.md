# Proposition d'Intégration des Tickets d'Assistance

**Date:** 2025-12-09  
**Source:** Google Sheet (GID: 239102801)  
**Total de tickets:** 5308 tickets d'assistance

---

## 📊 Vue d'Ensemble

Les tickets d'assistance ont des caractéristiques différentes des BUG/REQ :
- **Clé JIRA:** Format `OBCS-XXXXX` (vs `OD-XXXXX` pour BUG/REQ)
- **Type:** Tous de type "Interaction" → à mapper vers `ASSISTANCE`
- **Champs supplémentaires:** Sens (Entrant/Sortant), Durée (minutes), Action menée
- **Tous liés à une entreprise spécifique** (pas d'impact global)

---

## 🎯 Plan d'Intégration Proposé

### Étape 1: Mapping des Champs Principaux

#### ✅ **Champs à mapper directement**

| Champ CSV | Champ Supabase | Mapping | Notes |
|-----------|----------------|---------|-------|
| `Clé de ticket` | `jira_issue_key` | Direct | Format: `OBCS-XXXXX` |
| `Résumé` | `title` | Direct | |
| `Description` | `description` | Direct | Peut inclure "Action menée" |
| `Client(s)` | `company_id` | Lookup par nom | `affects_all_companies = false` |
| `Interlocuteur` | `contact_user_id` | Lookup par `full_name` | |
| `Rapporteur` | `created_by` | Lookup par `full_name` | |
| `Création` | `created_at` | Parse date française | Format: "20/juil./25 16:22" |
| `Mise à jour` | `updated_at` | Parse date française | |
| `État` | `status` | Mapping statut | Voir section Statuts |
| `Module` | `module_id` | Lookup par nom | Voir section Modules |
| `Sous-Module(s) (ancien)` | `submodule_id` | Lookup par nom | Optionnel |
| `Canal` | `canal` | Mapping canal | Voir section Canaux |
| `Priorité` | `priority` | Mapping priorité | Voir section Priorités |

#### ❓ **Champs à décider**

| Champ CSV | Proposition | Question |
|-----------|-------------|----------|
| `Type de ticket` = "Interaction" | → `ASSISTANCE` | ✅ Valider ? |
| `Sens` (Entrant/Sortant) | **Ignorer** (pas dans schéma) | ✅ Valider ? |
| `Durée (en min)` | **Ignorer** (pas dans schéma) | ✅ Valider ? |
| `Action menée` | **Ajouter à description** | ✅ Valider ? |
| `Objet principal` = "Assistance" | **Ignorer** (redondant avec type) | ✅ Valider ? |
| `Date d'enregistrement` | **Utiliser `created_at`** (si "Création" vide) | ✅ Valider ? |

---

## 🔄 Mapping Détaillé

### 1. Type de Ticket

**CSV:** `Type de ticket` = "Interaction"  
**Supabase:** `ticket_type` = `ASSISTANCE`

✅ **Proposition:** Mapper "Interaction" → `ASSISTANCE`

---

### 2. Statuts

**CSV:** `État` = "Terminé" (ou "Terminé" avec encodage)  
**Supabase:** `status` (TEXT, accepte valeurs dynamiques)

**Valeurs identifiées:**
- `Terminé`
- `Terminé` (avec problème d'encodage)

✅ **Proposition:** 
- "Terminé" → `Resolue` (enum standard) ou conserver "Terminé" (statut JIRA dynamique)
- **Question:** Préférer l'enum `Resolue` ou conserver le statut JIRA "Terminé" ?

---

### 3. Modules

**CSV:** Finance, RH, Opérations, Projets, Support, CRM, Paiement, Global  
**Supabase:** Modules existants (lookup par nom)

✅ **Proposition:** 
- Rechercher le module par nom (UPPER(TRIM(name)))
- Si non trouvé → utiliser le module "Global" (ID: `98ce1c5f-e53c-4baf-9af1-52255d499378`)
- **Question:** Créer les modules manquants ou tout mapper vers "Global" ?

**Modules identifiés:**
- `Finance` → Module Finance
- `RH` → Module RH
- `Opérations` → Module Opérations (si existe)
- `Projets` → Module Projets (si existe)
- `Support` → Module Support (si existe)
- `CRM` → Module CRM (si existe)
- `Paiement` → Module Paiement (si existe)
- `Global` → Module Global

---

### 4. Canaux

**CSV:** Appel Téléphonique, Online (Google Meet, Teams...), Chat WhatsApp, Appel WhatsApp, En présentiel, E-mail, Chat SMS, Non renseigné, Opérations - Vente, Appel Téléphonique - BIS

**Supabase:** Enum `canal_t` avec valeurs: `Whatsapp`, `Email`, `Appel`, `Autre`, `Appel Téléphonique`, `Appel WhatsApp`, `Chat SMS`, `Chat WhatsApp`, `Constat Interne`, `E-mail`, `En présentiel`, `Non enregistré`, `Online (Google Meet, Teams...)`

✅ **Proposition de mapping:**

| Canal CSV | Canal Supabase | Notes |
|-----------|----------------|-------|
| `Appel Téléphonique` | `Appel Téléphonique` | Direct |
| `Appel Téléphonique - BIS` | `Appel Téléphonique` | Normaliser |
| `Appel Téléphonique` (encodage) | `Appel Téléphonique` | Normaliser |
| `Appel WhatsApp` | `Appel WhatsApp` | Direct |
| `Chat WhatsApp` | `Chat WhatsApp` | Direct |
| `Chat SMS` | `Chat SMS` | Direct |
| `E-mail` | `E-mail` | Direct |
| `En présentiel` | `En présentiel` | Direct |
| `Online (Google Meet, Teams...)` | `Online (Google Meet, Teams...)` | Direct |
| `Non renseigné` | `Autre` | Par défaut |
| `Opérations - Vente` | `Autre` | Par défaut |

**Question:** Valider ce mapping ?

---

### 5. Priorités

**CSV:** `Priorité 3` (ou avec problème d'encodage)  
**Supabase:** Enum `priority_t`: `Low`, `Medium`, `High`, `Critical`

✅ **Proposition:**
- "Priorité 3" → `Low` (priorité la plus basse)
- **Question:** Confirmer ce mapping ou utiliser une autre priorité ?

**Alternatives possibles:**
- "Priorité 3" → `Medium`
- "Priorité 3" → `High`

---

### 6. Entreprises (Clients)

**CSV:** Tous les tickets ont un client spécifique (ARIC, 2AAZ, KOFFI & DIABATE, etc.)  
**Supabase:** `company_id` (UUID), `affects_all_companies` (boolean)

✅ **Proposition:**
- `affects_all_companies = false` (tous les tickets d'assistance sont pour des entreprises spécifiques)
- `company_id` = Lookup par nom d'entreprise (UPPER(TRIM(name)))
- Si entreprise non trouvée → `company_id = NULL` et log d'avertissement

**Question:** Valider cette approche ?

---

### 7. Contact Utilisateur (Interlocuteur)

**CSV:** `Interlocuteur` (ex: "Tapé Thibault Julien")  
**Supabase:** `contact_user_id` (UUID)

✅ **Proposition:**
- Rechercher dans `profiles` par `full_name` (UPPER(TRIM(full_name)))
- Si non trouvé → `contact_user_id = NULL`
- **Pas de filtre par rôle** (comme pour les autres tickets)

**Question:** Valider cette approche ?

---

### 8. Sous-Modules

**CSV:** `Sous-Module(s) (ancien)` (ex: "Comptabilité Générale", "Salaire")  
**Supabase:** `submodule_id` (UUID)

✅ **Proposition:**
- Si sous-module renseigné → Rechercher dans `submodules` par nom (UPPER(TRIM(name))) et `module_id`
- Si non trouvé → `submodule_id = NULL`
- **Optionnel** (peut être ignoré si trop complexe)

**Question:** Utiliser ce champ ou l'ignorer ?

---

### 9. Dates

**CSV:** 
- `Création` (ex: "20/juil./25 16:22")
- `Mise à jour` (ex: "20/juil./25 16:22")
- `Date d'enregistrement` (ex: "16/juil./25 00:00")

✅ **Proposition:**
- `created_at` = Parse "Création" (ou "Date d'enregistrement" si "Création" vide)
- `updated_at` = Parse "Mise à jour" (ou `created_at` si vide)
- `resolved_at` = `NULL` (pas de date de résolution dans le CSV)

**Question:** Valider cette logique ?

---

### 10. Origine

**Supabase:** `origin` (enum `origin_t`: `supabase` | `jira`)

✅ **Proposition:**
- `origin = 'jira'` (tous les tickets viennent de JIRA)

**Question:** Valider ?

---

## 🚫 Champs à Ignorer

### Champ "Sens" (Entrant/Sortant)
- **Raison:** Pas dans le schéma Supabase actuel
- **Impact:** Aucun (information non critique)

### Champ "Durée" (en minutes)
- **Raison:** Pas dans le schéma Supabase actuel
- **Impact:** Aucun (information non critique)

### Champ "Action menée"
- **Raison:** Peut être ajouté à la description si nécessaire
- **Proposition:** Ajouter à la description: `description + "\n\nAction menée: " + action_menee`

### Champ "Objet principal" = "Assistance"
- **Raison:** Redondant avec `ticket_type = ASSISTANCE`
- **Impact:** Aucun

---

## 📝 Règles de Synchronisation

### 1. UPSERT Logic
- **Clé unique:** `jira_issue_key` (OBCS-XXXXX)
- **Comportement:** 
  - Si ticket existe → UPDATE
  - Si ticket n'existe pas → INSERT

### 2. Gestion des Erreurs
- **Entreprise non trouvée:** `company_id = NULL`, log d'avertissement
- **Contact utilisateur non trouvé:** `contact_user_id = NULL`, pas d'erreur
- **Rapporteur non trouvé:** `created_by = NULL`, log d'avertissement
- **Module non trouvé:** Utiliser module "Global"

### 3. Valeurs par Défaut
- `affects_all_companies = false`
- `origin = 'jira'`
- `bug_type = NULL` (pas applicable pour ASSISTANCE)
- `submodule_id = NULL` (si non trouvé)
- `feature_id = NULL` (pas dans le CSV)

---

## ❓ Questions de Validation

### Questions Critiques

1. **Type de ticket:** "Interaction" → `ASSISTANCE` ✅ ?
2. **Statut:** "Terminé" → `Resolue` ou conserver "Terminé" ?
3. **Priorité:** "Priorité 3" → `Low` ✅ ?
4. **Entreprises:** `affects_all_companies = false` pour tous ✅ ?
5. **Champs à ignorer:** Sens, Durée, Action menée → OK ✅ ?

### Questions Optionnelles

6. **Sous-modules:** Utiliser le champ "Sous-Module(s) (ancien)" ou l'ignorer ?
7. **Modules manquants:** Créer les modules ou mapper vers "Global" ?
8. **Action menée:** Ajouter à la description ou ignorer ?
9. **Date d'enregistrement:** Utiliser comme fallback pour `created_at` ?

---

## 🎯 Plan d'Action

### Phase 1: Validation (Maintenant)
- ✅ Répondre aux questions ci-dessus
- ✅ Valider le mapping proposé

### Phase 2: Script de Synchronisation
- Créer `scripts/sync-assistance-tickets-from-google-sheet.mjs`
- Implémenter le mapping validé
- Gérer les cas d'erreur

### Phase 3: Génération SQL
- Générer la migration SQL
- Tester sur un échantillon de tickets

### Phase 4: Application
- Appliquer la migration (web interface ou CLI selon la taille)
- Vérifier les résultats

---

## 📊 Statistiques Attendues

- **Total de tickets:** 5308
- **Tickets avec entreprise:** ~5308 (100%)
- **Tickets avec contact:** ~5308 (100%)
- **Tickets avec rapporteur:** ~5308 (100%)
- **Taille estimée du fichier SQL:** ~2-3 MB (5308 tickets)

---

## ✅ Checklist de Validation

- [ ] Type de ticket: "Interaction" → `ASSISTANCE`
- [ ] Statut: "Terminé" → `Resolue` ou "Terminé"
- [ ] Priorité: "Priorité 3" → `Low`
- [ ] Entreprises: `affects_all_companies = false`
- [ ] Canaux: Mapping validé
- [ ] Modules: Mapping validé
- [ ] Champs à ignorer: Sens, Durée, Action menée
- [ ] Contact utilisateur: Lookup sans filtre de rôle
- [ ] Dates: Logique validée
- [ ] Origine: `origin = 'jira'`

---

**Prêt pour validation !** 🚀












