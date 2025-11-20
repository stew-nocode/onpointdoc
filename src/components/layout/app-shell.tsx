/**
 * Shell principal de l'application
 * 
 * Gère la structure de base : Sidebar, TopBar, contenu principal
 * Utilise les hooks personnalisés pour l'authentification
 */

'use client';

import { ReactNode } from 'react';
import { useAuth, useAuthRedirect } from '@/hooks';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/navigation/top-bar';

type AppShellProps = {
  children: ReactNode;
};

/**
 * Shell principal de l'application
 * 
 * Affiche la sidebar, la barre supérieure et le contenu principal.
 * Gère automatiquement l'authentification et la redirection.
 * 
 * @param children - Contenu principal à afficher
 */
export const AppShell = ({ children }: AppShellProps) => {
  // Rediriger automatiquement si non authentifié
  useAuthRedirect();

  // Récupérer l'utilisateur et son rôle
  const { role, isLoading } = useAuth();

  // Afficher un état de chargement pendant l'authentification
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Mapper le rôle pour Sidebar (exclure 'client' qui n'est pas un rôle interne, mapper 'director' à 'direction')
  const displayRole: 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'admin' = 
    role === 'client' 
      ? 'agent' 
      : role === 'director' 
        ? 'direction' 
        : (role ?? 'agent') as 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar role={displayRole} />
      <div className="flex min-h-screen flex-col lg:ml-64">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <TopBar />
        </div>
        <main className="flex-1 overflow-y-auto p-6 lg:min-h-0 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};

