# Proposition de Colonnes - Tableau des Entreprises

## 📋 Colonnes Proposées (dans l'ordre d'affichage)

### ✅ **1. Nom** (obligatoire, toujours visible)
- **Type** : Texte (nom de l'entreprise)
- **Triable** : ✅ Oui (`sort=name`)
- **Recherche** : ✅ Oui (recherche principale)
- **Format** : Texte avec highlight si recherche active
- **Max-width** : 300px (truncate avec tooltip)

---

### ✅ **2. Pays** (recommandé, prioritaire)
- **Type** : Relation vers `countries`
- **Triable** : ✅ Oui (`sort=country`)
- **Recherche** : ❌ Non (via filtre)
- **Format** : Nom du pays (ex: "France", "Sénégal")
- **Affichage si vide** : "-" ou badge "Non défini"
- **Filtre** : QuickFilter disponible (avec/sans pays)
- **Icône** : 🌍 (optionnel)

**Justification** : Information géographique essentielle pour segmenter les entreprises par région.

---

### ✅ **3. Point focal** (recommandé, prioritaire)
- **Type** : Relation vers `profiles` (focal_user_id)
- **Triable** : ❌ Non (relation complexe)
- **Recherche** : ❌ Non (via filtre)
- **Format** : Nom complet de l'utilisateur (ex: "Jean DUPONT")
- **Affichage si vide** : "-" ou badge "Non assigné"
- **Filtre** : QuickFilter disponible (avec/sans point focal)
- **Icône** : 👤 User icon

**Justification** : Responsable de la relation avec l'entreprise, information critique pour le support.

---

### ✅ **4. Secteurs** (recommandé)
- **Type** : Relation many-to-many via `company_sector_link`
- **Triable** : ❌ Non (tableau de secteurs)
- **Recherche** : ❌ Non (via filtre)
- **Format** : Liste de secteurs séparés par virgule (ex: "Finance, Technologies")
- **Affichage si vide** : "-"
- **Truncate** : Oui (max 200px avec tooltip complet)
- **Filtre** : QuickFilter par secteur (si besoin)
- **Icône** : 🏢 Building icon (optionnel)

**Justification** : Permet de catégoriser les entreprises par secteur d'activité.

---

### ✅ **5. ID JIRA** (optionnel, si synchronisé)
- **Type** : Entier (`jira_company_id`)
- **Triable** : ✅ Oui (`sort=jira_id`)
- **Recherche** : ✅ Oui (recherche par ID)
- **Format** : Numéro JIRA (ex: "12345")
- **Affichage si vide** : "-"
- **Icône** : 🔗 Link icon
- **Action** : Lien vers JIRA si disponible

**Justification** : Permet de lier l'entreprise avec JIRA pour la synchronisation.

---

### ✅ **6. Date de création** (recommandé)
- **Type** : Timestamp (`created_at`)
- **Triable** : ✅ Oui (`sort=created_at`)
- **Recherche** : ❌ Non (via filtre date si besoin)
- **Format** : Date courte (ex: "15/12/2024")
- **Tooltip** : Date complète avec heure (ex: "15 décembre 2024 à 14:30")
- **Icône** : 📅 Calendar icon

**Justification** : Permet de voir les entreprises récemment ajoutées, standard dans toutes les pages.

---

### ✅ **7. Actions** (obligatoire, toujours visible)
- **Type** : Boutons d'action
- **Actions disponibles** :
  - 👁️ Voir (ViewCompanyDialog)
  - ✏️ Modifier (EditCompanyDialog)
  - 🗑️ Supprimer (DeleteCompanyButton)
- **Affichage** : Icônes qui apparaissent au hover (opacity-0 group-hover:opacity-100)
- **Position** : Dernière colonne, alignée à droite

---

## 📊 Structure Recommandée Finale

### Ordre d'affichage (gauche → droite) :

1. **Nom** ⭐ (toujours visible)
2. **Pays** ⭐ (prioritaire)
3. **Point focal** ⭐ (prioritaire)
4. **Secteurs** (recommandé)
5. **ID JIRA** (optionnel si utilisé)
6. **Date de création** (recommandé)
7. **Actions** (toujours visible)

---

## 🎨 Recommandations d'Affichage

### Priorité d'affichage selon la taille d'écran :
- **Desktop** : Toutes les colonnes
- **Tablet** : Nom, Pays, Point focal, Date de création, Actions
- **Mobile** : Nom, Pays, Actions (les autres en tooltip ou modal)

### Badges et Indicateurs :
- **Pays manquant** : Badge gris "Non défini"
- **Point focal manquant** : Badge orange "Non assigné" (alerte)
- **Secteurs** : Tooltip complet si truncate
- **JIRA non synchronisé** : Badge gris "Non synchronisé"

---

## 🔄 Comparaison avec Autres Pages

| Colonne | Tickets | Activités | Tâches | Entreprises (proposé) |
|---------|---------|-----------|--------|----------------------|
| Nom/Titre | ✅ | ✅ | ✅ | ✅ **Nom** |
| Statut | ✅ | ✅ | ✅ | ❌ (n/a) |
| Priorité | ✅ | ❌ | ❌ | ❌ (n/a) |
| Type | ✅ | ✅ | ❌ | ❌ (n/a) |
| Assigné à | ✅ | ✅ (participants) | ✅ | ✅ **Point focal** |
| Pays/Région | ❌ | ❌ | ❌ | ✅ **Pays** |
| Secteurs | ❌ | ❌ | ❌ | ✅ **Secteurs** |
| Date échéance | ✅ | ✅ | ✅ | ❌ (n/a) |
| Liens | ✅ | ✅ | ✅ | ❌ (n/a) |
| ID externe | ✅ (JIRA) | ❌ | ❌ | ✅ **ID JIRA** |
| Date création | ✅ | ✅ | ✅ | ✅ **Date création** |
| Créateur | ✅ | ✅ | ✅ | ❌ (peut être ajouté si besoin) |
| Actions | ✅ | ✅ | ✅ | ✅ **Actions** |

---

## ✅ Validation

**Colonnes principales recommandées :**
1. Nom ⭐
2. Pays ⭐
3. Point focal ⭐
4. Secteurs
5. Date de création
6. Actions ⭐

**Colonnes optionnelles :**
- ID JIRA (si synchronisation active)
- Créateur (si besoin de traçabilité)

---

**À valider par l'utilisateur avant implémentation.**
