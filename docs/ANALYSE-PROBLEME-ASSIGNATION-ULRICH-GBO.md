# Analyse : Problème d'Assignation "ULRICH GBO"

## 🔍 Problème Identifié

Quand vous assignez **"ULRICH GBO"** dans JIRA, l'assignation ne se synchronise pas dans l'application, alors que ça fonctionne pour les autres utilisateurs.

---

## 🔄 Comment fonctionne la synchronisation d'assignation

### 1. Webhook JIRA → Supabase

Quand vous assignez un utilisateur dans JIRA :

```
JIRA : assignee.accountId = "712020:xxxx-xxxx-xxxx-xxxx"
    ↓
Webhook reçu dans /api/webhooks/jira/route.ts
    ↓
Extraction : jiraData.assignee.accountId
    ↓
Appel : mapJiraAccountIdToProfileId(accountId)
    ↓
Recherche dans Supabase :
  SELECT id FROM profiles 
  WHERE jira_user_id = '712020:xxxx-xxxx-xxxx-xxxx'
    ↓
Si trouvé → assigned_to = profile.id ✅
Si non trouvé → assigned_to = null ❌
```

### 2. La fonction de mapping

```typescript
async function mapJiraAccountIdToProfileId(jiraAccountId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('jira_user_id', jiraAccountId)  // ⚠️ Recherche EXACTE
    .single();

  if (error || !data) {
    console.warn(`Aucun profil trouvé pour le jira_user_id "${jiraAccountId}"`);
    return null;
  }

  return data.id;
}
```

**Important** : La recherche utilise `.eq()` qui fait une **comparaison exacte** (case-sensitive).

---

## 🎯 Causes Probables du Problème

### Cause 1 : `jira_user_id` manquant ou NULL

**Hypothèse** : Le profil de "ULRICH GBO" dans Supabase n'a pas de `jira_user_id` renseigné.

**Vérification** :
```sql
SELECT id, full_name, email, jira_user_id 
FROM profiles 
WHERE full_name ILIKE '%ULRICH%' 
   OR full_name ILIKE '%GBO%';
```

**Solution** : Si `jira_user_id` est NULL, il faut :
1. Récupérer l'`accountId` JIRA de "ULRICH GBO" depuis JIRA
2. Mettre à jour le profil dans Supabase :
   ```sql
   UPDATE profiles 
   SET jira_user_id = '712020:xxxx-xxxx-xxxx-xxxx'  -- AccountId JIRA
   WHERE id = 'uuid-du-profil-ulrich';
   ```

---

### Cause 2 : `jira_user_id` incorrect ou mal formaté

**Hypothèse** : Le `jira_user_id` dans Supabase ne correspond pas exactement à l'`accountId` JIRA.

**Exemples de problèmes** :
- Espaces avant/après : `" 712020:xxxx"` vs `"712020:xxxx"`
- Format différent : `"712020-xxxx"` vs `"712020:xxxx"`
- Casse différente : `"712020:XXXX"` vs `"712020:xxxx"` (peu probable car UUID)
- Valeur partielle : `"xxxx-xxxx"` au lieu de `"712020:xxxx-xxxx-xxxx-xxxx"`

**Vérification** :
1. Récupérer l'`accountId` JIRA de "ULRICH GBO" depuis JIRA
2. Comparer avec le `jira_user_id` dans Supabase :
   ```sql
   SELECT id, full_name, jira_user_id 
   FROM profiles 
   WHERE full_name ILIKE '%ULRICH%' 
      OR full_name ILIKE '%GBO%';
   ```
3. Vérifier que les deux valeurs sont **identiques** (caractère par caractère)

**Solution** : Corriger le `jira_user_id` dans Supabase pour qu'il corresponde exactement à l'`accountId` JIRA.

---

### Cause 3 : Profil inexistant dans Supabase

**Hypothèse** : "ULRICH GBO" n'existe pas dans la table `profiles` de Supabase.

**Vérification** :
```sql
SELECT id, full_name, email 
FROM profiles 
WHERE full_name ILIKE '%ULRICH%' 
   OR full_name ILIKE '%GBO%'
   OR email ILIKE '%ulrich%'
   OR email ILIKE '%gbo%';
```

**Solution** : Si aucun profil n'est trouvé, il faut créer le profil avec le `jira_user_id` correct.

---

### Cause 4 : Problème de logs (pour diagnostic)

**Hypothèse** : Le webhook est bien reçu mais le mapping échoue silencieusement.

**Vérification** : Consulter les logs Vercel/Supabase pour voir :
- Si le webhook est bien reçu
- Si `jiraData.assignee.accountId` est bien extrait
- Si le warning `"Aucun profil trouvé pour le jira_user_id"` apparaît avec l'accountId de "ULRICH GBO"

**Logs à chercher** :
```
[WEBHOOK JIRA] Webhook reçu: jira:issue_updated pour ticket XXX
[SYNC JIRA→SUPABASE] ⚠️ Utilisateur assigné dans JIRA (712020:xxxx) non trouvé dans Supabase. assigned_to mis à null.
```

---

## 📋 Checklist de Diagnostic

Pour identifier précisément le problème, vérifiez dans cet ordre :

### Étape 1 : Vérifier si le profil existe
```sql
SELECT id, full_name, email, jira_user_id 
FROM profiles 
WHERE full_name ILIKE '%ULRICH%' 
   OR full_name ILIKE '%GBO%';
```

### Étape 2 : Récupérer l'accountId JIRA de "ULRICH GBO"
- Aller dans JIRA
- Ouvrir un ticket assigné à "ULRICH GBO"
- Récupérer l'`accountId` depuis l'API JIRA ou les métadonnées du ticket
- Format attendu : `"712020:xxxx-xxxx-xxxx-xxxx"`

### Étape 3 : Comparer les valeurs
- Comparer l'`accountId` JIRA avec le `jira_user_id` dans Supabase
- Vérifier qu'ils sont **identiques** (caractère par caractère, sans espaces)

### Étape 4 : Vérifier les logs
- Consulter les logs Vercel pour voir si le webhook est reçu
- Chercher les warnings `"Aucun profil trouvé pour le jira_user_id"`

---

## ✅ Solution Recommandée

Une fois le problème identifié :

1. **Si `jira_user_id` est NULL** :
   - Mettre à jour le profil avec l'`accountId` JIRA correct

2. **Si `jira_user_id` est incorrect** :
   - Corriger le `jira_user_id` pour qu'il corresponde exactement à l'`accountId` JIRA

3. **Si le profil n'existe pas** :
   - Créer le profil avec le `jira_user_id` correct

4. **Pour tester** :
   - Réassigner "ULRICH GBO" dans JIRA
   - Vérifier que l'assignation se synchronise dans l'app

---

## 🔍 Pourquoi ça marche pour les autres ?

Les autres utilisateurs ont probablement :
- Un `jira_user_id` correctement renseigné dans Supabase
- Un `jira_user_id` qui correspond exactement à leur `accountId` JIRA
- Un profil existant dans Supabase

---

## 📝 Note Technique

Le système utilise une **recherche exacte** (`.eq()`) qui est **case-sensitive** et **sensible aux espaces**. 

Si l'`accountId` JIRA est `"712020:abc-123"` mais que le `jira_user_id` dans Supabase est `"712020:abc-123 "` (avec un espace à la fin), la recherche échouera.

**Recommandation** : Utiliser `TRIM()` lors de la mise à jour pour éviter les espaces :
```sql
UPDATE profiles 
SET jira_user_id = TRIM('712020:xxxx-xxxx-xxxx-xxxx')
WHERE id = 'uuid-du-profil';
```

