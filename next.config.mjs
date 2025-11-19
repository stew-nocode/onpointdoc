/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === 'production'
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    // Optimiser les imports de packages volumineux
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip'
    ]
  }
};

export default nextConfig;

