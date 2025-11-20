/**
 * Tests unitaires pour les types d'erreur
 */

import { describe, it, expect } from 'vitest';
import {
  ApplicationError,
  ErrorCode,
  createError,
  isApplicationError,
  normalizeError
} from '../types';

describe('Error Types', () => {
  describe('ApplicationError', () => {
    it('devrait créer une erreur avec les bonnes propriétés', () => {
      const error = new ApplicationError(
        ErrorCode.NOT_FOUND,
        'Ressource introuvable',
        404,
        { resourceId: '123' }
      );

      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Ressource introuvable');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ resourceId: '123' });
    });

    it('devrait convertir en JSON correctement', () => {
      const error = new ApplicationError(
        ErrorCode.VALIDATION_ERROR,
        'Erreur de validation',
        400
      );

      const json = error.toJSON();
      expect(json.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(json.message).toBe('Erreur de validation');
      expect(json.statusCode).toBe(400);
    });
  });

  describe('createError factory', () => {
    it('devrait créer une erreur unauthorized', () => {
      const error = createError.unauthorized('Non autorisé');
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
    });

    it('devrait créer une erreur notFound', () => {
      const error = createError.notFound('Ticket');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Ticket introuvable');
    });

    it('devrait créer une erreur validationError', () => {
      const error = createError.validationError('Champ invalide', { field: 'title' });
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'title' });
    });

    it('devrait créer une erreur supabaseError avec erreur originale', () => {
      const originalError = new Error('Erreur Supabase originale');
      const error = createError.supabaseError('Erreur DB', originalError);
      
      expect(error.code).toBe(ErrorCode.SUPABASE_ERROR);
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('isApplicationError', () => {
    it('devrait retourner true pour une ApplicationError', () => {
      const error = createError.notFound('Test');
      expect(isApplicationError(error)).toBe(true);
    });

    it('devrait retourner false pour une Error standard', () => {
      const error = new Error('Test');
      expect(isApplicationError(error)).toBe(false);
    });
  });

  describe('normalizeError', () => {
    it('devrait retourner ApplicationError telle quelle', () => {
      const appError = createError.notFound('Test');
      const normalized = normalizeError(appError);
      expect(normalized).toBe(appError);
    });

    it('devrait convertir une Error standard en ApplicationError', () => {
      const standardError = new Error('Erreur standard');
      const normalized = normalizeError(standardError);
      
      expect(isApplicationError(normalized)).toBe(true);
      expect(normalized.originalError).toBe(standardError);
    });

    it('devrait gérer les erreurs non-Error', () => {
      const unknownError = 'String error';
      const normalized = normalizeError(unknownError);
      
      expect(isApplicationError(normalized)).toBe(true);
      expect(normalized.message).toContain('erreur inconnue');
    });
  });
});

