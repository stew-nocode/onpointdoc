# Configuration des Notifications Email pour les Tickets

## 🎯 Objectif

Envoyer des emails automatiques aux clients lors des événements ticket :
- Ticket créé → Email de confirmation
- Ticket assigné → Email "Un agent travaille sur votre demande"
- Ticket résolu → Email de résolution + Enquête satisfaction (24h après)

## 📋 Étapes de Configuration

### 1. Variables d'Environnement

Ajoutez dans votre fichier `.env.local` :

```bash
# --- Notifications Email Tickets ---
# Activer/désactiver les notifications
TICKET_NOTIFICATIONS_ENABLED="true"

# IDs des templates Brevo (à configurer après création)
BREVO_TEMPLATE_TICKET_CREATED="1"
BREVO_TEMPLATE_TICKET_ASSIGNED="2"
BREVO_TEMPLATE_TICKET_RESOLVED="3"
BREVO_TEMPLATE_TICKET_FEEDBACK="4"
BREVO_TEMPLATE_TICKET_REMINDER="5"

# Email support
SUPPORT_EMAIL="support@onpointafrica.com"
```

### 2. Créer les Templates dans Brevo

Connectez-vous à Brevo et créez les templates suivants :

#### Template 1 : Ticket Créé
- **Nom** : `ticket_created`
- **Sujet** : `Votre demande a été reçue - Ticket #{{params.ticket_id}}`
- **Variables disponibles** :
  - `{{params.ticket_id}}` - ID du ticket
  - `{{params.ticket_title}}` - Titre
  - `{{params.ticket_type}}` - Type (BUG, REQ, ASSISTANCE)
  - `{{params.ticket_created_at}}` - Date de création
  - `{{params.portal_url}}` - Lien vers le ticket
  - `{{params.support_email}}` - Email support

#### Template 2 : Ticket Assigné
- **Nom** : `ticket_assigned`
- **Sujet** : `Un agent travaille sur votre demande - Ticket #{{params.ticket_id}}`
- **Variables supplémentaires** :
  - `{{params.agent_name}}` - Nom de l'agent

#### Template 3 : Ticket Résolu
- **Nom** : `ticket_resolved`
- **Sujet** : `Votre demande a été résolue - Ticket #{{params.ticket_id}}`
- **Variables supplémentaires** :
  - `{{params.resolution_summary}}` - Résumé de la résolution

#### Template 4 : Enquête Satisfaction
- **Nom** : `ticket_feedback`
- **Sujet** : `Votre avis nous intéresse - Ticket #{{params.ticket_id}}`
- **Variables supplémentaires** :
  - `{{params.feedback_url}}` - Lien vers l'enquête

#### Template 5 : Rappel
- **Nom** : `ticket_reminder`
- **Sujet** : `Avez-vous besoin d'aide supplémentaire ? - Ticket #{{params.ticket_id}}`

### 3. Récupérer les IDs des Templates

1. Allez dans **Brevo > Transactional > Templates**
2. Pour chaque template, copiez l'ID
3. Mettez à jour les variables d'environnement

### 4. Activer les Notifications

```bash
TICKET_NOTIFICATIONS_ENABLED="true"
```

## 🔧 Utilisation dans le Code

### Déclenchement Manuel

```typescript
import { onTicketCreated, onTicketResolved } from '@/services/support';

// Quand un ticket est créé
await onTicketCreated({ ticket });

// Quand un ticket est résolu
await onTicketResolved({ ticket });
```

### Intégration Automatique (Recommandé)

Appelez les fonctions dans les Server Actions ou API Routes :

```typescript
// Dans src/app/api/tickets/route.ts (POST)
import { onTicketCreated } from '@/services/support';

export async function POST(request: Request) {
  // ... création du ticket ...
  
  // Notification (non-bloquante)
  onTicketCreated({ ticket }).catch(console.error);
  
  return Response.json(ticket);
}
```

## 📊 Audit et Monitoring

Les notifications sont loggées dans la table `ticket_email_logs` :

```sql
SELECT 
  event_type,
  recipient_email,
  success,
  error_message,
  sent_at
FROM ticket_email_logs
WHERE ticket_id = 'xxx'
ORDER BY sent_at DESC;
```

## ⚠️ Notes Importantes

1. **Rate Limiting** : Brevo a des limites d'envoi (1000 emails/seconde max)
2. **Désactivation** : Mettez `TICKET_NOTIFICATIONS_ENABLED="false"` pour désactiver
3. **Test** : Testez d'abord avec `TICKET_NOTIFICATIONS_ENABLED="false"` pour vérifier les logs
4. **Templates** : Les IDs de templates doivent correspondre à ceux de Brevo

## 🔗 Liens Utiles

- [Brevo Templates Transactionnels](https://app.brevo.com/templates/transactional)
- [Documentation API Brevo SMTP](https://developers.brevo.com/reference/sendtransacemail)








