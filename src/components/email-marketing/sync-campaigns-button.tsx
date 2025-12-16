'use client';

/**
 * Composant bouton pour synchroniser les campagnes Brevo
 * 
 * Principe Clean Code :
 * - SRP : Une seule responsabilité (afficher le bouton et gérer la synchronisation)
 * - Utilise useTransition pour gérer l'état pending
 * - Feedback utilisateur clair (loading, succès, erreur)
 * - Types explicites
 * - Gestion d'erreur avec affichage à l'utilisateur
 * 
 * Optimisation v2 :
 * - Synchronisation complète avec pagination automatique
 * - 1000 campagnes = 2 appels API seulement
 * - Plus de rate limiting grâce au batch
 */

import { useTransition } from 'react';
import { Button } from '@/ui/button';
import { RefreshCw } from 'lucide-react';
import { syncCampaignsAction } from '@/app/(main)/marketing/email/actions';
import { toast } from 'sonner';
import { isApplicationError } from '@/lib/errors/types';

/**
 * Bouton pour synchroniser TOUTES les campagnes Brevo
 * La pagination est gérée automatiquement côté serveur
 */
export function SyncCampaignsButton() {
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      try {
        // Synchronise TOUTES les campagnes (pagination automatique)
        const result = await syncCampaignsAction();
        
        // Afficher un toast de succès avec le total
        toast.success(result.message);
      } catch (error) {
        // Logger l'erreur côté client pour le débogage
        console.error('[ERROR] Erreur dans SyncCampaignsButton:', error);
        
        // Transformer l'erreur en message utilisateur avec plus de détails
        let errorMessage = 'Une erreur est survenue lors de la synchronisation';
        
        if (isApplicationError(error)) {
          errorMessage = error.message;
          
          // Ajouter des détails supplémentaires selon le type d'erreur
          if (error.code === 'UNAUTHORIZED') {
            errorMessage = 'Vous devez être connecté pour synchroniser les campagnes';
          } else if (error.code === 'FORBIDDEN') {
            errorMessage = 'Vous n\'avez pas les permissions nécessaires. Seuls les administrateurs et la direction peuvent synchroniser les campagnes.';
          } else if (error.code === 'CONFIGURATION_ERROR' || error.message.includes('BREVO_API_KEY')) {
            errorMessage = 'Configuration Brevo manquante. Veuillez vérifier que BREVO_API_KEY est défini dans les variables d\'environnement.';
          } else if (error.code === 'NETWORK_ERROR' || error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Erreur de connexion à l\'API Brevo. Vérifiez votre connexion internet et la configuration de l\'API.';
          } else if (error.message.includes('IP address') || error.message.includes('unrecognised IP') || error.message.includes('authorised_ips')) {
            errorMessage = 'Adresse IP non autorisée. Veuillez ajouter votre adresse IP dans les paramètres de sécurité Brevo.';
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage, {
          description: 'Consultez la console pour plus de détails'
        });
      }
    });
  };

  return (
    <Button 
      onClick={handleSync}
      variant="outline" 
      size="sm"
      disabled={isPending}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
      {isPending ? 'Synchronisation...' : 'Synchroniser'}
    </Button>
  );
}

