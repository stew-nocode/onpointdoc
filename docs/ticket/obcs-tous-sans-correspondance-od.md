# Clés OBCS sans correspondance OD - Tous les agents support

**Date de création** : 2025-01-16  
**Contexte** : Mise à jour `created_by` pour les agents support  
**Total** : 62 clés OBCS (17 Edwige KOUASSI + 44 EVA BASSE, avec 1 doublon)

## ⚠️ Tickets sans correspondance OD

Ces clés OBCS n'ont pas encore de clé OD correspondante dans le fichier `correspondance - Jira (3).csv`.  
Ils seront traités automatiquement lorsque la correspondance sera ajoutée au fichier.

### Répartition par agent

- **Edwige KOUASSI** : 17 clés OBCS
- **EVA BASSE** : 44 clés OBCS
- **Total** : 61 clés OBCS

## 📝 Liste complète

Voir le fichier : `liste-obcs-tous-sans-correspondance.txt`

## 🔍 Vérification

Pour vérifier si une correspondance existe avec une autre orthographe :
1. Ouvrir `docs/ticket/correspondance - Jira (3).csv`
2. Rechercher la clé OBCS dans la colonne "Lien de ticket sortant (Duplicate)"
3. Si trouvée, noter la clé OD correspondante dans la colonne "Clé de ticket"

## ✅ Action à faire

1. Vérifier chaque clé OBCS dans le fichier de correspondance
2. Ajouter les correspondances manquantes si elles existent
3. Une fois les correspondances ajoutées, utiliser les scripts appropriés pour mettre à jour :
   ```bash
   # Pour Edwige KOUASSI
   node scripts/update-edwige-tickets-created-by.mjs --file liste-obcs-tous-sans-correspondance.txt
   
   # Pour EVA BASSE
   node scripts/update-eva-tickets-created-by.mjs --file liste-obcs-tous-sans-correspondance.txt
   ```

## 📋 Note importante

Ce fichier consolide **tous** les tickets sans correspondance OD pour tous les agents support.  
Une fois les correspondances ajoutées dans le CSV, relancer les scripts de mise à jour correspondants.

