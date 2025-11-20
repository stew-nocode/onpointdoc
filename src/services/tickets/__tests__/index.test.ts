/**
 * Tests unitaires pour les services tickets
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTicket, listTicketsPaginated } from '../index';
import {
  createMockSupabaseClient,
  mockTicket,
  mockProfile,
  setupMockSupabaseForTest,
  createMockSupabaseResponse
} from '@/tests/mocks/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Mock du client Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn()
}));

// Mock de createJiraIssue pour éviter les appels réels
vi.mock('@/services/jira/client', () => ({
  createJiraIssue: vi.fn().mockResolvedValue({
    success: true,
    jiraIssueKey: 'TEST-123'
  })
}));

describe('Services Tickets', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let testHelpers: ReturnType<typeof setupMockSupabaseForTest>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    testHelpers = setupMockSupabaseForTest(mockSupabase);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
  });

  describe('createTicket', () => {
    it('devrait créer un ticket ASSISTANCE avec succès', async () => {
      // Arrange
      const ticketInput = {
        title: 'Test Ticket',
        description: 'Description',
        type: 'ASSISTANCE' as const,
        priority: 'Medium' as const,
        channel: 'Email' as const,
        contactUserId: 'contact-123',
        productId: '',
        moduleId: '',
        customerContext: 'Test context'
      };

      // Configurer auth.getUser
      testHelpers.setAuthUser({ id: 'user-123', email: 'test@example.com' });

      // Configurer le résultat pour profiles
      testHelpers.setTableResult('profiles', createMockSupabaseResponse(mockProfile));

      // Configurer le résultat pour tickets (insert)
      const createdTicket = { ...mockTicket, ...ticketInput, id: 'new-ticket-123' };
      testHelpers.setTableResult('tickets', createMockSupabaseResponse(createdTicket));

      // Act
      const result = await createTicket(ticketInput);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('new-ticket-123');
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    });

    it('devrait lever une erreur si lutilisateur nest pas authentifié', async () => {
      // Arrange
      testHelpers.setAuthUser(null);

      // Act & Assert
      await expect(
        createTicket({
          title: 'Test',
          description: 'Test',
          type: 'ASSISTANCE',
          priority: 'Medium',
          channel: 'Email',
          contactUserId: 'contact-123',
          productId: '',
          moduleId: '',
          customerContext: 'Test context'
        })
      ).rejects.toThrow('Non authentifié');
    });

    it('devrait lever une erreur si le profil utilisateur est introuvable', async () => {
      // Arrange
      testHelpers.setAuthUser({ id: 'user-123', email: 'test@example.com' });
      testHelpers.setTableResult('profiles', createMockSupabaseResponse(null));

      // Act & Assert
      await expect(
        createTicket({
          title: 'Test',
          description: 'Test',
          type: 'ASSISTANCE',
          priority: 'Medium',
          channel: 'Email',
          contactUserId: 'contact-123',
          productId: '',
          moduleId: '',
          customerContext: 'Test context'
        })
      ).rejects.toThrow('Profil utilisateur introuvable');
    });
  });

  describe('listTicketsPaginated', () => {
    it('devrait retourner une liste de tickets paginée', async () => {
      // Arrange
      const mockTickets = [
        { ...mockTicket, id: 'ticket-1' },
        { ...mockTicket, id: 'ticket-2' }
      ];

      const result = createMockSupabaseResponse(mockTickets);
      result.count = 2;
      testHelpers.setTableResult('tickets', result);

      // Act
      const response = await listTicketsPaginated('ASSISTANCE', undefined, 0, 25);

      // Assert
      expect(response.tickets).toHaveLength(2);
      expect(response.total).toBe(2);
      expect(response.hasMore).toBe(false);
    });

    it('devrait filtrer par type de ticket', async () => {
      // Arrange
      const mockTickets = [{ ...mockTicket, ticket_type: 'BUG', id: 'ticket-bug-1' }];
      const result = createMockSupabaseResponse(mockTickets);
      result.count = 1;
      testHelpers.setTableResult('tickets', result);

      // Act
      const response = await listTicketsPaginated('BUG', undefined, 0, 25);

      // Assert
      expect(response.tickets).toHaveLength(1);
      expect(response.tickets[0].ticket_type).toBe('BUG');
    });

    it('devrait gérer les erreurs Supabase', async () => {
      // Arrange
      const errorResult = {
        data: null,
        error: { message: 'Erreur Supabase', code: 'TEST_ERROR' },
        count: null
      };
      testHelpers.setTableResult('tickets', errorResult);

      // Act & Assert
      await expect(
        listTicketsPaginated('ASSISTANCE', undefined, 0, 25)
      ).rejects.toThrow();
    });

    it('devrait retourner hasMore=true si plus de résultats disponibles', async () => {
      // Arrange
      const mockTickets = Array.from({ length: 25 }, (_, i) => ({
        ...mockTicket,
        id: `ticket-${i}`
      }));

      const result = createMockSupabaseResponse(mockTickets);
      result.count = 50; // Total de 50, on en a 25
      testHelpers.setTableResult('tickets', result);

      // Act
      const response = await listTicketsPaginated(undefined, undefined, 0, 25);

      // Assert
      expect(response.tickets).toHaveLength(25);
      expect(response.total).toBe(50);
      expect(response.hasMore).toBe(true);
    });
  });
});
