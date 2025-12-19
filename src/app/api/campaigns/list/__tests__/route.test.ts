/**
 * Tests d'intégration pour la route API /api/campaigns/list
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { GET } from '../route';
import { createMockRequest } from '@/tests/helpers/test-utils';
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

describe('API Route: /api/campaigns/list', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let testHelpers: ReturnType<typeof setupMockSupabaseForTest>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    testHelpers = setupMockSupabaseForTest(mockSupabase);
    vi.mocked(createSupabaseServerClient).mockResolvedValue(
      mockSupabase as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>
    );
  });

  it('devrait retourner une liste de campagnes', async () => {
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

    const request = createMockRequest('http://localhost:3000/api/campaigns/list');

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.campaigns).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.hasMore).toBe(false);
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

    const request = createMockRequest('http://localhost:3000/api/campaigns/list', {
      quick: 'sent'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.campaigns).toHaveLength(1);
    expect(data.campaigns[0].status).toBe('sent');
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

    const request = createMockRequest('http://localhost:3000/api/campaigns/list', {
      search: 'promo'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.campaigns).toHaveLength(1);
    expect(data.campaigns[0].campaign_name).toContain('Promo');
  });

  it('devrait valider le paramètre offset', async () => {
    // Arrange
    const request = createMockRequest('http://localhost:3000/api/campaigns/list', {
      offset: '-1'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toContain('offset');
  });

  it('devrait valider le paramètre limit', async () => {
    // Arrange
    const request = createMockRequest('http://localhost:3000/api/campaigns/list', {
      limit: '101'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toContain('limit');
  });

  it('devrait valider le quickFilter', async () => {
    // Arrange
    const request = createMockRequest('http://localhost:3000/api/campaigns/list', {
      quick: 'invalid'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toContain('filtre rapide');
  });

  it('devrait supporter la pagination', async () => {
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
    result.count = 50;
    testHelpers.setTableResult('brevo_email_campaigns', result);

    const request = createMockRequest('http://localhost:3000/api/campaigns/list', {
      offset: '0',
      limit: '25'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.campaigns).toHaveLength(25);
    expect(data.total).toBe(50);
    expect(data.hasMore).toBe(true);
  });

  it('devrait supporter le tri avec paramètre sort', async () => {
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

    const request = createMockRequest('http://localhost:3000/api/campaigns/list', {
      sort: 'sent_at:desc'
    });

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.campaigns).toHaveLength(2);
  });

  it('devrait gérer les erreurs Supabase', async () => {
    // Arrange
    const errorResult = {
      data: null,
      error: { message: 'Erreur Supabase', code: 'TEST_ERROR' },
      count: null
    };
    testHelpers.setTableResult('brevo_email_campaigns', errorResult);

    const request = createMockRequest('http://localhost:3000/api/campaigns/list');

    // Act
    const response = await GET(request as unknown as NextRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});

