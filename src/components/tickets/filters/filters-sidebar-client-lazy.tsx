/**
 * Lazy loading wrapper pour FiltersSidebarClient
 * 
 * Permet de réduire le bundle initial et d'améliorer FCP/LCP.
 */

import dynamic from 'next/dynamic';
import type { Product } from '@/services/products';
import type { Module } from '@/services/products';
import type { BasicProfile } from '@/services/users';

type FiltersSidebarClientProps = {
  users: BasicProfile[];
  products: Product[];
  modules: Module[];
};

/**
 * Chargement différé de FiltersSidebarClient pour améliorer les performances initiales
 * 
 * La sidebar de filtres n'est pas critique pour le First Contentful Paint.
 * Note: Utilisé dans un Server Component, donc on ne peut pas utiliser `ssr: false`.
 * Le lazy loading fonctionnera automatiquement car FiltersSidebarClient est un Client Component.
 */
export const FiltersSidebarClientLazy = dynamic(
  () =>
    import('./filters-sidebar-client').then((mod) => ({
      default: mod.FiltersSidebarClient,
    })),
  {
    loading: () => null, // Pas de skeleton pour la sidebar (chargement silencieux)
  }
) as React.ComponentType<FiltersSidebarClientProps>;

