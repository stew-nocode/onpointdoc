# Configuration des Variables d'Environnement JIRA

Ce guide explique comment configurer les variables d'environnement nécessaires pour l'intégration JIRA directe (sans N8N).

## 📋 Variables Requises

### 1. JIRA_URL
**Description**: URL de votre instance JIRA  
**Format**: `https://votre-entreprise.atlassian.net`  
**Exemple**: `https://onpointdigital.atlassian.net`  
**Important**: Ne pas inclure de slash final (`/`)

**Alternative**: `JIRA_BASE_URL` (acceptée mais non recommandée)

### 2. JIRA_USERNAME
**Description**: Email ou nom d'utilisateur JIRA  
**Format**: Email complet ou nom d'utilisateur  
**Exemple**: `votre-email@example.com`

**Alternatives acceptées**:
- `JIRA_EMAIL`
- `JIRA_API_EMAIL`

### 3. JIRA_TOKEN
**Description**: Token API JIRA pour l'authentification  
**Format**: Chaîne de caractères générée par Atlassian  
**Exemple**: `ATATT3xFfGF0...` (token long)

**Comment obtenir un token**:
1. Aller sur https://id.atlassian.com/manage-profile/security/api-tokens
2. Cliquer sur "Create API token"
3. Donner un nom au token (ex: "OnpointDoc Integration")
4. Copier le token généré (il ne sera affiché qu'une seule fois)

**Alternative**: `JIRA_API_TOKEN` (acceptée mais non recommandée)

## 🔧 Configuration

### Étape 1 : Créer le fichier .env.local

```bash
# À la racine du projet
cp .env.example .env.local
```

### Étape 2 : Renseigner les variables

Ouvrir `.env.local` et remplir les valeurs :

```env
# JIRA Configuration
JIRA_URL=https://onpointdigital.atlassian.net
JIRA_USERNAME=votre-email@onpointdigital.com
JIRA_TOKEN=ATATT3xFfGF0votre-token-complet
```

### Étape 3 : Vérifier la configuration

Vous pouvez tester la configuration avec le script :

```bash
node scripts/list-jira-projects.js
```

Si la configuration est correcte, vous verrez la liste des projets JIRA.

## 🔒 Sécurité

### ⚠️ Important
- **NE JAMAIS** commiter le fichier `.env.local` dans Git
- Le fichier `.env.local` est déjà dans `.gitignore`
- Ne partager **JAMAIS** votre token JIRA

### Bonnes Pratiques
1. Utiliser des tokens API dédiés pour chaque application
2. Régénérer les tokens régulièrement
3. Révoquer les tokens non utilisés
4. Utiliser des tokens avec des permissions minimales nécessaires

## 🧪 Test de Configuration

### Test 1 : Vérification des variables

Créer un script de test simple :

```bash
node -e "require('dotenv').config({ path: '.env.local' }); console.log('JIRA_URL:', process.env.JIRA_URL ? '✅' : '❌'); console.log('JIRA_USERNAME:', process.env.JIRA_USERNAME ? '✅' : '❌'); console.log('JIRA_TOKEN:', process.env.JIRA_TOKEN ? '✅' : '❌');"
```

### Test 2 : Connexion JIRA

```bash
node scripts/list-jira-projects.js
```

### Test 3 : Création de ticket (via l'application)

1. Démarrer l'application : `npm run dev`
2. Créer un ticket BUG ou REQ
3. Vérifier que le ticket JIRA est créé automatiquement
4. Vérifier que `jira_issue_key` est renseigné dans Supabase

## 🐛 Dépannage

### Erreur : "Configuration JIRA manquante"

**Cause**: Une ou plusieurs variables ne sont pas définies

**Solution**:
1. Vérifier que `.env.local` existe à la racine du projet
2. Vérifier que les variables sont bien nommées (sans fautes de frappe)
3. Vérifier qu'il n'y a pas d'espaces autour du `=`
4. Redémarrer le serveur Next.js après modification

### Erreur : "Erreur d'authentification HTTP 401"

**Cause**: Token JIRA invalide ou expiré

**Solution**:
1. Vérifier que le token est correct (copier-coller complet)
2. Générer un nouveau token sur https://id.atlassian.com/manage-profile/security/api-tokens
3. Mettre à jour `JIRA_TOKEN` dans `.env.local`
4. Redémarrer le serveur

### Erreur : "Erreur HTTP 403"

**Cause**: Permissions insuffisantes sur le projet JIRA

**Solution**:
1. Vérifier que l'utilisateur JIRA a les permissions nécessaires
2. Vérifier l'accès au projet "OD" (OBC)
3. Contacter l'administrateur JIRA si nécessaire

### Erreur : "Erreur HTTP 404"

**Cause**: URL JIRA incorrecte ou projet inexistant

**Solution**:
1. Vérifier que `JIRA_URL` est correct (sans slash final)
2. Vérifier que le projet "OD" existe dans JIRA
3. Tester l'URL dans un navigateur

## 📝 Variables Optionnelles

### JIRA_SUPABASE_TICKET_ID_FIELD
**Description**: Custom Field JIRA pour stocker l'ID Supabase  
**Par défaut**: `customfield_10001`  
**Usage**: Permet de lier les tickets JIRA aux tickets Supabase

**Comment trouver le custom field**:
1. Aller dans JIRA → Settings → Issues → Custom fields
2. Chercher le custom field qui stocke l'ID Supabase
3. Noter l'ID (ex: `customfield_10001`)

## 🔄 Migration depuis N8N

Si vous utilisiez N8N précédemment, vous pouvez supprimer ces variables (non utilisées maintenant) :
- `N8N_WEBHOOK_URL`
- `N8N_API_KEY`

L'intégration JIRA se fait maintenant directement depuis l'application Next.js.

## 📚 Ressources

- [Documentation API JIRA](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Créer un token API JIRA](https://id.atlassian.com/manage-profile/security/api-tokens)
- [Guide de vérification](./verification-refactoring-statuts-jira.md)

