# Explication : Problème des 2 Profils Manquants

## 🔍 Le Problème

Vous avez **2 rapporteurs JIRA** qui ont créé des tickets BUG, mais qui **n'existent pas dans Supabase**. 

### Conséquence
- Quand les tickets JIRA sont synchronisés vers Supabase, le système cherche le profil du rapporteur
- Si le profil n'existe pas, le champ `created_by` reste **NULL** dans la table `tickets`
- Résultat : **6 tickets BUG** ont `created_by = NULL` (on ne sait pas qui les a créés)

---

## 🔄 Comment ça fonctionne actuellement

### 1. Synchronisation JIRA → Supabase

Quand un ticket JIRA arrive dans Supabase (via webhook N8N), voici ce qui se passe :

```
Ticket JIRA arrive
    ↓
Système extrait le "reporter.accountId" (ex: "712020:d4a5e54b-...")
    ↓
Fonction mapJiraAccountIdToProfileId() cherche dans profiles
    WHERE jira_user_id = "712020:d4a5e54b-..."
    ↓
Si trouvé → utilise profile.id pour remplir tickets.created_by ✅
Si non trouvé → created_by = NULL ❌
```

### 2. Le Mapping JIRA → Supabase

Le lien entre JIRA et Supabase se fait via le champ `jira_user_id` dans la table `profiles` :

| Table | Champ | Description |
|-------|-------|-------------|
| `profiles` | `jira_user_id` | Contient l'Account ID JIRA (ex: `712020:bb02e93b-...`) |
| `tickets` | `created_by` | Contient l'ID du profil (FK vers `profiles.id`) |

**Important** : Le système cherche un profil avec `jira_user_id` = Account ID JIRA du rapporteur.

---

## ✅ La Solution

### Étape 1 : Créer les 2 profils manquants

Pour chaque rapporteur manquant, il faut :

1. **Récupérer les informations depuis JIRA** :
   - Nom complet
   - Email
   - Account ID JIRA (déjà connu)
   - Rôle (agent/manager)
   - Département

2. **Créer le profil dans Supabase** avec :
   ```sql
   INSERT INTO profiles (
     full_name,
     email,
     jira_user_id,  -- ⚠️ CRUCIAL : doit correspondre à l'Account ID JIRA
     role,
     department_id,
     is_active
   ) VALUES (...);
   ```

### Étape 2 : Mettre à jour les tickets existants

Une fois les profils créés, mettre à jour les 6 tickets pour remplir `created_by` :

```sql
UPDATE tickets
SET created_by = 'profile_id_du_rapporteur'
WHERE id IN (
  SELECT ticket_id 
  FROM jira_sync 
  WHERE jira_reporter_account_id = '712020:d4a5e54b-...'
);
```

### Étape 3 : Vérification

Les futures synchronisations JIRA trouveront automatiquement les profils grâce au `jira_user_id`.

---

## 📋 Les 2 Rapporteurs Manquants

### Rapporteur 1
- **ID JIRA** : `712020:d4a5e54b-dc78-41d8-a397-cc5dbd0461f0`
- **Tickets concernés** : 5 tickets
  - OD-2778, OD-2775, OD-2774, OD-1407, OD-1437
- **Action** : Créer le profil avec cet `jira_user_id`

### Rapporteur 2
- **ID JIRA** : `712020:d58975c6-6a68-40cc-a02a-6961e12afa4b`
- **Tickets concernés** : 1 ticket
  - OD-1176
- **Action** : Créer le profil avec cet `jira_user_id`

---

## 🛠️ Script de Résolution

Un script peut être créé pour :
1. Créer les profils manquants (une fois les infos JIRA récupérées)
2. Mettre à jour automatiquement les tickets existants
3. Vérifier que tout est correct

**Prérequis** : Avoir les informations complètes depuis JIRA (nom, email, rôle, département).

---

## ⚠️ Points d'Attention

1. **Le `jira_user_id` doit être EXACT** : Il doit correspondre exactement à l'Account ID JIRA (format : `712020:xxxxx-xxxxx-...`)

2. **Ne pas créer de doublons** : Vérifier qu'un profil avec le même `jira_user_id` n'existe pas déjà

3. **Rôle et département** : S'assurer que le rôle (agent/manager) et le département sont corrects pour les permissions

4. **Tickets historiques** : Après création des profils, mettre à jour les tickets existants pour avoir une traçabilité complète

---

## 📊 Impact

- **Tickets affectés** : 6 tickets BUG avec `created_by = NULL`
- **Rapporteurs manquants** : 2 utilisateurs internes
- **Solution** : Créer 2 profils + mettre à jour 6 tickets

Une fois résolu, tous les tickets auront un créateur identifié et la traçabilité sera complète.

