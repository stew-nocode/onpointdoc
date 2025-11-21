# Guide de Configuration N8N pour l'Analyse IA

Ce guide explique comment configurer le workflow N8N pour générer des analyses d'historique via IA.

## Vue d'ensemble

Le workflow N8N permet de générer des analyses d'historique pour :
- **Tickets** : Analyse des interactions, statuts, commentaires et tendances
- **Entreprises** : Analyse des tickets liés, contacts, besoins et opportunités
- **Contacts** : Analyse des tickets, interactions et besoins spécifiques

## Architecture

```
Application Next.js
    ↓ (POST /api/n8n/analysis)
    ↓ { context, id, question }
Webhook N8N
    ↓ (Récupération données Supabase)
    ↓ (Génération IA)
    ↓ (Formatage réponse)
    ↓ { success, analysis }
Application Next.js
    ↓ (Affichage dans modal)
```

## Configuration du Workflow N8N

### Étape 1 : Créer le Webhook Trigger

1. Créer un nouveau workflow dans N8N
2. Ajouter un node **Webhook**
3. Configurer :
   - **HTTP Method** : `POST`
   - **Path** : `/webhook/analysis`
   - **Response Mode** : `Respond to Webhook`
   - **Authentication** : Optionnel (Header Auth avec token si `N8N_API_KEY` est configuré)

⚠️ **IMPORTANT** : Pour que le webhook soit accessible en production, vous devez **ACTIVER** le workflow en cliquant sur le bouton **"Active"** (bouton vert) en haut à droite du workflow. Sinon, le webhook ne fonctionnera qu'en mode test après avoir cliqué sur "Execute workflow".

### Étape 2 : Valider les données d'entrée

Ajouter un node **Function** pour valider et extraire les données :

```javascript
// Valider les données reçues
const body = $input.item.json;

if (!body.context || !body.id || !body.question) {
  throw new Error('Données invalides : context, id et question sont requis');
}

const { context, id, question } = body;

// Valider le contexte
const validContexts = ['ticket', 'company', 'contact'];
if (!validContexts.includes(context)) {
  throw new Error(`Contexte invalide : doit être ${validContexts.join(', ')}`);
}

return {
  context,
  id,
  question,
  timestamp: new Date().toISOString()
};
```

### Étape 3 : Récupérer les données depuis Supabase

Ajouter un node **Supabase** :

#### Pour les tickets :
- **Action** : `Get`
- **Table** : `tickets`
- **ID** : `{{ $json.id }}`
- **Select** : 
  ```
  *,
  product:products(id, name),
  module:modules(id, name),
  submodule:submodules(id, name),
  feature:features(id, name),
  reporter:profiles!tickets_reporter_id_fkey(id, full_name, email),
  assigned:profiles!tickets_assigned_to_fkey(id, full_name, email),
  contact:profiles!tickets_contact_user_id_fkey(id, full_name, email, company_id),
  ticket_status_history(*, changed_by:profiles(id, full_name)),
  ticket_comments(*, author:profiles(id, full_name)),
  jira_sync(*)
  ```

#### Pour les entreprises :
- **Action** : `Get`
- **Table** : `companies`
- **ID** : `{{ $json.id }}`
- **Select** :
  ```
  *,
  country:countries(id, name),
  focal_user:profiles!companies_focal_user_id_fkey(id, full_name, email),
  company_sector_link(sector:sectors(id, name)),
  profiles(*, tickets(*))
  ```

#### Pour les contacts :
- **Action** : `Get`
- **Table** : `profiles`
- **ID** : `{{ $json.id }}`
- **Filter** : `role = 'client'`
- **Select** :
  ```
  *,
  company:companies(id, name),
  tickets(*, product:products(id, name), module:modules(id, name))
  ```

### Étape 4 : Formater les données pour l'IA

Ajouter un node **Function** pour formater les données :

```javascript
const data = $input.item.json;
const context = data.context;
const question = data.question;

let formattedData = '';

switch (context) {
  case 'ticket':
    const ticket = data.ticket;
    formattedData = `
# Ticket ${ticket.id}
**Titre** : ${ticket.title}
**Type** : ${ticket.ticket_type}
**Statut** : ${ticket.status}
**Priorité** : ${ticket.priority}
**Canal** : ${ticket.canal}
**Description** : ${ticket.description || 'N/A'}
**Produit** : ${ticket.product?.name || 'N/A'}
**Module** : ${ticket.module?.name || 'N/A'}
**Date de création** : ${ticket.created_at}
**Rapporteur** : ${ticket.reporter?.full_name || ticket.reporter?.email || 'N/A'}
**Assigné à** : ${ticket.assigned?.full_name || ticket.assigned?.email || 'Non assigné'}

## Historique des statuts
${(ticket.ticket_status_history || []).map(h => `- ${h.status_from} → ${h.status_to} (${h.changed_at})`).join('\n')}

## Commentaires
${(ticket.ticket_comments || []).map(c => `- ${c.content} (${c.created_at})`).join('\n')}
`;
    break;

  case 'company':
    const company = data.company;
    formattedData = `
# Entreprise ${company.name}
**Pays** : ${company.country?.name || 'N/A'}
**Point focal** : ${company.focal_user?.full_name || company.focal_user?.email || 'N/A'}
**Secteurs** : ${(company.company_sector_link || []).map(l => l.sector?.name).filter(Boolean).join(', ') || 'N/A'}

