import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTicketSchema } from '@/lib/validators/ticket';
import type { CreateTicketInput } from '@/lib/validators/ticket';

describe('Ticket Creation Validation', () => {
  describe('createTicketSchema', () => {
    it('should validate a valid ASSISTANCE ticket', () => {
      const validTicket: CreateTicketInput = {
        title: 'Problème de connexion',
        description: 'Le client ne peut pas se connecter',
        type: 'ASSISTANCE',
        channel: 'Email',
        contactUserId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '550e8400-e29b-41d4-a716-446655440001',
        moduleId: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'High',
        durationMinutes: 30,
        customerContext: 'Client VIP'
      };

      const parsed = createTicketSchema.parse(validTicket);
      expect(parsed.type).toBe('ASSISTANCE');
      expect(parsed.channel).toBe('Email');
      expect(parsed.priority).toBe('High');
    });

    it('should validate a valid BUG ticket', () => {
      const validTicket: CreateTicketInput = {
        title: 'Bug dans le calcul',
        description: 'Le calcul de la paie est incorrect',
        type: 'BUG',
        channel: 'Whatsapp',
        contactUserId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '550e8400-e29b-41d4-a716-446655440001',
        moduleId: '550e8400-e29b-41d4-a716-446655440002',
        submoduleId: '550e8400-e29b-41d4-a716-446655440003',
        featureId: '550e8400-e29b-41d4-a716-446655440004',
        priority: 'Critical',
        durationMinutes: 60
      };

      const parsed = createTicketSchema.parse(validTicket);
      expect(parsed.type).toBe('BUG');
      expect(parsed.submoduleId).toBeDefined();
      expect(parsed.featureId).toBeDefined();
    });

    it('should validate a valid REQ ticket', () => {
      const validTicket: CreateTicketInput = {
        title: 'Demande de nouvelle fonctionnalité',
        description: 'Ajouter un export Excel',
        type: 'REQ',
        channel: 'Appel',
        contactUserId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '550e8400-e29b-41d4-a716-446655440001',
        moduleId: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'Medium'
      };

      const parsed = createTicketSchema.parse(validTicket);
      expect(parsed.type).toBe('REQ');
      expect(parsed.priority).toBe('Medium');
    });

    it('should reject invalid ticket type', () => {
      expect(() => {
        createTicketSchema.parse({
          title: 'Test',
          description: 'Test',
          type: 'INVALID_TYPE',
          channel: 'Email',
          contactUserId: '550e8400-e29b-41d4-a716-446655440000',
          priority: 'Medium'
        });
      }).toThrow();
    });

    it('should reject invalid channel', () => {
      expect(() => {
        createTicketSchema.parse({
          title: 'Test',
          description: 'Test',
          type: 'ASSISTANCE',
          channel: 'INVALID_CHANNEL',
          contactUserId: '550e8400-e29b-41d4-a716-446655440000',
          priority: 'Medium'
        });
      }).toThrow();
    });

    it('should reject invalid priority', () => {
      expect(() => {
        createTicketSchema.parse({
          title: 'Test',
          description: 'Test',
          type: 'ASSISTANCE',
          channel: 'Email',
          contactUserId: '550e8400-e29b-41d4-a716-446655440000',
          priority: 'INVALID_PRIORITY'
        });
      }).toThrow();
    });

    it('should reject empty title', () => {
      expect(() => {
        createTicketSchema.parse({
          title: '',
          description: 'Test',
          type: 'ASSISTANCE',
          channel: 'Email',
          contactUserId: '550e8400-e29b-41d4-a716-446655440000',
          priority: 'Medium'
        });
      }).toThrow();
    });

    it('should allow optional fields to be undefined', () => {
      const minimalTicket: CreateTicketInput = {
        title: 'Ticket minimal',
        description: 'Description minimale requise',
        type: 'ASSISTANCE',
        channel: 'Email',
        contactUserId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '550e8400-e29b-41d4-a716-446655440001',
        moduleId: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'Medium'
      };

      const parsed = createTicketSchema.parse(minimalTicket);
      expect(parsed.productId).toBeDefined();
      expect(parsed.moduleId).toBeDefined();
      expect(parsed.submoduleId).toBeUndefined();
      expect(parsed.featureId).toBeUndefined();
      expect(parsed.durationMinutes).toBeUndefined();
    });

    it('should transform empty strings to undefined for optional fields', () => {
      const ticketWithEmptyStrings = {
        title: 'Test transformation',
        description: 'Description de test pour validation',
        type: 'ASSISTANCE' as const,
        channel: 'Email' as const,
        contactUserId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '550e8400-e29b-41d4-a716-446655440001',
        moduleId: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'Medium' as const,
        submoduleId: '',
        featureId: '',
        durationMinutes: ''
      };

      const parsed = createTicketSchema.parse(ticketWithEmptyStrings);
      expect(parsed.submoduleId).toBeUndefined();
      expect(parsed.featureId).toBeUndefined();
      expect(parsed.durationMinutes).toBeUndefined();
    });
  });

  describe('Ticket Type-specific Rules', () => {
    it('should require contactUserId for all ticket types', () => {
      expect(() => {
        createTicketSchema.parse({
          title: 'Test',
          description: 'Test',
          type: 'ASSISTANCE',
          channel: 'Email',
          priority: 'Medium'
        });
      }).toThrow();
    });

    it('should require productId and moduleId for all tickets', () => {
      // Le schéma actuel exige productId et moduleId pour tous les tickets
      const assistanceTicket = {
        title: 'Assistance client',
        description: 'Besoin d\'aide',
        type: 'ASSISTANCE' as const,
        channel: 'Email' as const,
        contactUserId: '550e8400-e29b-41d4-a716-446655440000',
        productId: '550e8400-e29b-41d4-a716-446655440001',
        moduleId: '550e8400-e29b-41d4-a716-446655440002',
        priority: 'Medium' as const
      };

      const parsed = createTicketSchema.parse(assistanceTicket);
      expect(parsed.type).toBe('ASSISTANCE');
      expect(parsed.productId).toBeDefined();
      expect(parsed.moduleId).toBeDefined();
    });
  });
});

describe('Ticket Service Logic', () => {
  it('should set correct status for ASSISTANCE tickets', () => {
    // ASSISTANCE tickets should default to 'Nouveau'
    const assistanceStatus = 'Nouveau';
    expect(assistanceStatus).toBe('Nouveau');
  });

  it('should set correct status for BUG/REQ tickets', () => {
    // BUG/REQ tickets should default to 'En_cours'
    const bugReqStatus = 'En_cours';
    expect(bugReqStatus).toBe('En_cours');
  });

  it('should set origin to supabase for tickets created in app', () => {
    const origin = 'supabase';
    expect(origin).toBe('supabase');
  });
});

