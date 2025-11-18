# Gestion des Fonctions des Utilisateurs - OnpointDoc

## 📋 Problématique

Les utilisateurs ont besoin d'un champ pour stocker leur **fonction/poste de travail** (ex: "Chef comptable", "Directeur Technique", "Comptable", "Responsable Achats") distinct du **rôle système** (agent, manager, admin, director, client) et du **département** (Support, IT, Marketing).

## 🎯 Solution Proposée

### Option 1 : Champ simple `job_title` (Recommandé)

Ajouter un champ `job_title` (TEXT, nullable) dans la table `profiles`.

**Avantages :**
- ✅ Simple et flexible
- ✅ Pas de contrainte, permet toute fonction
- ✅ Facile à afficher et rechercher
- ✅ Pas besoin de table supplémentaire

**Inconvénients :**
- ⚠️ Pas de normalisation (risque de doublons : "Chef comptable" vs "Chef Comptable")
- ⚠️ Pas de liste prédéfinie

### Option 2 : Table séparée `job_titles` avec référence

Créer une table `job_titles` et référencer depuis `profiles.job_title_id`.

**Avantages :**
- ✅ Normalisation (évite les doublons)
- ✅ Liste prédéfinie possible
- ✅ Statistiques facilitées

**Inconvénients :**
- ⚠️ Plus complexe
- ⚠️ Nécessite une table supplémentaire
- ⚠️ Moins flexible pour les cas particuliers

## 💡 Recommandation

**Option 1** : Champ `job_title` simple dans `profiles`

### Implémentation

1. **Migration SQL** : Ajouter `job_title TEXT` à `profiles`
2. **Mise à jour des formulaires** : Ajouter le champ dans les dialogs de création/édition
3. **Affichage** : Afficher dans les tableaux et vues détaillées
4. **Recherche** : Permettre la recherche par fonction

### Exemple d'utilisation

- **Utilisateurs internes** : "Chef comptable", "Directeur Technique", "Responsable Achats"
- **Contacts clients** : "Chef comptable", "Comptable", "Standard", etc.

## 🔄 Impact sur l'import

Pour les contacts CILAGRI déjà importés, on pourrait :
1. Ajouter le champ `job_title`
2. Créer un script de mise à jour pour ajouter les fonctions depuis les données d'origine

---

**Question pour vous :**
- Préférez-vous l'Option 1 (champ simple) ou l'Option 2 (table séparée) ?
- Souhaitez-vous une liste prédéfinie de fonctions ou laisser libre ?

