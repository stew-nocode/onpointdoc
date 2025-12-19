# Migration des Tickets d'Assistance - Fichiers Divisés

Cette migration a été divisée en **11 parties** pour être compatible avec l'éditeur SQL Supabase.

## 📊 Informations

- **Total de tickets:** 5308
- **Nombre de fichiers:** 11
- **Tickets par fichier:** 500 (dernier fichier: 308)
- **Taille moyenne par fichier:** ~170-200 KB

## 📁 Fichiers

Les fichiers sont numérotés de `part-01` à `part-11` et doivent être exécutés **dans l'ordre** :

1. `2025-12-09-sync-assistance-tickets-part-01.sql` (500 tickets)
2. `2025-12-09-sync-assistance-tickets-part-02.sql` (500 tickets)
3. `2025-12-09-sync-assistance-tickets-part-03.sql` (500 tickets)
4. `2025-12-09-sync-assistance-tickets-part-04.sql` (500 tickets)
5. `2025-12-09-sync-assistance-tickets-part-05.sql` (500 tickets)
6. `2025-12-09-sync-assistance-tickets-part-06.sql` (500 tickets)
7. `2025-12-09-sync-assistance-tickets-part-07.sql` (500 tickets)
8. `2025-12-09-sync-assistance-tickets-part-08.sql` (500 tickets)
9. `2025-12-09-sync-assistance-tickets-part-09.sql` (500 tickets)
10. `2025-12-09-sync-assistance-tickets-part-10.sql` (500 tickets)
11. `2025-12-09-sync-assistance-tickets-part-11.sql` (308 tickets)

## 🚀 Instructions d'Exécution

### Option 1: Via l'Éditeur SQL Supabase (Recommandé)

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Ouvrez le fichier `part-01.sql`
4. Copiez-collez son contenu dans l'éditeur
5. Cliquez sur **Run** et attendez la fin de l'exécution
6. Répétez pour `part-02`, `part-03`, etc. jusqu'à `part-11`

**⚠️ Important:** Attendez que chaque partie soit terminée avant de passer à la suivante.

### Option 2: Via CLI Supabase

Si vous avez le CLI Supabase installé :

```bash
# Appliquer toutes les parties en une fois
for file in supabase/migrations/assistance-tickets-split/2025-12-09-sync-assistance-tickets-part-*.sql; do
  supabase db push --file "$file"
done
```

### Option 3: Via psql

```bash
# Appliquer toutes les parties
for file in supabase/migrations/assistance-tickets-split/2025-12-09-sync-assistance-tickets-part-*.sql; do
  psql "postgresql://postgres:[PASSWORD]@db.xjcttqaiplnoalolebls.supabase.co:5432/postgres" -f "$file"
done
```

## 📝 Contenu de Chaque Fichier

Chaque fichier contient :

1. **Création de la table temporaire** `temp_assistance_tickets`
2. **INSERT des tickets** (500 tickets par fichier)
3. **Bloc DO $$** qui :
   - Crée automatiquement les entreprises manquantes
   - Crée automatiquement les modules/sous-modules manquants
   - Crée automatiquement les utilisateurs (rapporteurs et contacts) manquants
   - Insère ou met à jour les tickets dans la table `tickets`
4. **Nettoyage** de la table temporaire

## ✅ Vérification

Après avoir exécuté toutes les parties, vérifiez le résultat :

```sql
SELECT 
  COUNT(*) as total_assistance,
  COUNT(CASE WHEN jira_issue_key LIKE 'OBCS-%' THEN 1 END) as obcs_tickets
FROM tickets
WHERE ticket_type = 'ASSISTANCE';
```

Vous devriez voir **5308 tickets d'assistance** avec des clés `OBCS-XXXXX`.

## 🔄 Ré-exécution

Les fichiers sont **idempotents** : vous pouvez les ré-exécuter sans problème. Les tickets existants seront mis à jour, les nouveaux seront créés.

## ⚠️ Notes

- Chaque fichier est autonome et peut être exécuté indépendamment
- L'ordre d'exécution est important pour éviter les conflits
- Le processus peut prendre plusieurs minutes par fichier
- Les messages `RAISE NOTICE` dans les logs indiquent la progression

