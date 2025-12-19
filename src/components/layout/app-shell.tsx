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
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { TopBar } from '@/components/navigation/top-bar';
import { PageTransition } from '@/components/navigation/page-transition';
import { LogoLoader } from '@/components/navigation/logo-loader';
import { useNavigation } from '@/contexts/navigation-context';
import { useLinkInterceptor } from '@/hooks/navigation/use-link-interceptor';
import { cn } from '@/lib/utils';

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

  // Récupérer l'état de navigation pour le fade
  const { isNavigating } = useNavigation();

  // Intercepter les clics sur les liens pour déclencher la transition
  useLinkInterceptor();

  // Afficher un état de chargement pendant l'authentification
  if (isLoading) {
    return <LogoLoader isLoading={true} loadingText="Authentification" showDots={true} />;
  }

  // Mapper le rôle pour Sidebar (exclure 'client' qui n'est pas un rôle interne, mapper 'director' à 'direction')
  const displayRole: 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'admin' = 
    role === 'client' 
      ? 'agent' 
      : role === 'director' 
        ? 'direction' 
        : (role ?? 'agent') as 'agent' | 'manager' | 'it' | 'marketing' | 'direction' | 'admin';

  return (
    <SidebarProvider>
      {/* Barre de progression pour les transitions de page */}
      <PageTransition />
      
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Sidebar role={displayRole} />
        <div className="flex min-h-screen flex-col lg:ml-64">
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <TopBar />
          </div>
          <main
            className="flex-1 overflow-y-auto p-4 sm:p-6 lg:min-h-0 bg-slate-50 dark:bg-slate-950"
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

