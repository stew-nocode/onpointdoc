# OnpointDoc

Socle Next.js (App Router) + TypeScript + Tailwind + ShadCN UI pour piloter les tickets, activités et tâches décrits dans `context-general.mdc`.

## Découpage

- `src/app` : routes server components (pages Dashboard, Tickets, Activités, Tâches).
- `src/components` : composants réutilisables (layout, navigation, formulaires).
- `src/ui` : primitives ShadCN adaptées (boutons, cartes, badges).
- `src/services` : logique métier et accès Supabase (tickets/activités/tâches).
- `src/lib` : clients Supabase, validations Zod, constantes navigation.

## Scripts

```bash
npm run dev      # démarrer le serveur Next
npm run build    # build de production
npm run lint     # lint ESLint (config Next)
npm run typecheck
```

## Configuration

### Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner les valeurs :

```bash
cp .env.example .env.local
```

Variables requises :
- `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase

Variables pour intégration JIRA directe (requis pour création/synchronisation de tickets) :
- `JIRA_URL` : URL de votre instance Jira (ex: `https://onpointdigital.atlassian.net`)
- `JIRA_USERNAME` ou `JIRA_EMAIL` : Email ou nom d'utilisateur Jira
- `JIRA_TOKEN` ou `JIRA_API_TOKEN` : Token API Jira (créé sur https://id.atlassian.com/manage-profile/security/api-tokens)

**Vérifier la configuration JIRA** :
```bash
node scripts/check-jira-env.js
```

**Documentation complète** : Voir [`docs/configuration-jira-env.md`](./docs/configuration-jira-env.md)

### Test Local du Webhook JIRA (avec ngrok)

Pour tester le webhook JIRA localement sans déployer :

1. **Installer ngrok** :
   ```bash
   winget install ngrok.ngrok
   # Ou télécharger depuis https://ngrok.com/download
   ```

2. **Configurer ngrok** (première fois) :
   ```bash
   ngrok config add-authtoken VOTRE_AUTHTOKEN
   # Récupérer le token sur https://dashboard.ngrok.com/get-started/your-authtoken
   ```

3. **Démarrer l'application** (Terminal 1) :
   ```bash
   npm run dev
   ```

4. **Démarrer ngrok** (Terminal 2) :
   ```bash
   ngrok http 3000
   # Ou utiliser le script helper:
   .\scripts\start-ngrok.ps1
   ```

5. **Configurer le webhook JIRA** avec l'URL ngrok : `https://xxxx.ngrok-free.app/api/webhooks/jira`

**Guide complet** : Voir [`docs/configuration-ngrok-local-testing.md`](./docs/configuration-ngrok-local-testing.md)

### Intégration N8N/JIRA

Voir la documentation complète dans [`docs/workflows/`](./docs/workflows/) :
- [`n8n-jira-integration.md`](./docs/workflows/n8n-jira-integration.md) : Documentation technique des workflows
- [`n8n-setup-guide.md`](./docs/workflows/n8n-setup-guide.md) : Guide de configuration N8N

## Étapes suivantes

1. ✅ Configurer les variables d'env (voir ci-dessus)
2. ✅ Brancher les produits/modules depuis Supabase (fait)
3. ✅ Implémenter le transfert Assistance → JIRA (fait)
4. ⏳ Configurer les workflows N8N selon `docs/workflows/n8n-setup-guide.md`
5. ⏳ Configurer les webhooks JIRA pour la synchronisation retour
6. ⏳ Finaliser les RLS Supabase (tables tickets, activities, tasks)

