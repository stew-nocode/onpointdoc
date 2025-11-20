# Méthodologie Clean Code - OnpointDoc

**Date:** 2025-01-19  
**Branche:** `refactor/clean-code`  
**Statut:** ✅ **MÉTHODOLOGIE PRINCIPALE**

## 🎯 Philosophie

**Le Clean Code devient la méthodologie la plus importante** pour tous les développements futurs du projet OnpointDoc.

## 📋 Principes Fondamentaux

### 1. **SOLID Principles**

Tous les modules doivent respecter les principes SOLID :

- **S**ingle Responsibility Principle (SRP) : Une classe/fonction = une responsabilité
- **O**pen/Closed Principle (OCP) : Ouvert à l'extension, fermé à la modification
- **L**iskov Substitution Principle (LSP) : Les sous-types doivent être substituables
- **I**nterface Segregation Principle (ISP) : Interfaces spécifiques plutôt que générales
- **D**ependency Inversion Principle (DIP) : Dépendre d'abstractions, pas d'implémentations

### 2. **DRY (Don't Repeat Yourself)**

- Éliminer toute duplication de code
- Extraire les patterns répétés dans des fonctions utilitaires
- Réutiliser les composants existants

### 3. **KISS (Keep It Simple, Stupid)**

- Simplicité avant tout
- Code facile à lire et comprendre
- Éviter la sur-ingénierie

### 4. **YAGNI (You Aren't Gonna Need It)**

- Ne pas implémenter de fonctionnalités "au cas où"
- Focus sur les besoins actuels
- Refactoring itératif

### 5. **Clean Architecture**

- Séparation claire des couches :
  - **UI Layer** : Composants React, présentation
  - **Application Layer** : Services, logique métier
  - **Domain Layer** : Types, validations (Zod)
  - **Infrastructure Layer** : Supabase, JIRA, N8N

## 🏗️ Architecture du Code

### Structure Recommandée

```
src/
├── app/                    # Routes Next.js (Server Components)
│   └── (main)/
│       ├── config/         # Pages de configuration
│       └── gestion/        # Pages de gestion
│
├── components/             # Composants UI réutilisables
│   ├── ui/                 # Composants ShadCN (système de design)
│   └── [feature]/          # Composants spécifiques à une feature
│       ├── [feature]-table-client.tsx    # Composant client
│       └── [feature]-form.tsx            # Formulaires
│
├── lib/                    # Bibliothèques et utilitaires
│   ├── errors/             # Gestion d'erreur (types, handlers)
│   ├── validators/         # Schémas Zod
│   ├── supabase/           # Clients Supabase
│   └── utils/              # Fonctions utilitaires
│
├── services/               # Logique métier (pur JavaScript/TypeScript)
│   ├── tickets/            # Services tickets
│   ├── jira/               # Services JIRA
│   └── [feature]/          # Services par feature
│       ├── index.ts        # API publique du service
│       └── __tests__/      # Tests unitaires
│
├── types/                  # Types TypeScript partagés
│   ├── ticket.ts
│   ├── profile.ts
│   └── ...
│
└── tests/                  # Infrastructure de tests
    ├── setup/              # Configuration globale
    ├── mocks/              # Mocks (Supabase, etc.)
    └── helpers/            # Helpers de test
```

### Règles de Séparation

#### ❌ À ÉVITER

```typescript
// ❌ Composant qui fait tout
export function TicketsPage() {
  const supabase = createSupabaseClient();
  const [tickets, setTickets] = useState([]);
  
  useEffect(() => {
    // Logique métier dans le composant
    supabase.from('tickets').select('*')
      .then(data => {
        // Transformation complexe
        const transformed = data.map(...);
        setTickets(transformed);
      });
  }, []);
  
  // Calculs complexes dans le composant
  const stats = tickets.reduce(...);
  
  return <div>...</div>;
}
```

#### ✅ À FAIRE

```typescript
// ✅ Service séparé
// src/services/tickets/index.ts
export async function listTicketsPaginated(...) {
  // Logique métier pure
}

// ✅ Hook personnalisé
// src/hooks/use-tickets.ts
export function useTickets() {
  // Logique de state et effets
  const [tickets, setTickets] = useState([]);
  useEffect(() => {
    listTicketsPaginated(...).then(setTickets);
  }, []);
  return { tickets };
}

// ✅ Composant simple
// src/app/(main)/gestion/tickets/page.tsx
export default function TicketsPage() {
  const { tickets } = useTickets();
  return <TicketsTable tickets={tickets} />;
}
```

## 📝 Standards de Code

### 1. **Nommage**

