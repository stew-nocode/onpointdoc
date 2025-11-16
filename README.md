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

Variables optionnelles (pour automatisation N8N/JIRA) :
- `N8N_WEBHOOK_URL` : URL du webhook N8N pour transfert Assistance → JIRA
- `N8N_API_KEY` : Clé API N8N (pour authentification)

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

