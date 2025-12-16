# Configuration des Webhooks Brevo

Ce guide explique comment configurer les webhooks Brevo pour recevoir les événements email en temps réel dans OnpointDoc.

## 🎯 Pourquoi les Webhooks ?

Les webhooks permettent de recevoir les statistiques de **TOUS** les emails, y compris :
- ✅ Campagnes classiques
- ✅ Campagnes trigger
- ✅ **Automatisations** (workflows)
- ✅ Emails transactionnels

## 📋 Prérequis

1. Compte Brevo avec accès aux webhooks
2. URL publique pour OnpointDoc (production ou tunnel ngrok pour dev)
3. Variable d'environnement `SUPABASE_SERVICE_ROLE_KEY` configurée

## 🔧 Configuration dans Brevo

### Étape 1 : Accéder aux paramètres webhook

1. Connectez-vous à [Brevo](https://app.brevo.com)
2. Allez dans **Paramètres** (engrenage en haut à droite)
3. Cliquez sur **Webhooks** dans le menu de gauche
4. Ou accédez directement : https://app.brevo.com/settings/keys/webhook

### Étape 2 : Créer un nouveau webhook

1. Cliquez sur **"Ajouter un nouveau webhook"**
2. Configurez les paramètres :

| Paramètre | Valeur |
|-----------|--------|
| **URL** | `https://votre-domaine.com/api/webhooks/brevo` |
| **Description** | OnpointDoc - Tracking emails |
| **Type** | Marketing + Transactionnel |

### Étape 3 : Sélectionner les événements

Cochez **TOUS** ces événements :

- ✅ **Delivered** - Email délivré
- ✅ **Opened** - Email ouvert
- ✅ **Clicked** - Lien cliqué
- ✅ **Soft Bounce** - Rebond temporaire
- ✅ **Hard Bounce** - Rebond permanent
- ✅ **Spam** - Marqué comme spam
- ✅ **Unsubscribed** - Désabonné
- ✅ **Blocked** - Bloqué
- ✅ **Invalid** - Email invalide
- ✅ **Deferred** - Différé

### Étape 4 : Enregistrer

Cliquez sur **"Enregistrer"**

## 🧪 Test en développement local

Pour tester en local, utilisez **ngrok** pour exposer votre serveur :

```bash
# Installer ngrok si pas déjà fait
npm install -g ngrok

# Exposer le port 3000
ngrok http 3000
```

Utilisez l'URL ngrok (ex: `https://abc123.ngrok.io/api/webhooks/brevo`) dans Brevo.

## ✅ Vérification

### Test manuel de l'endpoint

```bash
curl https://votre-domaine.com/api/webhooks/brevo
```

Réponse attendue :
```json
{
  "status": "ok",
  "message": "Brevo webhook endpoint is ready",
  "timestamp": "2024-12-16T12:00:00.000Z"
}
```

### Vérifier les événements dans Supabase

```sql
SELECT * FROM brevo_email_events ORDER BY created_at DESC LIMIT 10;
```

## 📊 Événements stockés

Chaque événement contient :

| Champ | Description |
|-------|-------------|
| `event_type` | Type d'événement (opened, click, etc.) |
| `email` | Adresse email du destinataire |
| `campaign_id` | ID de la campagne (si applicable) |
| `template_id` | ID du template (pour automatisations) |
| `tag` | Tag personnalisé |
| `link_clicked` | URL cliquée (pour événements click) |
| `event_timestamp` | Date/heure de l'événement |

## 🔒 Sécurité

- L'endpoint accepte uniquement les POST de Brevo
- Les données sont validées avec Zod avant insertion
- Le client Supabase utilise `service_role` (bypass RLS)
- Les erreurs retournent 200 pour éviter les retries infinis

## 🚨 Troubleshooting

### Événements non reçus

1. Vérifiez que l'URL est accessible publiquement
2. Vérifiez les logs dans Brevo (Webhooks > Logs)
3. Vérifiez les logs serveur Next.js

### Erreur "SUPABASE_SERVICE_ROLE_KEY is not defined"

Ajoutez la clé dans `.env.local` :
```
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

La clé se trouve dans : Supabase Dashboard > Settings > API > service_role key


