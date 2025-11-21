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
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l'erreur pour le monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);

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

