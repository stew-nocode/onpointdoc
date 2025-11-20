/**
 * Gestionnaires d'erreur pour les routes API et Server Actions
 */

import { NextResponse } from 'next/server';
import { ApplicationError, createError, isApplicationError, normalizeError } from './types';
import type { AppError } from './types';

/**
 * Gère les erreurs dans les routes API Next.js
 * Retourne une NextResponse avec le bon status code et format
 */
export function handleApiError(error: unknown): NextResponse<{ error: AppError }> {
  const normalizedError = normalizeError(error);
  const appError: ApplicationError = isApplicationError(error) ? error : normalizedError;

  // Logger l'erreur en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      details: appError.details,
      stack: appError.originalError?.stack || appError.stack
    });
  }

  // En production, ne pas exposer les détails sensibles
  const responseError: AppError = {
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    ...(process.env.NODE_ENV === 'development' && {
      details: appError.details,
      originalError: appError.originalError
    })
  };

  return NextResponse.json({ error: responseError }, { status: appError.statusCode });
}

/**
 * Wrapper pour routes API avec gestion d'erreur automatique
 */
export function withErrorHandler<T>(
  handler: () => Promise<T> | T
): (() => Promise<NextResponse<T | { error: AppError }>>) {
  return async () => {
    try {
      const result = await handler();
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Gère les erreurs dans les Server Actions Next.js
 * Retourne un objet avec success/error pour le client
 */
export function handleServerActionError(error: unknown): { success: false; error: AppError } {
  const appError = normalizeError(error);

  // Logger l'erreur
  console.error('[Server Action Error]', {
    code: appError.code,
    message: appError.message,
    details: appError.details
  });

  // Convertir ApplicationError en AppError pour la réponse
  const errorResponse: AppError = {
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    details: appError.details,
    originalError: appError.originalError
      ? {
          name: appError.originalError.name,
          message: appError.originalError.message
        }
      : undefined
  };

  return {
    success: false,
    error: errorResponse
  };
}

/**
 * Wrapper pour Server Actions avec gestion d'erreur automatique
 */
export function withServerActionErrorHandler<T>(
  action: () => Promise<T>
): (() => Promise<{ success: true; data: T } | { success: false; error: AppError }>) {
  return async () => {
    try {
      const data = await action();
      return { success: true as const, data };
    } catch (error) {
      return handleServerActionError(error);
    }
  };
}

/**
 * Convertit une erreur Supabase en ApplicationError
 */
export function handleSupabaseError(error: unknown, context?: string): ApplicationError {
  if (error instanceof Error) {
    // Vérifier si c'est une erreur Supabase connue
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('jwt') || errorMessage.includes('token')) {
      return createError.unauthorized('Session expirée', { context });
    }

    if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
      return createError.forbidden('Permissions insuffisantes', { context });
    }

    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      return createError.notFound('Ressource introuvable', { context });
    }

    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return createError.conflict('Cette ressource existe déjà', { context });
    }

    return createError.supabaseError(
      `Erreur Supabase${context ? ` (${context})` : ''}`,
      error,
      { context }
    );
  }

  return createError.supabaseError('Erreur Supabase inconnue', undefined, { context });
}

