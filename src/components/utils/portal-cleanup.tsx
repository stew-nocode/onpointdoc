'use client';

import { useEffect } from 'react';

/**
 * Nettoie les portails nextjs-portal vides qui restent dans le DOM
 * Ces portails sont créés par Next.js et peuvent rester vides, causant des problèmes visuels
 */
export function PortalCleanup() {
  useEffect(() => {
    const cleanup = () => {
      // Trouver tous les portails nextjs-portal vides
      const portals = document.querySelectorAll('nextjs-portal');
      let hiddenCount = 0;
      let visibleCount = 0;
      
      portals.forEach((portal) => {
        const rect = portal.getBoundingClientRect();
        const hasChildren = portal.children.length > 0;
        const currentDisplay = window.getComputedStyle(portal).display;
        
        // Si le portail est vide (0x0 dimensions et pas d'enfants), le cacher
        if (!hasChildren && rect.width === 0 && rect.height === 0) {
          (portal as HTMLElement).style.display = 'none';
          if (currentDisplay !== 'none') hiddenCount++;
        } else if (hasChildren || rect.width > 0 || rect.height > 0) {
          // Si le portail a du contenu, s'assurer qu'il est visible
          (portal as HTMLElement).style.display = '';
          if (currentDisplay === 'none') visibleCount++;
        }
      });
    };

    // Nettoyer immédiatement et observer les changements
    cleanup();
    
    // Observer les changements dans le DOM pour nettoyer les nouveaux portails vides
    const observer = new MutationObserver(cleanup);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Nettoyer périodiquement (toutes les 2 secondes) pour les cas où l'observer ne capture pas tout
    const interval = setInterval(cleanup, 2000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}









