/**
 * Tests unitaires pour le service listCampaignsPaginated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listCampaignsPaginated } from '../list-campaigns-paginated';
import {
  createMockSupabaseClient,
  setupMockSupabaseForTest,
  createMockSupabaseResponse
} from '@/tests/mocks/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Mock du client Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn()
}));

describe('Service: listCampaignsPaginated', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let testHelpers: ReturnType<typeof setupMockSupabaseForTest>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    testHelpers = setupMockSupabaseForTest(mockSupabase);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
  });

  describe('listCampaignsPaginated', () => {
    it('devrait retourner une liste de campagnes paginée', async () => {
      // Arrange
      const mockCampaigns = [
        {
          id: 'campaign-1',
          brevo_campaign_id: 123,
          campaign_name: 'Campagne Test 1',
          email_subject: 'Sujet Test 1',
          status: 'sent',
          campaign_type: 'classic',
          sent_at: '2025-01-01T10:00:00Z',
          open_rate: 25.5,
          click_rate: 5.2,
          emails_sent: 1000
        },
        {
          id: 'campaign-2',
          brevo_campaign_id: 124,
          campaign_name: 'Campagne Test 2',
          email_subject: 'Sujet Test 2',
          status: 'draft',
          campaign_type: 'trigger',
          sent_at: null,
          open_rate: null,
          click_rate: null,
          emails_sent: 0
        }
      ];

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 2;
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(0, 25);

      // Assert
      expect(response.campaigns).toHaveLength(2);
      expect(response.total).toBe(2);
      expect(response.hasMore).toBe(false);
      expect(response.campaigns[0].campaign_name).toBe('Campagne Test 1');
    });

    it('devrait filtrer par quickFilter "sent"', async () => {
      // Arrange
      const mockCampaigns = [
        {
          id: 'campaign-1',
          brevo_campaign_id: 123,
          campaign_name: 'Campagne Envoyée',
          email_subject: 'Sujet',
          status: 'sent',
          campaign_type: 'classic',
          sent_at: '2025-01-01T10:00:00Z',
          open_rate: 25.5,
          click_rate: 5.2,
          emails_sent: 1000
        }
      ];

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 1;
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(0, 25, undefined, 'sent');

      // Assert
      expect(response.campaigns).toHaveLength(1);
      expect(response.campaigns[0].status).toBe('sent');
    });

    it('devrait filtrer par quickFilter "draft"', async () => {
      // Arrange
      const mockCampaigns = [
        {
          id: 'campaign-1',
          brevo_campaign_id: 123,
          campaign_name: 'Campagne Brouillon',
          email_subject: 'Sujet',
          status: 'draft',
          campaign_type: 'classic',
          sent_at: null,
          open_rate: null,
          click_rate: null,
          emails_sent: 0
        }
      ];

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 1;
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(0, 25, undefined, 'draft');

      // Assert
      expect(response.campaigns).toHaveLength(1);
      expect(response.campaigns[0].status).toBe('draft');
    });

    it('devrait rechercher dans campaign_name et email_subject', async () => {
      // Arrange
      const mockCampaigns = [
        {
          id: 'campaign-1',
          brevo_campaign_id: 123,
          campaign_name: 'Campagne Promo',
          email_subject: 'Promotion spéciale',
          status: 'sent',
          campaign_type: 'classic',
          sent_at: '2025-01-01T10:00:00Z',
          open_rate: 25.5,
          click_rate: 5.2,
          emails_sent: 1000
        }
      ];

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 1;
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(0, 25, 'promo');

      // Assert
      expect(response.campaigns).toHaveLength(1);
      expect(response.campaigns[0].campaign_name).toContain('Promo');
    });

    it('devrait trier par colonne et direction', async () => {
      // Arrange
      const mockCampaigns = [
        {
          id: 'campaign-1',
          brevo_campaign_id: 123,
          campaign_name: 'Campagne A',
          email_subject: 'Sujet A',
          status: 'sent',
          campaign_type: 'classic',
          sent_at: '2025-01-02T10:00:00Z',
          open_rate: 30.0,
          click_rate: 6.0,
          emails_sent: 1000
        },
        {
          id: 'campaign-2',
          brevo_campaign_id: 124,
          campaign_name: 'Campagne B',
          email_subject: 'Sujet B',
          status: 'sent',
          campaign_type: 'classic',
          sent_at: '2025-01-01T10:00:00Z',
          open_rate: 25.0,
          click_rate: 5.0,
          emails_sent: 500
        }
      ];

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 2;
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(0, 25, undefined, undefined, 'sent_at', 'desc');

      // Assert
      expect(response.campaigns).toHaveLength(2);
      // Le premier devrait être le plus récent (sent_at DESC)
      expect(response.campaigns[0].sent_at).toBe('2025-01-02T10:00:00Z');
    });

    it('devrait retourner hasMore=true si plus de résultats disponibles', async () => {
      // Arrange
      const mockCampaigns = Array.from({ length: 25 }, (_, i) => ({
        id: `campaign-${i}`,
        brevo_campaign_id: 100 + i,
        campaign_name: `Campagne ${i}`,
        email_subject: `Sujet ${i}`,
        status: 'sent',
        campaign_type: 'classic',
        sent_at: '2025-01-01T10:00:00Z',
        open_rate: 25.5,
        click_rate: 5.2,
        emails_sent: 1000
      }));

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 50; // Total de 50, on en a 25
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(0, 25);

      // Assert
      expect(response.campaigns).toHaveLength(25);
      expect(response.total).toBe(50);
      expect(response.hasMore).toBe(true);
    });

    it('devrait gérer les erreurs Supabase', async () => {
      // Arrange
      const errorResult = {
        data: null,
        error: { message: 'Erreur Supabase', code: 'TEST_ERROR' },
        count: null
      };
      testHelpers.setTableResult('brevo_email_campaigns', errorResult);

      // Act & Assert
      await expect(listCampaignsPaginated(0, 25)).rejects.toThrow();
    });

    it('devrait gérer la pagination avec offset', async () => {
      // Arrange
      const mockCampaigns = Array.from({ length: 25 }, (_, i) => ({
        id: `campaign-${i + 25}`,
        brevo_campaign_id: 125 + i,
        campaign_name: `Campagne ${i + 25}`,
        email_subject: `Sujet ${i + 25}`,
        status: 'sent',
        campaign_type: 'classic',
        sent_at: '2025-01-01T10:00:00Z',
        open_rate: 25.5,
        click_rate: 5.2,
        emails_sent: 1000
      }));

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 100; // Total de 100, on en a 25 à partir de l'offset 25
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(25, 25);

      // Assert
      expect(response.campaigns).toHaveLength(25);
      expect(response.total).toBe(100);
      // offset (25) + limit (25) = 50 < 100, donc hasMore = true
      expect(response.hasMore).toBe(true);
    });

    it('devrait ignorer les espaces dans la recherche', async () => {
      // Arrange
      const mockCampaigns = [
        {
          id: 'campaign-1',
          brevo_campaign_id: 123,
          campaign_name: 'Campagne Test',
          email_subject: 'Sujet Test',
          status: 'sent',
          campaign_type: 'classic',
          sent_at: '2025-01-01T10:00:00Z',
          open_rate: 25.5,
          click_rate: 5.2,
          emails_sent: 1000
        }
      ];

      const result = createMockSupabaseResponse(mockCampaigns);
      result.count = 1;
      testHelpers.setTableResult('brevo_email_campaigns', result);

      // Act
      const response = await listCampaignsPaginated(0, 25, '  test  ');

      // Assert
      expect(response.campaigns).toHaveLength(1);
    });
  });
});

