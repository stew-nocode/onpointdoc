# Guide Rapide - Configuration JIRA

## ✅ Vérification Rapide

Vérifier que les variables d'environnement sont configurées :

```bash
node scripts/check-jira-env.js
```

## 📋 Variables Requises

Dans votre fichier `.env.local` (à la racine du projet) :

```env
# JIRA Configuration
JIRA_URL=https://onpointdigital.atlassian.net
JIRA_USERNAME=support@onpointafrica.com
JIRA_TOKEN=votre-token-api-jira
```

## 🔑 Obtenir un Token API JIRA

1. Aller sur : https://id.atlassian.com/manage-profile/security/api-tokens
2. Cliquer sur **"Create API token"**
3. Donner un nom (ex: "OnpointDoc Integration")
4. **Copier le token** (affiché une seule fois)
5. Coller dans `.env.local` comme valeur de `JIRA_TOKEN`

## ✅ État Actuel

D'après le test de vérification :
- ✅ **JIRA_URL** : Configuré (`https://onpointdigital.atlassian.net`)
- ✅ **JIRA_USERNAME** : Configuré (`support@onpointafrica.com`)
- ✅ **JIRA_TOKEN** : Configuré (192 caractères)
- ✅ **Connexion JIRA** : Validée
- ✅ **Accès projet OD** : Confirmé

## 🚀 Prêt à Utiliser

Votre configuration est **complète et fonctionnelle** ! Vous pouvez maintenant :

1. **Créer des tickets BUG/REQ** → Création automatique dans JIRA
2. **Transférer des ASSISTANCE** → Création JIRA lors du transfert
3. **Synchroniser les statuts** → Via webhooks JIRA (à configurer)

## 📚 Documentation Complète

Pour plus de détails, voir [`docs/configuration-jira-env.md`](./configuration-jira-env.md)

