import nextConfig from 'eslint-config-next';

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      'scripts/**/*',
      '.next/**/*',
      'node_modules/**/*',
      'out/**/*',
      '.eslintignore',
    ],
  },
  {
    rules: {
      // Désactiver certaines règles trop strictes du plugin react-hooks
      'react-hooks/set-state-in-effect': 'off', // Trop de faux positifs pour la synchronisation d'état légitime
      'react-hooks/static-components': 'warn', // Convertir en warning au lieu d'erreur
      'react-hooks/refs': 'warn', // Convertir en warning au lieu d'erreur
    },
  },
];

export default eslintConfig;
