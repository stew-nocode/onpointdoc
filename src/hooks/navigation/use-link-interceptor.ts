/**
 * Hook pour intercepter les clics sur tous les liens de navigation
 * 
 * Détecte les clics sur les liens Next.js Link et déclenche
 * la transition immédiatement.
 * 
 * Cette solution permet de fonctionner avec les liens existants
 * sans avoir à les remplacer tous par SmoothLink.
 * 
 * Respecte les principes Clean Code :
 * - SRP : Interception des clics uniquement
 * - DRY : Réutilisable globalement
 * - KISS : Solution simple avec event delegation
 */

'use client';

import { useEffect } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { usePathname } from 'next/navigation';

/**
 * Hook pour intercepter les clics sur les liens de navigation
 * 
 * Utilise la délégation d'événements pour capturer tous les clics
 * sur les liens Next.js Link et déclencher la transition.
 * 
 * @example
 * useLinkInterceptor();
 */
export function useLinkInterceptor(): void {
  const { startNavigation } = useNavigation();
  const pathname = usePathname();

  useEffect(() => {
    /**
     * Handler pour intercepter les clics sur les liens
     */
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Trouver le lien parent (Next.js Link peut wrapper dans un <a>)
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      
      if (!link) {
        return;
      }

      const href = link.getAttribute('href');
      
      if (!href) {
        return;
      }

      // Ignorer les liens externes, ancres, et liens spéciaux
      if (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        link.hasAttribute('download') ||
        link.hasAttribute('target')
      ) {
        return;
      }

      // Ignorer si c'est le même lien que la page actuelle
      // Normaliser en enlevant les query params pour la comparaison
      const currentPath = (pathname || '/').split('?')[0];
      const normalizedHref = href.startsWith('/') 
        ? href.split('?')[0] 
        : `/${href.split('?')[0]}`;
      
      if (normalizedHref === currentPath) {
        return;
      }

      // Déclencher la transition immédiatement au clic
      startNavigation();
    };

    // Ajouter l'écouteur au document (event delegation)
    document.addEventListener('click', handleLinkClick, true); // Capture phase

    // Cleanup
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [startNavigation, pathname]);
}

