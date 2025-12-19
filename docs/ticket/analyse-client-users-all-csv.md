# Analyse du fichier client-users-all.csv

## 📋 Structure du fichier

**Fichier** : `docs/ticket/client-users-all.csv - All.csv`  
**Total de lignes** : ~443 lignes complètes (après reconstruction des champs multi-lignes)

### Colonnes identifiées (20 colonnes)

1. **Clé de ticket** - Clé JIRA (ex: OBCS-11496)
2. **Clé Ticket IT** - Clé interne (ex: OD-2953)
3. **Résumé** - Titre du ticket
4. **Description** - Description détaillée (peut contenir des retours à la ligne)
5. **Rapporteur** - Nom de la personne qui a créé le ticket
6. **Utilisateurs** - Utilisateur client concerné
7. **Entreprises** - Entreprise(s) concernée(s) (souvent "ALL")
8. **Equipe** - Équipe assignée
9. **Canal** - Canal de communication (Constat Interne, En présentiel, etc.)
10. **Module** - Module concerné (peut être "Global")
11. **Sous-Module(s)** - Sous-module concerné (peut être "Global")
12. **Type_Ticket** - Type (Bug, Requêtes)
13. **Type de bug** - Type spécifique de bug (si applicable)
14. **Projet** - Projet JIRA (ex: OBC Customer Support)
15. **Priorité** - Priorité JIRA (Priorité 1, Priorité 2, etc.)
16. **Etat** - État du ticket (En cours, Terminé(e), À faire)
17. **Date de creation de Jira** - Date de création
18. **Date de mise à jour Jira** - Date de dernière mise à jour
19. **Date de résolution** - Date de résolution (si résolu)
20. **Fonctionnalité** - Fonctionnalité concernée (peut être "Global")

## 🔍 Observations importantes

### Tickets avec "Global"
- **Module = "Global"** : ~3-8 tickets
- **Sous-Module = "Global"** : ~3-8 tickets
- **Fonctionnalité = "Global"** : présent dans certains tickets

### Entreprises
- **"ALL"** : ~75-97 tickets concernent toutes les entreprises
- **Entreprises spécifiques** : ~4 tickets avec entreprise spécifique
- Ces tickets doivent probablement avoir `affects_all_companies = true` dans Supabase

### Utilisateurs
- **Rapporteurs uniques** : ~10
- **Utilisateurs clients** : ~4-8 (peu renseignés)
- La plupart des tickets n'ont pas d'utilisateur client spécifique

### Modules identifiés
- CRM
- Finance
- Global
- Opérations
- RH
- Support
- Projets

## 🎯 Champs à mettre à jour dans Supabase

Basé sur la structure de la table `tickets`, voici les champs qui pourraient être mis à jour :

### Champs principaux
1. **`jira_issue_key`** ← "Clé de ticket" (OBCS-XXXXX)
2. **`title`** ← "Résumé"
3. **`description`** ← "Description"
4. **`ticket_type`** ← "Type_Ticket" (BUG, REQ, ASSISTANCE)
5. **`priority`** ← "Priorité" (mapping Priorité 1 → High, etc.)
6. **`status`** ← "Etat" (mapping JIRA → Supabase)
7. **`canal`** ← "Canal"
8. **`bug_type`** ← "Type de bug" (si applicable)
9. **`affects_all_companies`** ← true si "Entreprises" = "ALL"
10. **`company_id`** ← ID de l'entreprise si spécifique (non-ALL)
11. **`contact_user_id`** ← ID du profil utilisateur si "Utilisateurs" renseigné
12. **`created_by`** ← ID du profil rapporteur si "Rapporteur" renseigné
13. **`resolved_at`** ← "Date de résolution" (si renseignée)
14. **`updated_at`** ← "Date de mise à jour Jira"

### Champs de structure produit
15. **`module_id`** ← Mapping "Module" → UUID (NULL si "Global")
16. **`submodule_id`** ← Mapping "Sous-Module(s)" → UUID (NULL si "Global")
17. **`feature_id`** ← Mapping "Fonctionnalité" → UUID (NULL si "Global" ou vide)

### Champs JIRA
18. **`jira_metadata`** ← Stocker les métadonnées JIRA supplémentaires
19. **`workflow_status`** ← "Etat" (statut workflow JIRA)
20. **`resolution`** ← Résolution JIRA (si terminé)

## ⚠️ Points d'attention

1. **Module/Sous-Module "Global"** : 
   - Ces tickets doivent avoir `module_id = NULL` et `submodule_id = NULL`
   - Ils concernent potentiellement tous les modules

2. **Entreprises "ALL"** :
   - Doit avoir `affects_all_companies = true`
   - `company_id` peut être NULL ou pointer vers l'entreprise signalante

3. **Parsing CSV complexe** :
   - Les descriptions contiennent des retours à la ligne
   - Nécessite un parser CSV robuste qui gère les guillemets et retours à la ligne

4. **Mapping des noms** :
   - "Rapporteur" → `created_by` (profil utilisateur)
   - "Utilisateurs" → `contact_user_id` (profil client)
   - "Entreprises" → `company_id` (table companies)

5. **Dates** :
   - Format à vérifier (ex: "2025-10-24 09:34" vs "3/11/2025 11:30")
   - Conversion nécessaire pour PostgreSQL timestamptz

## 📝 Prochaines étapes

1. ✅ **Analyse terminée** - Structure du fichier comprise
2. ⏳ **Clarification nécessaire** - Attendre confirmation de l'utilisateur
3. ⏳ **Création du script de mise à jour** - Une fois les clarifications faites
4. ⏳ **Application de la migration** - Via MCP Supabase

