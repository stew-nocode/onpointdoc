# Analyse finale du fichier client-users-all.csv

## 📋 Informations générales

**Fichier** : `docs/ticket/client-users-all.csv - All.csv`  
**Total de tickets** : ~442 tickets  
**⚠️ IMPORTANT** : Tous les tickets concernent **TOUTES les entreprises** (portée globale)

## 🎯 Structure du fichier

### Colonnes identifiées (20 colonnes)

1. **Clé de ticket** - Clé JIRA (ex: OBCS-11496)
2. **Clé Ticket IT** - Clé interne (ex: OD-2953)
3. **Résumé** - Titre du ticket
4. **Description** - Description détaillée (multi-lignes)
5. **Rapporteur** - Nom de la personne qui a créé le ticket
6. **Utilisateurs** - Utilisateur client concerné (optionnel)
7. **Entreprises** - Toujours "ALL" (portée globale)
8. **Equipe** - Équipe assignée
9. **Canal** - Canal de communication
10. **Module** - Module concerné (peut être "Global")
11. **Sous-Module(s)** - Sous-module concerné (peut être "Global")
12. **Type_Ticket** - Type (Bug, Requêtes)
13. **Type de bug** - Type spécifique de bug (si applicable)
14. **Projet** - Projet JIRA
15. **Priorité** - Priorité JIRA
16. **Etat** - État du ticket
17. **Date de creation de Jira** - Date de création
18. **Date de mise à jour Jira** - Date de dernière mise à jour
19. **Date de résolution** - Date de résolution (si résolu)
20. **Fonctionnalité** - Fonctionnalité concernée (peut être "Global")

## 📊 Statistiques

- **Tickets uniques** : ~416
- **Rapporteurs uniques** : ~10 (82 tickets avec rapporteur)
- **Utilisateurs clients uniques** : ~4 (6 tickets avec utilisateur)
- **Modules uniques** : 9 (CRM, Finance, Global, Opérations, RH, Support, etc.)
- **Sous-modules uniques** : ~23
- **Types de tickets** : Bug, Requêtes
- **États** : En cours, Terminé(e), À faire
- **Priorités** : Priorité 1, Priorité 2, Priorité 3, Priorité 4
- **Canaux** : Constat Interne, En présentiel, Appel Téléphonique, etc.

### Tickets avec "Global"
- **Module = "Global"** : ~3 tickets
- **Sous-Module = "Global"** : ~3 tickets
- **Fonctionnalité = "Global"** : ~2 tickets

## ❓ Questions à clarifier avant la mise à jour

### 1. Clé de ticket JIRA
**Question** : Quelle clé utiliser comme `jira_issue_key` dans Supabase ?
- **Option A** : "Clé de ticket" (OBCS-XXXXX) - Clé JIRA principale
- **Option B** : "Clé Ticket IT" (OD-XXXX) - Clé interne
- **Option C** : Les deux (OBCS-XXXXX comme `jira_issue_key`, OD-XXXX dans `jira_metadata`)

**Recommandation** : Option A (OBCS-XXXXX) car c'est la clé JIRA principale

---

### 2. Module/Sous-Module "Global"
**Question** : Comment gérer les tickets avec Module = "Global" ou Sous-Module = "Global" ?
- **Option A** : Utiliser le module "Global" existant dans Supabase (ID: `98ce1c5f-e53c-4baf-9af1-52255d499378`)
- **Option B** : Mettre `module_id = NULL` et `submodule_id = NULL` (portée vraiment globale)

**Recommandation** : Option A (utiliser le module Global existant) pour cohérence

---

### 3. Mapping des priorités
**Question** : Comment mapper les priorités JIRA vers Supabase ?
- "Priorité 1" → `High` ou `Critical` ?
- "Priorité 2" → `Medium` ?
- "Priorité 3" → `Low` ?
- "Priorité 4" → `Low` ?

**Recommandation** :
- Priorité 1 → `Critical`
- Priorité 2 → `High`
- Priorité 3 → `Medium`
- Priorité 4 → `Low`

---

### 4. Mapping des statuts
**Question** : Comment mapper les statuts JIRA vers Supabase ?

**✅ Recommandation (Statuts JIRA dynamiques)** :
- **"Terminé(e)"** → `Terminé(e)` ✅ **Conserver tel quel** (déjà utilisé 1703 fois dans Supabase)
- **"En cours"** → `Traitement en Cours` (statut JIRA dynamique courant - 19 tickets)
- **"À faire"** → `Sprint Backlog` (statut JIRA dynamique courant - 287 tickets)

**Justification** :
- Le système utilise déjà majoritairement les statuts JIRA dynamiques
- `Terminé(e)` est le statut le plus utilisé (1703 tickets)
- Conserver les statuts JIRA permet la flexibilité et la cohérence avec JIRA