## Tickets associés
${(company.profiles || []).flatMap(p => p.tickets || []).map(t => `- ${t.title} (${t.status})`).join('\n')}
`;
    break;

  case 'contact':
    const contact = data.contact;
    formattedData = `
# Contact ${contact.full_name || contact.email}
**Entreprise** : ${contact.company?.name || 'N/A'}
**Email** : ${contact.email}

## Tickets associés
${(contact.tickets || []).map(t => `- ${t.title} (${t.status}) - ${t.product?.name}/${t.module?.name}`).join('\n')}
`;
    break;
}

return {
  context,
  question,
  data: formattedData,
  originalData: data
};
```

### Étape 5 : Appeler l'IA (OpenAI / Anthropic / etc.)

Ajouter un node **OpenAI** (ou votre service IA préféré) :

- **Operation** : `Chat`
- **Model** : `gpt-4` ou `gpt-3.5-turbo`
- **Messages** :
  ```json
  [
    {
      "role": "system",
      "content": "Tu es un assistant expert en analyse de données de tickets support. Fournis des analyses détaillées, structurées et actionnables en français."
    },
    {
      "role": "user",
      "content": "{{ $json.question }}\n\nDonnées :\n{{ $json.data }}"
    }
  ]
  ```
- **Temperature** : `0.7`
- **Max Tokens** : `2000`

### Étape 6 : Formater la réponse

Ajouter un node **Function** pour formater la réponse :

```javascript
const aiResponse = $input.item.json;
const originalData = $('Format Data').item.json;

// Extraire le texte de l'analyse
const analysis = aiResponse.choices?.[0]?.message?.content || 
                 aiResponse.content || 
                 'Aucune analyse générée';

return {
  success: true,
  analysis: analysis,
  context: originalData.context,
  id: originalData.originalData.id,
  generatedAt: new Date().toISOString()
};
```

### Étape 7 : Gérer les erreurs

Ajouter un node **Error Trigger** ou un node **Function** avec try/catch :

```javascript
try {
  // Traitement normal
  return $input.item.json;
} catch (error) {
  return {
    success: false,
    error: error.message || 'Erreur inconnue',
    context: $('Validate Input').item.json.context,
    id: $('Validate Input').item.json.id
  };
}
```

### Étape 8 : Répondre au Webhook

Ajouter un node **Respond to Webhook** :

- **Respond With** : `JSON`
- **Response Body** : `{{ $json }}`

## Variables d'environnement N8N

Dans **Settings → Environment Variables**, ajouter :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
OPENAI_API_KEY=votre-openai-api-key
```

## Variables d'environnement Application Next.js

Dans `.env.local`, ajouter :

```env
# URL du webhook N8N pour l'analyse
N8N_ANALYSIS_WEBHOOK_URL=https://votre-n8n.example.com/webhook/analysis

# Optionnel : clé API pour authentification
N8N_API_KEY=votre-cle-api
```

## Format de la réponse N8N

Le workflow doit répondre avec :

### Succès
```json
{
  "success": true,
  "analysis": "## Analyse détaillée\n\n**Points clés** :\n- ...\n\n**Recommandations** :\n- ..."
}
```

### Erreur
```json
{
  "success": false,
  "error": "Message d'erreur descriptif"
}
```

## Sécurité

### Option 1 : Authentification par Header
Dans le node Webhook N8N :
- **Authentication** : `Header Auth`
- **Name** : `Authorization`
- **Value** : `Bearer {{ $env.N8N_API_KEY }}`

Dans l'application, le service inclut automatiquement le header si `N8N_API_KEY` est défini.

### Option 2 : Validation de l'origine
Dans le node Function de validation, ajouter :

```javascript
const headers = $input.all()[0].headers;
const origin = headers['origin'] || headers['referer'];

// Valider que la requête vient de votre domaine
if (!origin || !origin.includes('votre-domaine.com')) {
  throw new Error('Origine non autorisée');
}
```

## Test du workflow

### Test manuel depuis N8N
1. Cliquer sur **Execute Workflow**
2. Entrer les données de test :
   ```json
   {
     "context": "ticket",
     "id": "uuid-d-un-ticket-test",
     "question": "Analyse l'historique complet du ticket..."
   }
   ```

### Test depuis l'application
1. Aller sur la page des tickets
2. Cliquer sur l'icône **✨** à côté d'un ticket
3. Le modal s'ouvre et génère automatiquement l'analyse

## Optimisations possibles

1. **Cache** : Ajouter un node de cache pour éviter de régénérer la même analyse
2. **Streaming** : Pour des analyses longues, utiliser le streaming OpenAI
3. **Fallback** : Si l'IA échoue, retourner une analyse basique depuis les données brutes
4. **Personnalisation** : Adapter le prompt selon le contexte (ticket vs entreprise vs contact)

## Dépannage

### Erreur "Webhook N8N non configuré"
- Vérifier que `N8N_ANALYSIS_WEBHOOK_URL` est défini dans `.env.local`
- Vérifier l'URL du webhook dans N8N

### Erreur "Timeout"
- Augmenter le timeout dans le service (actuellement 60 secondes)
- Optimiser le workflow N8N (réduire les appels API)

### Analyse vide ou incomplète
- Vérifier que les données Supabase sont bien récupérées
- Vérifier que le prompt IA est correct
- Vérifier les logs N8N pour les erreurs

## Support

Pour toute question ou problème :
1. Vérifier les logs N8N dans l'interface
2. Vérifier les logs de l'application Next.js
3. Tester le webhook directement avec `curl` ou Postman

