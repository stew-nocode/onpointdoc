/**
 * Mocks Supabase pour les tests
 */

import { vi } from 'vitest';

/**
 * Mock d'une réponse Supabase réussie
 */
export function createMockSupabaseResponse<T>(data: T) {
  return {
    data,
    error: null,
    count: Array.isArray(data) ? data.length : 1
  };
}

/**
 * Mock d'une réponse Supabase avec erreur
 */
export function createMockSupabaseError(message: string) {
  return {
    data: null,
    error: {
      message,
      details: null,
      hint: null,
      code: 'TEST_ERROR'
    },
    count: null
  };
}

/**
 * Crée un query builder mocké qui supporte toute la chaîne de méthodes Supabase
 */
function createMockQueryBuilder(finalResult: any) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis()
  };

  // Les méthodes qui retournent une promesse
  builder.single = vi.fn().mockResolvedValue(finalResult);
  builder.maybeSingle = vi.fn().mockResolvedValue(finalResult);

  // Pour les méthodes qui retournent directement une promesse (comme après .range())
  // On ajoute un then() qui retourne le résultat final
  const thenable = {
    ...builder,
    then: vi.fn((onResolve: any) => {
      return Promise.resolve(finalResult).then(onResolve);
    }),
    catch: vi.fn((onReject: any) => {
      if (finalResult.error) {
        return Promise.reject(finalResult).catch(onReject);
      }
      return Promise.resolve(finalResult);
    })
  };

  // Les méthodes qui terminent la chaîne retournent le thenable
  builder.range = vi.fn().mockReturnValue(thenable);
  builder.limit = vi.fn().mockReturnValue(thenable);
  builder.single = vi.fn().mockResolvedValue(finalResult);
  builder.maybeSingle = vi.fn().mockResolvedValue(finalResult);

  return builder;
}

/**
 * Mock d'un client Supabase complet avec support de toute la chaîne de méthodes
 */
export function createMockSupabaseClient() {
  const mockData: Record<string, any[]> = {};
  const queryBuilders: Record<string, any> = {};

  // Fonction pour créer un query builder pour une table spécifique
  const createTableQueryBuilder = (table: string, finalResult: any = createMockSupabaseResponse([])) => {
    if (!queryBuilders[table]) {
      queryBuilders[table] = createMockQueryBuilder(finalResult);
    }
    return queryBuilders[table];
  };

  const mockFrom = vi.fn((table: string) => {
    // Retourner un nouveau builder à chaque appel
    return createTableQueryBuilder(table);
  });

  // Méthode pour définir le résultat final d'une requête sur une table
  const setTableResult = (table: string, result: any) => {
    queryBuilders[table] = createMockQueryBuilder(result);
  };

  const client = {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        },
        error: null
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    },
    rpc: vi.fn().mockResolvedValue(createMockSupabaseResponse(null)),
    // Méthode helper pour les tests
    _setTableResult: setTableResult,
    _getTableResult: (table: string) => queryBuilders[table]
  };

  return client;
}

/**
 * Helper pour configurer facilement un mock Supabase pour un test
 */
export function setupMockSupabaseForTest(mockSupabase: ReturnType<typeof createMockSupabaseClient>) {
  return {
    // Configurer le résultat d'une requête sur une table
    setTableResult: (table: string, result: any) => {
      mockSupabase._setTableResult(table, result);
    },
    // Configurer auth.getUser
    setAuthUser: (user: { id: string; email: string } | null) => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user },
        error: null
      });
    },
    // Configurer auth.getUser avec erreur
    setAuthError: (error: string) => {
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: error }
      });
    }
  };
}

/**
 * Mock d'un profile utilisateur
 */
export const mockProfile = {
  id: 'profile-123',
  auth_uid: 'user-123',
  full_name: 'Test User',
  email: 'test@example.com',
  role: 'agent_support' as const,
  company_id: 'company-123'
};

/**
 * Mock d'un ticket
 */
export const mockTicket = {
  id: 'ticket-123',
  title: 'Test Ticket',
  description: 'Description du ticket test',
  ticket_type: 'ASSISTANCE' as const,
  status: 'Nouveau' as const,
  priority: 'Medium' as const,
  canal: 'Email' as const,
  created_at: '2025-01-19T10:00:00Z',
  created_by: 'profile-123',
  assigned_to: null,
  product_id: null,
  module_id: null,
  jira_issue_key: null,
  origin: 'supabase' as const
};
