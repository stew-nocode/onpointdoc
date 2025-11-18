# Résultats de l'Initialisation des Mappings Fonctionnalités Jira → Supabase

**Date**: 2025-01-18  
**Script**: `scripts/create-jira-feature-mappings.js`

## Vue d'ensemble

- **Tickets Jira analysés** : 1808 tickets avec `customfield_10052`
- **Fonctionnalités uniques identifiées** : 57
- **Features créées** : **16** ✅
- **Total mappings créés** : **30** ✅
- **Fonctionnalités sans mapping** : 27 (réduit de 42 à 27)

## Features Créées (16)

Les features suivantes ont été créées dans Supabase pour permettre les mappings :

1. ✅ `Documents` (RH → Documents)
2. ✅ `Activités commerciales` (CRM → Activités commerciales)
3. ✅ `Gérer mes projets` (Projets → Gérer mes projets)
4. ✅ `Dashboard` (Projets → Gérer mes projets)
5. ✅ `Offres` (CRM → Offres)
6. ✅ `Budget` (Finance → Budget)
7. ✅ `Analytique` (Projets → Analytique)
8. ✅ `Impôts et taxes` (Finance → Impôts et taxes)
9. ✅ `Clients` (CRM → Clients)
10. ✅ `Paramétrage` (RH → Paramétrage)
11. ✅ `Trésorerie` (Finance → Trésorerie)
12. ✅ `Pilotage commercial` (CRM → Pilotage commercial)
13. ✅ `Feuille de temps` (Projets → Feuille de temps)
14. ✅ `Note de frais` (Projets → Note de frais)
15. ✅ `Gérer mes tâches` (Projets → Gérer mes tâches)
16. ✅ `Paramétrage` (RH → Paramétrage) - deuxième instance

## Mappings Créés (30)

### Mappings initiaux (15)
1. ✅ `Opérations - Vente` → Feature mappée
2. ✅ `Opérations - Immobilisations` → Feature mappée
3. ✅ `Finance - Paramétrage` → Feature mappée
4. ✅ `Opérations - Débours` → Feature mappée
5. ✅ `RH - Salaire` → Feature mappée
6. ✅ `Opérations - Achat` → Feature mappée
7. ✅ `RH - Paramétrage` → Feature mappée
8. ✅ `Finance - Caisse` → Feature mappée
9. ✅ `Finance - Comptabilité Générale` → Feature mappée
10. ✅ `RH - Gestion employé` → Feature mappée
11. ✅ `Opérations - Gestion de stock` → Feature mappée
12. ✅ `Finance - Comptabilité analytique` → Feature mappée
13. ✅ `RH - Feuille de temps (Pointage)` → Feature mappée
14. ✅ `RH - Avance sur mission` → Feature mappée
15. ✅ `RH - Gestion de carrière` → Feature mappée

### Nouveaux mappings après création features (15)
16. ✅ `RH - Documents` → `Documents`
17. ✅ `CRM - Activités commerciales` → `Activités commerciales`
18. ✅ `Projets - Gérer mes projets` → `Gérer mes projets`
19. ✅ `Projets - Dashboard` → `Dashboard`
20. ✅ `CRM - Offres` → `Offres`
21. ✅ `Finance - Budget` → `Budget`
22. ✅ `Finance - Impôts et taxes` → `Impôts et taxes`
23. ✅ `CRM - Clients` → `Clients`
24. ✅ `Projets - Feuille de temps` → `Feuille de temps`
25. ✅ `Finance - Trésorerie` → `Trésorerie`
26. ✅ `CRM - Pilotage commercial` → `Pilotage commercial`
27. ✅ `Projets - Note de frais` → `Note de frais`
28. ✅ `Projets - Gérer mes tâches` → `Gérer mes tâches`
29. ✅ `Projets - Identification des projets` → `Gérer mes projets`
30. ✅ `Projets - Comptabilité analytique des projets` → `Analytique`

**Note** : Pour voir les détails complets des mappings (feature_id, noms), utiliser :
```bash
node scripts/count-jira-feature-mappings.js
```

## Fonctionnalités Sans Mapping (27)

Ces fonctionnalités n'ont pas de correspondance dans Supabase. Elles nécessitent soit :
- La création de nouvelles features dans Supabase
- Un mapping manuel si elles existent sous un nom différent

### Fonctionnalités Prioritaires Restantes (par nombre de tickets)

