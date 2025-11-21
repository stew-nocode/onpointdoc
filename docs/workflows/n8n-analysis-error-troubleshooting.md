# Guide de Dépannage : Erreur "Le webhook N8N n'a pas retourné d'analyse valide"

## Erreur

```
[N8N_ERROR] Le webhook N8N n'a pas retourné d'analyse valide
```

## Causes possibles

Cette erreur se produit lorsque le workflow N8N ne retourne pas le format de réponse attendu. Vérifiez les points suivants :

### 1. Format de réponse incorrect

Le workflow N8N doit retourner un JSON avec ce format exact :

```json
{
  "success": true,
  "analysis": "## Analyse détaillée\n\n**Points clés** :\n- ..."
}
```

**Vérifications** :
- ✅ Le node "Respond to Webhook" retourne bien du JSON
- ✅ Le champ `success` est présent et vaut `true`
- ✅ Le champ `analysis` est présent et contient du texte (non vide)

### 2. Le champ "analysis" est vide

L'analyse générée par l'IA peut être vide.

**Vérifications** :
- Ouvrir le node OpenAI/Anthropic dans N8N
- Vérifier que l'IA a bien généré une réponse
- Vérifier que le node "Format Response" extrait correctement le texte

**Solution** : Vérifier le node "Format Response" (Étape 6) :

```javascript
// Vérifier que l'analyse n'est pas vide
if (!analysis || analysis.trim().length === 0) {
  throw new Error('L\'analyse générée est vide. Vérifiez la réponse de l\'IA.');
}
```

### 3. Format de réponse de l'IA inattendu

L'IA peut retourner différents formats selon le service utilisé (OpenAI, Anthropic, etc.).

**Vérifications** :
- Vérifier le format exact de la réponse dans le node IA
- Adapter le node "Format Response" pour extraire correctement le texte

**Solution** : Utiliser le code amélioré de l'Étape 6 qui gère plusieurs formats :

```javascript
// Extraire le texte selon le type de réponse
let analysis = '';
if (aiResponse.choices && Array.isArray(aiResponse.choices) && aiResponse.choices.length > 0) {
  // Format OpenAI
  analysis = aiResponse.choices[0].message?.content || '';
} else if (aiResponse.content) {
  // Format Anthropic ou autre
  analysis = aiResponse.content;
} else if (typeof aiResponse === 'string') {
  // Réponse directe en string
  analysis = aiResponse;
}
```

### 4. Le workflow ne répond pas correctement

Le node "Respond to Webhook" peut ne pas être correctement configuré.

**Vérifications** :
- Le node "Respond to Webhook" est bien connecté au flux de succès
- La configuration du node "Respond to Webhook" :
  - **Respond With** : `JSON`
  - **Response Body** : `{{ $json }}`

**Solution** : Vérifier que le node retourne bien le format attendu :

```javascript
// Dans le node "Format Response" (avant "Respond to Webhook")
return {
  success: true,
  analysis: analysis.trim(),
  context: originalData.context,
  id: originalData.originalData?.id || originalData.id,
  generatedAt: new Date().toISOString()
};
```

### 5. Erreur dans le workflow non gérée

Une erreur peut survenir dans le workflow mais n'être pas correctement formatée.

**Vérifications** :
- Vérifier les logs N8N pour voir s'il y a des erreurs
- Vérifier que les branches d'erreur sont bien configurées
- Vérifier que les erreurs sont bien formatées avant d'arriver au "Respond to Webhook"

**Solution** : Ajouter un node "Format Error Response" qui formate toutes les erreurs :

```javascript
// Dans "Format Error Response"
const errorData = $input.item.json;
const errorMessage = errorData.error?.message || 
                     errorData.error || 
                     errorData.message || 
                     'Erreur inconnue dans le workflow';

return {
  success: false,
  error: errorMessage,
  context: errorData.context || 'unknown',
  id: errorData.id || 'unknown'
};
```

## Diagnostic étape par étape

### 1. Tester le workflow manuellement dans N8N

1. Ouvrir le workflow dans N8N
2. Cliquer sur **"Execute Workflow"**
3. Entrer des données de test :
   ```json
   {
     "context": "ticket",
     "id": "OD-123",
     "identifier_type": "jira_issue_key",
     "question": "Analyse l'historique complet du ticket..."
   }
   ```
4. Exécuter le workflow et vérifier chaque node
5. Vérifier la réponse finale dans le node "Respond to Webhook"

### 2. Vérifier le format de la réponse

Dans le node "Respond to Webhook", vérifier que la réponse contient :

```json
{
  "success": true,
  "analysis": "texte de l'analyse..."
}
```

### 3. Vérifier les logs N8N

1. Aller dans l'interface N8N
2. Cliquer sur l'exécution du workflow
3. Examiner chaque node pour voir les données et erreurs
4. Vérifier particulièrement :
   - Node Supabase : le ticket est-il bien récupéré ?
   - Node IA : l'IA a-t-elle bien généré une réponse ?
   - Node "Format Response" : l'extraction du texte est-elle correcte ?

### 4. Vérifier les logs de l'application Next.js

Dans le terminal où tourne `npm run dev`, chercher :

```
[N8N_ERROR] Le webhook N8N n'a pas retourné d'analyse valide: ...
```

Le message d'erreur devrait maintenant inclure plus de détails sur la réponse reçue.

## Solution rapide : Ajouter des logs de débogage

Dans le node "Format Response" avant le "Respond to Webhook", ajouter :

```javascript
const formatted = {
  success: true,
  analysis: analysis.trim(),
  context: originalData.context,
  id: originalData.originalData?.id || originalData.id,
  generatedAt: new Date().toISOString()
};

// Log pour débogage (à retirer en production)
console.log('Formatted response:', JSON.stringify(formatted, null, 2));
console.log('Analysis length:', formatted.analysis.length);

return formatted;
```

## Vérification finale

Après avoir corrigé le workflow, vérifier que :

1. ✅ Le workflow retourne toujours `{ success: true, analysis: "..." }` en cas de succès
2. ✅ Le workflow retourne toujours `{ success: false, error: "..." }` en cas d'erreur
3. ✅ Le champ `analysis` n'est jamais vide ou null
4. ✅ Tous les chemins (succès et erreur) passent par le même "Respond to Webhook"

## Message d'erreur amélioré

Le code a été amélioré pour afficher plus de détails dans l'erreur. Si vous voyez toujours cette erreur, le message devrait maintenant inclure :

- Le message d'erreur du workflow N8N (si présent)
- La réponse complète reçue du webhook N8N

Utilisez ces informations pour identifier le problème exact dans votre workflow N8N.

