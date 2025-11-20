/**
 * Utilitaires de test réutilisables
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import type { NextURL } from 'next/dist/server/web/next-url';
import { ErrorBoundary } from '@/components/errors/error-boundary';
import { vi } from 'vitest';

/**
 * Render avec les providers nécessaires (Error Boundary, etc.)
 * Note: ThemeProvider n'est pas nécessaire pour les tests unitaires
 */
function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <ErrorBoundary>{children}</ErrorBoundary>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Attendre qu'une promesse soit résolue (utile pour les tests async)
 */
export async function waitForAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

import type { MockNextRequest } from '@/types/next-request-mock';

/**
 * Mock d'une NextRequest pour les tests d'API routes
 */
export function createMockRequest(url: string, searchParams?: Record<string, string>): MockNextRequest {
  const urlObj = new URL(url, 'http://localhost:3000');
  
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
  }

  return {
    url: urlObj.toString(),
    nextUrl: urlObj,
    method: 'GET',
    headers: new Headers(),
    json: vi.fn(),
    text: vi.fn()
  };
}

// Réexporter render avec providers
export * from '@testing-library/react';
export { renderWithProviders as render };

