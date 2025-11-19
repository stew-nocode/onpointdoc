# Analyse Urgente - Table Tickets
**Date** : 2025-01-19  
**Objectif** : Identifier les problèmes urgents pour éviter erreurs et conflits

---

## 🔴 Problèmes Critiques Identifiés

### 1. **Clés Étrangères Manquantes ou Non Définies**

#### 1.1. `assigned_to` et `created_by`
- **Problème** : Les colonnes `assigned_to` et `created_by` sont référencées dans le code mais :
  - Pas de contrainte FOREIGN KEY explicite vers `profiles.id` ou `auth.users`
  - Risque de données orphelines si un utilisateur est supprimé
- **Impact** : Erreurs lors des requêtes avec JOIN, données incohérentes
- **Action urgente** : Ajouter les contraintes FK avec `ON DELETE SET NULL` ou `ON DELETE CASCADE`

#### 1.2. `product_id` et `module_id`
- **Problème** : Référencés dans le code mais pas de FK visible dans les migrations
- **Impact** : Risque de références à des produits/modules inexistants
- **Action urgente** : Vérifier et ajouter les contraintes FK

#### 1.3. `related_ticket_id`
- **Problème** : FK auto-référentielle présente (`REFERENCES public.tickets(id) ON DELETE SET NULL`)
- **Status** : ✅ OK - Mais vérifier qu'il n'y a pas de boucles infinies

---

### 2. **Index Manquants pour Performance**

#### 2.1. Index sur `assigned_to`
- **Problème** : Colonne très utilisée pour les filtres mais index peut manquer
- **Impact** : Requêtes lentes sur "Mes tickets assignés"
- **Action** : Vérifier si `idx_tickets_assigned_to` existe

#### 2.2. Index sur `jira_issue_key`
- **Problème** : Colonne utilisée pour la synchronisation JIRA mais index peut manquer
- **Impact** : Recherches lentes lors de la synchronisation
- **Action** : Vérifier et créer si manquant

#### 2.3. Index composite pour requêtes fréquentes
- **Recommandation** : Créer des index composites :
  - `(status, ticket_type, created_at)` - Pour les listes filtrées
  - `(assigned_to, status)` - Pour "mes tickets en cours"
  - `(product_id, module_id)` - Pour les filtres par produit/module

---

### 3. **Contraintes de Données Manquantes**

#### 3.1. Enum pour `status`
- **Problème** : Le code utilise `'Nouveau' | 'En_cours' | 'Transfere' | 'Resolue'` mais :
  - Pas de contrainte CHECK dans la base
  - Risque de valeurs invalides insérées
- **Action urgente** : Créer un ENUM PostgreSQL ou une contrainte CHECK

#### 3.2. Enum pour `ticket_type`
- **Problème** : Le code utilise `'BUG' | 'REQ' | 'ASSISTANCE'` mais pas de contrainte
- **Action urgente** : Créer un ENUM ou CHECK constraint

#### 3.3. Enum pour `priority`
- **Problème** : Le code utilise `'Low' | 'Medium' | 'High' | 'Critical'` mais pas de contrainte
- **Action urgente** : Créer un ENUM ou CHECK constraint

---

### 4. **Problèmes de Cohérence Code ↔ Base de Données**

#### 4.1. Colonnes ajoutées dans les migrations mais non utilisées dans le code
- `resolution` (Phase 1) - Utilisée ?
- `fix_version` (Phase 1) - Utilisée ?
- `workflow_status` (Phase 4) - Utilisée ?
- `test_status` (Phase 4) - Utilisée ?
- `issue_type` (Phase 4) - Utilisée ?
- `sprint_id` (Phase 4) - Utilisée ?
- `related_ticket_key` (Phase 4) - Utilisée ?
- `target_date` (Phase 4) - Utilisée ?
- `resolved_at` (Phase 4) - Utilisée ?
- `custom_fields` (Phase 5) - Utilisée ?

**Action** : Vérifier l'utilisation dans le code et documenter ou supprimer si inutile

