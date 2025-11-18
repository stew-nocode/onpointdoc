# Analyse des 26 Fonctionnalités Restantes Sans Mapping

**Date**: 2025-01-18  
**Contexte**: Après résolution du cas "OBC", 26 fonctionnalités Jira restent sans mapping  
**Question**: Ont-elles le même problème qu'OBC (produit utilisé comme feature) ?

---

## 1. Comparaison avec le Cas "OBC"

### 1.1. Problème d'OBC

- **OBC** = **PRODUIT** dans Supabase
- Utilisé comme **feature** dans Jira (`customfield_10052 = "OBC"`)
- **Problème** : Impossible de mapper un produit directement vers `tickets.feature_id`
- **Solution** : Feature générique créée dans Opérations → Général

### 1.2. Les 26 Fonctionnalités Restantes

Analyse de la liste pour identifier des cas similaires :

---

## 2. Analyse par Catégorie

### 2.1. Fonctionnalités Normales (Pas de Problème Structurel)

Ces fonctionnalités suivent le format `Module - Feature` et sont des features normales qui n'ont simplement pas été créées/mappées dans Supabase :

1. ✅ **Paramétrage admin. système - Workflow** (34 tickets)
   - Format : `Module - Feature` ✅
   - Problème : Feature non créée dans Supabase
   - Solution : Créer la feature dans le module "Paramétrage admin. système"

2. ✅ **CRM - Analytique** (29 tickets)
   - Format : `Module - Feature` ✅
   - ⚠️ **Feature créée mais mapping non trouvé** (problème différent)
   - Solution : Vérifier pourquoi le mapping n'a pas été créé

3. ✅ **Paramétrage admin. système - Paramétrage sur fonctionnalités** (28 tickets)
   - Format : `Module - Feature` ✅
   - Problème : Feature non créée
   - Solution : Créer la feature

4. ✅ **Opérations - Parc automobile** (26 tickets)
   - Format : `Module - Feature` ✅
   - Problème : Feature non créée
   - Solution : Créer la feature dans Opérations → Parc automobile (ou créer le submodule)

5. ✅ **CRM - Paramétrage** (20 tickets)
   - Format : `Module - Feature` ✅
   - ⚠️ **Feature créée mais mapping non trouvé** (problème différent)
   - Solution : Vérifier pourquoi le mapping n'a pas été créé

6. ✅ **Paramétrage admin. système - Autres admin. système** (17 tickets)
   - Format : `Module - Feature` ✅
   - Problème : Feature non créée
   - Solution : Créer la feature

7. ✅ **Paiement - Centre de paiement** (16 tickets)
   - Format : `Module - Feature` ✅
   - Problème : Feature non créée
   - Solution : Créer la feature dans Paiement → Centre de paiement

8. ✅ **Opérations - Production** (16 tickets)
   - Format : `Module - Feature` ✅
   - Problème : Feature non créée
   - Solution : Créer la feature

9. ✅ **Paramétrage admin. système - Gestion des utilisateurs** (14 tickets)
   - Format : `Module - Feature` ✅
   - Problème : Feature non créée
   - Solution : Créer la feature

