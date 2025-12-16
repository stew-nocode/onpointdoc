# Test de Création de Commentaires Supabase → JIRA

**Date :** 2025-01-27  
**Objectif :** Vérifier que la synchronisation bidirectionnelle des commentaires fonctionne

---

## 🧪 Test Manuel

### Prérequis

1. Un ticket Supabase avec `jira_issue_key` renseigné (ex: `OD-1234`)
2. Accès à l'application OnpointDoc
3. Accès à JIRA pour vérifier

### Étapes

#### 1. Identifier un ticket de test

```sql
-- Dans Supabase, trouver un ticket avec jira_issue_key
SELECT id, title, jira_issue_key, ticket_type, status
FROM tickets
WHERE jira_issue_key IS NOT NULL
LIMIT 1;
```

#### 2. Créer un commentaire via l'interface

1. Ouvrir l'application OnpointDoc
2. Aller sur le ticket identifié
3. Ajouter un commentaire avec un contenu unique (ex: "Test sync JIRA - 2025-01-27 14:30")
4. Sauvegarder le commentaire

#### 3. Vérifier dans Supabase

```sql
-- Vérifier que le commentaire a été créé avec origin='app'
SELECT id, content, origin, created_at
FROM ticket_comments
WHERE ticket_id = '<ticket_id>'
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu :**
- ✅ Commentaire créé avec `origin='app'`
- ✅ Contenu correspondant au commentaire saisi

#### 4. Vérifier dans JIRA

1. Ouvrir JIRA
2. Aller sur le ticket correspondant (ex: `OD-1234`)
3. Vérifier la section "Comments"
4. Chercher le commentaire créé

**Résultat attendu :**
- ✅ Commentaire visible dans JIRA
- ✅ Contenu identique au commentaire Supabase
- ✅ Auteur : utilisateur qui a créé le commentaire dans Supabase

---

## 🔧 Test Automatisé (Script)

### Utilisation du script

```bash
# Test avec un ticket spécifique
node scripts/test-jira-comment-creation.mjs <ticket_id> "Contenu du commentaire"

# Exemple
node scripts/test-jira-comment-creation.mjs abc-123-def "Test commentaire depuis Supabase"
```

### Ce que fait le script

1. ✅ Vérifie que le ticket existe
2. ✅ Vérifie si le ticket a une `jira_issue_key`
3. ✅ Crée un commentaire dans Supabase
4. ✅ Vérifie que le commentaire a été créé
5. ⚠️  Indique l'URL JIRA pour vérification manuelle

**Note :** Le script crée directement dans Supabase. Pour tester la synchronisation JIRA complète, il faut utiliser l'interface utilisateur qui appelle `createComment()` avec la logique de synchronisation.

---

## 🐛 Dépannage

### Le commentaire n'apparaît pas dans JIRA

**Causes possibles :**

1. **Le ticket n'a pas de `jira_issue_key`**
   ```sql
   SELECT jira_issue_key FROM tickets WHERE id = '<ticket_id>';
   ```
   - Si `NULL`, le commentaire ne sera pas synchronisé vers JIRA

2. **Erreur lors de la création JIRA**
   - Vérifier les logs de l'application
   - Vérifier les variables d'environnement JIRA :
     - `JIRA_URL`
     - `JIRA_USERNAME`
     - `JIRA_TOKEN`

3. **Le webhook JIRA a créé un doublon**
   - Vérifier dans Supabase s'il y a deux commentaires :
     - Un avec `origin='app'` (créé depuis Supabase)
     - Un avec `origin='jira'` (créé par le webhook JIRA)
   - C'est normal pour l'instant (amélioration future : stocker `jira_comment_id`)

### Vérifier les logs

```bash
# Dans les logs de l'application Next.js
# Chercher les erreurs liées à JIRA
grep -i "jira\|comment" logs/app.log
```

---

## ✅ Checklist de Validation

- [ ] Ticket avec `jira_issue_key` identifié
- [ ] Commentaire créé dans Supabase avec `origin='app'`
- [ ] Commentaire visible dans JIRA
- [ ] Contenu identique entre Supabase et JIRA
- [ ] Pas d'erreur dans les logs
- [ ] Pièces jointes uploadées (si présentes)

---

## 📝 Notes

### Comportement Actuel

1. **Création Supabase → JIRA** : ✅ Implémenté
   - Quand un commentaire est créé dans Supabase pour un ticket avec `jira_issue_key`
   - Le commentaire est automatiquement créé dans JIRA

2. **Création JIRA → Supabase** : ✅ Déjà fonctionnel
   - Via webhook JIRA
   - Crée un commentaire avec `origin='jira'`

3. **Gestion des doublons** : ⚠️ À améliorer
   - Actuellement, un commentaire créé depuis Supabase peut déclencher un webhook JIRA
   - Le webhook crée un nouveau commentaire avec `origin='jira'`
   - Solution future : stocker `jira_comment_id` dans `ticket_comments` pour éviter les doublons

---

## 🔄 Prochaines Améliorations

1. **Stockage de `jira_comment_id`**
   - Ajouter une colonne `jira_comment_id` dans `ticket_comments`
   - Stocker l'ID JIRA lors de la création
   - Vérifier dans le webhook si le commentaire existe déjà

2. **Tests automatisés**
   - Tests unitaires pour `createJiraComment()`
   - Tests d'intégration pour la synchronisation complète
   - Tests E2E avec un environnement de test JIRA

3. **Monitoring**
   - Logger les créations de commentaires JIRA
   - Alertes en cas d'échec de synchronisation
   - Métriques de synchronisation