**Alternative (normalisation vers enums)** :
- "En cours" → `En_cours` (enum standard)
- "Terminé(e)" → `Resolue` (enum standard)
- "À faire" → `To_Do` (enum standard)

**Voir** : `docs/ticket/recommandation-mapping-statuts-jira-dynamiques.md` pour les détails

---

### 5. Mapping des types de tickets
**Question** : Comment mapper les types de tickets ?
- "Bug" → `BUG` ?
- "Requêtes" → `REQ` ?

**Recommandation** : Direct (Bug → BUG, Requêtes → REQ)

---

### 6. Rapporteur (created_by)
**Question** : Comment gérer le champ "Rapporteur" ?
- **Option A** : Rechercher par nom complet dans `profiles` et utiliser l'ID trouvé
- **Option B** : Créer un profil si non trouvé
- **Option C** : Laisser `created_by = NULL` si non trouvé

**Recommandation** : Option A (rechercher uniquement, laisser NULL si non trouvé)

---

### 7. Utilisateurs clients (contact_user_id)
**Question** : Comment gérer le champ "Utilisateurs" (utilisateur client) ?
- **Option A** : Rechercher par nom complet dans `profiles` (role = 'client') et utiliser l'ID trouvé
- **Option B** : Créer un profil client si non trouvé
- **Option C** : Laisser `contact_user_id = NULL` si non trouvé (la plupart sont vides)

**Recommandation** : Option A (rechercher uniquement, laisser NULL si non trouvé)

---

### 8. Entreprises (affects_all_companies)
**Question** : Confirmation que tous les tickets doivent avoir `affects_all_companies = true` ?
- **Réponse attendue** : Oui, tous les tickets concernent toutes les entreprises
- **Action** : `affects_all_companies = true` pour tous
- **`company_id`** : NULL ou entreprise signalante ?

**Recommandation** : `affects_all_companies = true`, `company_id = NULL`

---

### 9. Dates
**Question** : Format des dates à normaliser ?
- Format création : "2025-10-24 09:34" (ISO-like)
- Format mise à jour : "3/11/2025 11:30" (format français)
- Format résolution : Variable

**Recommandation** : Parser et convertir tous les formats vers PostgreSQL `timestamptz`

---

### 10. Fonctionnalité "Global"
**Question** : Comment gérer le champ "Fonctionnalité" quand il vaut "Global" ?
- **Option A** : `feature_id = NULL` (pas de fonctionnalité spécifique)
- **Option B** : Créer/rechercher une fonctionnalité "Global"

**Recommandation** : Option A (`feature_id = NULL`)

---

### 11. Canal
**Question** : Mapping des canaux ?
- "Constat Interne" → `Constat_Interne` ?
- "En présentiel" → `En_presentiel` ?
- "Appel Téléphonique" → `Appel_Telephonique` ?

**Recommandation** : Vérifier l'enum `canal` dans Supabase et mapper en conséquence

---

### 12. Type de bug
**Question** : Comment gérer le champ "Type de bug" ?
- **Option A** : Mapper vers l'enum `bug_type` existant
- **Option B** : Stocker dans `jira_metadata` si pas de correspondance

**Recommandation** : Option A (mapper si possible, sinon dans metadata)

---

### 13. Description multi-lignes
**Question** : Les descriptions contiennent du formatage JIRA (h3, *, !image, etc.). Faut-il :
- **Option A** : Conserver tel quel (format JIRA)
- **Option B** : Convertir en Markdown
- **Option C** : Nettoyer le formatage

**Recommandation** : Option A (conserver tel quel pour compatibilité JIRA)

---

### 14. Tickets existants
**Question** : Que faire si un ticket avec la même `jira_issue_key` existe déjà ?
- **Option A** : Mettre à jour le ticket existant
- **Option B** : Ignorer (skip)
- **Option C** : Créer un nouveau ticket (doublon)

**Recommandation** : Option A (UPSERT : mettre à jour si existe, créer sinon)

---

## 📝 Résumé des décisions à prendre

1. ✅ **Tous les tickets** : `affects_all_companies = true`, `company_id = NULL`
2. ❓ **Clé JIRA** : OBCS-XXXXX ou OD-XXXX ?
3. ❓ **Module Global** : Utiliser module existant ou NULL ?
4. ❓ **Priorités** : Mapping Priorité 1-4 → Critical/High/Medium/Low
5. ❓ **Statuts** : Mapping En cours/Terminé(e)/À faire → En_cours/Resolue/To_Do
6. ❓ **Rapporteur/Utilisateurs** : Rechercher uniquement ou créer si absent ?
7. ❓ **Tickets existants** : Mettre à jour ou ignorer ?

---

## 🚀 Prochaines étapes

Une fois les questions clarifiées, je créerai :
1. Un script de parsing CSV robuste
2. Un script de génération SQL pour la migration
3. Une migration Supabase pour mettre à jour les tickets

