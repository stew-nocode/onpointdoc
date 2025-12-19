# Templates Email Brevo pour OnpointDoc

Ce dossier contient les templates HTML pour les emails transactionnels envoyés via Brevo.

## 📋 Liste des Templates

| Fichier | Événement | Description |
|---------|-----------|-------------|
| `ticket-created.html` | Ticket créé | Confirmation de réception de demande |
| `ticket-assigned.html` | Ticket assigné | Notification qu'un agent travaille dessus |
| `ticket-resolved.html` | Ticket résolu | Notification de résolution |
| `ticket-feedback.html` | Enquête satisfaction | Demande d'évaluation (24h après résolution) |

## 🚀 Comment Importer dans Brevo

### 1. Connexion à Brevo
- Allez sur [app.brevo.com](https://app.brevo.com)
- Connectez-vous avec vos identifiants

### 2. Créer un Template
1. Allez dans **Transactional** > **Templates**
2. Cliquez sur **Create a template**
3. Sélectionnez **Drag & Drop Editor** ou **Paste your code**
4. Si code : collez le contenu HTML du fichier

### 3. Configurer le Template
- **Nom** : `ticket_created`, `ticket_assigned`, `ticket_resolved`, `ticket_feedback`
- **Sujet** : Voir dans chaque fichier HTML
- **Variables** : Les `{{params.xxx}}` sont automatiquement détectées

### 4. Récupérer l'ID
- Une fois le template sauvegardé, l'ID apparaît dans l'URL
- Exemple : `https://app.brevo.com/templates/transactional/123` → ID = `123`

### 5. Configurer les Variables d'Environnement
```bash
BREVO_TEMPLATE_TICKET_CREATED="123"
BREVO_TEMPLATE_TICKET_ASSIGNED="124"
BREVO_TEMPLATE_TICKET_RESOLVED="125"
BREVO_TEMPLATE_TICKET_FEEDBACK="126"
```

## 📝 Variables Disponibles

### Toutes les templates
| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{params.ticket_id}}` | ID du ticket | `ABC123` |
| `{{params.ticket_title}}` | Titre | `Problème de connexion` |
| `{{params.ticket_type}}` | Type | `BUG`, `REQ`, `ASSISTANCE` |
| `{{params.ticket_status}}` | Statut | `Nouveau`, `En_cours` |
| `{{params.ticket_priority}}` | Priorité | `Low`, `Medium`, `High`, `Critical` |
| `{{params.ticket_created_at}}` | Date création | `16/12/2025 14:30` |
| `{{params.portal_url}}` | Lien vers le ticket | `https://app.onpointdoc.com/tickets/xxx` |
| `{{params.support_email}}` | Email support | `support@onpointafrica.com` |
| `{{params.company_name}}` | Nom entreprise | `Onpoint Digital` |

### Template `ticket-assigned.html`
| Variable | Description |
|----------|-------------|
| `{{params.agent_name}}` | Nom de l'agent assigné |

### Template `ticket-resolved.html`
| Variable | Description |
|----------|-------------|
| `{{params.resolution_summary}}` | Résumé de la résolution |
| `{{params.feedback_url}}` | Lien vers l'enquête |

### Template `ticket-feedback.html`
| Variable | Description |
|----------|-------------|
| `{{params.feedback_url}}` | Lien vers le formulaire d'évaluation |

## 🎨 Personnalisation

### Couleurs
- **Bleu principal** : `#2563eb` (tickets créés)
- **Orange** : `#f59e0b` (en cours)
- **Vert** : `#16a34a` (résolu)
- **Violet** : `#8b5cf6` (feedback)

### Logo
Remplacez `https://app.onpointdoc.com/logo-white.png` par l'URL de votre logo.

### Polices
Les templates utilisent `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` pour une compatibilité email maximale.

## ✅ Test des Templates

1. Dans Brevo, utilisez **Send a test email**
2. Remplissez les variables de test
3. Vérifiez le rendu sur différents clients email (Gmail, Outlook, Apple Mail)

## 🔒 Bonnes Pratiques

1. **Ne pas modifier** les noms de variables `{{params.xxx}}`
2. **Tester** sur plusieurs clients email avant mise en production
3. **Utiliser des images hébergées** (pas d'images en base64)
4. **Garder les emails < 100KB** pour éviter le clipping Gmail








