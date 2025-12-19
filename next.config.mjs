import bundleAnalyzer from '@next/bundle-analyzer';

/**
 * ✅ OPTIMISATION Phase 2 : Bundle Analyzer
 * 
 * Active l'analyse du bundle uniquement si ANALYZE=true
 * Usage: ANALYZE=true npm run build
 * 
 * @see docs/dashboard/OPTIMISATIONS-PHASE-2-CODE.md
 */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // ✅ Correction : Désactiver les source maps en production pour éviter l'erreur Supabase/Turbopack
  // En développement, les source maps restent actives pour le debug
  productionBrowserSourceMaps: false,
  // TODO: Réactiver le TypeScript strict après avoir corrigé toutes les erreurs
  // Voir: docs/TECHNICAL-DEBT-AUDIT-GUIDE.md pour le plan de correction
  typescript: {
    ignoreBuildErrors: true
  },
  experimental: {
    // Server Actions sont maintenant stables dans Next.js 16, mais la config reste dans experimental
    serverActions: {
      bodySizeLimit: '2mb'
    },
    // Optimiser les imports de packages volumineux
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      'recharts', // ✅ Optimiser recharts (bibliothèque de charts lourde)
      // Note: react-quill retiré de optimizePackageImports car cela cause des conflits avec dynamic import
    ]
  }
};

export default withBundleAnalyzer(nextConfig);