10. ✅ **Paramétrage admin. système - Dashboard Global** (12 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

11. ✅ **RH - Dashboard** (6 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

12. ✅ **Opérations - Dashboard** (4 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

13. ✅ **Finance - Paiement** (4 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

14. ✅ **Opérations - Dashboard - Parc Auto** (3 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

15. ✅ **Opérations - Paramétrage - Parc Auto** (3 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

16. ✅ **RH - Evaluation** (3 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

17. ✅ **Finance - Dashboard** (2 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

18. ✅ **Opérations - Processus métier** (2 tickets)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

19. ✅ **Paramétrage admin. système - Gestion des administrateurs** (1 ticket)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

20. ✅ **Paiement - Dashboard** (1 ticket)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

21. ✅ **Paiement - Point de paiement** (1 ticket)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

22. ✅ **Opérations - Paramétrage** (1 ticket)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

23. ✅ **RH - Recrutement** (1 ticket)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

24. ✅ **RH - Formation** (1 ticket)
    - Format : `Module - Feature` ✅
    - Problème : Feature non créée
    - Solution : Créer la feature

25. ✅ **Projets - Paramétrage** (5 tickets)
    - Format : `Module - Feature` ✅
    - ⚠️ **Feature créée mais mapping non trouvé** (problème différent)
    - Solution : Vérifier pourquoi le mapping n'a pas été créé

### 2.2. Cas Spéciaux à Vérifier

26. ⚠️ **GED** (2 tickets)
    - Format : **Pas de format `Module - Feature`** ⚠️
    - **Vérification** : "GED" n'existe PAS comme produit ou module dans Supabase
    - **Conclusion** : Probablement une feature générique ou un module non créé
    - **Solution** : 
      - Option 1 : Créer un module "GED" et une feature générique
      - Option 2 : Créer une feature "GED" dans un module existant (ex: Opérations → Général, comme OBC)

---

## 3. Conclusion

### 3.1. Différence avec OBC

**Non, les 26 autres fonctionnalités n'ont PAS le même problème qu'OBC.**

- **OBC** : Produit utilisé comme feature → Problème structurel
- **Les 26 autres** : Features normales non créées/mappées → Problème de création/mapping

### 3.2. Types de Problèmes Identifiés

1. **Features non créées** (23 fonctionnalités)
   - Format correct : `Module - Feature`
   - Solution : Créer les features dans Supabase

2. **Features créées mais mapping non trouvé** (3 fonctionnalités)
   - **CRM - Analytique** (29 tickets)
     - Feature "Analytique" existe dans **Projets**, pas CRM
     - Le script cherche "Analytique" dans CRM → Non trouvé
     - Solution : Créer feature "Analytique" dans CRM OU créer mapping manuel vers Projets
   
   - **CRM - Paramétrage** (20 tickets)
     - Features "Paramétrage" existent dans **Finance** et **RH**, pas CRM
     - Le script cherche "Paramétrage" dans CRM → Non trouvé
     - Solution : Créer feature "Paramétrage" dans CRM OU créer mapping manuel
   
   - **Projets - Paramétrage** (5 tickets)
     - Features "Paramétrage" existent dans **Finance** et **RH**, pas Projets
     - Le script cherche "Paramétrage" dans Projets → Non trouvé
     - Solution : Créer feature "Paramétrage" dans Projets OU créer mapping manuel

3. **Cas spécial à vérifier** (1 fonctionnalité)
   - **GED** (2 tickets)
     - Format ambigu (pas de "Module - Feature")
     - Vérifié : N'existe pas comme produit/module dans Supabase
     - Solution : Créer feature "GED" dans un module existant (ex: Opérations → Général)

### 3.3. Actions Recommandées

1. ✅ **Vérifier "GED"** : Est-ce un produit/module/feature ?
2. ✅ **Vérifier les 3 features créées** : Pourquoi les mappings n'ont pas été créés ?
3. ✅ **Créer les 23 features manquantes** : Utiliser le script `create-missing-features.js`
4. ✅ **Créer les mappings** : Utiliser le script `create-jira-feature-mappings.js`

---

## 4. Prochaines Étapes

1. ⏳ Vérifier "GED" dans Supabase
2. ⏳ Analyser pourquoi CRM - Analytique, CRM - Paramétrage, Projets - Paramétrage n'ont pas été mappés
3. ⏳ Créer les 23 features manquantes (priorité par nombre de tickets)
4. ⏳ Créer les mappings pour toutes les features

---

**Note** : Contrairement à OBC, ces fonctionnalités suivent la structure normale `Module - Feature` et peuvent être créées/mappées de manière standard.

