# Checklist des Champs JIRA - OnpointDoc

## ✅ Champs JIRA déjà présents

| Table | Champ JIRA | Type | Statut |
|-------|------------|------|--------|
| `companies` | `jira_company_id` | INTEGER | ✅ Ajouté |
| `modules` | `id_module_jira` | NUMERIC | ✅ Existant |
| `submodules` | `id_module_jira` | NUMERIC | ✅ Existant |
| `tickets` | `jira_issue_key` | TEXT | ✅ Existant |
| `tickets` | `jira_metadata` | JSONB | ✅ Existant |
| `jira_sync` | `jira_issue_key` | TEXT | ✅ Existant |
| `profiles` | `jira_user_id` | TEXT | ✅ Ajouté |

## ✅ Champs JIRA ajoutés

| Table | Champ JIRA | Type | Statut |
|-------|------------|------|--------|
| `features` | `jira_feature_id` | INTEGER | ✅ Ajouté |
| `products` | `jira_product_id` | INTEGER | ✅ Ajouté |

## 📝 Notes

- **Features** : Si les fonctionnalités sont gérées dans JIRA, ajouter `jira_feature_id`
- **Products** : Si les produits sont gérées dans JIRA, ajouter `jira_product_id`
- **Profiles** : Pas nécessaire (pas de relation directe avec JIRA)

## 🔄 Processus d'ajout

Pour chaque table nécessitant un champ JIRA :

1. Créer une migration SQL pour ajouter la colonne
2. Créer un index unique (si nécessaire)
3. Mettre à jour les scripts d'import pour utiliser ce champ
4. Documenter dans ce fichier

