# Documentation des Workflows OnpointDoc

Cette section contient la documentation complète des workflows d'automatisation entre Supabase, N8N et JIRA.

## Documents disponibles

1. **[n8n-jira-integration.md](./n8n-jira-integration.md)** : Documentation technique complète des workflows
   - Architecture générale
   - Workflow 1 : Transfert Assistance → JIRA
   - Workflow 2 : Synchronisation JIRA → Supabase
   - Mapping des champs
   - Règles anti-boucle
   - Gestion des erreurs

2. **[n8n-setup-guide.md](./n8n-setup-guide.md)** : Guide pratique de configuration N8N
   - Configuration des variables d'environnement
   - Étapes détaillées pour créer les workflows
   - Code JavaScript pour les nodes N8N
   - Tests et dépannage

## Vue d'ensemble rapide

### Transfert Assistance → JIRA

```
Agent Support → Clic "Transférer" → Supabase (statut="Transféré") 
→ Webhook N8N → Création ticket JIRA → Mise à jour Supabase (jira_issue_key)
```

### Synchronisation JIRA → Supabase

```
Agent IT (JIRA) → Changement statut/commentaire → Webhook JIRA 
→ N8N → Mise à jour Supabase → Affichage dans l'application
```

## Prochaines étapes

- [ ] Configurer les workflows N8N selon le guide
- [ ] Tester le transfert Assistance → JIRA
- [ ] Tester la synchronisation JIRA → Supabase
- [ ] Configurer les webhooks JIRA
- [ ] Mettre en place le monitoring des erreurs

