# Guide des Scripts d'Import - OnpointDoc

## 📋 Vue d'ensemble

Ce répertoire contient tous les scripts d'import de données pour OnpointDoc. Ces scripts permettent d'importer des données depuis diverses sources (CSV, JSON, JIRA) vers Supabase de manière contrôlée et traçable.

## 🚀 Prérequis

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
# Supabase (requis pour la plupart des scripts)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Jira (requis pour scripts/list-jira-projects.js)
JIRA_URL=https://your-company.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_TOKEN=your-api-token
# Alternative: JIRA_EMAIL et JIRA_API_TOKEN peuvent être utilisés
```

> **⚠️ Important** : Le `SUPABASE_SERVICE_ROLE_KEY` est nécessaire pour contourner les RLS et créer des comptes Auth. Ne le partagez jamais publiquement.

### Dépendances

```bash
npm install
```

Les scripts utilisent :
- `@supabase/supabase-js` - Client Supabase
- `dotenv` - Gestion des variables d'environnement

## 📁 Structure des scripts

### Convention de nommage

- `import-{entity}-{company}.js` - Import spécifique à une entreprise
- `import-{entity}.js` - Import générique d'une entité
- `update-{entity}-{field}.js` - Mise à jour d'un champ spécifique

### Catégories

#### 1. Entreprises (`companies`)
- `import-companies.js` - Import initial
- `import-companies-complete.js` - Import complet avec IDs JIRA

#### 2. Structure produit
- `import-submodules-{module}.js` - Import sous-modules par module

#### 3. Utilisateurs internes
- `import-users-support.js` - Équipe Support OBC
- `import-onpoint-africa-group-users.js` - Employés ONPOINT AFRICA GROUP

#### 4. Contacts clients
- `import-contacts-{company}.js` - Import contacts par entreprise (25+ scripts)
- `update-cilagri-job-titles.js` - Mise à jour fonctions CILAGRI

#### 5. Tickets (templates)
- `import-tickets-template.js` - Template pour import tickets JIRA

#### 6. Utilitaires Jira
- `list-jira-projects.js` - Liste les projets Jira disponibles via l'API REST

## 🔧 Utilisation

### Exécution d'un script

```bash
node scripts/import-contacts-aric.js
```

### Structure standard d'un script

Tous les scripts suivent cette structure :

```javascript
// 1. Configuration environnement
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
// ... chargement .env.local

// 2. Connexion Supabase
const supabase = createClient(url, key, { auth: { persistSession: false } });

// 3. Données à importer
const data = [ /* ... */ ];

// 4. Fonction principale
async function importData() {
  // - Recherche entités existantes
  // - Détection doublons
  // - Insertion/Mise à jour
  // - Gestion erreurs
  // - Rapport final
}

// 5. Exécution
importData().then(() => process.exit(0)).catch(...);
```

## 📊 Fonctionnalités communes

### Détection automatique des doublons

Tous les scripts vérifient l'existence avant insertion :
- Par email (pour les profils)
- Par nom (pour les entreprises)
- Par ID JIRA (quand disponible)

### Gestion des erreurs

- Erreurs individuelles : Un échec n'arrête pas l'import
- Logs détaillés : Chaque erreur est loggée avec contexte
- Rapport final : Résumé (succès, ignorés, erreurs)

### Support des mises à jour

Les scripts peuvent :
- Créer de nouvelles entités
- Mettre à jour les entités existantes
- Ignorer les doublons (selon configuration)

## 📝 Exemples d'utilisation

### Import de contacts clients

```bash
# Import contacts ARIC
node scripts/import-contacts-aric.js

# Import contacts CILAGRI
node scripts/import-contacts-cilagri.js
```

### Import de sous-modules

```bash
# Import sous-modules Finance
node scripts/import-submodules-finance.js
```

### Mise à jour de données

```bash
# Mise à jour fonctions CILAGRI
node scripts/update-cilagri-job-titles.js
```

### Utilitaires Jira

```bash
# Lister les projets Jira disponibles
node scripts/list-jira-projects.js
```

> **Note** : Ce script nécessite les variables d'environnement `JIRA_URL`, `JIRA_USERNAME` (ou `JIRA_EMAIL`), et `JIRA_TOKEN` (ou `JIRA_API_TOKEN`) dans `.env.local`.

## 🔍 Dépannage

### Erreur "Variables d'environnement manquantes"

Vérifiez que `.env.local` existe et contient :
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Erreur "Entreprise non trouvée"

Vérifiez que l'entreprise existe dans la table `companies` :
```sql
SELECT id, name FROM companies WHERE name ILIKE '%nom%';
```

### Erreur "ON CONFLICT"

Certains scripts utilisent `upsert` avec `ON CONFLICT`. Vérifiez :
- Les contraintes uniques dans la base
- Les colonnes utilisées pour la détection de doublons

### Erreur RLS

Les scripts utilisent le `service_role_key` pour contourner RLS. Si vous voyez des erreurs RLS :
- Vérifiez que vous utilisez bien le service role
- Vérifiez les policies RLS dans Supabase

### Erreur Jira "401 Unauthorized"

Pour `list-jira-projects.js`, si vous obtenez une erreur 401 :
- Vérifiez que `JIRA_URL` est correct (sans slash final)
- Vérifiez que `JIRA_USERNAME` correspond à votre email Jira
- Vérifiez que `JIRA_TOKEN` est valide (créer un nouveau token sur https://id.atlassian.com/manage-profile/security/api-tokens)
- Assurez-vous que le token n'a pas expiré

## 📚 Documentation complémentaire

- `docs/import/PLAN-IMPORT-DONNEES.md` - Plan d'import global
- `docs/import/GESTION-FONCTIONS-UTILISATEURS.md` - Gestion du champ `job_title`
- `docs/workflows/MAPPING-JIRA-SUPABASE.md` - Mapping JIRA ↔ Supabase

## 🛠️ Maintenance

### Créer un nouveau script d'import

1. Copiez un script existant similaire
2. Adaptez les données et la logique
3. Suivez la convention de nommage
4. Testez sur un petit échantillon
5. Documentez les spécificités

### Bonnes pratiques

- ✅ Toujours vérifier les doublons avant insertion
- ✅ Logger les erreurs avec contexte
- ✅ Fournir un rapport final détaillé
- ✅ Gérer les cas où les données sont optionnelles
- ✅ Utiliser `upsert` pour les mises à jour
- ✅ Valider les foreign keys avant insertion

### Tests

Avant d'exécuter un script sur toutes les données :
1. Testez sur un petit échantillon (1-2 entités)
2. Vérifiez les résultats dans Supabase
3. Validez les relations (foreign keys)
4. Exécutez sur l'ensemble des données

## 🔐 Sécurité

- ⚠️ Ne commitez jamais `.env.local`
- ⚠️ Ne partagez jamais le `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ Utilisez les scripts uniquement en environnement de développement/staging
- ⚠️ Pour la production, préférez les migrations SQL ou les API sécurisées

---

**Dernière mise à jour** : 2025-01-17
