/**
 * Types pour les mocks NextRequest dans les tests
 */

import type { NextRequest } from 'next/server';

/**
 * Mock partiel de NextRequest pour les tests
 * Inclut uniquement les propriétés nécessaires pour les tests
 * Utilise Partial pour permettre l'omission de propriétés non nécessaires
 */
export type MockNextRequest = Partial<Omit<NextRequest, 'nextUrl'>> & {
  url: string;
  nextUrl: URL;
  method: string;
  headers: Headers;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

