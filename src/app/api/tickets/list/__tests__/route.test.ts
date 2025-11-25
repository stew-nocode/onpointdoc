/**
 * Tests d'intégration pour la route API /api/tickets/list
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { GET } from '../route';
import { createMockRequest } from '@/tests/helpers/test-utils';
import type { MockNextRequest } from '@/types/next-request-mock';
import {
  createMockSupabaseClient,
  mockTicket,
  setupMockSupabaseForTest,
  createMockSupabaseResponse
} from '@/tests/mocks/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Mock Supabase client utilitaire
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn()
}));

describe('API Route: /api/tickets/list', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let testHelpers: ReturnType<typeof setupMockSupabaseForTest>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    testHelpers = setupMockSupabaseForTest(mockSupabase);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      mockSupabase as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
  });

  it('devrait retourner une liste de tickets', async () => {
    // Arrange
    const mockTickets = [
      { ...mockTicket, id: 'ticket-1' },
      { ...mockTicket, id: 'ticket-2' }
    ];

    const result = createMockSupabaseResponse(mockTickets);
    result.count = 2;
    testHelpers.setTableResult('tickets', result);

    const request = createMockRequest('http://localhost:3000/api/tickets/list');

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.tickets).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.hasMore).toBe(false);
  });

  it('devrait filtrer par type de ticket', async () => {
    // Arrange
    const mockTickets = [{ ...mockTicket, ticket_type: 'BUG', id: 'ticket-bug-1' }];
    const result = createMockSupabaseResponse(mockTickets);
    result.count = 1;
    testHelpers.setTableResult('tickets', result);

    const request = createMockRequest('http://localhost:3000/api/tickets/list', {
      type: 'BUG'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.tickets).toHaveLength(1);
    expect(data.tickets[0].ticket_type).toBe('BUG');
  });

  it('devrait gérer les erreurs Supabase', async () => {
    // Arrange
    const errorResult = {
      data: null,
      error: { message: 'Erreur Supabase', code: 'TEST_ERROR' },
      count: null
    };
    testHelpers.setTableResult('tickets', errorResult);

    const request = createMockRequest('http://localhost:3000/api/tickets/list');

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('devrait retourner une erreur si la configuration Supabase manque', async () => {
    // Arrange - Mock des variables d'environnement manquantes
    // Note: Ce test peut ne pas fonctionner correctement car process.env est read-only
    // Il faudrait mock l'accès aux variables d'environnement dans la route API elle-même
    // Pour l'instant, on teste seulement que la route retourne une erreur en cas de problème
    
    const request = createMockRequest('http://localhost:3000/api/tickets/list');
    
    // Mock du client pour simuler une configuration manquante
    vi.mocked(createSupabaseServerClient).mockImplementationOnce(async () => {
      throw new Error('Configuration Supabase manquante');
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('devrait supporter la pagination', async () => {
    // Arrange
    const mockTickets = Array.from({ length: 25 }, (_, i) => ({
      ...mockTicket,
      id: `ticket-${i}`
    }));

    const result = createMockSupabaseResponse(mockTickets);
    result.count = 50;
    testHelpers.setTableResult('tickets', result);

    const request = createMockRequest('http://localhost:3000/api/tickets/list', {
      offset: '0',
      limit: '25'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.tickets).toHaveLength(25);
    expect(data.total).toBe(50);
    expect(data.hasMore).toBe(true);
  });
});
