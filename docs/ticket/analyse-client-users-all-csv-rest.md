# Analyse du fichier client-users-all.csv - rest.csv

## 📊 Résumé

**Fichier** : `docs/ticket/client-users-all.csv - rest.csv`  
**Total de tickets** : **1462 tickets**  
**⚠️ IMPORTANT** : Tous les tickets concernent **TOUTES les entreprises** (portée globale)

## 🔑 Différence importante avec le fichier "All"

### Clés de tickets
- ✅ **Tous les tickets ont les DEUX clés** :
  - "Clé de ticket" (OBCS-XXXXX) : 1462 tickets
  - "Clé Ticket IT" (OD-XXXX) : 1462 tickets
- ✅ **100% de correspondance** : Chaque ticket a les deux clés

### Entreprises
- ⚠️ **Différence observée** : Les tickets ont des entreprises spécifiques (ARIC, SIT BTP, KOFFI & DIABATE, etc.)
- ❓ **Question** : Même si l'entreprise est spécifiée, faut-il mettre `affects_all_companies = true` pour tous ?

## 📈 Statistiques

- **Tickets uniques** : 1462
- **Rapporteurs uniques** : 7 (tous les tickets ont un rapporteur)
- **Utilisateurs clients uniques** : 167 (951 tickets avec utilisateur)
- **Modules uniques** : 8 (CRM, Finance, Global, Opérations, Paiement, Projets, RH, Support)
- **Sous-modules uniques** : 36
- **Types de tickets** : Bug, Requêtes
- **États** : En cours, Terminé(e), À faire
- **Priorités** : Priorité 1, Priorité 2, Priorité 3, Priorité 4

### Tickets avec "Global"
- **Module = "Global"** : 81 tickets
- **Sous-Module = "Global"** : 79 tickets
- **Fonctionnalité = "Global"** : 71 tickets

## ❓ Questions à clarifier

### 1. Entreprises spécifiques vs portée globale
**Observation** : Les tickets ont des entreprises spécifiques (ARIC, SIT BTP, etc.) au lieu de "ALL"

**Question** : Même si l'entreprise est spécifiée dans le CSV, faut-il :
- **Option A** : Mettre `affects_all_companies = true` et `company_id = NULL` (portée globale)
- **Option B** : Mapper l'entreprise spécifique → `company_id` et `affects_all_companies = false`
- **Option C** : Mapper l'entreprise spécifique → `company_id` mais garder `affects_all_companies = true`

**Recommandation** : Option A (comme pour le fichier "All") car vous avez dit que tous concernent toutes les entreprises.

---

### 2. Utilisateurs clients
**Observation** : 951 tickets (65%) ont un utilisateur client spécifique

**Question** : Faut-il :
- Rechercher ces utilisateurs par nom dans `profiles` (role = 'client')
- Les lier via `contact_user_id`
- Ou les ignorer ?

**Recommandation** : Rechercher et lier (comme décidé précédemment).

---

### 3. Clé JIRA à utiliser
**Observation** : Tous les tickets ont les deux clés (OBCS-XXXXX et OD-XXXX)

**Question** : Utiliser "Clé Ticket IT" (OD-XXXX) comme `jira_issue_key` comme pour le premier fichier ?

**Recommandation** : Oui, utiliser OD-XXXX (cohérence avec le premier fichier).

---

### 4. Autres points
- ✅ Module Global : Utiliser le module existant, `submodule_id = NULL` si Global
- ✅ Priorités : Priorité 1→Critical, 2→High, 3→Medium, 4→Low
- ✅ Statuts : Conserver les statuts JIRA dynamiques
- ✅ Canal : Défaut "Autre" si non trouvé
- ✅ Dates : Formats ISO et français supportés
- ✅ UPSERT : Mettre à jour si existe, créer sinon

## 📋 Comparaison avec le fichier "All"

| Critère | Fichier "All" | Fichier "rest" |
|---------|---------------|----------------|
| Nombre de tickets | 137 | 1462 |
| Clés OBCS- | ~416 uniques | 1462 (tous) |
| Clés OD- | 137 | 1462 (tous) |
| Entreprises | "ALL" | Entreprises spécifiques |
| Utilisateurs clients | 6 tickets | 951 tickets |
| Module Global | 3 tickets | 81 tickets |

## ✅ Prêt pour la génération

Une fois les questions clarifiées, je peux générer le script de migration pour les 1462 tickets restants.






