# Guide de Test Rapide : Commentaires Supabase → JIRA

## 🚀 Test Rapide (5 minutes)

### Étape 1 : Préparer un ticket de test

1. **Trouver un ticket avec `jira_issue_key`** :
   ```sql
   -- Dans Supabase SQL Editor
   SELECT id, title, jira_issue_key 
   FROM tickets 
   WHERE jira_issue_key IS NOT NULL 
   LIMIT 1;
   ```

2. **Noter l'ID du ticket** (ex: `abc-123-def-456`)

### Étape 2 : Créer un commentaire via l'interface

1. Ouvrir l'application OnpointDoc
2. Aller sur le ticket identifié
3. Cliquer sur "Ajouter un commentaire"
4. Saisir un contenu unique : `"Test sync JIRA - [VOTRE_NOM] - [DATE]"`
5. Sauvegarder

### Étape 3 : Vérifier dans Supabase

```sql
-- Vérifier que le commentaire a été créé
SELECT id, content, origin, created_at
FROM ticket_comments
WHERE ticket_id = '<TICKET_ID>'
ORDER BY created_at DESC
LIMIT 1;
```

**✅ Résultat attendu :**
- `origin = 'app'`
- `content` correspond à votre commentaire

### Étape 4 : Vérifier dans JIRA

1. Ouvrir JIRA
2. Aller sur le ticket (ex: `OD-1234`)
3. Section "Comments"
4. Chercher votre commentaire

**✅ Résultat attendu :**
- Commentaire visible dans JIRA
- Contenu identique

---

## 🔍 Vérification des Logs

Si le commentaire n'apparaît pas dans JIRA, vérifier les logs :

```bash
# Dans la console de l'application Next.js
# Chercher les erreurs JIRA
```

**Erreurs possibles :**
- `Configuration JIRA manquante` → Vérifier `.env.local`
- `JIRA 401` → Vérifier `JIRA_TOKEN`
- `JIRA 404` → Vérifier `JIRA_URL` et `jira_issue_key`

---

## ✅ Checklist de Validation

- [ ] Ticket avec `jira_issue_key` trouvé
- [ ] Commentaire créé dans Supabase (`origin='app'`)
- [ ] Commentaire visible dans JIRA
- [ ] Contenu identique
- [ ] Pas d'erreur dans les logs

---

## 🐛 Si ça ne marche pas

1. **Vérifier les variables d'environnement** :
   ```bash
   # Dans .env.local
   JIRA_URL=https://votre-instance.atlassian.net
   JIRA_USERNAME=votre-email@example.com
   JIRA_TOKEN=votre-token-api
   ```

2. **Vérifier que le ticket a bien une `jira_issue_key`** :
   ```sql
   SELECT jira_issue_key FROM tickets WHERE id = '<TICKET_ID>';
   ```

3. **Vérifier les logs de l'application** pour les erreurs JIRA

4. **Tester manuellement l'API JIRA** :
   ```bash
   curl -u "email:token" \
     -H "Content-Type: application/json" \
     -X POST \
     "https://votre-instance.atlassian.net/rest/api/3/issue/OD-1234/comment" \
     -d '{"body":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Test"}]}]}}'
   ```

---

## 📝 Notes

- Le commentaire est créé dans Supabase **en premier**
- Si JIRA échoue, le commentaire Supabase reste (pas d'échec total)
- Un webhook JIRA peut créer un doublon avec `origin='jira'` (normal pour l'instant)