- **Fonctions** : Verbe + nom (`getUser`, `createTicket`, `updateProfile`)
- **Composants** : PascalCase (`TicketsTable`, `UserForm`)
- **Types/Interfaces** : PascalCase (`Ticket`, `UserProfile`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_TICKETS`, `API_BASE_URL`)
- **Variables** : camelCase (`userName`, `ticketCount`)

### 2. **Fonctions**

- **Maximum 20 lignes** par fonction
- **Maximum 3 paramètres** (utiliser un objet pour plus)
- **Un seul niveau d'indentation** si possible
- **Noms explicites** qui décrivent l'action

```typescript
// ❌ Fonction trop longue et complexe
function processTickets(data) {
  const results = [];
  for (const ticket of data) {
    if (ticket.status === 'new') {
      if (ticket.priority === 'high') {
        // 50 lignes de logique...
      }
    }
  }
  return results;
}

// ✅ Fonction courte et claire
function filterNewHighPriorityTickets(tickets: Ticket[]): Ticket[] {
  return tickets.filter(isNewHighPriorityTicket);
}

function isNewHighPriorityTicket(ticket: Ticket): boolean {
  return ticket.status === 'new' && ticket.priority === 'high';
}
```

### 3. **Composants React**

- **Maximum 100 lignes** par composant
- **Séparation** : Présentation vs Logique
- **Props typées** explicitement
- **Pas de logique métier** dans les composants

```typescript
// ❌ Composant avec logique métier
export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  const [filtered, setFiltered] = useState([]);
  
  useEffect(() => {
    // Logique métier complexe
    const result = tickets.filter(...).map(...).sort(...);
    setFiltered(result);
  }, [tickets]);
  
  return <table>...</table>;
}

// ✅ Composant simple avec hook
export function TicketsTable({ tickets }: Props) {
  const filteredTickets = useFilteredTickets(tickets);
  return <table>...</table>;
}

// Hook séparé
function useFilteredTickets(tickets: Ticket[]) {
  return useMemo(() => {
    return tickets.filter(...).map(...).sort(...);
  }, [tickets]);
}
```

### 4. **Services**

- **Fonctions pures** quand possible
- **Une responsabilité** par fonction
- **Types explicites** pour tous les paramètres et retours
- **Gestion d'erreur** avec `ApplicationError`

```typescript
// ✅ Service clean
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  // Validation
  const validated = createTicketSchema.parse(input);
  
  // Logique métier
  const ticket = await insertTicket(validated);
  
  // Actions secondaires
  if (validated.type !== 'ASSISTANCE') {
    await syncToJira(ticket);
  }
  
  return ticket;
}
```

### 5. **Gestion d'Erreur**

- **Toujours utiliser** `handleApiError` dans les routes API
- **Toujours utiliser** `createError` pour créer des erreurs typées
- **Jamais de** `throw new Error()` générique
- **Try/catch** systématique dans les routes API

```typescript
// ✅ Gestion d'erreur propre
export async function GET(req: NextRequest) {
  try {
    // ...
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
```

### 6. **Validation**

- **Toujours utiliser Zod** pour valider les entrées
- **Toujours utiliser** `safeParse()` pour une gestion d'erreur propre
- **Jamais de** `as` casting pour valider

```typescript
// ✅ Validation propre
const validationResult = schema.safeParse(body);
if (!validationResult.success) {
  return handleApiError(createError.validationError('Données invalides', {
    issues: validationResult.error.issues
  }));
}
const payload = validationResult.data; // Types inférés automatiquement
```

## 🧪 Tests

### Standards de Tests

- **Couverture minimum** : 80% pour les services critiques
- **Tests unitaires** : Services, utilitaires
- **Tests d'intégration** : Routes API
- **Tests e2e** : Workflows critiques

### Structure des Tests

```typescript
describe('Service: createTicket', () => {
  it('devrait créer un ticket ASSISTANCE avec succès', async () => {
    // Arrange
    const input = { ... };
    
    // Act
    const result = await createTicket(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.type).toBe('ASSISTANCE');
  });
});
```

## 📚 Documentation

### JSDoc pour les Fonctions Exportées

```typescript
/**
 * Crée un ticket dans la base de données
 * 
 * @param input - Données du ticket à créer
 * @returns Le ticket créé avec son ID
 * @throws {ApplicationError} Si la validation échoue ou si Supabase renvoie une erreur
 * 
 * @example
 * const ticket = await createTicket({
 *   title: 'Bug critique',
 *   type: 'BUG',
 *   // ...
 * });
 */
export async function createTicket(input: CreateTicketInput): Promise<Ticket> {
  // ...
}
```

## 🔍 Checklist de Code Review

### Avant de commiter :

- [ ] Code suit les principes SOLID
- [ ] Pas de duplication de code
- [ ] Fonctions < 20 lignes (ou justifiées)
- [ ] Composants < 100 lignes (ou justifiés)
- [ ] Types explicites partout
- [ ] Gestion d'erreur avec `handleApiError`
- [ ] Validation Zod avec `safeParse()`
- [ ] Tests pour les nouvelles fonctionnalités
- [ ] Documentation JSDoc pour les fonctions exportées
- [ ] Pas de `console.log` en production
- [ ] Pas de `as any` ou `as unknown`
- [ ] Nommage cohérent et explicite

## 🚀 Prochaines Étapes

1. **Phase 8** : Refactoring des composants existants
2. **Phase 9** : Extraction de hooks personnalisés
3. **Phase 10** : Documentation complète (JSDoc)
4. **Phase 11** : Optimisation des services selon SOLID
5. **Phase 12** : Réduction de la complexité cyclomatique

---

**Cette méthodologie doit être respectée pour tous les développements futurs.**

