# Clés OBCS sans correspondance OD - Tickets Edwige KOUASSI

**Date de création** : 2025-01-16  
**Contexte** : Mise à jour `created_by` pour Edwige KOUASSI  
**Total** : 17 clés OBCS

> **⚠️ IMPORTANT** : Ce fichier a été consolidé avec les clés d'EVA BASSE dans un fichier unique.  
> Voir : `docs/ticket/obcs-tous-sans-correspondance-od.md` et `liste-obcs-tous-sans-correspondance.txt`

## ⚠️ Tickets sans correspondance OD

Ces clés OBCS n'ont pas encore de clé OD correspondante dans le fichier `correspondance - Jira (3).csv`.  
Ils seront traités automatiquement lorsque la correspondance sera ajoutée au fichier.

### Liste des clés OBCS

```
OBCS-10485
OBCS-10264
OBCS-9997
OBCSS-9774
OBCS-8643
OBCS-1052
OBCS-730
OBCS-8900
OBCS-8898
OBCS-8773
OBCS-8425
OBCS-7147
OBCS-874
OBCS-800
OBCS-797
OBCS-766
OBCS-731
```

## 📝 Notes

- Ces tickets ont été extraits depuis la Google Sheet filtrée sur Edwige KOUASSI
- Ils nécessitent une correspondance OD avant de pouvoir mettre à jour `created_by`
- Vérifier dans le fichier de correspondance si ces clés existent avec une autre orthographe
- Une fois la correspondance ajoutée, exécuter :
  ```bash
  node scripts/update-edwige-tickets-created-by.mjs --obcs LISTE_DES_CLES
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

