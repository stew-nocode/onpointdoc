'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { isApplicationError } from '@/lib/errors/types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary global pour capturer les erreurs React
 * Utilisé pour les Client Components
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Ne pas afficher l'UI d'erreur pour les erreurs réseau normales
    // Ces erreurs sont déjà gérées dans les composants qui font les fetch
    const isNetworkError = error instanceof TypeError && (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message === 'network error'
    );

    // Si c'est une erreur réseau, ne pas déclencher l'UI d'erreur
    // mais retourner quand même un état pour éviter les re-renders
    if (isNetworkError) {
      return {
        hasError: false,
        error: null
      };
    }

    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Ne pas logger les erreurs réseau qui sont normales (déconnexion, timeout, etc.)
    // Ces erreurs sont déjà gérées dans les composants qui font les fetch
    const isNetworkError = error instanceof TypeError && (
      error.message.toLowerCase().includes('network') ||
      error.message.toLowerCase().includes('fetch') ||
      error.message === 'network error'
    );

    if (!isNetworkError) {
      // Logger l'erreur pour le monitoring (seulement les erreurs non réseau)
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Appeler le callback si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Ici, on pourrait envoyer l'erreur à un service de monitoring (Sentry, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const isAppError = error && isApplicationError(error);

      return (
        <Card className="m-4 border-status-danger">
          <CardHeader>
            <CardTitle className="text-status-danger">
              {isAppError ? error.message : 'Une erreur est survenue'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && error && (
              <div className="rounded-lg bg-slate-100 p-4 text-sm dark:bg-slate-800">
                <p className="font-semibold">Détails de l&apos;erreur :</p>
                <pre className="mt-2 overflow-auto">{error.stack}</pre>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                Réessayer
              </Button>
              <Button
                onClick={() => {
                  window.location.href = '/';
                }}
                variant="default"
              >
                Retour à l&apos;accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Composant wrapper pour utiliser ErrorBoundary avec des props simplifiées
 */
type ErrorBoundaryWrapperProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function ErrorBoundaryWrapper({ children, fallback }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}

