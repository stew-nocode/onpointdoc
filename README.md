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

## Étapes suivantes

1. Configurer les variables d'env `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Brancher les tables décrites dans Supabase (tickets, activities, tasks, tables de liaison).
3. Brancher les flux N8N ↔ JIRA (server actions + webhooks Edge Functions).
4. Finaliser les formulaires (React Hook Form + Zod) et les RLS côté Supabase.

