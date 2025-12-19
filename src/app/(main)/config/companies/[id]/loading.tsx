import { LogoLoader } from '@/components/navigation/logo-loader';

/**
 * État de chargement pour la page de détail d'une entreprise
 * 
 * Pattern identique à TicketDetailPage loading pour cohérence
 */
export default function CompanyDetailLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <LogoLoader isLoading={true} loadingText="Chargement de l'entreprise..." showDots={true} />
    </div>
  );
}

