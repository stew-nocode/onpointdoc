# Questions : Mapping via Google Sheet

## 📋 Contexte

L'utilisateur a un Google Sheet qui contient le mapping entre :
- **Clé de ticket OD** (ex: OD-1234)
- **ID de rapporteur** (le vrai créateur)
- **Lien du ticket entrant (Duplicate)** (probablement le ticket OBSC source)

## ❓ Questions à Clarifier

### 1. Lien du Google Sheet
- Est-ce le même lien que celui partagé précédemment ?
- Ou un nouveau lien spécifique pour cette analyse ?

### 2. Format de l'ID de rapporteur
- Est-ce un **Account ID JIRA** (format: `712020:xxxxx-xxxxx-...`) ?
- Ou un autre format (email, nom, ID numérique) ?

### 3. Format de la Clé de ticket
- Format exact : `OD-1234` ou `OD-01234` ?
- Correspond-il exactement au `jira_issue_key` dans Supabase ?

### 4. Identification dans Supabase
- Comment identifier le ticket Supabase depuis la clé OD ?
  - Via `tickets.jira_issue_key` ?
  - Via `jira_sync.jira_issue_key` ?

### 5. Structure du Sheet
- Y a-t-il un header/entête avec les noms de colonnes ?
- Les données sont-elles dans une seule feuille ou plusieurs ?
- Y a-t-il des filtres ou des lignes vides à ignorer ?

### 6. Scope des données
- Le sheet contient-il **tous** les tickets OD ?
- Ou seulement une partie (BUG + REQ uniquement) ?
- Y a-t-il des tickets OD qui ne sont pas dans le sheet ?

### 7. Action souhaitée
- Voulez-vous que je :
  1. Lise le Google Sheet (via API ou export CSV) ?
  2. Crée un script pour mapper les tickets ?
  3. Mette à jour `tickets.created_by` dans Supabase ?
  4. Génère un rapport de ce qui a été fait ?

## 🎯 Plan d'Action Proposé

Une fois les réponses obtenues :

1. **Lire le Google Sheet** (via API Google Sheets ou export CSV)
2. **Parser les données** et extraire le mapping Clé OD → ID Rapporteur
3. **Identifier les tickets dans Supabase** via `jira_issue_key`
4. **Mapper l'ID Rapporteur vers un profil Supabase** via `jira_user_id`
5. **Mettre à jour `tickets.created_by`** avec le profil trouvé
6. **Générer un rapport** des tickets mis à jour / non trouvés

