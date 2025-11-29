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
      '@radix-ui/react-tooltip'
      // Note: react-quill retiré de optimizePackageImports car cela cause des conflits avec dynamic import
    ]
  }
};

export default nextConfig;

