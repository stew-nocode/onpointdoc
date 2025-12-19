# Analyse du Google Sheet - Tickets à Impact Global

**Date:** 2025-12-09
**Source:** https://docs.google.com/spreadsheets/d/1cZ5vXr6vkNC3JeXPFDFyWUA3qPqAqqfa9X7MYDVtXMM/edit?gid=1192006101#gid=1192006101

## 📊 Statistiques Générales

- **Total tickets:** 41
- **Tickets avec "ALL":** 41
- **Tickets avec autres entreprises:** 0

## 🏢 Entreprises

- ALL

## 📋 Colonnes Identifiées

- **jiraIssueKey**: Colonne 1 - "Clé Ticket IT"
- **title**: Colonne 2 - "Résumé"
- **description**: Colonne 3 - "Description"
- **ticketType**: Colonne 12 - "Type_Ticket"
- **priority**: Colonne 18 - "Priorité"
- **canal**: Colonne 8 - "Canal"
- **status**: Colonne 19 - "Etat"
- **module**: Colonne 10 - "Module"
- **submodule**: Colonne 11 - "Sous-Module(s)"
- **feature**: Colonne 32 - "ID Fonctionnalités"
- **bugType**: Colonne 13 - "Type de bug"
- **reporter**: Colonne 4 - "Rapporteur"
- **users**: Colonne 7 - "Utilisateurs"
- **company**: Colonne 5 - "Entreprises"
- **createdAt**: Colonne 23 - "Date de creation de Jira"
- **updatedAt**: Colonne 24 - "Date de mise à jour Jira"
- **resolvedAt**: Colonne 25 - "Date de résolution"

## 🔍 Valeurs Uniques

### Statuts
- En cours
- Terminé(e)
- À faire

### Priorités
- Priorité 1
- Priorité 2
- Priorité 3
- Priorité 4

### Canaux
- Constat Interne
- En présentiel

### Types de Tickets
- Bug

## ⚠️ Questions à Clarifier

1. **Tous les tickets doivent-ils avoir affects_all_companies = true ?**
   - Si oui, tous les tickets doivent avoir company_id = NULL
   - Les tickets avec d'autres entreprises que "ALL" doivent-ils être ignorés ?

2. **Module Global:**
   - Tous les tickets doivent-ils utiliser le module "Global" existant ?
   - submodule_id = NULL et feature_id = NULL ?

3. **Mapping des statuts:**
   - Utiliser les statuts JIRA dynamiques (comme pour le fichier précédent) ?

4. **Utilisateurs contact:**
   - Si le champ "Utilisateurs" est vide, contact_user_id = NULL ?
   - Recherche par nom uniquement (sans filtre de rôle) ?

5. **Dates:**
   - Format des dates dans le CSV ? (ISO ou format français)
   - Gérer les conflits avec les dates JIRA existantes ?

## 📝 Exemples de Tickets


### Ticket 1
- **Clé JIRA:** OD-715
- **Titre:** Impossible d’enregistrer une opportunité dans une nouvelle base
- **Entreprise:** ALL


### Ticket 2
- **Clé JIRA:** OD-714
- **Titre:** Empêcher l'enregistrement des opportunités avec des erreurs : Faire agir le roll back en amont
- **Entreprise:** ALL


### Ticket 3
- **Clé JIRA:** OD-2780
- **Titre:** Server Error in '/' Application.
- **Entreprise:** ALL


### Ticket 4
- **Clé JIRA:** OD-2771
- **Titre:** Impossible de poursuivre le paramétrage d'une entreprise à partir de l'interface principal OBC
- **Entreprise:** ALL


### Ticket 5
- **Clé JIRA:** OD-2765
- **Titre:** Impossible de créer une entité - Un message d'erreur affiche
- **Entreprise:** ALL

