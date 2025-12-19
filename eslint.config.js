import nextConfig from 'eslint-config-next';

export default [
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
];
