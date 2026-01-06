import nextConfig from 'eslint-config-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

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
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Désactiver les nouvelles règles React Hooks v7 qui génèrent trop de faux positifs
      // Ces règles sont expérimentales et peuvent être trop strictes pour certains patterns légitimes
      'react-hooks/set-state-in-effect': 'off', // Désactiver car trop de faux positifs
      'react-hooks/static-components': 'off', // Désactiver car patterns avec useMemo légitimes
      'react-hooks/refs': 'off', // Désactiver
      // Garder les règles classiques
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