#### 4.2. Colonnes utilisées dans le code mais absentes des migrations
- Vérifier que toutes les colonnes utilisées dans `listTicketsPaginated` existent

---

### 5. **Problèmes de RLS (Row Level Security)**

#### 5.1. Policies potentiellement conflictuelles
- **Problème** : Plusieurs policies RLS peuvent se chevaucher
- **Risque** : Comportement imprévisible, accès refusé ou accordé par erreur
- **Action** : Vérifier la logique des policies et tester avec différents rôles

#### 5.2. `team_id` nullable mais utilisé dans les policies
- **Problème** : `team_id` peut être NULL mais les policies RLS l'utilisent
- **Risque** : Tickets sans `team_id` peuvent être invisibles
- **Action** : Définir une valeur par défaut ou gérer les NULL dans les policies

---

### 6. **Problèmes de Synchronisation JIRA**

#### 6.1. Table `jira_sync` séparée
- **Problème** : Relation 1:1 avec `tickets` mais pas de contrainte UNIQUE garantie
- **Risque** : Plusieurs entrées `jira_sync` pour un même ticket
- **Action** : Vérifier la contrainte UNIQUE sur `ticket_id`

#### 6.2. `jira_issue_key` dans `tickets` ET `jira_sync`
- **Problème** : Duplication possible, risque d'incohérence
- **Action** : Définir une source de vérité unique

---

### 7. **Problèmes de Performance**

#### 7.1. Requêtes avec multiples JOINs
- **Problème** : `listTicketsPaginated` fait des JOINs sur `profiles`, `products`, `modules`
- **Risque** : Performance dégradée avec beaucoup de tickets
- **Action** : Vérifier les index sur les colonnes de jointure

#### 7.2. Transformation des données après requête
- **Problème** : Transformation `assigned_user` de tableau → objet dans le code
- **Risque** : Performance si beaucoup de tickets
- **Action** : Utiliser `.single()` dans Supabase ou optimiser la requête

---

## ✅ Points Positifs Identifiés

1. **Index de base présents** : `status`, `ticket_type`, `created_by`, `team_id`
2. **RLS activé** : Sécurité au niveau des lignes
3. **Historique des statuts** : Table `ticket_status_history` pour audit
4. **JSONB pour champs personnalisés** : Flexible avec index GIN

---

## 🎯 Actions Urgentes Recommandées

### Priorité 1 (Critique - À faire immédiatement)
1. ✅ Vérifier et ajouter les contraintes FOREIGN KEY manquantes
2. ✅ Créer les ENUMs ou CHECK constraints pour `status`, `ticket_type`, `priority`
3. ✅ Vérifier l'unicité de `jira_issue_key` et `ticket_id` dans `jira_sync`

### Priorité 2 (Important - À faire cette semaine)
4. ✅ Ajouter les index manquants pour performance
5. ✅ Vérifier la cohérence des colonnes utilisées vs définies
6. ✅ Tester les policies RLS avec différents scénarios

### Priorité 3 (Amélioration - À planifier)
7. ✅ Documenter les colonnes non utilisées
8. ✅ Optimiser les requêtes avec JOINs multiples
9. ✅ Ajouter des index composites pour requêtes fréquentes

---

## 📋 Checklist de Vérification

- [ ] Contraintes FK sur `assigned_to`, `created_by`, `product_id`, `module_id`
- [ ] ENUMs ou CHECK constraints pour `status`, `ticket_type`, `priority`
- [ ] Index sur `assigned_to`, `jira_issue_key`
- [ ] Index composites pour requêtes fréquentes
- [ ] Contrainte UNIQUE sur `jira_sync.ticket_id`
- [ ] Gestion des NULL dans les policies RLS pour `team_id`
- [ ] Vérification de l'utilisation de toutes les colonnes ajoutées
- [ ] Tests de performance sur `listTicketsPaginated` avec beaucoup de données

---

**Note** : Cette analyse est basée sur l'examen des migrations et du code. Une vérification directe dans Supabase est recommandée pour confirmer l'état actuel de la base de données.

