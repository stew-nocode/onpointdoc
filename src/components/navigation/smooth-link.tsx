/**
 * Composant Link personnalisé avec transition fluide
 * 
 * Intercepte les clics sur les liens pour déclencher la transition
 * immédiatement, avant même que la route change.
 * 
 * Respecte les principes Clean Code :
 * - SRP : Interception des clics et déclenchement de transition
 * - DRY : Réutilisable pour tous les liens de navigation
 * - KISS : Wrapper simple autour de Next.js Link
 */

'use client';

import Link from 'next/link';
import { useNavigation } from '@/contexts/navigation-context';
import { usePathname } from 'next/navigation';
import type { LinkProps } from 'next/link';
import type { ReactNode } from 'react';

type SmoothLinkProps = LinkProps & {
  /**
   * Contenu du lien
   */
  children: ReactNode;

  /**
   * Classe CSS additionnelle (optionnel)
   */
  className?: string;
};

/**
 * Composant Link avec transition fluide
 * 
 * Déclenche la transition de page immédiatement au clic,
 * avant même que Next.js ne change la route.
 * 
 * @param href - URL de destination
 * @param children - Contenu du lien
 * @param className - Classe CSS additionnelle
 * @param ...props - Autres props de Next.js Link
 * 
 * @example
 * <SmoothLink href="/dashboard">Dashboard</SmoothLink>
 */
export function SmoothLink({
  href,
  children,
  className,
  ...props
}: SmoothLinkProps) {
  const { startNavigation } = useNavigation();
  const pathname = usePathname();

  /**
   * Handler pour le clic sur le lien
   * 
   * Déclenche la transition immédiatement si ce n'est pas
   * le même lien que la page actuelle.
   */
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Convertir href en string pour la comparaison
    const hrefString = typeof href === 'string' ? href : href.pathname || '';
    const currentPath = pathname || '/';

    // Ne pas déclencher si c'est le même lien
    if (hrefString === currentPath) {
      e.preventDefault();
      return;
    }

    // Démarrer la transition immédiatement au clic
    startNavigation();
  };

  return (
    <Link href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </Link>
  );
}

