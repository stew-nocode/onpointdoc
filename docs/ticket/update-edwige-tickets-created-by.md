# Mise à jour created_by pour Edwige KOUASSI

## 📋 Contexte

Ce script permet de mettre à jour le champ `created_by` des tickets pour indiquer qu'Edwige KOUASSI (agent support) a enregistré ces tickets dans le système.

**Important** :
- ✅ On met à jour uniquement `tickets.created_by`
- ❌ On ne touche **pas** à `contact_user_id` (client/utilisateur externe qui a rapporté le problème)

## 🎯 Utilisation

### Prérequis

1. Exportez les clés OBCS depuis la Google Sheet (colonne "Clé de ticket") filtrée sur les tickets créés par Edwige KOUASSI
2. Ayez les variables d'environnement configurées :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Options d'exécution

#### Option 1 : Liste directe de clés OBCS

```bash
node scripts/update-edwige-tickets-created-by.mjs --obcs OBCS-11493,OBCS-11491,OBCS-11483
```

#### Option 2 : Fichier texte (une clé par ligne)

Créez un fichier `liste-obcs.txt` :
```
OBCS-11493
OBCS-11491
OBCS-11483
```

Puis exécutez :
```bash
node scripts/update-edwige-tickets-created-by.mjs --file liste-obcs.txt
```

#### Option 3 : Mode test (sans modification)

Pour voir ce qui sera modifié sans faire de changement :
```bash
node scripts/update-edwige-tickets-created-by.mjs --obcs OBCS-11493 --dry-run
```

## 🔄 Processus

1. **Parsing du CSV de correspondance** : Le script lit `docs/ticket/correspondance - Jira (3).csv` pour créer un mapping OBCS → OD
2. **Recherche des clés OD** : Pour chaque clé OBCS, trouve la clé OD correspondante
3. **Vérification du profil** : Vérifie que le profil d'Edwige KOUASSI existe (`ff6b3d35-c635-4258-a253-db3fac202302`)
4. **Mise à jour des tickets** : Met à jour `tickets.created_by` pour chaque ticket trouvé

## 📊 Exemple de sortie

```
🔍 Mise à jour des tickets created_by pour Edwige KOUASSI

📖 Parsing du fichier CSV de correspondance...
✅ 1500 correspondances trouvées

📋 Récupération des clés OBCS...
✅ 3 clés OBCS à traiter: OBCS-11493, OBCS-11491, OBCS-11483

✅ 3 clés OD trouvées:

   OBCS-11493 → OD-2951
   OBCS-11491 → OD-2949
   OBCS-11483 → OD-2946

🔍 Vérification du profil d'Edwige KOUASSI...
✅ Profil trouvé: Edwige KOUASSI (edwige.kouassi@example.com, agent)

🔄 Mise à jour des tickets...

✅ OD-2951 - Mis à jour (Vivien DAKPOGAN → Edwige KOUASSI)
✅ OD-2949 - Mis à jour (Vivien DAKPOGAN → Edwige KOUASSI)
✅ OD-2946 - Mis à jour (Vivien DAKPOGAN → Edwige KOUASSI)

📊 RÉSUMÉ:
   ✅ Mis à jour: 3
   ⏭️  Déjà à jour: 0
   ❌ Erreurs: 0
   📝 Total: 3
```

## ⚠️ Notes importantes

- Le script met à jour uniquement le champ `created_by`
- Les tickets déjà à jour (created_by = Edwige) sont ignorés
- Les tickets introuvables dans Supabase sont signalés mais n'interrompent pas le processus
- Le script inclut une pause de 100ms entre chaque mise à jour pour éviter de surcharger la base de données

