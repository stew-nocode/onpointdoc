# Clés OBCS sans correspondance OD - Tickets EVA BASSE

**Date de création** : 2025-01-16  
**Contexte** : Mise à jour `created_by` pour EVA BASSE  
**Total** : 44 clés OBCS

> **⚠️ IMPORTANT** : Ce fichier a été consolidé avec les clés d'Edwige KOUASSI dans un fichier unique.  
> Voir : `docs/ticket/obcs-tous-sans-correspondance-od.md` et `liste-obcs-tous-sans-correspondance.txt`

## ⚠️ Tickets sans correspondance OD

Ces clés OBCS n'ont pas encore de clé OD correspondante dans le fichier `correspondance - Jira (3).csv`.  
Ils seront traités automatiquement lorsque la correspondance sera ajoutée au fichier.

### Liste des clés OBCS

Les 44 clés OBCS identifiées lors de la mise à jour des tickets d'EVA BASSE :

```
OBCS-10117
OBCS-9990
OBCS-9464
OBBCS-9199
OBCS-8886
... (et 39 autres)
```

> **Note** : Pour obtenir la liste complète, exécuter le script de mise à jour en mode dry-run ou consulter les logs de la dernière exécution.

## 📝 Notes

- Ces tickets ont été extraits depuis la Google Sheet filtrée sur EVA BASSE
- Ils nécessitent une correspondance OD avant de pouvoir mettre à jour `created_by`
- Vérifier dans le fichier de correspondance si ces clés existent avec une autre orthographe
- Une fois la correspondance ajoutée, exécuter :
  ```bash
  node scripts/update-eva-tickets-created-by.mjs --obcs LISTE_DES_CLES
  ```

## 🔍 Vérification

Pour vérifier si une correspondance existe avec une autre orthographe :
1. Ouvrir `docs/ticket/correspondance - Jira (3).csv`
2. Rechercher la clé OBCS dans la colonne "Lien de ticket sortant (Duplicate)"
3. Si trouvée, noter la clé OD correspondante dans la colonne "Clé de ticket"

## ✅ Action à faire

1. Vérifier chaque clé OBCS dans le fichier de correspondance
2. Ajouter les correspondances manquantes si elles existent
3. Relancer le script de mise à jour pour ces clés spécifiques

