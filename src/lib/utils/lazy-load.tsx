/**
 * Utilitaires pour le lazy loading des composants
 * Respecte les principes Clean Code : fonctions courtes, réutilisables
 * 
 * Note: Client Component car utilise next/dynamic avec ssr: false
 */

'use client';

import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Props pour un composant lazy-loadé avec fallback
 */
export type LazyComponentProps = {
  isLoading?: boolean;
  error?: Error | null;
};

/**
 * Fallback par défaut pour les composants lazy-loadés
 */
export function DefaultLazyFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-brand" />
      <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Chargement...</span>
    </div>
  );
}

/**
 * Crée un composant lazy-loadé avec options par défaut
 * 
 * @param importFunction - Fonction qui importe le composant
 * @param componentName - Nom du composant pour le fallback
 * @returns Composant lazy-loadé
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  componentName?: string
): ComponentType<React.ComponentProps<T>> {
  return dynamic(importFunction, {
    ssr: false,
    loading: () => <DefaultLazyFallback />
  }) as ComponentType<React.ComponentProps<T>>;
}

/**
 * Options pour le lazy loading de dialogs
 */
export type LazyDialogOptions = {
  ssr?: boolean;
  loading?: () => React.JSX.Element;
};

/**
 * Crée un composant dialog lazy-loadé
 * Les dialogs sont toujours client-side (ssr: false)
 * 
 * @param importFunction - Fonction qui importe le dialog
 * @param options - Options de lazy loading
 * @returns Dialog lazy-loadé
 */
export function createLazyDialog<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options?: LazyDialogOptions
): ComponentType<React.ComponentProps<T>> {
  return dynamic(importFunction, {
    ssr: options?.ssr ?? false,
    loading: options?.loading ?? DefaultLazyFallback
  }) as ComponentType<React.ComponentProps<T>>;
}

