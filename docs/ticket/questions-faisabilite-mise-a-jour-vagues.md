# Questions de Faisabilité - Mise à jour des tickets par vagues

## 📋 Contexte

**Fichier source :** Google Sheets  
**URL :** https://docs.google.com/spreadsheets/d/1c4PEgIGrhLBhzF3SYLNS-XsaPUl2tJk8awmbzBOj-dQ/edit?gid=0#gid=0

**Colonnes identifiées :**
- **"Clé de ticket"** : Contient les clés OBCS (ex: OBCS-11889)
- **"Entreprise"** : Déjà filtrée pour exclure "ALL" (traités précédemment)
- **"Utilisateurs"** : Profil qui demande le ticket

## 🎯 Objectif

Mettre à jour les tickets dans Supabase par **vagues** selon :
1. Les **entreprises** concernées
2. Les **utilisateurs** qui ont créé les tickets

---

## ❓ Questions de Faisabilité

### 1. **Correspondance OBCS → OD**

✅ **RÉSOLU** : Nous avons déjà le fichier de correspondance `correspondance - Jira (3).csv` avec ~1954 mappings.

**Question :** Pour les tickets OBCS qui n'ont **pas** de correspondance OD dans ce fichier :
- Doit-on les **ignorer** pour cette vague de mise à jour ?
- Ou faut-il les **rechercher différemment** (ex: dans Jira via le champ "Lien de ticket sortant (Duplicate)") ?

---

### 2. **Mapping Entreprise → Supabase**

**Question :** Comment gérer le mapping entre le nom d'entreprise dans le Google Sheet et l'ID d'entreprise dans Supabase ?
- Les noms d'entreprise dans le Sheet correspondent-ils **exactement** aux noms dans Supabase ?
- Y a-t-il des variations à prendre en compte (accents, majuscules, espaces) ?
- Devons-nous créer un **mapping manuel** pour les entreprises non trouvées ?

**Proposition :** Le script proposera automatiquement les correspondances par similarité de nom.

---

### 3. **Mapping Utilisateur → Profile ID**

**Question :** Comment identifier le `profile_id` (UUID) dans Supabase à partir du nom d'utilisateur dans le Sheet ?
- Le nom dans le Sheet correspond-il au champ `full_name` dans `profiles` ?
- Ou au champ `email` ?
- Y a-t-il un format spécifique (ex: "Prénom NOM", "NOM Prénom") ?

**Proposition :** Le script cherchera par :
1. **Exact match** sur `full_name`
2. **Similarité** sur `full_name` (normalisation : accents, casse)
3. **Match partiel** si plusieurs correspondances

---

### 4. **Champs à mettre à jour dans Supabase**

**Question :** Quels champs du ticket doivent être mis à jour ?
- `contact_user_id` : L'utilisateur qui a créé le ticket
- `company_id` : L'entreprise concernée
- Autres champs (ex: `created_by`, `canal`, etc.) ?

**Proposition par défaut :**
- `company_id` : À partir de la colonne "Entreprise"
- `contact_user_id` : À partir de la colonne "Utilisateurs"
- `created_by` : Doit-il aussi être mis à jour ? (actuellement c'est l'agent support qui crée)

---

### 5. **Structure de traitement par vagues**

**Question :** Comment organiser les vagues ?
- **Option A** : Par entreprise (tous les tickets d'une entreprise en une vague)
- **Option B** : Par combinaison entreprise + utilisateur (tous les tickets d'un utilisateur dans une entreprise)
- **Option C** : Par nombre de tickets (ex: 100 tickets par vague)

**Recommandation :** 
- **Option B** semble la plus logique pour un contrôle granulaire
- Permet de valider chaque combinaison avant de passer à la suivante
- Facilite le rollback si problème

---

### 6. **Gestion des tickets non trouvés**

**Question :** Que faire si un ticket OD n'existe pas dans Supabase ?
- Le **logger** dans un rapport pour traitement manuel ?
- Le **créer automatiquement** avec les données du Sheet ? (risqué)
- L'**ignorer silencieusement** ?

**Proposition :** Logging systématique dans un rapport CSV pour traitement manuel.

---

### 7. **Validation et Dry-Run**

**Question :** Préférez-vous :
- Un mode **dry-run** qui simule toutes les mises à jour sans modifier la DB ?
- Un mode **interactif** qui demande confirmation avant chaque vague ?
- Un mode **batch** qui traite toutes les vagues automatiquement ?

**Proposition :** Mode dry-run par défaut avec rapport détaillé, puis confirmation avant exécution réelle.

---

### 8. **Rapport et Traçabilité**

**Question :** Quel niveau de détail souhaitez-vous dans les rapports ?
- **Résumé** : Nombre de tickets mis à jour par entreprise/utilisateur
- **Détaillé** : Liste de tous les tickets traités avec avant/après
- **Erreurs** : Liste des tickets non traitables avec raison

**Proposition :** Les trois niveaux de rapport (résumé + détaillé + erreurs).

---

## 🔄 Processus proposé

### Phase 1 : Analyse
1. Télécharger et parser le CSV
2. Charger les correspondances OBCS → OD
3. Analyser la structure des données
4. Identifier les entreprises et utilisateurs uniques
5. Générer un rapport d'analyse

### Phase 2 : Mapping
1. Mapper les entreprises (Sheet → Supabase)
2. Mapper les utilisateurs (Sheet → Supabase)
3. Vérifier les tickets OD existants dans Supabase
4. Générer un rapport de mapping avec les correspondances

### Phase 3 : Validation
1. Mode dry-run : simuler toutes les mises à jour
2. Générer un rapport détaillé (avant/après)
3. Présenter les statistiques par entreprise/utilisateur
4. Demander confirmation

### Phase 4 : Exécution (par vagues)
1. Pour chaque combinaison entreprise + utilisateur :
   - Afficher le résumé (X tickets à mettre à jour)
   - Demander confirmation
   - Exécuter les mises à jour en batch
   - Générer un rapport de la vague
2. Continuer avec la vague suivante

---

## 📝 Actions attendues

Merci de répondre aux questions ci-dessus, et notamment :

1. ✅ **Traitement des tickets sans correspondance OD** : Ignorer ou rechercher ?
2. ✅ **Champs à mettre à jour** : `company_id` + `contact_user_id` uniquement ?
3. ✅ **Structure des vagues** : Par entreprise, par entreprise+utilisateur, ou par nombre ?
4. ✅ **Mode d'exécution** : Dry-run puis confirmation, ou automatique ?

Une fois ces réponses obtenues, je préparerai le script final de mise à jour.