1. **OBC** (124 tickets) - ⚠️ **PRIORITÉ HAUTE** - Nécessite un submodule dédié ou approche spéciale
2. **Paramétrage admin. système - Workflow** (34 tickets)
3. **CRM - Analytique** (29 tickets) - ⚠️ Feature créée mais mapping non trouvé (vérifier)
4. **Paramétrage admin. système - Paramétrage sur fonctionnalités** (28 tickets)
5. **Opérations - Parc automobile** (26 tickets)
6. **CRM - Paramétrage** (20 tickets) - ⚠️ Feature créée mais mapping non trouvé (vérifier)
7. **Paramétrage admin. système - Autres admin. système** (17 tickets)
8. **Paiement - Centre de paiement** (16 tickets)
9. **Opérations - Production** (16 tickets)
10. **Paramétrage admin. système - Gestion des utilisateurs** (14 tickets)
11. **Paramétrage admin. système - Dashboard Global** (12 tickets)
12. **RH - Dashboard** (6 tickets)
13. **Opérations - Dashboard** (4 tickets)
14. **Finance - Paiement** (4 tickets)
15. **Opérations - Dashboard - Parc Auto** (3 tickets)
16. **Opérations - Paramétrage - Parc Auto** (3 tickets)
17. **RH - Evaluation** (3 tickets)
18. **Finance - Dashboard** (2 tickets)
19. **Opérations - Processus métier** (2 tickets)
20. **GED** (2 tickets)
21. **Paramétrage admin. système - Gestion des administrateurs** (1 ticket)
22. **Paiement - Dashboard** (1 ticket)
23. **Paiement - Point de paiement** (1 ticket)
24. **Opérations - Paramétrage** (1 ticket)
25. **RH - Recrutement** (1 ticket)
26. **RH - Formation** (1 ticket)
27. **Projets - Paramétrage** (5 tickets) - ⚠️ Feature créée mais mapping non trouvé (vérifier)

## Recommandations

### Actions Immédiates

1. ✅ **Mappings prioritaires créés** :
   - ✅ Finance - Comptabilité Générale (186 tickets) - **MAPPÉ**
   - ✅ RH - Gestion employé (172 tickets) - **MAPPÉ**
   - ✅ RH - Documents (107 tickets) - **MAPPÉ** (feature créée + mapping)
   - ✅ Opérations - Gestion de stock (106 tickets) - **MAPPÉ**
   - ✅ CRM - Activités commerciales (101 tickets) - **MAPPÉ** (feature créée + mapping)

2. ✅ **Features créées** : 16 features créées dans Supabase

3. **Créer les features manquantes restantes** dans Supabase pour :
   - OBC (124 tickets) - ⚠️ **PRIORITÉ HAUTE** - Nécessite approche spéciale (peut être un produit ou un submodule dédié)

2. **Vérifier les noms** : Certaines fonctionnalités peuvent exister sous des noms différents dans Supabase. Effectuer une recherche manuelle pour :
   - "Finance - Comptabilité Générale" → Chercher "Comptabilité Générale", "Comptabilité", etc.
   - "RH - Gestion employé" → Chercher "Gestion employé", "Employé", etc.

3. **Créer un script de mapping manuel** pour les fonctionnalités restantes une fois les features créées.

### Prochaines Étapes

1. ✅ Mappings automatiques créés (30)
2. ✅ Features prioritaires créées (16)
3. ⏳ Gérer le cas "OBC" (124 tickets) - Peut nécessiter un submodule dédié ou une approche spéciale
4. ⏳ Créer les features restantes (27 fonctionnalités) - Priorité moyenne/basse
5. ⏳ Valider les mappings avec un échantillon de tickets Jira
6. ⏳ Vérifier pourquoi certaines features créées n'ont pas été mappées (CRM - Analytique, CRM - Paramétrage, Projets - Paramétrage)

## Utilisation

Pour créer un mapping manuellement :

```javascript
import { upsertFeatureMapping } from '@/services/jira/feature-mapping';

await upsertFeatureMapping(
  "Finance - Comptabilité Générale", // Valeur Jira
  "feature-uuid-here",                // ID de la feature Supabase
  "customfield_10052",                // ID du champ Jira
  "10088"                             // ID de l'option Jira (optionnel)
);
```

## Notes

- Les mappings sont stockés dans la table `jira_feature_mapping`
- La contrainte `UNIQUE(jira_feature_value, jira_custom_field_id)` empêche les doublons
- Les mappings peuvent être mis à jour via `upsertFeatureMapping`
- Les fonctionnalités sans mapping ne bloquent pas la synchronisation, mais les tickets ne seront pas associés à une feature

