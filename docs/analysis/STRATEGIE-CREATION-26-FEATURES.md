# Stratégie de Création des 26 Features Restantes

**Date**: 2025-01-18  
**Objectif**: Créer les 26 features restantes et leurs mappings Jira → Supabase

---

## 1. Stratégie de Création

### 1.1. Principe de Base

Les features seront créées **en fonction de** :

1. **Format Jira** : `Module - Feature` ou `Module - SubModule - Feature`
2. **Structure Supabase existante** : Modules et submodules déjà créés
3. **Logique métier** : Association logique entre feature et submodule

### 1.2. Règles de Création

#### Règle 1 : Format "Module - Feature"
- **Exemple** : "CRM - Analytique"
- **Action** :
  1. Trouver le module "CRM" dans Supabase
  2. Chercher un submodule existant correspondant (ex: "Analytique")
  3. Si submodule existe → Créer feature dans ce submodule
  4. Si submodule n'existe pas → Créer submodule avec le nom de la feature, puis créer la feature

#### Règle 2 : Format "Module - SubModule - Feature"
- **Exemple** : "Opérations - Dashboard - Parc Auto"
- **Action** :
  1. Trouver le module "Opérations"
  2. Chercher le submodule "Dashboard" (ou créer s'il n'existe pas)
  3. Créer la feature "Parc Auto" dans ce submodule

#### Règle 3 : Format simple (sans module)
- **Exemple** : "GED"
- **Action** :
  1. Créer dans un module générique (ex: Opérations → Général)
  2. Créer la feature avec le nom complet

### 1.3. Priorisation

Les features seront créées par **ordre de priorité** (nombre de tickets) :

1. **Priorité HAUTE** (30+ tickets) : 3 features
2. **Priorité MOYENNE** (10-29 tickets) : 8 features
3. **Priorité BASSE** (1-9 tickets) : 15 features

---

## 2. Détail par Feature

### 2.1. Priorité HAUTE (3 features)

#### 1. Paramétrage admin. système - Workflow (34 tickets)
- **Module** : "Paramétrage admin. système" (à vérifier/créer)
- **Submodule** : "Workflow" (à créer)
- **Feature** : "Workflow"

#### 2. CRM - Analytique (29 tickets)
- **Module** : "CRM" ✅ (existe)
- **Submodule** : "Analytique" (à créer)
- **Feature** : "Analytique"

#### 3. Paramétrage admin. système - Paramétrage sur fonctionnalités (28 tickets)
- **Module** : "Paramétrage admin. système" (à vérifier/créer)
- **Submodule** : "Paramétrage sur fonctionnalités" (à créer)
- **Feature** : "Paramétrage sur fonctionnalités"

### 2.2. Priorité MOYENNE (8 features)

#### 4. Opérations - Parc automobile (26 tickets)
- **Module** : "Opérations" ✅ (existe)
- **Submodule** : "Parc automobile" (à créer)
- **Feature** : "Parc automobile"

#### 5. CRM - Paramétrage (20 tickets)
- **Module** : "CRM" ✅ (existe)
- **Submodule** : "Paramétrage" (à créer)
- **Feature** : "Paramétrage"

#### 6. Paramétrage admin. système - Autres admin. système (17 tickets)
- **Module** : "Paramétrage admin. système" (à vérifier/créer)
- **Submodule** : "Autres admin. système" (à créer)
- **Feature** : "Autres admin. système"

#### 7. Paiement - Centre de paiement (16 tickets)
- **Module** : "Paiement" ✅ (existe)
- **Submodule** : "Centre de paiement" ✅ (existe)
- **Feature** : "Centre de paiement"

#### 8. Opérations - Production (16 tickets)
- **Module** : "Opérations" ✅ (existe)
- **Submodule** : "Production" (à créer)
- **Feature** : "Production"

#### 9. Paramétrage admin. système - Gestion des utilisateurs (14 tickets)
- **Module** : "Paramétrage admin. système" (à vérifier/créer)
- **Submodule** : "Gestion des utilisateurs" (à créer)
- **Feature** : "Gestion des utilisateurs"

#### 10. Paramétrage admin. système - Dashboard Global (12 tickets)
- **Module** : "Paramétrage admin. système" (à vérifier/créer)
- **Submodule** : "Dashboard Global" (à créer)
- **Feature** : "Dashboard Global"

#### 11. Projets - Paramétrage (5 tickets)
- **Module** : "Projets" ✅ (existe)
- **Submodule** : "Paramétrage" (à créer)
- **Feature** : "Paramétrage"

### 2.3. Priorité BASSE (15 features)

#### 12-26. Features avec 1-6 tickets
- **Modules** : RH, Finance, Opérations, Paiement ✅ (existent)
- **Submodules** : À créer selon le nom de la feature
- **Features** : Dashboard, Paiement, Evaluation, Recrutement, Formation, etc.

### 2.4. Cas Spécial

#### 27. GED (2 tickets)
- **Module** : "Opérations" ✅ (existe)
- **Submodule** : "Général" ✅ (existe - créé pour OBC)
- **Feature** : "GED"

---

## 3. Gestion du Module "Paramétrage admin. système"

### 3.1. Vérification

Si le module "Paramétrage admin. système" n'existe pas :
- **Option 1** : Créer le module dans OBC
- **Option 2** : Utiliser le module "Global" existant
- **Option 3** : Créer un module "Administration" ou "Paramétrage"

### 3.2. Décision

**Utiliser le module "Global" existant** pour toutes les features "Paramétrage admin. système" car :
- Le module "Global" existe déjà dans OBC
- Il semble être le module approprié pour les fonctionnalités administratives globales

---

## 4. Structure de Création

### 4.1. Ordre d'Exécution

1. **Vérifier/Créer les modules manquants**
2. **Vérifier/Créer les submodules manquants**
3. **Créer les features**
4. **Créer les mappings Jira → Supabase**

### 4.2. Gestion des Doublons

- Vérifier si la feature existe déjà avant de créer
- Vérifier si le submodule existe déjà avant de créer
- Utiliser `ON CONFLICT DO NOTHING` pour éviter les erreurs

---

## 5. Résultat Attendu

- **26 features créées**
- **26 mappings créés**
- **Tous les tickets Jira mappables** (sauf cas spéciaux)

---

## 6. Script de Création

Le script `scripts/create-remaining-26-features.js` sera créé pour automatiser cette création.

