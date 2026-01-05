# Problème Identifié - Filtre "Tous les tickets"

**Date** : 2025-12-23  
**Problème** : Le filtre "Tous les tickets" ne montre pas vraiment tous les tickets

---

## 🔴 PROBLÈME IDENTIFIÉ

### Comportement Actuel

Quand l'utilisateur sélectionne **"Tous les tickets"** (`quickFilter = 'all'`), la fonction RPC `list_tickets_with_user_context` applique un **filtre implicite** :

```sql
(p_quick_filter = 'all' AND (
  (p_user_id IS NOT NULL AND (
    t.created_by = p_user_id          -- ✅ Tickets créés par l'utilisateur
    OR t.assigned_to = p_user_id      -- ✅ Tickets assignés à l'utilisateur
    OR (v_has_modules AND t.module_id = ANY(v_user_modules))  -- ✅ Tickets dans les modules de l'utilisateur
  ))
  OR p_user_id IS NULL  -- ✅ Seulement si pas d'utilisateur connecté
))
```

### Conséquence

**OD-3111 n'apparaît pas** car :
- ❌ Créé par : **GNAHORE AMOS** (pas Edwige KOUASSI)
- ❌ Assigné à : **DATE Kouamé** (pas Edwige KOUASSI)
- ❌ `module_id` : **NULL** (pas dans les modules d'Edwige)

**OBCS-10730 apparaît** car :
- ✅ Créé par : **Edwige KOUASSI**
- ✅ `module_id` : `dd452875-31d0-473d-8ff6-9e9afbe5b490` (dans les modules d'Edwige)

---

## 🎯 Solution Requise

### Comportement Attendu

Le filtre **"Tous les tickets"** devrait montrer **TOUS les tickets** auxquels l'utilisateur a accès selon les **RLS (Row Level Security)**, pas seulement :
- Ses tickets créés
- Ses tickets assignés
- Les tickets de ses modules

### Options de Correction

#### Option 1 : Modifier la RPC Function (Recommandé)

Modifier `list_tickets_with_user_context` pour que `p_quick_filter = 'all'` retourne vraiment tous les tickets (sous réserve des RLS) :

```sql
-- AVANT (actuel)
(p_quick_filter = 'all' AND (
  (p_user_id IS NOT NULL AND (
    t.created_by = p_user_id
    OR t.assigned_to = p_user_id
    OR (v_has_modules AND t.module_id = ANY(v_user_modules))
  ))
  OR p_user_id IS NULL
))

-- APRÈS (corrigé)
(p_quick_filter = 'all' AND (
  -- Laisser les RLS gérer les permissions
  -- Pas de filtre supplémentaire
  TRUE
))
```

#### Option 2 : Créer un nouveau filtre "Tous (sans restriction)"

Ajouter un nouveau filtre qui montre vraiment tous les tickets, et garder "Tous les tickets" avec le comportement actuel.

---

## ⚠️ Impact

### Utilisateurs Affectés

- **Managers** : Ne voient pas tous les tickets de leur équipe
- **Admins** : Ne voient pas tous les tickets du système
- **Agents Support** : Ne voient pas tous les tickets d'assistance

### Tickets Affectés

- Tickets créés par d'autres utilisateurs
- Tickets assignés à d'autres utilisateurs
- Tickets sans module assigné (`module_id = NULL`)
- Tickets dans des modules non assignés à l'utilisateur

---

## 📝 Recommandation

**Corriger la fonction RPC** pour que `p_quick_filter = 'all'` retourne vraiment tous les tickets accessibles selon les RLS.

**Fichier à modifier** : Migration Supabase pour `list_tickets_with_user_context`

**Priorité** : 🔴 **HAUTE** - Impact sur la visibilité des tickets pour tous les utilisateurs

---

**Prochaine étape** : Corriger la fonction RPC pour permettre l'affichage de tous les tickets selon les permissions RLS.

---

## ✅ CORRECTION APPLIQUÉE

**Date de correction** : 2025-12-24  
**Migration** : `20251224000000_fix_tickets_filter_all.sql`

### Modifications apportées

1. **Filtre "all" corrigé** : Retourne maintenant tous les tickets accessibles via RLS, sans filtre supplémentaire
2. **Optimisation** : La récupération des modules n'est plus nécessaire pour le filtre "all"
3. **RLS** : Les permissions sont gérées automatiquement par les Row Level Security policies

### Comportement après correction

Le filtre **"Tous les tickets"** (`p_quick_filter = 'all'`) :
- ✅ Retourne tous les tickets accessibles selon les RLS
- ✅ Respecte les permissions selon le rôle de l'utilisateur (Support, Manager, Admin, etc.)
- ✅ Ne filtre plus par `created_by`, `assigned_to` ou `module_id`

### Tests recommandés

1. Vérifier que tous les tickets accessibles s'affichent avec le filtre "all"
2. Vérifier que les autres filtres rapides fonctionnent toujours correctement
3. Vérifier que les permissions RLS sont bien respectées

