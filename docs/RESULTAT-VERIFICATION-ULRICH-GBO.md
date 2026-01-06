# Résultat de la Vérification : Problème d'Assignation "ULRICH GBO"

## ✅ Problème Identifié

**Le profil "Ulrich GBO" dans Supabase n'a pas de `jira_user_id` renseigné.**

### Détails du Profil

| Champ | Valeur |
|-------|--------|
| **ID** | `ba09620a-09a9-4a11-a6d0-f95177ab5fe8` |
| **Nom complet** | `Ulrich GBO` |
| **Email** | `null` |
| **jira_user_id** | **`NULL`** ← **PROBLÈME** |
| **Rôle** | `client` |
| **Statut** | `is_active = true` |

### Conséquence

Quand vous assignez "ULRICH GBO" dans JIRA :
1. JIRA envoie un webhook avec `assignee.accountId` (ex: `"712020:xxxx-xxxx-xxxx-xxxx"`)
2. Le système appelle `mapJiraAccountIdToProfileId(accountId)`
3. La recherche dans Supabase échoue car `jira_user_id IS NULL`
4. Le système met `assigned_to = null` dans Supabase
5. **Résultat** : L'assignation ne se synchronise pas dans l'app

### Preuve

J'ai trouvé **10 tickets** assignés à "Ulrich GBO" dans Supabase :
- OD-3001, OD-1849, OD-1660, OD-869, OD-904, OD-703, OD-1320, OD-1394, OD-1395, OD-723

Tous ces tickets ont `assigned_to = 'ba09620a-09a9-4a11-a6d0-f95177ab5fe8'` (le profil d'Ulrich GBO), mais le profil n'a pas de `jira_user_id`, donc les **nouvelles assignations depuis JIRA ne fonctionnent pas**.

---

## 🔍 Comparaison avec les Autres Utilisateurs

J'ai vérifié les autres profils avec `jira_user_id` renseigné. Format utilisé :

| Utilisateur | jira_user_id | Format |
|-------------|--------------|--------|
| CHARLEY KOUAME | `712020:1294eacb-4c40-4947-a874-6af47ae70d35` | Format moderne (43 caractères) |
| EVA BASSE | `712020:d4a5e54b-dc78-41d8-a397-cc5dbd0461f0` | Format moderne (43 caractères) |
| GNAHORE AMOS | `712020:bb02e93b-c270-4c40-a166-a19a42e5629a` | Format moderne (43 caractères) |
| DATE Kouamé | `5ffc79279edf280075c25b09` | Format ancien (24 caractères) |
| Edwige KOUASSI | `5fb4dd9e2730d800765b5774` | Format ancien (24 caractères) |

**Format attendu pour "Ulrich GBO"** : Probablement `712020:xxxx-xxxx-xxxx-xxxx` (format moderne)

---

## ✅ Solution

### Étape 1 : Récupérer l'accountId JIRA de "Ulrich GBO"

**Option A - Via l'interface JIRA** :
1. Ouvrir un ticket assigné à "Ulrich GBO" dans JIRA
2. Cliquer sur le profil de l'assigné
3. Récupérer l'`accountId` depuis l'URL ou les métadonnées

**Option B - Via l'API JIRA** :
```bash
# Récupérer l'accountId depuis un ticket JIRA
curl -u "email:token" \
  "https://votre-jira.atlassian.net/rest/api/3/issue/OD-3001" \
  | jq '.fields.assignee.accountId'
```

**Option C - Via un script** :
Utiliser le script `scripts/map-jira-users-to-profiles.js` pour mapper automatiquement tous les utilisateurs JIRA vers Supabase.

### Étape 2 : Mettre à jour le profil dans Supabase

Une fois l'`accountId` JIRA récupéré (ex: `"712020:xxxx-xxxx-xxxx-xxxx"`), exécuter :

```sql
UPDATE profiles 
SET jira_user_id = '712020:xxxx-xxxx-xxxx-xxxx'  -- Remplacer par le vrai accountId
WHERE id = 'ba09620a-09a9-4a11-a6d0-f95177ab5fe8';
```

**Important** : 
- Vérifier que l'`accountId` correspond **exactement** (caractère par caractère)
- Pas d'espaces avant/après
- Format correct (avec les deux-points `:`)

### Étape 3 : Tester

1. Réassigner "ULRICH GBO" à un ticket dans JIRA
2. Vérifier que l'assignation se synchronise dans l'app
3. Vérifier les logs pour confirmer que le mapping fonctionne

---

## 📊 Statistiques

- **Tickets assignés à "Ulrich GBO"** : 10+ tickets
- **Profil actif** : Oui (`is_active = true`)
- **jira_user_id manquant** : Oui (`NULL`)

---

## 🔄 Pourquoi ça marche pour les autres ?

Les autres utilisateurs ont :
- ✅ Un `jira_user_id` correctement renseigné dans Supabase
- ✅ Un `jira_user_id` qui correspond exactement à leur `accountId` JIRA
- ✅ Le mapping fonctionne donc correctement lors de la synchronisation

---

## 📝 Note Technique

Le système utilise une recherche **exacte** (`.eq()`) qui est :
- **Case-sensitive** (sensible à la casse)
- **Sensible aux espaces** (un espace avant/après fait échouer la recherche)

C'est pourquoi il est crucial que le `jira_user_id` dans Supabase corresponde **exactement** à l'`accountId` JIRA.

---

## 🎯 Action Immédiate Requise

1. **Récupérer l'accountId JIRA de "Ulrich GBO"** depuis JIRA
2. **Mettre à jour le profil** dans Supabase avec cet accountId
3. **Tester** en réassignant "ULRICH GBO" dans JIRA

Une fois cette correction effectuée, la synchronisation d'assignation fonctionnera pour "ULRICH GBO" comme pour les autres utilisateurs.

